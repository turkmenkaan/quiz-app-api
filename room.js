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
    constructor(roomSocket, users, category, questionNumber, languages) {
        this.roomSocket = roomSocket;
        this.users = users;
        this.category = category;
        this.questionNumber = questionNumber;
        this.languages = languages;
        // Create a map [[socket1, false], [socket2, false]]
        this.isReady = new Map();
        users.forEach((user) => {
            this.isReady.set(user.socket, false)
        });
        console.log(this.isReady);
    }

    // Fetch the words from database
    getWords = async () => {
        Question.find({ category: this.category }, {
            // Only project the necessary languages
            [this.languages.from]: 1,
            [this.languages.to]: 1
        })
        .then((words) => {
            this.words = words;
        })
        .catch((err) => {
            // Handle error fetching the words
            console.log(err);
        });
    }

    startGame = () => {
        this.roomSocket.emit("START GAME");
    }

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

    }
}

module.exports = { Room }