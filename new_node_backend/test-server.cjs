const net = require('net');
const server = net.createServer();
server.listen(3001, '127.0.0.1', () => console.log('tcp server running on port', server.address().port));
server.on('error', (err) => console.error('error:', err));