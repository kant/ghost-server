let model = require('./model');
let data = require('./data');
let db = require('./db');

let wrapParens = (x) => {
  return '(' + x + ')';
};

function makeSearchQuery(query, cursorPosition, opts) {
  opts = opts || {};
  limit = opts.limit || 30;
  cursorPosition = cursorPosition || 0;
  let s = query.toLowerCase();
  s.replace(/[^a-z\-\s]/g, '');
  let tokens = s.split(/\s/);
  let lastToken = tokens[tokens.length - 1];

  // TODO(ccheever): Make this better by actually incorporating cursor position
  let partialTokens = [lastToken];
  let fullTokens = tokens.slice(0, tokens.length - 1);

  // Strip out empty tokens from the list
  tokens = tokens.filter((x) => x.length > 0);
  partialTokens = partialTokens.filter((x) => x.length > 0);
  fullTokens = fullTokens.filter((x) => x.length > 0);

  let sq = {
    tokens,
    lastToken,
    s,
    query,
    cursorPosition,
    fullTokens,
    partialTokens,
  };
  return sq;
}

async function queryJustMediaAndPlaylistsAsync(query, cursorPosition, opts) {
  let sq = makeSearchQuery(query, cursorPosition, opts);
  let [mediaResults, playlistResults] = await Promise.all([
    getMediaResultsAsync(sq),
    getPlaylistResultsAsync(sq),
  ]);
  return {
    mediaResults,
    playlistResults,
    recommendedResults: [],
  };
}

async function queryAsync(query, cursorPosition, opts) {
  let sq = makeSearchQuery(query, cursorPosition, opts);
  let listOfResultLists = await Promise.all([
    getUserResultsAsync(sq),
    getMediaResultsAsync(sq),
    getToolResultsAsync(sq),
    getPlaylistResultsAsync(sq),
    getTagResultsAsync(sq),
  ]);
  let results = [].concat(...listOfResultLists);
  results.sort((a, b) => {
    return a.score < b.score;
  });
  return results.slice(0, limit);
}

async function getUserResultsAsync(sq) {
  let { tokens, fullTokens, partialTokens } = sq;
  let r = db.replacer();

  let q = `
    SELECT * FROM "user" WHERE `;

  let clauses = [];
  if (tokens.length === 1) {
    clauses.push(`"username" ILIKE ${r(tokens[0] + '%')}`);
    clauses.push(`"userId" ILIKE ${r(tokens[0] + '%')}`);
  }
  let nameParts = [];
  for (let t of fullTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t + '\\M')}`);
  }
  for (let t of partialTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t)}`);
  }

  let nameClause = nameParts.map(wrapParens).join(' AND ');
  if (nameClause) {
    clauses.push(nameClause);
  }

  if (!clauses.length) {
    clauses.push('True');
  }

  clauses.push('False');

  q += clauses.map(wrapParens).join(' OR ');

  let databaseResult = await db.queryAsync(q, r.values());
  let results = [];
  for (let row of databaseResult.rows) {
    let type = 'user';
    if (row.isTeam) {
      type = 'team';
    }
    results.push({
      type,
      score: 5,
      title: row.name,
      slug: row.username,
      id: row.userId,
      metadata: {},
      description: row.about,
      image: row.photo,
      url: '/@' + row.username,
    });
  }
  if (results.length > 0) {
    results[0].score += 5;
  }
  return results;
}

async function getMediaResultsAsync(sq) {
  let { tokens, fullTokens, partialTokens } = sq;
  let r = db.replacer();

  let q = `
    SELECT * FROM "media" WHERE `;

  let clauses = [];
  if (tokens.length === 1) {
    clauses.push(`"slug" ILIKE ${r(tokens[0] + '%')}`);
    clauses.push(`"mediaId" ILIKE ${r(tokens[0] + '%')}`);
  }
  let nameParts = [];
  for (let t of fullTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t + '\\M')}`);
  }
  for (let t of partialTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t)}`);
  }

  let nameClause = nameParts.map(wrapParens).join(' AND ');
  if (nameClause) {
    clauses.push(nameClause);
  }

  if (!clauses.length) {
    clauses.push('True');
  }

  clauses.push('False');

  for (let t of tokens) {
    clauses.push(`"tagSet"::jsonb ? ${r(t)}`);
  }

  q += clauses.map(wrapParens).join(' OR ');

  let databaseResult = await db.queryAsync(q, r.values());
  let results = [];
  for (let row of databaseResult.rows) {
    // For now, let's fake the url
    let fakeUsername =
      row.username || (row.userId ? row.userId.replace(/^user:([a-z-]\+)?/, '') : 'community');
    // let fakeUsername = row.userId.replace(/^user:([a-z-]\+)?/, '');
    let fakeSlug = row.mediaId.substr('media:'.length);

    let type = 'media';
    results.push({
      type,
      score: 5,
      title: row.name,
      slug: row.slug,
      snippet: JSON.stringify(row.description),
      id: row.mediaId,
      metadata: {
        userId: row.userId,
      },
      description: row.description,
      image: row.coverImage,
      // url: 'http://castle.io/' + '@' + row.userId + '/' + row.slug,
      url: '/' + '@' + fakeUsername + '/' + fakeSlug,
    });
  }
  if (results.length > 0) {
    results[0].score += 10;
  }
  return results;
}

async function getToolResultsAsync(sq) {
  let { tokens, fullTokens, partialTokens } = sq;
  let r = db.replacer();

  let q = `
    SELECT * FROM "tool" WHERE `;

  let clauses = [];
  if (tokens.length === 1) {
    clauses.push(`"toolId" ILIKE ${r('tool:' + tokens[0] + '%')}`);
    clauses.push(`"toolId" ILIKE ${r(tokens[0] + '%')}`);
  }

  let nameParts = [];
  for (let t of fullTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t + '\\M')}`);
  }
  for (let t of partialTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t)}`);
  }

  let nameClause = nameParts.map(wrapParens).join(' AND ');
  if (nameClause) {
    clauses.push(nameClause);
  }

  if (!clauses.length) {
    clauses.push('True');
  }

  clauses.push('False');

  q += clauses.map(wrapParens).join(' OR ');

  let databaseResult = await db.queryAsync(q, r.values());
  let results = [];
  for (let row of databaseResult.rows) {
    // For now, let's fake the url
    let fakeSlug = row.toolId.substr('tool:'.length);

    let type = 'tool';
    results.push({
      type,
      score: 5,
      title: row.name,
      slug: fakeSlug,
      snippet: JSON.stringify(row.about),
      id: row.toolId,
      metadata: {},
      description: row.about,
      image: row.image,
      url: '/tool/' + fakeSlug,
    });
  }
  if (results.length > 0) {
    results[0].score += 3;
  }
  return results;
}

async function getPlaylistResultsAsync(sq) {
  let { tokens, fullTokens, partialTokens } = sq;
  let r = db.replacer();

  let q = `
    SELECT * FROM "playlist" WHERE `;

  let clauses = [];
  if (tokens.length === 1) {
    clauses.push(`"playlistId" ILIKE ${r('playlist:' + tokens[0] + '%')}`);
    clauses.push(`"playlistId" ILIKE ${r(tokens[0] + '%')}`);
  }

  let nameParts = [];
  for (let t of fullTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t + '\\M')}`);
  }
  for (let t of partialTokens) {
    nameParts.push(`"name" ~* ${r('\\m' + t)}`);
  }

  let nameClause = nameParts.map(wrapParens).join(' AND ');
  if (nameClause) {
    clauses.push(nameClause);
  }

  if (!clauses.length) {
    clauses.push('True');
  }

  clauses.push('False');

  q += clauses.map(wrapParens).join(' OR ');

  let databaseResult = await db.queryAsync(q, r.values());
  let results = [];
  for (let row of databaseResult.rows) {
    // For now, let's fake the url
    let fakeSlug = row.playlistId.substr('playlist:'.length);

    let type = 'playlist';
    results.push({
      type,
      score: 5,
      title: row.name,
      slug: fakeSlug,
      snippet: JSON.stringify(row.description),
      id: row.playlistId,
      metadata: {},
      description: row.about,
      image: row.image,
      url: '/playlist/' + fakeSlug,
    });
  }
  if (results.length > 0) {
    results[0].score += 4;
  }
  return results;
}

async function getTagResultsAsync(sq) {
  let { tokens, fullTokens, partialTokens } = sq;
  let full = null;
  let partial = null;
  if (fullTokens.length) {
    full = fullTokens[0];
  }
  if (partialTokens.length) {
    partial = partialTokens[0];
  }

  // Tags are always going to be one token long
  if (tokens.length > 1) {
    return [];
  }

  let allTagsResult = await db.queryAsync(
    `SELECT jsonb_object_keys("tagSet") AS "tag", count(*) as "number" FROM "media" GROUP BY "tag" ORDER BY "number" DESC`
  );

  let results = [];
  let maxCount = 1;
  if (allTagsResult.rowCount > 0) {
    maxCount = allTagsResult.rows[0].number;
  }

  for (let row of allTagsResult.rows) {
    let tag = row.tag;

    let include = false;

    let score = 5;

    if (full && tag === full) {
      include = true;
      score += 3;
    }

    if (partial && tag.startsWith(partial)) {
      include = true;
    }

    score += 2 * (row.number / maxCount);

    if (include) {
      results.push({
        type: 'tag',
        score,
        title: tag,
        slug: tag,
        snippet: '',
        id: tag,
        metadata: {},
        description: {},
        image: null,
        url: '/tag/' + tag,
      });
    }
  }

  return results;
}

module.exports = {
  getUserResultsAsync,
  getMediaResultsAsync,
  getPlaylistResultsAsync,
  getTagResultsAsync,
  getToolResultsAsync,
  queryAsync,
  makeSearchQuery,
  queryJustMediaAndPlaylistsAsync,
};
