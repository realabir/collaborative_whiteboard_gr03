import * as express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import { Realtime } from 'ably';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:4200',
      'collaborative-whiteboard-gr03.vercel.app',
      'https://collaborative-whiteboard-gr03-git-master-realabir.vercel.app',
      'collaborative-whiteboard-gr03-omfefhhl9-realabir.vercel.app'
    ],
  },
});

const PORT = process.env['PORT'] || 3000;
let users: { [key: string]: string } = {};

// Ably configuration
const ably = new Realtime({ key: 'Q-6dRg.E1HCQA:qMU01Uzx5QY8JfQ0eeqNmBEnWX-S3EPbt-p3zzIoWU0' });
const ablyChannel = ably.channels.get('Collaborative Whiteboard');
ablyChannel.attach();

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);
  socket.emit('user-id', socket.id);

  socket.on('new-user', (userName: string) => {
    users[socket.id] = userName;
    socket.broadcast.emit('user-connected', userName);
  });

  socket.on('text', (data) => {
    socket.broadcast.emit('text', data);
    ablyChannel.publish('text', data);
  });

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
    ablyChannel.publish('draw', data);
  });

  socket.on('chat-message', (data) => {
    const message = {
      user: users[socket.id],
      text: data,
    };
    io.emit('chat-message', message);
    ablyChannel.publish('chat-message', data);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
    ablyChannel.publish('clear');
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
