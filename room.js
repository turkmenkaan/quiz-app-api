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
   * @param {Array} users
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
    this.timer = 60; // Temporarily hard coded

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
    this.users.forEach( (val, key) => usersArray.push(val.username));
    this.timer = 60;
    this.currentQuestion = 0;

    console.log(`[START GAME] Game starting between ${usersArray[0]} and ${usersArray[1]}`);
    this.roomSocket.emit("START GAME", {
      roomId: this.roomId,
      questionNumber: this.questionNumber,
      users: Object.values(this.users).map((user) => user.username),
      timer: this.timer
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
    this.isTimeUp = false;
    this.timeout = setTimeout(this.timeUp, this.timer * 1000);
  }

  timeUp = () => {
    this.isTimeUp = true;
    this.checkAnswer();
  }

  checkAnswer = (socket, answer) => {
  
    const correctAnswer = this.questionOrder[this.currentQuestion][this.languages.to];
    this.isAnswered.set(socket, true);
    
    // Check if both users answered
    if ([...this.isAnswered.values()].every((answered) => answered ) || this.isTimeUp) {
      if (this.isTimeUp) {
        console.log('[TIME UP]')
      }
      console.log(`[END QUESTION] Correct Answer: ${correctAnswer}`);
      this.roomSocket.emit("END QUESTION", {
        'correct-answer' : correctAnswer
      });
      
      this.users.forEach( (user, socket) => this.isAnswered.set(socket, false));
      this.currentQuestion++;

      this.scoreboard.set(this.users.get(socket), this.scoreboard.get(this.users.get(socket) + 1));
      clearTimeout(this.timeout);
      this.nextQuestion();
    }
    // console.log(this.users.get(socket).username);
  }

  nextQuestion = () => {
    if (this.currentQuestion == this.questionNumber) {
      // END GAME
      setTimeout(this.endGame, 3000);
    } else {
      // NEXT QUESTION
      setTimeout(this.sendQuestion, 3000);
    }
  }

  /*
   SCOREBOARD
    {
      'kaan' : 5,
      'sahircan' : 10
    }
  */
  endGame = () => {
    console.log("[END GAME]")
    this.roomSocket.emit("END GAME", {
      scoreboard : Object.fromEntries(this.scoreboard.entries()),
      winner : [...this.scoreboard.entries()].reduce((a, e) => e[1] > a[1] ? e : a)[0]
    });
    this.currentQuestion = 0;
  }
}

module.exports = { Room }