const queues = require('../models/queue.model');

/**
 * The purpose of this controller is to provide an interface
 * for the waiting queue system.
 */

const QueueController = {
    // Add a user to the end of the target language queue
    enqueue: function (target, user) {
        queues[target].push(user);
    },

    // Remove a user from the beginning of the target language queue
    dequeu: function (target) {
       return queues[target].shift();
    },

    removeUser: function (target, user) {
        // TODO: Update the comparison method for the user
        queues[target].filter(elem => elem !== user);
    },

    // Search for a user in the given target language queue
    searchQueue: function (target, user) {
        // TODO: Update the comparison method for the user
        queues[target].some((element) => element === user);
    },

    isDuplicate: function (target, user) {
        return queues[target].some((user) => user.uid === object.uid);
    },

    isEmpty: function (target) {
        return queues[target].length === 0;
    }
}


module.exports = QueueController;