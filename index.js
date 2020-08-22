const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Question = require('./model').Question;
const Room = require('./room').Room;
require('dotenv').config();

const port = process.env.PORT || 3000;

let rooms = {};
let waitingUsers = [];



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

        // Remove the user from the waiting list
        // Time complexity O(n)
        waitingUsers = waitingUsers.filter(user => !(Object.is(socket, user.socket)));
        console.log(waitingUsers);
    });
  
    socket.on("JOIN ROOM", (object) => {
        console.log(`${object.username} is looking for room`);
        
        // If there is another user waiting for a game
        // put them in the same room and start the game
        if (waitingUsers.length > 0) {
            const roomId = uuidv4();
            const roomSocket = io.to(roomId);
            const langs = {
                "from" : "en",
                "to" : "tr"
            }
            const room = new Room(roomSocket, [waitingUsers[0].username, object.username], "fruits", 5, langs);

            socket.join(roomId);
            waitingUsers[0].socket.join(roomId);
            waitingUsers.shift();
            rooms.roomId = room;
            room.startGame();
        } else {
            waitingUsers.push({
                username : object.username,
                socket,
            });
        }
    });

    socket.on("READY", (object) => {
        const room = rooms[object['room-id']];
        room.ready(object['username']);

        if (room.checkReady()) {
            room.sendQuestion();
        }

        // Iki taraftan da ready geldiginde ilk soruyu gonder
        // Room'a yolla
    })

    socket.on('ANSWER', (object) => {
        console.log(object);
        console.log(`User: ${object.user} Answer: ${object.answer}`);
        // Iki kullanici da cevapladiysa ya da timer bitti ise END QUESTION gonder
        socket.emit("END QUESTION", () => {
            // Soru sayisina ulasilmadiysa
            socket.emit("QUESTION", () => {

            });

            // Sorular bittiyse
            socket.emit("END GAME", () => {

            });
        });
    });

    // // Iki cevap gelmedi ama timer bittiyse
    // socket.emit("END QUESTION", () => {

    // });

    socket.on("LEAVE GAME", (object) => {

    });
})

http.listen(port, () => {
  console.log('listening on *:3000');
});