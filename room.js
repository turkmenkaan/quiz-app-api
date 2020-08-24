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
    users.forEach((user) => {
      this.isReady.set(user.socket, false)
    });
    this.currentQuestion = 0; // Question index
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
    return Question.find({}, `${this.languages.from} ${this.languages.to}`)
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
      choices: this.generateChoices(this.questionOrder[this.currentQuestion])
    }
  }

  startGame = () => {
    this.roomSocket.emit("START GAME", {
      roomId: this.roomId,
      questionNumber: this.questionNumber,
      users: this.users.map((user) => user.username)
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
    console.log(question);
    this.roomSocket.emit("QUESTION", question);
  }
}

module.exports = { Room }