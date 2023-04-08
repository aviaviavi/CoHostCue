// Import the required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Set up the Express app and the server
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

// Create a map to store the mapping of studio ID to its connected users
const studios = new Map();
const userToStudio = new Map();

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
    // Add the socketId to the studio so that we can track the connected users
    if (studios.has(studioId)) {
      const studio = studios.get(studioId);
      studio.push(socket.id);
    } else {
      studios.set(studioId, [socket.id]);
    }
    // Send the occupancy of the studio to all connected users
    const studio = studios.get(studioId);
    io.to(studioId).emit('studio-occupancy', { occupancy: studio.length });

    // Add the user to the user to studio map
    userToStudio.set(socket.id, studioId);
  });

  // Listen for users leaving the studio
  socket.on('leave-studio', (data) => {
    const studioId = data.studioId;
    socket.leave(studioId);
    console.log(`User ${socket.id} left studio: ${studioId}`);
    // Remove the sessionId from the studio
    if (studios.has(studioId)) {
      const studio = studios.get(studioId);
      const index = studio.indexOf(socket.id);
      if (index > -1) {
        studio.splice(index, 1);
      }
    }
    // Send the occupancy of the studio to all connected users
    const studio = studios.get(studioId);
    io.to(studioId).emit('studio-occupancy', { occupancy: studio.length });
  });

  // Listen for the 'notify' event
  socket.on('notify', (data) => {
    console.log(`User ${socket.id} has been notified ${data}`);

    // Emit the 'notification' event to all connected sockets in the studio except the sender
    socket.to(socket.studioId).emit('notification', { from: 'Co-host', notification: data.notification });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);

    // get the studio Id from the user to studio map
    const studioId = userToStudio.get(socket.id);

    // Remove the sessionId from the studio
    if (studios.has(studioId)) {
      const studio = studios.get(studioId);
      const index = studio.indexOf(socket.id);
      if (index > -1) {
        studio.splice(index, 1);
      }
      // Send the occupancy of the studio to all connected users
      io.to(studioId).emit('studio-occupancy', { occupancy: studio.length });
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
