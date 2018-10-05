let md5 = require('md5');
let streamBuffers = require('stream-buffers');

let ClientError = require('./ClientError');
let data = require('./data');
let db = require('./db');

async function storeUploadAsync(file, opts) {
  let { stream, filename, mimetype, encoding } = await file;
  let { userId, uploadIp } = opts;

  let content = await new Promise((resolve, reject) => {
    let ws = new streamBuffers.WritableStreamBuffer({
      initialSize: 100 * 1024, // start at 100 kilobytes.
      incrementAmount: 100 * 1024, // grow by 100 kilobytes each time buffer overflows.
    });
    stream
      .pipe(ws)
      .on('finish', () => {
        resolve(ws.getContents());
      })
      .on('error', reject);
  });

  let hash = md5(content);

  // 30MB limit on uploads
  if (content.byteLength > 31457280) {
    throw ClientError(
      'The file you have you uploaded exceeds the upload file size limit for this service (currently 30MB)',
      'UPLOADED_FILE_TOO_BIG'
    );
  }

  let r = db.replacer();
  await db.queryAsync(
    /* SQL */
    `INSERT INTO "blob" ("hash", "data", "size") VALUES
     (${r(hash)}, ${r(content)}, ${r(content.byteLength)})
     ON CONFLICT (hash) DO NOTHING;`,
    r.values()
  );

  let fileId = 'file:' + hash.substr(0, 7);
  let createdFile = await data.writeNewObjectAsync(
    {
      fileId,
      hash,
      encoding,
      mimeType: mimetype,
      userId,
      uploadIp,
    },
    'file',
    { autoId: true }
  );

  return createdFile;
}

module.exports = {
  storeUploadAsync,
};
