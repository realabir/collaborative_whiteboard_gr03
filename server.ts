const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'https://collaborative-whiteboard-gr03.herokuapp.com/'
    ],
  },
});

app.use(express.static(__dirname + '/dist/collaborative-whiteboard'))
app.get('/*', (req: any, resp: any) =>{
  resp.sendFile(__dirname + '/dist/collaborative-whiteboard/index.html')
})

let users: { [key: string]: string } = {};
let onlineUsers: { [key: string]: string } = {};
let drawings: any[] = []; // Store drawings
let texts: any[] = []; // Store texts
let chatMessages: any[] = []; // Store chat messages

io.on('connection', (socket: any) => {
  console.log(`New user connected: ${socket.id}`);
  socket.emit('user-id', socket.id);

  // Send existing drawings to the newly connected user
  for (const drawing of drawings) {
    socket.emit('draw', drawing);
  }

  // Send existing texts to the newly connected user
  for (const text of texts) {
    socket.emit('text', text);
  }

  // Send existing chat messages to the newly connected user
  for (const message of chatMessages) {
    socket.emit('chat-message', message);
  }

  socket.on('new-user', (userName: string) => {
    if (userName && !Object.values(users).includes(userName)) {
      users[socket.id] = userName;
      onlineUsers[socket.id] = userName;
      socket.broadcast.emit('user-connected', userName);
      io.emit('online-users', Object.values(onlineUsers));
    } else {
      socket.emit('invalid-username');
    }
  });

  socket.on('draw', (data: any) => {
    drawings.push(data); // Store the drawing
    socket.broadcast.emit('draw', data);
  });

  socket.on('erase', (data: any) => {
    socket.broadcast.emit('erase', data);
  });

  socket.on('text', (data: any) => {
    texts.push(data); // Store the text
    socket.broadcast.emit('text', data);
  });

  socket.on('chat-message', (data: any) => {
    const message = {
      user: users[socket.id],
      chatText: data,
    };
    chatMessages.push(message); // Store the chat message
    io.emit('chat-message', message);
  });

  socket.on('clear', () => {
    drawings = []; // Clear stored drawings
    texts = []; // Clear stored texts
    socket.broadcast.emit('clear');
  });

  socket.on('clear-chat', () => {
    chatMessages = []; // Clear stored chat messages
    socket.broadcast.emit('clear-chat');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const disconnectedUser = users[socket.id];
    delete users[socket.id];
    delete onlineUsers[socket.id];
    socket.broadcast.emit('user-disconnected', disconnectedUser);
    io.emit('online-users', Object.values(onlineUsers));
  });
});

server.listen(process.env['PORT'] || 8080);
