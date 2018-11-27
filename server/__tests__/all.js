let db = require('../db');
let gq = require('../testlib/gq');
let populateTestDatabase = require('../testlib/populateTestDatabase');

afterAll(async () => {
  await db.drainPoolAsync();
}, 60000);

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
  // Jest has a default timeout of 5 seconds, and sometimes this test
  // will take longer than that
  jest.setTimeout(30000);

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
  // Jest has a default timeout of 5 seconds, and sometimes this test
  // will take longer than that
  jest.setTimeout(30000);

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
  expect(signup.isTeam).toBeFalsy();

  let updateUser = (await gqAsync(
    /* GraphQL */ `
      mutation($userId: ID!) {
        User(userId: $userId) {
          update(
            update: {
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
      }
    `,
    { userId: gaben }
  )).data.User.update;

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
        login(who: $who, userId: $userId, username: $username, password: "hl3confirmed") {
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
        login(who: $who, userId: $userId, username: $username, password: "hl3confirmed") {
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
        login(who: $who, userId: $userId, username: $username, password: "hl3confirmed") {
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
        login(who: $who, userId: $userId, username: $username, password: "hl3confirmed") {
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
        login(who: $who, userId: $userId, username: $username, password: "bengay") {
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
        login(who: $who, userId: $userId, username: $username, password: "kensentme") {
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
        login(who: $who, userId: $userId, username: $username, password: "xyzzy") {
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
        login(who: $who, userId: $userId, username: $username, password: "xyzzy") {
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
  let gqAsync = gq.withClientId('testTeams');
  let signup_1 = (await gqAsync(/* GraphQL */ `
    mutation {
      signup(user: { username: "dwight", name: "Dwight Schrute" }, password: "beets") {
        userId
        username
        name
      }
    }
  `)).data.signup;
  let dwight = signup_1.userId;
  let signup_2 = (await gqAsync(/* GraphQL */ `
    mutation {
      signup(user: { username: "jim", name: "Jim Halpert" }, password: "ilovepam") {
        userId
        username
        name
      }
    }
  `)).data.signup;
  let jim = signup_2.userId;
  let signup_3 = (await gqAsync(/* GraphQL */ `
    mutation {
      signup(user: { username: "littlekidlover", name: "Michael Scott" }, password: "twss") {
        userId
        username
        name
      }
    }
  `)).data.signup;
  let michael = signup_3.userId;
  let signup_4 = (await gqAsync(/* GraphQL */ `
    mutation {
      signup(
        user: { username: "dundermifflin", isTeam: true, name: "Dunder Mifflin Paper Company" }
        password: "scranton"
      ) {
        userId
        username
        name
      }
    }
  `)).data.signup;
  let dundermifflin = signup_4.userId;

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
    { teamId: dundermifflin, admins: [michael] }
  );

  await gqAsync(/* GraphQL */ `
    mutation {
      login(who: "littlekidlover", password: "twss") {
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
      teamId: dundermifflin,
      members: [michael, jim, dwight],
    }
  );

  let { members, admins } = (await gqAsync(/* GraphQL */ `
    query {
      userByUsername(username: "dundermifflin") {
        members {
          userId
        }
        admins {
          userId
        }
      }
    }
  `)).data.userByUsername;
  expect(members).toHaveLength(3);
  expect(admins).toHaveLength(1);
  expect(admins[0].userId).toBe(michael);

  await gqAsync(
    /* GraphQL */ `
      mutation($teamId: ID!, $members: [ID]!) {
        User(userId: $teamId) {
          removeTeamMembers(userIdList: $members) {
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
      teamId: dundermifflin,
      members: [jim, dwight],
    }
  );

  let data = (await gqAsync(/* GraphQL */ `
    query {
      userByUsername(username: "dundermifflin") {
        members {
          userId
        }
        admins {
          userId
        }
      }
    }
  `)).data.userByUsername;
  members = data.members;
  admins = data.admins;
  expect(members).toHaveLength(1);
  expect(admins).toHaveLength(1);
  expect(admins[0].userId).toBe(michael);
  expect(members[0].userId).toBe(michael);
});
