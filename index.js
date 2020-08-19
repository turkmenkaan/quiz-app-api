const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

const Question = require('./model').Question;
require('dotenv').config();

const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, () => {
    console.log("Database connection established!");
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('A user connected!');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
  
    socket.on('chat message', (msg) => {
        console.log("message: " + msg);
        socket.emit('STARTGAME', {
            'user' : 'kaan',
            'question-number' : 5
        })
    });
})

http.listen(port, () => {
  console.log('listening on *:3000');
});