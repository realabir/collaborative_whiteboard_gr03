var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
    cors: {
        origin: [
            'https://cwhiteboard-test.herokuapp.com/'
        ],
    },
});
app.use(express.static(__dirname + '/dist/collaborative-whiteboard'));
app.get('/*', function (req, resp) {
    resp.sendFile(__dirname + '/dist/collaborative-whiteboard/index.html');
});
var users = {};
io.on('connection', function (socket) {
    console.log("New user connected: ".concat(socket.id));
    socket.emit('user-id', socket.id);
    socket.on('new-user', function (userName) {
        users[socket.id] = userName;
        socket.broadcast.emit('user-connected', userName);
    });
    socket.on('chatText', function (data) {
        socket.broadcast.emit('chatText', data);
    });
    socket.on('erase', function (data) {
        socket.broadcast.emit('erase', data);
    });
    socket.on('draw', function (data) {
        socket.broadcast.emit('draw', data);
    });
    socket.on('chat-message', function (data) {
        var message = {
            user: users[socket.id],
            chatText: data,
        };
        io.emit('chat-message', message);
    });
    socket.on('clear', function () {
        socket.broadcast.emit('clear');
    });
    socket.on('disconnect', function () {
        console.log("User disconnected: ".concat(socket.id));
        socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    });
});
server.listen(process.env['PORT'] || 8080);
