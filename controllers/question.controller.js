const Question = require('../models/question.model');

const QuestionController = {
    index: function (req, res) {
        Question.find({})
        .then((words) => {
          console.log(words);
          res.send(words);
        })
        .catch((error) => {
            console.log("[ERROR] Questions could not be fetched:", error);
            res.send("Questions could not be fetched!");
        })
    }
}

module.exports = QuestionController;