const mongoose = require('mongoose')

const QuestionSchema = new mongoose.Schema({
    en: String,
    tr: String,
    category: String
});

const Question = mongoose.model('Question', QuestionSchema, 'words');

module.exports = {
    Question
};