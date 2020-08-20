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
        this.isReady = [];

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
        if (!this.isReady.includes(user)) {
            this.isReady.push(user);
        }
    }

    // Checks if the game is ready to start
    checkReady = () => {
        if (this.isReady.length == this.users.length) {
            return true;
        }
        return false;
    }

    // Send a question
    sendQuestion = () => {

    }
}

module.exports = { Room }