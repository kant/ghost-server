let db = require('../db');
let gq = require('../testlib/gq');
let populateTestDatabase = require('../testlib/populateTestDatabase');

afterAll(async () => {
  await db.drainPoolAsync();
}, 10000);

let SharedIds = {};

beforeAll(async () => {
  SharedIds = await populateTestDatabase.populateDatabaseAsync();
}, 30000);

test('Test login and me and logout', async () => {
  let gqAsync = gq.withClientId('testLoginLogout');
  let login = (await gqAsync(/* GraphQL */ `
    mutation {
      login(who: "american", password: "alice") {
        userId
        username
      }
    }
  `)).data.login;
  expect(login.userId).toBe('user:american');
  expect(login.username).toBe('american');

  let me = (await gqAsync(/* GraphQL */ `
    query {
      me {
        userId
        username
        name
      }
    }
  `)).data.me;
  expect(me.username).toBe('american');
  expect(me.userId).toBe('user:american');
  expect(me.name).toBe('American McGee');

  let _null = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;
  expect(_null).toBeNull();

  let me2 = (await gqAsync(/* GraphQL */ `
    query {
      me {
        userId
        username
        name
      }
    }
  `)).data.me;
  expect(me2).toBeNull();
});

test('Test making a media item', async () => {
  let gqAsync = gq.withClientId('testMakeMedia');
  let login = (await gqAsync(/* GraphQL */ `
    mutation {
      login(who: "american", password: "alice") {
        userId
        username
      }
    }
  `)).data.login;

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

  // Test editing the media
  let { updateMedia } = (await gqAsync(
    /* GraphQL */ `
      mutation($mediaId: ID!, $engineId: ID!) {
        updateMedia(
          mediaId: $mediaId
          media: {
            name: "Starcraft 2 - Legacy of the Void"
            slug: "sc2-lotv"
            description: "The best RTS"
            instructions: "Use lots of APMs"
            mediaUrl: "http://us.battle.net/sc2/en/legacy-of-the-void/"
            links: { website: "https://starcraft2.com/" }
            published: "2018-09-27T08:14:17.611Z"
            toolIds: [$engineId]
            tags: ["rts", "blizzard"]
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
    { mediaId, engineId: SharedIds.sc2Engine }
  )).data;

  expect(updateMedia.slug).toBe('sc2-lotv');
  expect(updateMedia.mediaId).toBe(mediaId);
  expect(updateMedia.mediaUrl).toBe('http://us.battle.net/sc2/en/legacy-of-the-void/');
  expect(updateMedia.name).toBe('Starcraft 2 - Legacy of the Void');
  expect(updateMedia.toolIds).toContain(SharedIds.sc2Engine);
  expect(updateMedia.toolIds).toHaveLength(1);
  expect(updateMedia.instructions).toBe('Use lots of APMs');
  expect(updateMedia.description).toBe('The best RTS');
  expect(updateMedia.published).toEqual(new Date('2018-09-27T08:14:17.611Z'));
  expect(Object.keys(updateMedia.links).length).toBe(1);
  expect(updateMedia.links.website).toBe('https://starcraft2.com/');
  expect(updateMedia.tags).toContain('rts');
  expect(updateMedia.tags).toContain('blizzard');

  // Test adding tags and removing tags
  let { addMediaTags } = (await gqAsync(
    /*GraphQL*/
    `
    mutation($mediaId:ID!) {
      addMediaTags(mediaId: $mediaId, tag:"test-tag", tags: ["tag-two", "tag-three"]) {
        tags
      }
    }`,
    { mediaId }
  )).data;
  expect(addMediaTags.tags).toHaveLength(5);
  expect(addMediaTags.tags).toContain('tag-two');
  expect(addMediaTags.tags).toContain('tag-three');
  expect(addMediaTags.tags).toContain('test-tag');

  let { removeMediaTags } = (await gqAsync(
    /*GraphQL*/
    `
    mutation($mediaId:ID!) {
      removeMediaTags(mediaId: $mediaId, tag:"tag-three", tags: ["rts", "not-on-here"]) {
        tags
      }
    }
    `,
    { mediaId }
  )).data;

  expect(removeMediaTags.tags).toHaveLength(3);
  expect(removeMediaTags.tags).toContain('blizzard');

  let { addMediaTools } = (await gqAsync(
    /* GraphQL */
    `
      mutation($mediaId: ID!, $toolId: ID, $toolIds: [ID!]) {
        addMediaTools(mediaId: $mediaId, toolId: $toolId, toolIds: $toolIds) {
          mediaId
          name
          toolIds
          tools {
            toolId
          }
        }
      }
    `,
    {
      mediaId,
      toolId: SharedIds.sc2Engine,
      toolIds: [SharedIds.havok],
    }
  )).data;

  expect(addMediaTools.toolIds).toHaveLength(2);
  expect(addMediaTools.tools).toHaveLength(2);

  let { removeMediaTools } = (await gqAsync(
    /* GraphQL */
    `
      mutation($mediaId: ID!, $toolId: ID, $toolIds: [ID!]) {
        removeMediaTools(mediaId: $mediaId, toolId: $toolId, toolIds: $toolIds) {
          mediaId
          name
          toolIds
          tools {
            toolId
          }
        }
      }
    `,
    {
      mediaId,
      toolIds: [SharedIds.havok],
    }
  )).data;

  expect(removeMediaTools.toolIds).toHaveLength(1);
  expect(removeMediaTools.tools).toHaveLength(1);

  // Test delete
  let { deleteMedia } = (await gqAsync(
    /* GraphQL */ `
      mutation($mediaId: ID!) {
        deleteMedia(mediaId: $mediaId)
      }
    `,
    { mediaId }
  )).data;
  expect(deleteMedia).toBe(true);

  let mediaNull_ = (await gqAsync(
    /* GraphQL */ `
      query {
        media(mediaId: "media:starcraft-2") {
          mediaId
        }
      }
    `,
    { mediaId }
  )).data.media;
  expect(mediaNull_).toBeNull();
});

test('Signing up a user and updating a user and logging in and logging out', async () => {
  let gqAsync = gq.withClientId('testUserOperations');
  let gqAllowErrorsAsync = gq.withClientId('testUserOperations', { allowErrors: true });
  let signup = (await gqAsync(
    /* GraphQL */ `
      mutation {
        signup(
          user: {
            name: "Gabe Newell"
            location: "Bellevue, WA"
            username: "gaben"
            about: "The head of Valve"
            otherUsernames: { steam: "gabelogannewell" }
            links: { website: "https://www.valvesoftware.com/en/people" }
            photo: {
              url: "data:image/jpeg;base64,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"
              width: 268
              height: 268
            }
          }
          password: "hl3confirmed"
        ) {
          userId
          name
          location
          username
          about
          otherUsernames
          links
          photo {
            url
            height
            width
          }
          isTeam
          members {
            username
          }
          admins {
            username
          }
        }
      }
    `,
    {}
  )).data.signup;
  let gaben = signup.userId;

  expect(signup.name).toBe('Gabe Newell');
  expect(signup.photo.url).toHaveLength(7639);
  expect(signup.isTeam).toBeFalsy();

  let { updateUser } = (await gqAsync(
    /* GraphQL */ `
      mutation($userId: ID!) {
        updateUser(
          userId: $userId
          user: {
            name: "Babe Gruel"
            location: "Ex-MSFT"
            username: "gabenlagen"
            otherUsernames: { reddit: "GabeNewellBellevue" }
            links: { wikipedia: "https://en.wikipedia.org/wiki/Gabe_Newell" }
            about: "C'mon, people, you can't show the player a really big bomb and not let them blow it up."
          }
        ) {
          userId
          username
          name
          location
          username
          otherUsernames
          links
          about
        }
      }
    `,
    { userId: gaben }
  )).data;

  expect(updateUser.name).toBe('Babe Gruel');
  expect(updateUser.location).toBe('Ex-MSFT');
  expect(updateUser.username).toBe('gabenlagen');
  expect(Object.keys(updateUser.otherUsernames)).toHaveLength(1);
  expect(Object.keys(updateUser.links)).toHaveLength(1);
  expect(updateUser.links.wikipedia).toBe('https://en.wikipedia.org/wiki/Gabe_Newell');
  expect(updateUser.otherUsernames.reddit).toBe('GabeNewellBellevue');

  let me_0 = (await gqAsync(
    /* GraphQL */
    `
      query {
        me {
          userId
          username
          name
        }
      }
    `
  )).data.me;

  expect(me_0.userId).toBe(gaben);

  let logout_0 = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;

  expect(logout_0).toBeNull();

  // Login with userId
  let login_1 = (await gqAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "hl3confirmed"
        ) {
          userId
          username
          name
        }
      }
    `,
    { userId: gaben }
  )).data.login;

  expect(login_1.userId).toBe(gaben);

  let logout_1 = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;

  expect(logout_1).toBeNull();

  // Login with username
  let login_2 = (await gqAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "hl3confirmed"
        ) {
          userId
          username
          name
        }
      }
    `,
    { username: 'gabenlagen' }
  )).data.login;

  expect(login_2.userId).toBe(gaben);

  // Login with userId in general field
  let logout_2 = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;

  expect(logout_2).toBeNull();

  let login_3 = (await gqAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "hl3confirmed"
        ) {
          userId
          username
          name
        }
      }
    `,
    { who: gaben }
  )).data.login;

  expect(login_3.userId).toBe(gaben);

  // Login with userId in general field
  let logout_3 = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;

  expect(logout_3).toBeNull();

  // Login with username in general field
  let login_4 = (await gqAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "hl3confirmed"
        ) {
          userId
          username
          name
        }
      }
    `,
    { who: 'gabenlagen' }
  )).data.login;

  expect(login_4.userId).toBe(gaben);

  // Try changing password

  let changePassword = (await gqAsync(
    /* GraphQL */ `
      mutation {
        changePassword(oldPassword: "hl3confirmed", newPassword: "bengay")
      }
    `,
    {}
  )).data.changePassword;

  expect(changePassword).toBeTruthy();

  let me_4 = (await gqAsync(
    /* GraphQL */
    `
      query {
        me {
          userId
          username
          name
        }
      }
    `
  )).data.me;

  expect(me_4.userId).toBe(gaben);

  let logout_4 = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;

  expect(logout_4).toBeNull();

  // Login with userId in general field
  let login_5 = (await gqAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "bengay"
        ) {
          userId
          username
          name
        }
      }
    `,
    { who: gaben }
  )).data.login;

  expect(login_5.userId).toBe(gaben);

  // Verify that incorrect passwords don't work
  let logout_5 = (await gqAsync(/* GraphQL */ `
    mutation {
      logout
    }
  `)).data.logout;

  expect(logout_5).toBeNull();

  let me_5 = (await gqAsync(
    /* GraphQL */
    `
      query {
        me {
          userId
          username
          name
        }
      }
    `
  )).data.me;

  expect(me_5).toBeNull();

  let incorrectPassword_1 = await gqAllowErrorsAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "kensentme"
        ) {
          userId
          username
          name
        }
      }
    `,
    { who: gaben }
  );

  expect(incorrectPassword_1.data.login).toBeNull();
  expect(incorrectPassword_1.errors).toHaveLength(1);

  let incorrectPassword_2 = await gqAllowErrorsAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "xyzzy"
        ) {
          userId
          username
          name
        }
      }
    `,
    { userId: gaben }
  );

  expect(incorrectPassword_2.data.login).toBeNull();
  expect(incorrectPassword_2.errors).toHaveLength(1);

  let incorrectPassword_3 = await gqAllowErrorsAsync(
    /* GraphQL */ `
      mutation($who: String, $userId: ID, $username: String) {
        login(
          who: $who
          userId: $userId
          username: $username
          password: "xyzzy"
        ) {
          userId
          username
          name
        }
      }
    `,
    { userId: gaben }
  );

  expect(incorrectPassword_3.data.login).toBeNull();
  expect(incorrectPassword_3.errors).toHaveLength(1);

  let me_6 = (await gqAsync(
    /* GraphQL */
    `
      query {
        me {
          userId
          username
          name
        }
      }
    `
  )).data.me;

  expect(me_6).toBeNull();
});

test('Test teams', async () => {
  // let gqAsync = gq.withClientId('testTeams');
  // let signup_1 = (await gqAsync(/* GraphQL */ `
  //   mutation {
  //     signup(user: { username: "ab84", name: "Antonio Brown" }, password: "callgod") {
  //       userId
  //       username
  //       name
  //     }
  //   }
  // `)).data.signup;
  // let ab = signup_1.userId;

  // let signup_2 = (await gqAsync(/* GraphQL */ `
  //   mutation {
  //     signup(user: { username: "troy", name: "Troy Polamalu" }, password: "callgod") {
  //       userId
  //       username
  //       name
  //     }
  //   }
  // `)).data.signup;
  // let troy = signup_2.userId;

  // let signup_3 = (await gqAsync(/* GraphQL */ `
  //   mutation {
  //     signup(user: { username: "peezy", name: "Joey Porter" }, password: "whoride") {
  //       userId
  //       username
  //       name
  //     }
  //   }
  // `)).data.signup;
  // let peezy = signup_3.userId;

  // let signup_4 = (await gqAsync(/* GraphQL */ `
  // mutation {
  //   signup(user: { username: "steelers", name: "The Pittsburgh Steelers" }, password: "7rings") {
  //     userId
  //     username
  //     name
  //   }
  // }
  // `)).data.signup;

  // let steelers = signup_4.userId;

});
