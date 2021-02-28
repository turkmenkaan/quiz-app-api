const admin = require('firebase-admin');

module.exports = {
    isAuthenticated: function (req, res, next) {
        const authorizationHeader = req.headers['authorization'] ? req.headers['authorization'].split(" ")[1] : '';
        console.log(authorizationHeader);
        admin.auth().verifyIdToken(authorizationHeader)
        .then((decodedClaims) => {
            console.log(decodedClaims);
            console.log("[DEBUG] Authenticated");
            next();
        })
        .catch( (error) => {
            console.log("[ERROR] Not authenticated");
            res.sendStatus(401)
        });
    }
}