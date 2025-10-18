const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { getRandomProxy, parseProxy } = require('../proxies');

class ScraperService {
    constructor() {
        this.browser = null;
    }

    /**
     * Launch browser with random proxy
     * @returns {Object} - Puppeteer browser instance with proxy info
     */
    async launchBrowserWithProxy() {
        const proxyString = getRandomProxy();
        const { ip, port, username, password } = parseProxy(proxyString);
        
        console.log(`🌐 Using proxy: ${ip}:${port}`);
        
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                `--proxy-server=${ip}:${port}`
            ]
        });

        // Store proxy credentials for later use
        browser._proxyCredentials = { username, password };

        return browser;
    }

    /**
     * Main function to scrape company data from a given URL
     * @param {string} url - The URL to scrape
     * @param {number} startPage - Starting page number (default: 1)
     * @param {number} endPage - Ending page number (default: startPage)
     * @returns {Promise<Object>} - Structured company data
     */
    async scrapeCompanyData(url, startPage = 1, endPage = null) {
        try {
            // Check if this is a Clutch.co URL
            if (url.includes('clutch.co')) {
                console.log('🔍 Detected Clutch.co URL - using specialized scraper...');
                const finalEndPage = endPage || startPage;
                return await this.scrapeClutchDataWithPagination(url, startPage, finalEndPage);
            }

            // For other URLs, throw an error indicating unsupported URL
            throw new Error('Unsupported URL. Currently, only Clutch.co URLs are supported.');
        } catch (error) {
            throw new Error(`Failed to scrape ${url}: ${error.message}`);
        }
    }

    /**
     * Scrape multiple pages from Clutch.co with pagination support
     * @param {string} url - The Clutch.co URL to scrape
     * @param {number} startPage - Starting page number
     * @param {number} endPage - Ending page number
     * @returns {Promise<Array>} - Array of company data objects from all pages
     */
    async scrapeClutchDataWithPagination(url, startPage, endPage) {
        const allCompanies = [];
        const scrapedPages = [];
        let page = null;

        try {
            // Initialize browser and page once for all pages
            if (!this.browser) {
                console.log('🚀 Launching headless browser with proxy for Clutch.co scraping...');
                this.browser = await this.launchBrowserWithProxy();
            }

            page = await this.browser.newPage();
            
            // Set up proxy authentication if credentials are available
            if (this.browser._proxyCredentials) {
                await page.authenticate(this.browser._proxyCredentials);
            }
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
                console.log(`📄 Scraping page ${currentPage} of ${endPage}...`);
                
                const pageUrl = this.buildClutchUrlWithPage(url, currentPage);
                console.log('📍 Page URL:', pageUrl);
                
                const companies = await this.scrapeClutchDataSinglePage(page, pageUrl);
                
                if (Array.isArray(companies)) {
                    allCompanies.push(...companies);
                    scrapedPages.push({
                        page: currentPage,
                        url: pageUrl,
                        companiesFound: companies.length
                    });
                } else if (companies) {
                    allCompanies.push(companies);
                    scrapedPages.push({
                        page: currentPage,
                        url: pageUrl,
                        companiesFound: 1
                    });
                }

                // Close page and browser after each scrape to avoid Cloudflare detection
                if (currentPage < endPage) {
                    console.log('🔄 Closing browser to avoid detection...');
                    await page.close();
                    await this.browser.close();
                    this.browser = null;
                    
                    console.log('⏳ Waiting 3 seconds before next page...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Launch fresh browser for next page
                    console.log('🚀 Launching fresh browser for next page...');
                    this.browser = await this.launchBrowserWithProxy();
                    page = await this.browser.newPage();
                    
                    // Set up proxy authentication if credentials are available
                    if (this.browser._proxyCredentials) {
                        await page.authenticate(this.browser._proxyCredentials);
                    }
                    
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                }
            }

            console.log(`🎯 Total companies extracted: ${allCompanies.length} from ${scrapedPages.length} pages`);
            
            return {
                companies: allCompanies,
                pagination: {
                    startPage,
                    endPage,
                    totalPages: endPage - startPage + 1,
                    totalCompanies: allCompanies.length,
                    scrapedPages
                }
            };

        } catch (error) {
            throw new Error(`Multi-page Clutch.co scraping failed: ${error.message}`);
        } finally {
            // Clean up any remaining browser/page instances
            try {
                if (page && !page.isClosed()) {
                    await page.close();
                    console.log('✅ Closed page after pagination scraping');
                }
            } catch (cleanupError) {
                console.warn('Error closing page:', cleanupError.message);
            }
            
            try {
                if (this.browser) {
                    await this.browser.close();
                    this.browser = null;
                    console.log('✅ Closed browser after pagination scraping');
                }
            } catch (cleanupError) {
                console.warn('Error closing browser:', cleanupError.message);
            }
        }
    }

    /**
     * Build Clutch.co URL with proper page parameter
     * @param {string} originalUrl - Original URL
     * @param {number} pageNumber - Page number to add
     * @returns {string} - URL with page parameter
     */
    buildClutchUrlWithPage(originalUrl, pageNumber) {
        try {
            const url = new URL(originalUrl);
            
            // Remove existing page parameter if present
            url.searchParams.delete('page');
            
            // Add page parameter only if not page 1
            if (pageNumber > 1) {
                url.searchParams.set('page', pageNumber.toString());
            }
            
            return url.toString();
        } catch (error) {
            console.warn('Could not parse URL, using string manipulation');
            
            // Fallback: string manipulation
            let cleanUrl = originalUrl.split('?')[0]; // Remove existing query params
            
            if (pageNumber > 1) {
                cleanUrl += `?page=${pageNumber}`;
            }
            
            return cleanUrl;
        }
    }

    /**
     * Scrape a single Clutch.co page using an existing page instance
     * @param {Object} page - Puppeteer page instance
     * @param {string} url - The Clutch.co URL to scrape
     * @returns {Promise<Array>} - Array of company data objects
     */
    async scrapeClutchDataSinglePage(page, url) {
        try {
            console.log('📄 Loading Clutch.co page:', url);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for the providers list to load
            await page.waitForSelector('#providers__list', { timeout: 15000 });
            console.log('✅ Providers list loaded');

            // Get the HTML content
            const content = await page.content();
            const $ = cheerio.load(content);

            // Find all provider list items
            const providers = [];
            $('#providers__list li.provider-list-item').each((index, element) => {
                try {
                    const providerData = this.extractClutchProviderData($, $(element));
                    if (providerData.companyName) {
                        providers.push(providerData);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error extracting provider ${index + 1}:`, error.message);
                }
            });

            console.log(`🎯 Successfully extracted ${providers.length} companies from this page`);
            return providers;

        } catch (error) {
            console.error(`Single page scraping failed for ${url}:`, error.message);

            // Save current page content for debugging (if page is available)
            try {
                if (page) {
                    const debugContent = await page.content();
                    const fileName = `debug_${Date.now()}.html`;
                    fs.writeFileSync(fileName, debugContent);
                    console.log(`🐛 Debug HTML saved for troubleshooting at ${fileName}`);
                }
            } catch (debugError) {
                console.warn('Could not save debug HTML:', debugError.message);
            }
            
            return [];
        }
    }

    /**
     * Extract data from a single Clutch provider element
     * @param {Object} $ - Cheerio instance
     * @param {Object} element - Provider element
     * @returns {Object} - Extracted provider data
     */
    extractClutchProviderData($, element) {
        const data = {
            companyName: null,
            website: null,
            industry: null,
            country: null,
            email: null,
            phone: null,
            linkedinUrl: null,
            // Additional Clutch-specific fields
            rating: null,
            reviewCount: null,
            hourlyRate: null,
            projectSize: null,
            employeeCount: null,
            location: null,
            services: [],
            profileUrl: null
        };

        try {
            // Company Name
            const nameElement = element.find('.provider__title-link');
            if (nameElement.length) {
                data.companyName = nameElement.text().trim();
            }

            // Profile URL and Website
            const profileLink = element.find('.provider__title-link').attr('href');
            if (profileLink) {
                data.profileUrl = profileLink.startsWith('http') ? profileLink : `https://clutch.co${profileLink}`;
            }

            // Extract website from Visit Website button
            const websiteLink = element.find('a[href*="redirect"]').attr('href');
            if (websiteLink) {
                // Extract the actual website URL from the redirect link
                const urlMatch = websiteLink.match(/u=([^&]+)/);
                if (urlMatch) {
                    try {
                        data.website = decodeURIComponent(urlMatch[1]);
                    } catch (e) {
                        console.warn('Could not decode website URL');
                    }
                }
            }

            // Phone number from meta tag
            const phoneElement = element.find('meta[itemprop="telephone"]');
            if (phoneElement.length) {
                data.phone = phoneElement.attr('content');
            }

            // Rating
            const ratingElement = element.find('.sg-rating__number');
            if (ratingElement.length) {
                const ratingText = ratingElement.text().trim();
                const rating = parseFloat(ratingText);
                if (!isNaN(rating)) {
                    data.rating = rating;
                }
            }

            // Review Count
            const reviewElement = element.find('meta[itemprop="reviewCount"]');
            if (reviewElement.length) {
                const reviewCount = parseInt(reviewElement.attr('content'));
                if (!isNaN(reviewCount)) {
                    data.reviewCount = reviewCount;
                }
            }

            // Hourly Rate
            const hourlyRateElement = element.find('.hourly-rate');
            if (hourlyRateElement.length) {
                const rateText = hourlyRateElement.text().trim();
                data.hourlyRate = rateText.replace(/\s+/g, ' ');
            }

            // Project Size
            const projectSizeElement = element.find('.min-project-size');
            if (projectSizeElement.length) {
                const sizeText = projectSizeElement.text().trim();
                data.projectSize = sizeText.replace(/\s+/g, ' ');
            }

            // Employee Count
            const employeeElement = element.find('.employees-count');
            if (employeeElement.length) {
                const employeeText = employeeElement.text().trim();
                data.employeeCount = employeeText.replace(/\s+/g, ' ');
            }

            // Location
            const locationElement = element.find('.location');
            if (locationElement.length) {
                data.location = locationElement.text().trim();
            }

            // Country from address meta tags
            const countryElement = element.find('meta[itemprop="addressCountry"]');
            if (countryElement.length) {
                const countryCode = countryElement.attr('content');
                data.country = this.getCountryFromCode(countryCode);
            }

            // Services
            const serviceElements = element.find('.provider__services-list-item');
            serviceElements.each((i, serviceEl) => {
                const serviceText = $(serviceEl).text().trim();
                if (serviceText && !serviceText.includes('+') && !serviceText.includes('services')) {
                    data.services.push(serviceText);
                }
            });

            // Industry from services (first service as primary industry)
            if (data.services.length > 0) {
                data.industry = data.services[0].replace(/^\d+%?\s*/, '').trim();
            }

            // LinkedIn URL (check for LinkedIn links in the provider section)
            const linkedinElement = element.find('a[href*="linkedin.com"]');
            if (linkedinElement.length) {
                data.linkedinUrl = linkedinElement.attr('href');
            }

        } catch (error) {
            console.warn('Error extracting provider data:', error.message);
        }

        return data;
    }

    /**
     * Convert country code to country name
     * @param {string} code - Country code
     * @returns {string} - Country name
     */
    getCountryFromCode(code) {
        const countryCodes = {
            'US': 'United States',
            'CA': 'Canada',
            'GB': 'United Kingdom',
            'UK': 'United Kingdom',
            'DE': 'Germany',
            'FR': 'France',
            'AU': 'Australia',
            'JP': 'Japan',
            'IN': 'India',
            'BR': 'Brazil',
            'IT': 'Italy',
            'ES': 'Spain',
            'NL': 'Netherlands',
            'SE': 'Sweden',
            'CH': 'Switzerland',
            'NO': 'Norway',
            'DK': 'Denmark',
            'FI': 'Finland',
            'PL': 'Poland',
            'BE': 'Belgium',
            'AT': 'Austria',
            'IE': 'Ireland',
            'PT': 'Portugal',
            'CZ': 'Czech Republic',
            'HU': 'Hungary',
            'RO': 'Romania',
            'BG': 'Bulgaria',
            'HR': 'Croatia',
            'SI': 'Slovenia',
            'SK': 'Slovakia',
            'LT': 'Lithuania',
            'LV': 'Latvia',
            'EE': 'Estonia'
        };

        return countryCodes[code?.toUpperCase()] || code || null;
    }

    /**
     * Clean up browser instance
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new ScraperService();