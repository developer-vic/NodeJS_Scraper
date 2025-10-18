/**
 * Centralized proxy configuration
 * All validated working proxies with their credentials
 * Format: ip:port:username:password
 */

const PROXIES = [
    '142.111.48.253:7030:lrjuntov:ohg8mtsazkag',    // Los Angeles, CA, US - Leaseweb USA
    '31.59.20.176:6754:lrjuntov:ohg8mtsazkag',      // London, England, UK - Leaseweb UK
    '38.170.176.177:5572:lrjuntov:ohg8mtsazkag',    // Los Angeles, CA, US - B2 Net Solutions
    '198.23.239.134:6540:lrjuntov:ohg8mtsazkag',    // Buffalo, NY, US - HostPapa
    '45.38.107.97:6014:lrjuntov:ohg8mtsazkag',      // London, England, UK - UK-2 Limited
    '107.172.163.27:6543:lrjuntov:ohg8mtsazkag',    // Buffalo, NY, US - ColoCrossing
    '64.137.96.74:6641:lrjuntov:ohg8mtsazkag',      // Madrid, Spain - Getechbrothers
    '216.10.27.159:6837:lrjuntov:ohg8mtsazkag',     // Los Angeles, CA, US - Colocation America
    '142.111.67.146:5611:lrjuntov:ohg8mtsazkag',    // Ueda, Nagano, Japan - Leaseweb Japan
    '142.147.128.93:6593:lrjuntov:ohg8mtsazkag'     // Ashburn, VA, US - NTT America
];

/**
 * Get all available proxies
 * @returns {Array<string>} Array of proxy strings
 */
function getAllProxies() {
    return [...PROXIES]; // Return a copy to prevent modification
}

/**
 * Get a random proxy from the list
 * @returns {string} Random proxy string
 */
function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * PROXIES.length);
    return PROXIES[randomIndex];
}

/**
 * Parse proxy string into components
 * @param {string} proxyString - Proxy string
 * @returns {Object} Parsed proxy components
 */
function parseProxy(proxyString) {
    const [ip, port, username, password] = proxyString.split(':');
    return {
        ip,
        port: parseInt(port),
        username,
        password,
        formatted: `${ip}:${port}`,
        withAuth: `${username}:${password}@${ip}:${port}`
    };
}

module.exports = {
    getAllProxies,
    getRandomProxy,
    parseProxy
};