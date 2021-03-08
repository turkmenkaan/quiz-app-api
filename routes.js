const express = require('express');
const router = express.Router();
const UserController = require('./controllers/user.controller');
const QuestionController = require('./controllers/question.controller');
const Middleware = require('./middlewares')

router.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// router.get('/users', Middleware.isAuthenticated, UserController.index);
router.get('/users', UserController.index);
router.get('/user/:uid', UserController.show);
router.post('/users', UserController.store);

router.get('/words', QuestionController.index);


module.exports = router;