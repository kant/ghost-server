let db = require('../db');
let gq = require('../testlib/gq');

afterAll(async () => {
  await db.drainPoolAsync();
}, 10000);

let SharedIds = {};

beforeAll(async () => {
  let gqAsync = gq.withClientId('beforeAll');

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
            photo: {
              url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/American_McGee.jpg/936px-American_McGee.jpg"
              height: 468
              width: 600
            }
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
            photo: {
              url: "https://static.giantbomb.com/uploads/scale_small/0/5395/323199-spot_gay.jpg"
              height: 160
              width: 160
            }
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

  SharedIds.american = american.data.signup.userId;
  SharedIds.jonathan = jonathan.data.signup.userId;

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
  SharedIds.havok = havok.data.addTool.toolId;
  SharedIds.sc2Engine = sc2Engine.data.addTool.toolId;
}, 30000);

test('Test login and whoAmI and logout', async () => {
  let gqAsync = gq.withClientId('testLoginLogout');
  let login = (await gqAsync(/* GraphQL */ `
    mutation {
      login(usernameOrSimilar: "american", password: "alice") {
        userId
        username
      }
    }
  `)).data.login;
  expect(login.userId).toBe('user:american');
  expect(login.username).toBe('american');

  let whoAmI = (await gqAsync(/* GraphQL */ `
    query {
      whoAmI {
        userId
        username
        name
      }
    }
  `)).data.whoAmI;
  expect(whoAmI.username).toBe('american');
  expect(whoAmI.userId).toBe('user:american');
  expect(whoAmI.name).toBe('American McGee');

  let _null = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;
  expect(_null).toBeNull();

  let whoAmI2 = (await gqAsync(/* GraphQL */ `
    query {
      whoAmI {
        userId
        username
        name
      }
    }
  `)).data.whoAmI;
  expect(whoAmI2).toBeNull();
});

test('Test making a media item', async () => {
  let gqAsync = gq.withClientId('testMakeMedia');
  let login = (await gqAsync(/* GraphQL */ `
    mutation {
      login(usernameOrSimilar: "american", password: "alice") {
        userId
        username
      }
    }
  `)).data.login;

  // let whoAmI = (await gqAsync(/* GraphQL */ `
  // query {
  //   whoAmI {
  //     userId
  //   }
  // }
  // `)).data.whoAmI;

  let addMedia = (await gqAsync(
    /* GraphQL */ `
      mutation($toolIds: [ID]) {
        addMedia(
          media: {
            name: "Starcraft 2"
            mediaUrl: "https://starcraft2.com/"
            slug: "starcraft2"
            description: "Maru is a literal god Tasteless"
            links: {
              website: "https://starcraft2.com/"
              liquipedia: "https://liquipedia.net/starcraft2"
            }
            coverImage: {
              url: "https://upload.wikimedia.org/wikipedia/en/2/20/StarCraft_II_-_Box_Art.jpg"
              width: 256
              height: 363
            }
            instructions: "Play the game"
            dimensions: { height: 100, width: 100 }
            toolIds: $toolIds
            tags: ["rts", "strategy"]
            published: "2018-09-27T09:14:17.611Z"
          }
        ) {
          mediaId
          mediaUrl
          slug
          name
          description
          userId
          coverImage {
            width
            height
            url
          }
          instructions
          dimensions
          links
          published
          createdTime
          updatedTime
          tags
          user {
            userId
            name
            username
          }
          tools {
            name
            toolId
          }
          toolIds
        }
      }
    `,
    { toolIds: [SharedIds.havok, SharedIds.sc2Engine] }
  )).data.addMedia;

  let mediaId = addMedia.mediaId;

  let media = (await gqAsync(
    /* GraphQL */ `
      query($mediaId: ID!) {
        media(mediaId: $mediaId) {
          mediaId
          mediaUrl
          slug
          name
          description
          userId
          coverImage {
            width
            height
            url
          }
          instructions
          dimensions
          links
          published
          createdTime
          updatedTime
          tags
          user {
            userId
            name
            username
          }
          tools {
            name
            toolId
          }
          toolIds
        }
      }
    `,
    { mediaId }
  )).data.media;
  expect(media.slug).toBe('starcraft2');
  expect(media.mediaId).toBe(mediaId);
  expect(media.mediaUrl).toBe('https://starcraft2.com/');
  expect(media.description).toBe('Maru is a literal god Tasteless');
  expect(media.links.website).toBe('https://starcraft2.com/');
  expect(media.links.liquipedia).toBe('https://liquipedia.net/starcraft2');
  expect(media.coverImage).toMatchObject({
    url: 'https://upload.wikimedia.org/wikipedia/en/2/20/StarCraft_II_-_Box_Art.jpg',
    width: 256,
    height: 363,
  });
  expect(media.instructions).toBe('Play the game');
  expect(media.dimensions).toMatchObject({ height: 100, width: 100 });
  expect(media.tools).toHaveLength(2);
  expect(media.toolIds).toContain(SharedIds.havok);
  expect(media.toolIds).toContain(SharedIds.sc2Engine);
  expect(media.tags).toContain('rts');
  expect(media.tags).toContain('strategy');
  expect(media.published).toEqual(new Date('2018-09-27T09:14:17.611Z'));
});


