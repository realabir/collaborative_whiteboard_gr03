const express = require('express');
import * as http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:4200',
      'https://collaborative-whiteboard-gr3.herokuapp.com'
    ],
  },
});

const PORT = process.env['PORT'] || 3000;
let users: { [key: string]: string } = {};


io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);
  socket.emit('user-id', socket.id);

  socket.on('new-user', (userName: string) => {
    users[socket.id] = userName;
    socket.broadcast.emit('user-connected', userName);
  });

  socket.on('text', (data) => {
    socket.broadcast.emit('text', data);
  });

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('chat-message', (data) => {
    const message = {
      user: users[socket.id],
      text: data,
    };
    io.emit('chat-message', message);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    socket.broadcast.emit('user-disconnected', users[socket.id]);
    delete users[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});

//Install express server
const path = require('path');


// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/dist/collaborative-whiteboard'));

app.get('/*', function(req: any, res: any) {

  res.sendFile(path.join(__dirname +'/dist/collaborative-whiteboard/index.html'));
});

// Start the app by listening on the default Heroku port
app.listen(process.env['PORT'] || 8080);
