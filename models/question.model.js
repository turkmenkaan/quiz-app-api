const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    en: String,
    tr: String,
    category: String
});

module.exports = mongoose.model('Question', QuestionSchema, 'words');