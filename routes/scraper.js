const express = require('express');
const router = express.Router();
const scraperService = require('../services/scraperService');

// POST /api/scraper/scrape - Main scraping endpoint with pagination support
router.post('/scrape', async (req, res) => {
  try {
    const { url, startPage, endPage } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'URL parameter is required'
      });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL'
      });
    }

    // Validate pagination parameters
    const startPageNum = parseInt(startPage) || 1;
    const endPageNum = parseInt(endPage) || startPageNum;

    if (startPageNum < 1 || endPageNum < 1 || startPageNum > endPageNum) {
      return res.status(400).json({
        error: 'Invalid Pagination',
        message: 'startPage and endPage must be positive integers, and startPage <= endPage'
      });
    }

    if (endPageNum - startPageNum > 10) {
      return res.status(400).json({
        error: 'Page Limit Exceeded',
        message: 'Maximum of 10 pages can be scraped in a single request'
      });
    }

    console.log(`🔍 Scraping URL: ${url} (Pages ${startPageNum}-${endPageNum})`);
    const scrapedData = await scraperService.scrapeCompanyData(url, startPageNum, endPageNum);
    
    res.json({
      success: true,
      url: url,
      pages: {
        start: startPageNum,
        end: endPageNum,
        total: endPageNum - startPageNum + 1
      },
      timestamp: new Date().toISOString(),
      data: scrapedData
    });

  } catch (error) {
    console.error('Scraping error:', error.message);
    res.status(500).json({
      error: 'Scraping Failed',
      message: error.message || 'An error occurred while scraping the URL'
    });
  }
});

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = router;