const admin = require('firebase-admin');
const User = require('../models/user.model');

const UserController = {
    index: function (req, res) {
        let users = [];

        admin.auth().listUsers()
            .then((listUsersResult) => {
                

                listUsersResult.users.forEach((user) => {
                    users.push({ 
                        displayName: user.displayName, 
                        email: user.email 
                    });
                })

                console.log(users);
                res.send(users);
            })
            .catch((error) => {
                console.log('[ERROR] Could not fetch users:', error);
            });

    },

    show: function (req, res) {
        admin.auth().getUser(req.params.uid)
        .then((user) => {
          res.send(user);
        })
        .catch((error) => {
          console.log('[ERROR] Could not fetch user data from FireBase:', error);
          res.send('Could not fetch user data from FireBase!');
        });    
    },

    store: function (req, res) {
        admin.auth().createUser({
            email: req.body.email,
            password: req.body.password
        })
            .then((user) => {
                console.log("[DEBUG] User created");
                res.send('User Created!');
            }).catch((error) => {
                console.log("[ERROR] User could not be created:", error);
                res.send("User could not be created!");
            })
    }
}

module.exports = UserController;