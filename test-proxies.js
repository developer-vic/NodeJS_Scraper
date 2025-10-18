const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { getAllProxies } = require('./proxies');

// Get proxies from centralized configuration
const proxies = getAllProxies();

// Function to test a single proxy
async function testProxy(proxyString) {
    const [ip, port, username, password] = proxyString.split(':');
    const proxyUrl = `http://${username}:${password}@${ip}:${port}`;
    
    try {
        console.log(`🔍 Testing proxy: ${ip}:${port}...`);
        
        // Create proxy agent
        const agent = new HttpsProxyAgent(proxyUrl);
        
        // Test the proxy by making a request to a location service
        const response = await axios.get('https://httpbin.org/ip', {
            httpsAgent: agent,
            timeout: 10000 // 10 second timeout
        });
        
        // Get location info
        const locationResponse = await axios.get(`http://ip-api.com/json/${response.data.origin}`, {
            timeout: 5000
        });
        
        const location = locationResponse.data;
        
        console.log(`✅ Proxy ${ip}:${port} - WORKING`);
        console.log(`   📍 Location: ${location.city}, ${location.regionName}, ${location.country}`);
        console.log(`   🌐 ISP: ${location.isp}`);
        console.log(`   🔢 IP: ${response.data.origin}`);
        console.log(`   ⏱️  Response time: ${Date.now() - startTime}ms\n`);
        
        return {
            proxy: proxyString,
            working: true,
            ip: response.data.origin,
            location: `${location.city}, ${location.regionName}, ${location.country}`,
            isp: location.isp,
            responseTime: Date.now() - startTime
        };
        
    } catch (error) {
        console.log(`❌ Proxy ${ip}:${port} - FAILED`);
        console.log(`   Error: ${error.message}\n`);
        
        return {
            proxy: proxyString,
            working: false,
            error: error.message
        };
    }
}

// Main function to test all proxies
async function testAllProxies() {
    console.log('🚀 Starting proxy testing...\n');
    
    const results = [];
    
    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        console.log(`Testing proxy ${i + 1}/${proxies.length}`);
        
        global.startTime = Date.now(); // For response time calculation
        const result = await testProxy(proxy);
        results.push(result);
        
        // Add delay between tests to be respectful
        if (i < proxies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Summary
    console.log('=' * 50);
    console.log('📊 SUMMARY REPORT');
    console.log('=' * 50);
    
    const workingProxies = results.filter(r => r.working);
    const failedProxies = results.filter(r => !r.working);
    
    console.log(`✅ Working proxies: ${workingProxies.length}/${proxies.length}`);
    console.log(`❌ Failed proxies: ${failedProxies.length}/${proxies.length}\n`);
    
    if (workingProxies.length > 0) {
        console.log('🌍 WORKING PROXY LOCATIONS:');
        workingProxies.forEach((proxy, index) => {
            console.log(`${index + 1}. ${proxy.proxy.split(':')[0]} - ${proxy.location} (${proxy.isp})`);
        });
    }
    
    if (failedProxies.length > 0) {
        console.log('\n💥 FAILED PROXIES:');
        failedProxies.forEach((proxy, index) => {
            console.log(`${index + 1}. ${proxy.proxy.split(':')[0]} - ${proxy.error}`);
        });
    }
    
    // Return results for potential further use
    return results;
}

// Direct execution check
if (require.main === module) {
    testAllProxies()
        .then(results => {
            console.log('\n🎯 Testing completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Testing failed:', error);
            process.exit(1);
        });
}

module.exports = { testAllProxies, testProxy };