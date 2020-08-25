// TODO: Cevap gelince kontrol et
// TODO: Yeni soru
// TODO: Oyun sırasında bir kişi disconnect ederse handle'la
// TODO: Timer
// TODO: Oyun bitince oyunu rooms'dan sil
// LEAVE GAME mesajını handle'la

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Question = require('./model').Question;
const Room = require('./room').Room;
require('dotenv').config();

const port = process.env.PORT || 3000;

const rooms = {};
let waitingUsers = [];

const connectedUsers = {};

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})
  .then(() => {
    console.log("Database connection established!");
  })
  .catch((err) => {
    console.log(err);
  });


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected!');
  connectedUsers[socket] = null;

  socket.on('disconnect', () => {
    console.log('user disconnected');

    // Remove the user from the waiting list
    // Time complexity O(n)
    waitingUsers = waitingUsers.filter(user => !(Object.is(socket, user.socket)));
  });

  /** 
   * Join a room with options from the client
   * @typedef {Object} object - Options from the client side
   * @param {string} object.username - Username
   * @param {string} object.category - Word category of the quiz
   * @typedef {Object} languages - Languages
   * @param {('en' | 'tr')} from - Question language
   * @param {('en' | 'tr')} to - Answer language
  */
  socket.on("JOIN ROOM", (object) => {
    console.log(`${object.username} is looking for room`);

    // If there is another user waiting for a game
    // put them in the same room and start the game
    if (waitingUsers.length > 0) {
      const roomId = uuidv4();
      const roomSocket = io.to(roomId);
      /*
      const langs = {
          "from" : "en",
          "to" : "tr"
      };
      */
      // TODO: decide on users' object structure
      
      const users = {};

      users[socket] = {
        username: object.username,
      }

      users[waitingUsers[0].socket] = {
        username: waitingUsers[0].username
      }
      
      // const users = [waitingUsers[0], {
      //   username: object.username,
      //   socket
      // }];
      
      const room = new Room(roomId, roomSocket, users, object.category, 5, object.languages);

      connectedUsers[socket] = room;
      connectedUsers[waitingUsers[0].socket] = room;

      socket.join(roomId);
      waitingUsers[0].socket.join(roomId);
      waitingUsers.shift();
      rooms[roomId] = room;
      room.init();
    } else {
      waitingUsers.push({
        username: object.username,
        socket,
      });
    }
  });

  socket.on("READY", (object) => {
    const room = rooms[object.roomId];
    room.userReady(socket);

    if (room.checkReady()) {
      room.sendQuestion();
    }

    // Iki taraftan da ready geldiginde ilk soruyu gonder
    // Room'a yolla
  })

  socket.on('ANSWER', (object) => {
    console.log(`User: ${object.user} Answer: ${object.answer}`);
    connectedUsers[socket].checkAnswer(socket, object.answer);
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