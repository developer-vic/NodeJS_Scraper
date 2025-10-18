# Node.js Web Scraper API

A powerful Node.js backend service for scraping company data from websites, with specialized support for **Clutch.co agency listings**. The API accepts URLs and returns structured JSON data containing comprehensive company information.

## Features

- 🚀 Express.js REST API
- 🎯 **Specialized Clutch.co scraper** for agency listings
- 🔍 Dual scraping approach (Cheerio + Puppeteer)
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- 📊 Structured JSON responses with rich company data
- 🔄 Automatic fallback for dynamic content
- ⚡ Fast static content parsing
- 🧪 Error handling and validation

## Scraped Data Fields

### Standard Fields (All URLs)
- **Company Name** - Business name or organization title
- **Website** - Primary website URL
- **Industry/Category** - Business sector or industry type
- **Country/Region** - Geographic location
- **Email** - Contact email address (if available)
- **Phone** - Contact phone number (if available)
- **LinkedIn URL** - Official LinkedIn profile (if available)

### Enhanced Clutch.co Fields
When scraping Clutch.co URLs, additional fields are extracted:
- **Rating** - Company rating (e.g., 4.8)
- **Review Count** - Number of reviews (e.g., 65)
- **Hourly Rate** - Service pricing range (e.g., "$100 - $149 / hr")
- **Project Size** - Minimum project size (e.g., "$5,000+")
- **Employee Count** - Company size (e.g., "250 - 999")
- **Location** - Detailed location (e.g., "San Diego, CA")
- **Services** - Array of offered services with percentages
- **Profile URL** - Direct link to Clutch.co profile

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NodeJS_Scraper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Scrape Company Data

#### POST Method (Recommended)
```
POST /api/scraper/scrape
Content-Type: application/json

{
  "url": "https://example-company.com"
}
```

#### GET Method (Alternative)
```
GET /api/scraper/scrape?url=https://example-company.com
```

## Response Format

### Success Response (Clutch.co - Single Page)
```json
{
  "success": true,
  "url": "https://clutch.co/agencies",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [
    {
      "companyName": "Power Digital",
      "website": "https://powerdigitalmarketing.com/growthplan/",
      "industry": "Advertising",
      "country": "United States",
      "email": null,
      "phone": "+1 (619) 613-2751",
      "linkedinUrl": null,
      "rating": 4.8,
      "reviewCount": 65,
      "hourlyRate": "$100 - $149 / hr",
      "projectSize": "$5,000+",
      "employeeCount": "250 - 999",
      "location": "San Diego, CA",
      "services": ["15% Advertising", "25% Social Media Marketing", "20% Pay Per Click"],
      "profileUrl": "https://clutch.co/profile/power-digital"
    }
  ]
}
```

### Success Response (Clutch.co - Multi-Page)
```json
{
  "success": true,
  "url": "https://clutch.co/agencies",
  "pages": {
    "start": 1,
    "end": 3,
    "total": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "companies": [
      {
        "companyName": "Power Digital",
        "website": "https://powerdigitalmarketing.com/growthplan/",
        "industry": "Advertising",
        "country": "United States",
        "phone": "+1 (619) 613-2751",
        "rating": 4.8,
        "reviewCount": 65,
        "hourlyRate": "$100 - $149 / hr",
        "projectSize": "$5,000+",
        "employeeCount": "250 - 999",
        "location": "San Diego, CA",
        "services": ["15% Advertising", "25% Social Media Marketing"],
        "profileUrl": "https://clutch.co/profile/power-digital"
      }
    ],
    "pagination": {
      "startPage": 1,
      "endPage": 3,
      "totalPages": 3,
      "totalCompanies": 150,
      "scrapedPages": [
        {
          "page": 1,
          "url": "https://clutch.co/agencies",
          "companiesFound": 50
        },
        {
          "page": 2,
          "url": "https://clutch.co/agencies?page=2",
          "companiesFound": 50
        },
        {
          "page": 3,
          "url": "https://clutch.co/agencies?page=3",
          "companiesFound": 50
        }
      ]
    }
  }
}
```

### Success Response (Other Websites)
```json
{
  "success": true,
  "url": "https://example-company.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "companyName": "Example Company Inc.",
    "website": "https://example-company.com",
    "industry": "Technology",
    "country": "United States",
    "email": "contact@example-company.com",
    "phone": "+1-555-123-4567",
    "linkedinUrl": "https://linkedin.com/company/example-company"
  }
}
```

### Error Response
```json
{
  "error": "Scraping Failed",
  "message": "Failed to scrape https://invalid-url.com: Request timeout"
}
```

## Usage Examples

### Scraping Clutch.co Agencies (Recommended)

#### Single Page Scraping
```bash
# POST request for Clutch.co agencies (single page)
curl -X POST http://localhost:3000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://clutch.co/agencies"}'

# GET request for Clutch.co agencies (single page)
curl "http://localhost:3000/api/scraper/scrape?url=https://clutch.co/agencies"
```

#### Multi-Page Scraping with Pagination
```bash
# POST request for pages 1-3
curl -X POST http://localhost:3000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://clutch.co/agencies", "startPage": 1, "endPage": 3}'

# GET request for pages 2-4
curl "http://localhost:3000/api/scraper/scrape?url=https://clutch.co/agencies&startPage=2&endPage=4"

# POST request for specific category with pagination
curl -X POST http://localhost:3000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://clutch.co/web-developers", "startPage": 1, "endPage": 2}'
```

#### URL Page Parameter Handling
The scraper automatically handles page parameters in URLs:
- If URL contains `?page=X`, it will be removed and replaced with proper pagination
- Page 1 URLs won't include `?page=1` (Clutch.co default behavior)
- Pages 2+ will include `?page=N` parameter

### Other Websites
```bash
# POST request for any website
curl -X POST http://localhost:3000/api/scraper/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example-company.com"}'

# GET request for any website
curl "http://localhost:3000/api/scraper/scrape?url=https://example-company.com"
```

### Using JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/scraper/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data);
```

## Configuration

The server runs on port `3000` by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Rate Limiting

The API includes rate limiting to prevent abuse:
- **Limit**: 100 requests per 15 minutes per IP
- **Response**: 429 Too Many Requests when exceeded

## Error Handling

The API handles various error scenarios:
- Invalid URLs
- Network timeouts
- Scraping failures
- Rate limit exceeded
- Server errors

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (Jest)

### Project Structure
```
NodeJS_Scraper/
├── server.js              # Main server file
├── routes/
│   └── scraper.js         # API routes
├── services/
│   └── scraperService.js  # Scraping logic
├── package.json           # Dependencies and scripts
└── README.md             # Documentation
```

## Dependencies

### Production
- **express**: Web framework
- **cheerio**: HTML parsing (static content)
- **puppeteer**: Browser automation (dynamic content)
- **axios**: HTTP client
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **express-rate-limit**: Rate limiting

### Development
- **nodemon**: Development auto-reload
- **jest**: Testing framework

## Notes

- **Clutch.co Optimization**: The scraper automatically detects Clutch.co URLs and uses a specialized scraper optimized for their structure
- **Multiple Results**: Clutch.co URLs return an array of companies, while other URLs return a single company object
- **Real-time Data**: All data is scraped in real-time with no cached or demo results
- **Dynamic Content**: Uses Puppeteer for JavaScript-heavy sites and Cheerio for static content
- **Rate Limiting**: Built-in protection against abuse with configurable limits
- **Timeout Handling**: Graceful handling of slow-loading pages and timeouts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.