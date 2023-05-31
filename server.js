"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require('express');
var http = require("http");
var socket_io_1 = require("socket.io");
var app = express();
var server = http.createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: [
            'http://localhost:4200',
            'https://collaborative-whiteboard-gr3.herokuapp.com'
        ],
    },
});
var PORT = process.env['PORT'] || 3000;
var users = {};
io.on('connection', function (socket) {
    console.log("New user connected: ".concat(socket.id));
    socket.emit('user-id', socket.id);
    socket.on('new-user', function (userName) {
        users[socket.id] = userName;
        socket.broadcast.emit('user-connected', userName);
    });
    socket.on('text', function (data) {
        socket.broadcast.emit('text', data);
    });
    socket.on('draw', function (data) {
        socket.broadcast.emit('draw', data);
    });
    socket.on('chat-message', function (data) {
        var message = {
            user: users[socket.id],
            text: data,
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
server.listen(PORT, function () {
    console.log("Server started at http://localhost:".concat(PORT));
});
//Install express server
var path = require('path');
// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/dist/src'));
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/src/index.html'));
});
// Start the app by listening on the default Heroku port
app.listen(process.env['PORT'] || 8080);