const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'https://cwhiteboard-test.herokuapp.com/'
    ],
  },
});

app.use(express.static(__dirname + '/dist/collaborative-whiteboard'))
app.get('/*', (req: any, resp: any) =>{
  resp.sendFile(__dirname + '/dist/collaborative-whiteboard/index.html')
})



let users: { [key: string]: string } = {};

io.on('connection', (socket: any) => {
  console.log(`New user connected: ${socket.id}`);
  socket.emit('user-id', socket.id);

  socket.on('new-user', (userName: string) => {
    users[socket.id] = userName;
    socket.broadcast.emit('user-connected', userName);
  });

  socket.on('chatText', (data: any) => {
    socket.broadcast.emit('chatText', data);
  });

  socket.on('erase', (data: any) => {
    socket.broadcast.emit('erase', data);
  });

  socket.on('draw', (data: any) => {
    socket.broadcast.emit('draw', data);
  });

  socket.on('text', (data: any) => {
    socket.broadcast.emit('text', data);
  });

  socket.on('chat-message', (data: any) => {
    const message = {
      user: users[socket.id],
      chatText: data,
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

server.listen( process.env['PORT'] || 8080 );
