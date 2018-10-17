let gq = require('./gq');

async function populateDatabaseAsync() {
  let gqAsync = gq.withClientId('populateDatabase');

  let sharedIds = {};

  // Setup some users and stuff
  let [american, jonathan] = await Promise.all([
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: {
            name: "American McGee"
            location: "Dallas"
            username: "american"
            about: "Made some video games"
            isTeam: false
          }
          password: "alice"
        ) {
          userId
          username
          name
          location
          about
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: {
            name: "Jonathan Gay"
            location: "Sebastopol"
            username: "jgay"
            about: "Made some video games and also invented Flash"
            isTeam: false
          }
          password: "flash"
        ) {
          userId
          username
          name
          location
          about
        }
      }
    `),
  ]);

  sharedIds.american = american.data.signup.userId;
  sharedIds.jonathan = jonathan.data.signup.userId;

  let [havok, sc2Engine] = await Promise.all([
    gqAsync(/* GraphQL */ `
      mutation {
        addTool(
          tool: {
            # toolId: ID
            name: "Havok"
            url: "https://www.havok.com/"
            about: "Havok Physics offers the fastest, most robust collision detection and physical simulation technology available, which is why it has become the gold standard within the games industry and has been used by leading game developers in over 400 launched titles and many more in development."
            tags: ["physics", "engine"]
          }
        ) {
          toolId
          name
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        addTool(
          tool: {
            # toolId: ID
            name: "SC2 Engine"
            url: "https://starcraft2.com/"
            tags: ["blizzard", "engine"]
          }
        ) {
          toolId
          name
        }
      }
    `),
  ]);
  sharedIds.havok = havok.data.addTool.toolId;
  sharedIds.sc2Engine = sc2Engine.data.addTool.toolId;

  let [ab_, troy_, peezy_, steelers_, artosis_, tasteless_, tastosis_] = await Promise.all([
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: { username: "ab84", name: "Antonio Brown", info: { number: 84 } }
          password: "whoride"
        ) {
          userId
          username
          name
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: { username: "troy", name: "Troy Polamalu", info: { number: 43 } }
          password: "hair"
        ) {
          userId
          username
          name
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: { username: "peezy", name: "Joey Porter", info: { number: 55 } }
          password: "whoride"
        ) {
          userId
          username
          name
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: {
            username: "steelers"
            name: "The Pittsburgh Steelers"
            info: { colors: "Black and Gold" }
            isTeam: true
          }
          password: "superbowl"
        ) {
          userId
          username
          name
        }
      }
    `),

    gqAsync(/* GraphQL */ `
      mutation {
        signup(user: { username: "artosis", name: "Dan Stemkoski" }, password: "somanybanelings") {
          userId
          username
          name
        }
      }
    `),

    gqAsync(/* GraphQL */ `
      mutation {
        signup(user: { username: "tasteless", name: "Nick Plott" }, password: "pandabearguy") {
          userId
          username
          name
        }
      }
    `),

    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: { username: "tastosis", name: "The Casting Archon", isTeam: true }
          password: "gsl"
        ) {
          userId
          username
          name
        }
      }
    `),
  ]);

  sharedIds.ab = ab_.data.signup.userId;
  sharedIds.troy = troy_.data.signup.userId;
  sharedIds.peezy = peezy_.data.signup.userId;
  sharedIds.steelers = steelers_.data.signup.userId;
  sharedIds.artosis = artosis_.data.signup.userId;
  sharedIds.tasteless = tasteless_.data.signup.userId;
  sharedIds.tastosis = tastosis_.data.signup.userId;

  // Add team members and admins
  await gqAsync(/* GraphQL */ `
    mutation {
      login(who: "tastosis", password: "gsl") {
        userId
      }
    }
  `);
  await gqAsync(
    /* GraphQL */ `
    mutation($teamId: ID!, $admins: [ID]!) {
      User(userId: $teamId) {
        addTeamAdmins(userIdList: $admins) {
          admins {
            userId
            username
            name
          }
        }
      }
    }
    `,
    {
      teamId: sharedIds.tastosis,
      admins: [sharedIds.tasteless, sharedIds.artosis],
    }
  );

  await gqAsync(/* GraphQL */ `
    mutation {
      login(who: "steelers", password: "superbowl") {
        userId
      }
    }
  `);

  await gqAsync(
    /* GraphQL */ `
      mutation($teamId: ID!, $admins: [ID]!) {
        User(userId: $teamId) {
          addTeamAdmins(userIdList: $admins) {
            admins {
              userId
              username
              name
            }
          }
        }
      }
      `,
    {
      teamId: sharedIds.steelers,
      admins: [sharedIds.peezy],
    }
  );

  await gqAsync(/* GraphQL */ `
    mutation {
      login(who: "peezy", password: "whoride") {
        userId
      }
    }
  `);

  await gqAsync(
    /* GraphQL */ `
      mutation($teamId: ID!, $members: [ID]!) {
        User(userId: $teamId) {
          addTeamMembers(userIdList: $members) {
            members {
              userId
              username
              name
            }
          }
        }
      }
      `,
    {
      teamId: sharedIds.steelers,
      members: [sharedIds.peezy, sharedIds.troy, sharedIds.ab],
    }
  );

  return sharedIds;
}

module.exports = {
  populateDatabaseAsync,
};
