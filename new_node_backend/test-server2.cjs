const net = require('net');
const server = net.createServer();
server.listen(3001, '0.0.0.0', () => console.log('tcp server running on port', server.address().port, server.address().address));
server.on('error', (err) => console.error('error:', err));