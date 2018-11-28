let ClientError = require('./ClientError');
let emaillib = require('./emaillib');
let model = require('./model');
let passwordlib = require('./passwordlib');
let sms = require('./sms');
let validation = require('./validation');
let AWS = require('aws-sdk');
let secret = require('./secret');
let crypto = require('crypto');

let gamelift = new AWS.GameLift({
  apiVersion: '2015-10-01',
  accessKeyId: secret.aws.accessKeyId,
  secretAccessKey: secret.aws.secretAccessKey,
  region: 'us-west-2',
});

const GAMELIFT_ALIAS_ID = 'alias-893656f2-c282-48a7-a3f9-60dc98332062';

async function multiplayerJoinAsync(mediaUrl, userId) {
  let castleUrlHash = crypto
    .createHash('md5')
    .update(mediaUrl)
    .digest('hex');

  let existingSessions = await gamelift
    .searchGameSessions({
      AliasId: GAMELIFT_ALIAS_ID,
      Limit: 1,
      FilterExpression:
        "hasAvailablePlayerSessions=true AND gameSessionProperties.castleUrlHash='" +
        castleUrlHash +
        "'",
    })
    .promise();

  let session = null;
  if (existingSessions.GameSessions && existingSessions.GameSessions.length > 0) {
    session = existingSessions.GameSessions[0];
  }

  if (!session) {
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/GameLift.html#createGameSession-property
    let newSession = await gamelift
      .createGameSession({
        MaximumPlayerSessionCount: 10, // TODO: let the game configure this
        AliasId: GAMELIFT_ALIAS_ID,
        // This rate limits sessions created per user
        // CreatorId: userId,
        GameSessionData: mediaUrl,
        GameProperties: [
          {
            Key: 'castleUrlHash',
            Value: castleUrlHash,
          },
        ],
        // GameSessionData: 'STRING_VALUE',
        // IdempotencyToken: 'STRING_VALUE',
        Name: 'Castle URL: ' + mediaUrl,
      })
      .promise();
    session = newSession.GameSession;
  }

  console.log(session);
  return null;
}

module.exports = {
  multiplayerJoinAsync,
};
