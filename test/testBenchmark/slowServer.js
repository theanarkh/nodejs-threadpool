const http = require('http');
const cal = require('./cal');
http.createServer(function(req, res) {
    cal();
    res.end('OK');
}).listen(9297);
