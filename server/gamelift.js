let AWS = require('aws-sdk');
let secret = require('./secret');
let crypto = require('crypto');
let normalizeUrl = require('normalize-url');

let gamelift = new AWS.GameLift({
  apiVersion: '2015-10-01',
  accessKeyId: secret.aws.accessKeyId,
  secretAccessKey: secret.aws.secretAccessKey,
  region: 'us-west-2',
});

const GAMELIFT_ALIAS_ID = 'alias-893656f2-c282-48a7-a3f9-60dc98332062';

function normalizeCastleUrl(url) {
  return (
    'http://' +
    normalizeUrl(url, { stripProtocol: true, stripHash: true }).replace(/^(?:castle:)?\/\//, '')
  );
}

async function multiplayerJoinAsync(mediaUrl, userId) {
  mediaUrl = normalizeCastleUrl(mediaUrl);

  let castleUrlHash = crypto
    .createHash('md5')
    .update('castle' + mediaUrl)
    .digest('hex');

  // Use 2 to signal that there are open spots. 1 to signal that there aren't. You can't search using PlayerSessionCreationPolicy :/
  let existingSessions = await gamelift
    .searchGameSessions({
      AliasId: GAMELIFT_ALIAS_ID,
      Limit: 1,
      FilterExpression:
        "maximumSessions > 1 AND hasAvailablePlayerSessions=true AND gameSessionProperties.castleUrlHash='" +
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
        // Use 2 to signal that there are open spots. 1 to signal that there aren't. You can't search using PlayerSessionCreationPolicy :/
        MaximumPlayerSessionCount: 2,
        AliasId: GAMELIFT_ALIAS_ID,
        // This rate limits sessions created per user
        // CreatorId: userId,
        GameSessionData: 'castle' + mediaUrl,
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
  session.address = session.IpAddress + ':' + session.Port;
  return session;
}

module.exports = {
  multiplayerJoinAsync,
};
