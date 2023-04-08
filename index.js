// Import the required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Set up the Express app and the server
const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Create a map to store the mapping of studio ID to its connected users
const studios = new Map();

// Generate a random ID for each studio
function generateStudioId() {
  return Math.random().toString(36).substring(2, 15);
}

// Set up a route to serve the client-side code
app.get('/', (req, res) => {
  res.redirect(`/${generateStudioId()}`);
});

app.get('/:studioId', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Listen for incoming socket connections
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  socket.on('join-studio', (data) => {
    const studioId = data.studioId;
    socket.join(studioId);
    socket.studioId = studioId;
    console.log(`User ${socket.id} joined studio: ${studioId}`);
  });

  // Listen for the 'notify' event
  socket.on('notify', (data) => {
    console.log(`User ${socket.id} has been notified ${data}`);

    // Emit the 'notification' event to all connected sockets in the studio except the sender
    socket.to(socket.studioId).emit('notification', { from: 'Co-host', notification: data.notification });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
