const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const brave_api_key = process.env.BRAVE_API_KEY || 'YOUR_BRAVE_API_KEY';
const port = process.env.NODE_SERVER_PORT || 3000;

const logRequest = (req, status) => {
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.url} - ${status}`;
    console.log(logMessage);
};

function serveBraveWebSearchJSON(req, res) {
    const queryObject = url.parse(req.url, true).query;
    const query = queryObject.query;
    const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

    let headers = {
        'X-Subscription-Token': brave_api_key,
        'User-Agent': req.headers['user-agent'],
    };
    if (req.headers['X-Loc-Lat']) {
	    Object.assign(headers, req.headers['X-Loc-Lat']);
    }
    if (req.headers['X-Loc-Long']) {
	    Object.assign(headers, req.headers['X-Loc-Long']);
    }
    // console.log(headers);
    // console.log(req.headers);

    const braveReq = https.request(braveUrl, {
        method: 'GET',
        headers: headers
    }, braveRes => {
        let data = '';

        braveRes.on('data', chunk => {
            data += chunk;
        });

        braveRes.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
            logRequest(req, '200 OK');
        });
    });

    braveReq.on('error', error => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Server error: ${error.message}` }));
        logRequest(req, '500 Internal Server Error');
    });

    braveReq.end();
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
        serveBraveWebSearchJSON(req, res);
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
