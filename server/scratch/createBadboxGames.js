let fetch = require('cross-fetch');

async function getHeadGameAsync() {
  let fr = await fetch('https://gamejolt.com/site-api/web/discover/games/369208', {
    credentials: 'include',
    headers: {},
    referrer: 'https://gamejolt.com/games/head-game/369208',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
  });
  return await fr.json();
}

module.exports = {
  getHeadGameAsync,
};
