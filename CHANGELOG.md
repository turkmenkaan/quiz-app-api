
API ENDPOINTS

/api/

user/id/profile
user/id/level

## API DOCUMENTATION

**/questions/** - Retrieves the list of questions (This should not be available for users in production)
**/questions/<id>/** - Retrieves a specific question with the id
**/questions/get-random** - Gets a random question for the competition
**/questions/<id>/answer** - Send the user's answer for the particular question
    - POST REQUEST requirements: user_id, answer_id 

**/answer-choices/** - Retrieves the lsit of quesitons (This should not be avaiable for users in production)
**/answer-choices/<id>/** - Retrieves a specific question with id