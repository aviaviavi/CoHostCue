// Import the required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Set up the Express app and the server
const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Set up a route to serve the client-side code
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Listen for incoming socket connections
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Listen for the 'notify' event
  socket.on('notify', data => {
    console.log(`User ${socket.id} has been notified ${data}`);

    // Emit the 'notification' event to all connected sockets except the sender
    socket.broadcast.emit('notification', { from: 'Co-host', notification: data.notification });
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});