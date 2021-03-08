const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const UserController = require('./controllers/user.controller');
const QuestionController = require('./controllers/question.controller');
const QueueController = require('./controllers/queue.controller');

const Middleware = require('./middlewares');
const mainRouter = require('./routes');

const Room = require('./room').Room;
require('dotenv').config();

const QUESTION_NUMBER = 5;
const port = process.env.PORT || 3000;
const connectedUsers = {};  // { socket : room (object) }
const rooms = {};  // { roomId: room (object) }
let waitingUsers = [];

admin.initializeApp({
  credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
})

app.use(cookieParser());
app.use(bodyParser.json());
app.use('/', mainRouter);

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

const removeWaitingUser = (socket) => {
  waitingUsers = waitingUsers.filter(user => !(Object.is(socket, user.socket)));
}

io.on('connection', (socket) => {
  // const authorizationHeader = req.headers['authorization'] ? req.headers['authorization'].split(" ")[1] : '';
  console.log('[CONNECTED]');

  // admin.auth().verifyIdToken(authorizationHeader)
  //   .then((decodedClaims) => {
  //     // console.log(decodedClaims);
  //     console.log('[CONNECTED]');
  //   })
  //   .catch((error) => {
  //     console.log("[ERROR] Not authenticated, DISCONNECTED");
  //     socket.close();
  //   });

  connectedUsers[socket] = null;

  socket.on('disconnect', () => {
    // If the user is in a room
    if (connectedUsers[socket]) {
      const activeRoom = connectedUsers[socket];
      console.log("[DISCONNECTED] In a room");
      activeRoom.endGame(socket);
      delete connectedUsers[socket];
      delete activeRoom;
    }

    // Remove the user from the waiting list
    // Time complexity O(n)
    else {
      console.log('[DISCONNECTED] not in a room');
      removeWaitingUser(socket);
      // waitingUsers = waitingUsers.filter(user => !(Object.is(socket, user.socket)));
    }
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
  socket.on("JOIN ROOM", (object, callback) => {
    
    console.log(`[JOIN ROOM] ${JSON.stringify(object)} is looking for room`);
    
    // If there is another user waiting for a game
    // put them in the same room and start the game
    let target = object.languages.to; // Target language
    const user = {
      username: object.username,
      uid: object.uid,
      socket
    }

    // TODO: Replace User with the User model
    if (!QueueController.isEmpty(target) && !QueueController.isDuplicate(target, user)) {
      const roomId = uuidv4();
      const roomSocket = io.to(roomId);
      const users = new Map();

      users.set(socket, {
        username: object.username,
        id: object.uid
      });

      users.set(waitingUsers[0].socket, {
        username: waitingUsers[0].username,
        id: waitingUsers[0].uid
      });


      /* 
      {
        'socket' : { username: 'kaan' }
      }
      */

      const room = new Room(roomId, roomSocket, users, object.category, QUESTION_NUMBER, object.languages);

      connectedUsers[socket] = room;
      connectedUsers[waitingUsers[0].socket] = room;

      socket.join(roomId);
      const opponent = QueueController.dequeu(target);
      opponent.socket.join(roomId);
      // waitingUsers[0].socket.join(roomId);
      // waitingUsers.shift();
      rooms[roomId] = room;
      room.init();
    } else if (!QuestionController.isDuplicate(target, object.user)) {
      QueueController.enqueue(target, user)

      callback(null, { status: "OK" });
    } else {
      console.log(`[WARNING] Duplicate request from ${object.username}`)
    }

  });

  socket.on("CANCEL JOIN ROOM", () => {
    removeWaitingUser(socket);
    console.log("[CANCEL JOIN ROOM]");
  });

  socket.on("READY", (object) => {
    const room = rooms[object.roomId];
    
    if (room) {
      room.userReady(socket);

      if (room.checkReady()) {
        room.sendQuestion();
      }
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

  socket.on("LEAVE GAME", () => {
    const activeRoom = connectedUsers[socket];
    console.log("[LEAVE GAME]");
    if (activeRoom) {
      activeRoom.endGame(socket);
      delete connectedUsers[socket];
      delete activeRoom;
    }
  });
})

http.listen(port, () => {
  console.log('listening on *:3000');
});