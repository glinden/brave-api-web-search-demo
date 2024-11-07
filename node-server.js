const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const bing_api_key = process.env.BING_API_KEY || 'YOUR_BING_API_KEY';
const port = process.env.NODE_SERVER_PORT || 3000;

const logRequest = (req, status) => {
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.url} - ${status}`;
    console.log(logMessage);
};

function serveBingWebSearchJSON(req, res) {
    const queryObject = url.parse(req.url, true).query;
    const query = queryObject.query;
    const bingUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`;

    let headers = {
        'Ocp-Apim-Subscription-Key': bing_api_key,
        'User-Agent': req.headers['user-agent'],
        'X-MSEdge-ClientIP': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };
    if (req.headers['x-search-location']) {
        Object.assign(headers, req.headers['x-search-location']);
    }
    // console.log(headers);
    // console.log(req.headers);

    const bingReq = https.request(bingUrl, {
        method: 'GET',
        headers: headers
    }, bingRes => {
        let data = '';

        bingRes.on('data', chunk => {
            data += chunk;
        });

        bingRes.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
            logRequest(req, '200 OK');
        });
    });

    bingReq.on('error', error => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Server error: ${error.message}` }));
        logRequest(req, '500 Internal Server Error');
    });

    bingReq.end();
}

const serveStaticFile = (req, res, fileName, contentType) => {
    fs.readFile(fileName, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            logRequest(req, '500 Internal Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            logRequest(req, '200 OK');
        }
    });    
};

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/search')) {
        serveBingWebSearchJSON(req, res);
    } else if (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/?q=')) {
        serveStaticFile(req, res, 'index.html', 'text/html');
    } else if (req.url === '/style.css') {
        serveStaticFile(req, res, 'style.css', 'text/css');
    } else if (req.url === '/main.js') {
        serveStaticFile(req, res, 'main.js', 'application/javascript');
    } else {
        res.writeHead(302, { 'Location': '/' });
        res.end();
        logRequest(req, '302 Redirect');
    }
 });

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});