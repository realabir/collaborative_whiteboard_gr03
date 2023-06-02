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
var drawings = []; // Store drawings
var texts = []; // Store texts
var chatMessages = []; // Store chat messages
io.on('connection', function (socket) {
    console.log("New user connected: ".concat(socket.id));
    socket.emit('user-id', socket.id);
    // Send existing drawings to the newly connected user
    for (var _i = 0, drawings_1 = drawings; _i < drawings_1.length; _i++) {
        var drawing = drawings_1[_i];
        socket.emit('draw', drawing);
    }
    // Send existing texts to the newly connected user
    for (var _a = 0, texts_1 = texts; _a < texts_1.length; _a++) {
        var text = texts_1[_a];
        socket.emit('text', text);
    }
    // Send existing chat messages to the newly connected user
    for (var _b = 0, chatMessages_1 = chatMessages; _b < chatMessages_1.length; _b++) {
        var message = chatMessages_1[_b];
        socket.emit('chat-message', message);
    }
    socket.on('new-user', function (userName) {
        users[socket.id] = userName;
        socket.broadcast.emit('user-connected', userName);
    });
    socket.on('draw', function (data) {
        drawings.push(data); // Store the drawing
        socket.broadcast.emit('draw', data);
    });
    socket.on('erase', function (data) {
        socket.broadcast.emit('erase', data);
    });
    socket.on('text', function (data) {
        texts.push(data); // Store the text
        socket.broadcast.emit('text', data);
    });
    socket.on('chat-message', function (data) {
        var message = {
            user: users[socket.id],
            chatText: data,
        };
        chatMessages.push(message); // Store the chat message
        io.emit('chat-message', message);
    });
    socket.on('clear', function () {
        drawings = []; // Clear stored drawings
        texts = []; // Clear stored texts
        socket.broadcast.emit('clear');
    });
    socket.on('clear-chat', function () {
        chatMessages = []; // Clear stored chat messages
        socket.broadcast.emit('clear-chat');
    });
    socket.on('disconnect', function () {
        console.log("User disconnected: ".concat(socket.id));
        var disconnectedUser = users[socket.id];
        delete users[socket.id];
        socket.broadcast.emit('user-disconnected', disconnectedUser);
    });
});
server.listen(process.env['PORT'] || 8080);
