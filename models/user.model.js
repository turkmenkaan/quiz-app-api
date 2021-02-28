const mongoose = require('mongoose');

const User = mongoose.model('User', mongoose.Schema({
    name: String
}));

module.exports = User;