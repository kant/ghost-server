let fetch = require('node-fetch');

let db = require('../db');
let model = require('../model');
let gq = require('../testlib/gq');

let gqAsync = gq.withClientId('__shell__/addItch');

async function addItchGameAsync(url) {
  let response = await fetch(url);
  let body = await response.text();
  let iframeUrl = 'https:' + body.match(/(\/\/v6p9d9t4.ssl.hwcdn.net\/[^"&]*)/)[1];
  return {
    iframeUrl,
  };
}

async function addItchUserAsync(itchUsername) {
  let username = itchUsername;
  let userId = 'user:itch+' + itchUsername;
  let name = itchUsername + ' on itch.io';
  let website = `https://${itchUsername}.itch.io`;
  let itchProfile = `https://itch.io/profile/${itchUsername}`;
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
