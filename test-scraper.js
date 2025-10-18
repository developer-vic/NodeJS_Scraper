// Test script to demonstrate the Clutch.co scraper functionality
const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';

async function testScraper() {
  console.log('🧪 Testing Node.js Scraper API\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${SERVER_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    console.log();

    // Test 2: Clutch.co scraping (single page)
    console.log('2️⃣ Testing Clutch.co scraping (single page)...');
    console.log('🔍 Scraping: https://clutch.co/agencies');
    
    const startTime = Date.now();
    const scrapeResponse = await axios.post(`${SERVER_URL}/api/scraper/scrape`, {
      url: 'https://clutch.co/agencies'
    }, {
      timeout: 60000 // 60 second timeout for scraping
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Single page scraping completed in ${duration} seconds`);

    const { data } = scrapeResponse.data;

    // Test 3: Clutch.co pagination scraping
    console.log('\n3️⃣ Testing Clutch.co pagination scraping...');
    console.log('🔍 Scraping: https://clutch.co/agencies (Pages 1-2)');
    
    const paginationStartTime = Date.now();
    const paginationResponse = await axios.post(`${SERVER_URL}/api/scraper/scrape`, {
      url: 'https://clutch.co/agencies',
      startPage: 1,
      endPage: 2
    }, {
      timeout: 120000 // 2 minute timeout for multi-page scraping
    });

    const paginationDuration = ((Date.now() - paginationStartTime) / 1000).toFixed(2);
    console.log(`⏱️ Multi-page scraping completed in ${paginationDuration} seconds`);

    const paginationData = paginationResponse.data;
    
    // Process single page results
    if (Array.isArray(data)) {
      console.log(`🎯 Successfully extracted ${data.length} companies from single page`);
      showCompanyData(data, 'Single Page Results');
    } else {
      console.log('🎯 Single company data extracted');
      console.log(JSON.stringify(data, null, 2));
    }

    // Process pagination results
    if (paginationData.data && paginationData.data.companies) {
      const { companies, pagination } = paginationData.data;
      console.log(`\n🎯 Multi-page extraction completed!`);
      console.log(`📄 Scraped ${pagination.totalPages} pages (${pagination.startPage}-${pagination.endPage})`);
      console.log(`🏢 Total companies found: ${pagination.totalCompanies}`);
      
      // Show pagination details
      console.log('\n📊 Page-by-page breakdown:');
      pagination.scrapedPages.forEach(pageInfo => {
        console.log(`  Page ${pageInfo.page}: ${pageInfo.companiesFound} companies`);
      });
      
      showCompanyData(companies, 'Multi-Page Results');
    }

    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📝 Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the server is running: npm start');
    }
  }
}

// Helper function to display company data
function showCompanyData(companies, title) {
  console.log(`\n📊 ${title}:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Show first company as example
  const firstCompany = companies[0];
  if (firstCompany) {
    console.log(`🏢 Company: ${firstCompany.companyName}`);
    console.log(`🌐 Website: ${firstCompany.website}`);
    console.log(`🏭 Industry: ${firstCompany.industry}`);
    console.log(`📍 Location: ${firstCompany.location}`);
    console.log(`🏆 Rating: ${firstCompany.rating}/5.0 (${firstCompany.reviewCount} reviews)`);
    console.log(`💰 Hourly Rate: ${firstCompany.hourlyRate}`);
    console.log(`📦 Project Size: ${firstCompany.projectSize}`);
    console.log(`👥 Employees: ${firstCompany.employeeCount}`);
    console.log(`📞 Phone: ${firstCompany.phone}`);
    
    if (firstCompany.services && firstCompany.services.length > 0) {
      console.log(`⚙️ Services: ${firstCompany.services.slice(0, 3).join(', ')}${firstCompany.services.length > 3 ? '...' : ''}`);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Show summary of all companies
  console.log('\n📈 Summary Statistics:');
  const withRatings = companies.filter(c => c.rating);
  const avgRating = withRatings.length > 0 ? 
    (withRatings.reduce((sum, c) => sum + c.rating, 0) / withRatings.length).toFixed(1) : 'N/A';
  
  const countries = [...new Set(companies.map(c => c.country).filter(Boolean))];
  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  
  console.log(`📊 Total Companies: ${companies.length}`);
  console.log(`⭐ Average Rating: ${avgRating}`);
  console.log(`🌍 Countries: ${countries.slice(0, 3).join(', ')}${countries.length > 3 ? ` (+${countries.length - 3} more)` : ''}`);
  console.log(`🏭 Industries: ${industries.slice(0, 3).join(', ')}${industries.length > 3 ? ` (+${industries.length - 3} more)` : ''}`);
}

// Run the test
if (require.main === module) {
  testScraper();
}

module.exports = { testScraper };