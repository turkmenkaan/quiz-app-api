// Question model for the database
const Question = require("./model");

// shuffle function from the lodash module
// Runtime complexity O(n)
// Not an in place function
const shuffle = require("lodash.shuffle");

class Room {
  /**
   * 
   * @param {} roomSocket 
   * @param {Object} users
   * @param {String} category 
   * @param {Integer} questionNumber 
   * @param {Object} languages
   * {
   *   "from" : "en",
   *   "to" : "tr"
   * }  
   */
  constructor(roomId, roomSocket, users, category, questionNumber, languages) {
    this.roomId = roomId;
    this.roomSocket = roomSocket;
    /*
    {
      socket: user
    }
    */
    this.users = users;
    this.category = category;
    this.questionNumber = questionNumber;
    this.choiceNumber = 4; // How many choices in a question
    this.languages = languages;
    // Create a map [[socket1, false], [socket2, false]]
    this.isReady = new Map();
    this.isAnswered = new Map();
    this.scoreboard = new Map();
    this.currentQuestion = 0; // Question index

    this.users.forEach( (user, socket) => {
      this.isReady.set(socket, false);
      this.isAnswered.set(socket, false);
      this.scoreboard.set(user, 0);
    });

  }

  // Fetch the words and generate questions
  init = async () => {
    try {
      this.words = await this.getWords();

      // Choose the question words
      this.questionOrder = shuffle(this.words);

      // Start Game
      this.startGame();
    } catch (err) {
      // Handle database errors
      console.log(err)
    }
  }

  // Fetch the words from database
  getWords = async () => {
    return Question.find({category: this.category}, `${this.languages.from} ${this.languages.to}`)
      .then((words) => {
        return words;
      })
      .catch((err) => {
        console.log(err);
      })
  }

  // Get the current question prompt
  getCurrentPromt = () => {
    return this.questionOrder[this.currentQuestion][this.languages.from];
  }

  // Generate 3 other choices 
  generateChoices = (question) => {
    return shuffle([
      question,
      ...shuffle(this.words.filter((word) => word !== question)).slice(0, this.choiceNumber - 1)
    ]).map((word) => word[this.languages.to]);
  }

  // Generate the complete question
  generateQuestion = () => {
    return {
      prompt: this.getCurrentPromt(),
      choices: this.generateChoices(this.questionOrder[this.currentQuestion]),
      'current-question' : this.currentQuestion
    }
  }

  startGame = () => {
    const usersArray = [];
    this.users.forEach( (val, key) => usersArray.push(val.username))

    console.log(`[START GAME] Game starting between ${usersArray[0]} and ${usersArray[1]}`);
    this.roomSocket.emit("START GAME", {
      roomId: this.roomId,
      questionNumber: this.questionNumber,
      users: Object.values(this.users).map((user) => user.username)
    });
  }

  // FIXME: Unnecessary
  // Both users are ready, send the socket message
  sendReady = () => {
    this.roomSocket.emit("READY");
  }

  // Set ready for a user
  userReady = (user) => {
    this.isReady.set(user, true);
  }

  // Checks if the game is ready to start
  checkReady = () => {
    return [...this.isReady.values()].every((state) => state);
  }

  // Send a question
  sendQuestion = () => {
    const question = this.generateQuestion();
    this.roomSocket.emit("QUESTION", question);
    console.log("[QUESTION]");
  }

  checkAnswer = (socket, answer) => {
  
    this.isAnswered.set(socket, true);
    
    if ([...this.isAnswered.values()].every((answered) => answered )) {
      console.log(`[END QUESTION] Correct Answer: ${this.questionOrder[this.currentQuestion][this.languages.to]}`);
      this.roomSocket.emit("END QUESTION", {
        'correct-answer' : this.questionOrder[this.currentQuestion][this.languages.to]
      });
      
      this.users.forEach( (user, socket) => this.isAnswered.set(socket, false));
      this.currentQuestion++;
      
      if (this.currentQuestion == this.questionNumber) {
        // END GAME
        setTimeout(function () {}, 3000);
      } else {
        // NEXT QUESTION
        setTimeout(this.sendQuestion, 3000);
      }
    } 
    // console.log(this.users.get(socket).username);
  }

  endGame = () => {
    this.roomSocket.emit("END GAME")
  }
}

module.exports = { Room }