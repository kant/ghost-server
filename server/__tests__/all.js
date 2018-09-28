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
