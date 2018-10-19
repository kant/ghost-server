let fetch = require('node-fetch');

let db = require('../db');
let model = require('../model');
let gq = require('../testlib/gq');

let gqAsync = gq.withClientId('__shell__/addItch');

async function addItchGameAsync(url) {
  let response = await fetch(url);
  let body = await response.text();
  let iframeUrl = 'https:' + body.match(/(\/\/v6p9d9t4.ssl.hwcdn.net\/[^"&]*)/)[1];
  let username = url.match(/https?:\/\/([a-z0-9-]+)\.itch\.io\/.*/)[1];
  let ldJson = body.match(
    /<script type=\"application\/ld\+json\">({\"@context\":\"http:\\\/\\\/schema\.org\\\/\",\"@type\":\"Product\"[^<]+})<\/script>/
  )[1];
  let ld = JSON.parse(ldJson);
  let name = ld.name;
  let description = ld.description;

  let gqAsync = gq.withClientId('__shell__/addItch+' + username);

  await addItchUserAsync(username);

  // Login as the itch user
  let result = await gqAsync(
    /* GraphQL */ `
      mutation($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          userId
        }
      }
    `,
    {
      username,
      password: username + '123',
    }
  );
  let userId = result.data.login.userId;

  let mediaResult = await gqAsync(
    /* GraphQL */ `
      mutation(
        $name: String!
        $mediaUrl: String!
        $description: Json
        $userId: ID!
        $itchUrl: String
      ) {
        addMedia(
          media: {
            userId: $userId
            mediaUrl: $mediaUrl
            name: $name
            description: $description
            links: { itch: $itchUrl }
          }
        ) {
          mediaId
        }
      }
    `,
    {
      name,
      mediaUrl: iframeUrl,
      description,
      itchUrl: url,
      userId,
    }
  );

  return {
    iframeUrl,
    // body,
    username,
    // ld,
    name,
    description,
    mediaId: mediaResult.data.addMedia.mediaId,
    userId,
    itchUrl: url,
  };
}

async function addItchUserAsync(itchUsername) {
  let username = itchUsername;
  let userId = 'user:itch+' + itchUsername;
  let name = itchUsername + ' on itch.io';
  let website = `https://${itchUsername}.itch.io`;
  let itchProfile = `https://itch.io/profile/${itchUsername}`;

  let result = await gqAsync(
    /* GraphQL */ `
      query($userId: ID!) {
        user(userId: $userId) {
          userId
        }
      }
    `,
    { userId }
  );

  if (result.data.user) {
    console.log(`Itch user ${itchUsername} already exists; skipping.`);
    return;
  }
  gqAsync(
    /* GraphQL */ `
      mutation(
        $username: String!
        $userId: String!
        $name: String!
        $website: String
        $itchProfile: String
        $password: String!
      ) {
        signup(
          user: {
            userId: $userId
            username: $username
            name: $name
            links: { itch: $website, itchProfile: $itchProfile }
          }
          password: $password
        ) {
          userId
          name
          username
        }
      }
    `,
    {
      password: itchUsername + '123',
      username,
      userId,
      name,
      itchProfile,
      website,
    }
  );
}

module.exports = {
  addItchGameAsync,
  addItchUserAsync,
};
