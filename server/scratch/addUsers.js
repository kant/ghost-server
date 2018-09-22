let requestImageSize = require('request-image-size');

let db = require('../db');
let data = require('../data');
let model = require('../model');

async function mainAsync() {

  // prettier-ignore
await model.newUserAsync({userId: 'user:adam', location: 'Redwood City', name: 'Adam Perry', username: 'anp'});
await model.newUserAsync({userId: "user:jesse", location: "Seattle", name: "Jesse Ruder", username: 'jesse' });
await model.newUserAsync({userId: 'user:quin', name: 'Quinlan Jung', location: 'Palo Alto', username: 'sushipower'});
await model.newUserAsync({userId: 'user:eric', location: 'Mountain View', name: 'Eric Samelson', username: 'eric'});
await model.newUserAsync({userId: 'user:brent', location: 'Vancouver', name: 'Brent Vatne', username: 'brent'});
await model.newUserAsync({userId: 'user:jess', name: 'Jess Moore', location: 'San Francisco', username: 'jess'});
await model.newUserAsync({userId: 'user:nikki', location: 'San Francisco', name: 'Nikhilesh Sigatapu', username: 'nikki'});
await model.newUserAsync({userId: 'user:jim', location: 'San Francisco', name: 'Jim Lee', username: 'jim'});
await model.newUserAsync({userId: 'user:ville', name: 'Ville Immonen', location: 'Helsinki', username: 'fson'});
await model.newUserAsync({userId: 'user:ide', name: 'James Ide', location: 'Palo Alto', username: 'ide'});
await model.newUserAsync({userId: 'user:a-nav', location: 'Milwaukee', name: 'Adam Navarro', username: 'a-nav'});
await model.newUserAsync({userId: 'user:evan', name: 'Evan Bacon', location: 'Palo Alto', username: 'evan'});
await model.newUserAsync({userId: 'user:tc', name: 'TC Davis', location: 'San Francisco', username: 'tc'});
await model.newUserAsync({userId: 'user:ccheever', name:'Charlie Cheever', location: 'Palo Alto', username: 'ccheever'});
await model.newUserAsync({userId: 'user:nick', name: 'Nick Novitski', location: 'San Francisco', username: 'nick'});
await model.newUserAsync({userId: 'user:schazers', name: 'Jason Riggs', location: "San Francisco", username: 'schazers'});
await model.newUserAsync({userId: 'user:ben', name: 'Ben Roth', location: 'Seattle', username: 'ben'});


await model.updateUserAsync({userId: 'user:adam', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.perry.png'});
await model.updateUserAsync({userId: 'user:jesse', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.jesse.png'});
await model.updateUserAsync({userId: 'user:quin', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.quin.png'});
await model.updateUserAsync({userId: 'user:eric', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.eric.png'});
await model.updateUserAsync({userId: 'user:brent', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.brent.png'});
await model.updateUserAsync({userId: 'user:jess', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.jess.png'});
await model.updateUserAsync({userId: 'user:nikki', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.nikki.png'});
await model.updateUserAsync({userId: 'user:jim', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.jim.png'});
await model.updateUserAsync({userId: 'user:ville', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.ville.png'});
await model.updateUserAsync({userId: 'user:ide', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.james.png'});
await model.updateUserAsync({userId: 'user:a-nav', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.adam.png'});
await model.updateUserAsync({userId: 'user:evan', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.evan.png'});
await model.updateUserAsync({userId: 'user:tc', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.tc.png'});
await model.updateUserAsync({userId: 'user:ccheever', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.charlie.png'});
await model.updateUserAsync({userId: 'user:nick', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.nick.png'});
await model.updateUserAsync({userId: 'user:schazers', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.jason.png'});
await model.updateUserAsync({userId: 'user:ben', photoUrl: 'https://d30j33t1r58ioz.cloudfront.net/static/images/about/team.ben.png'});

}

if (require.main === module) {
  mainAsync();
}

async function migratePhotosAsync() {
  let results = await db.queryAsync('SELECT * FROM "user" WHERE "photoUrl" IS NOT NULL');
  let users = data.objectsListFromResults(results);
  let a = [];
  for (let user of users) {
    a.push(migratePhotoAsync(user));
  }
  return await Promise.all(a);
}

async function migratePhotoAsync(user) {
  let d= await requestImageSize(user.photoUrl);
  let photo = Object.assign({ url: user.photoUrl }, d);

  await model.updateUserAsync({
    userId: user.userId,
    photo: JSON.stringify(photo),
  });
}


module.exports = {
  mainAsync,
  migratePhotoAsync,
  migratePhotosAsync,
};