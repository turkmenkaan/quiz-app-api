const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const Question = require('./model');
const Room = require('./room').Room;
require('dotenv').config();

const port = process.env.PORT || 3000;

/**
 * {
 *  socket : room (object)
 *  ...
 * }
 */
const connectedUsers = {};

/**
 * roomId: room (object)
 */
const rooms = {};
let waitingUsers = [];

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

const User = mongoose.model('User', mongoose.Schema({
  name: String
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/users', (req, res) => {
  const users = User.find(function (err, users) {
    let html = "";
    users.forEach(user => {
      html += "- " + user['name'] + "<br>";
    });
    console.log(html);
    res.send(html);
  });
})

app.get('/words', (req, res) => {
  const words = Question.find({})
    .then((words) => {
      console.log(words);
      res.send(words);
    })
})

io.on('connection', (socket) => {
  console.log('[CONNECTED]');
  connectedUsers[socket] = null;

  socket.on('disconnect', () => {
    console.log('[DISCONNECTED]');

    // If the user is in a room
    if (connectedUsers[socket]) {
      const activeRoom = connectedUsers[socket];      
      console.log("[DISCONNECTED] In a room");
      activeRoom.endGame(socket);
      connectedUsers.delete(socket);
      rooms = rooms.filter(room => !Object.is(room, activeRoom))
    }

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
    console.log(`[JOIN ROOM] ${object.username} is looking for room`);


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

      const users = new Map();

      // console.log(`[DEBUG] ${JSON.stringify(waitingUsers[0])}`)
      users.set(socket, {
        username: object.username,
      });

      users.set(waitingUsers[0].socket, {
        username: waitingUsers[0].username
      });
      
      // console.log(users);
      // console.log(`${JSON.stringify(users)}`);

      
      /* 
      {
        'socket' : { username: 'kaan' }
      }
      */

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
    console.log(`[ANSWER] User: ${object.user} Answer: ${object.answer}`);
    connectedUsers[socket].checkAnswer(socket, object.answer);
    // Iki kullanici da cevapladiysa ya da timer bitti ise END QUESTION gonder
  });

  // // Iki cevap gelmedi ama timer bittiyse
  // socket.emit("END QUESTION", () => {

  // });

  // TODO: Oyun bitince oyunu rooms'dan sil
  // TODO: LEAVE GAME mesajını handle'la
  socket.on("LEAVE GAME", (object) => {
    console.log("[LEAVE GAME]")
  });
})

http.listen(port, () => {
  console.log('listening on *:3000');
});