let md5 = require('md5');
let memoryStreams = require('memory-streams');

let db = require('./db');

async function processUploadAsync(context, file) {
  let { stream, filename, mimetype, encoding } = await file;

  let writer = new memoryStreams.WritableStream();
  await new Promise((resolve, reject) => {
    stream
      .pipe(writer)
      .on('finish', () => resolve())
      .on('error', reject);
  });

  let binaryContents = writer.toBuffer();
  let hash = md5(binaryContents);
  let userId = context.userId;
  let length = binaryContents.length;

  let r = db.replacer();
  // TODO(ccheever): Add an ON CONFLICT clause and fill in fromIp
  await db.queryAsync(
    /* SQL */ `
  INSERT INTO "file"
   ("fileHash", "content", "length", "mimeType", "filename", "userId", "fromIp", "uploadTime") 
   VALUES (${r(hash)}, ${r(binaryContents)}, ${r(length)}, ${r(mimetype)}, 
   ${r(filename)}, ${r(userId)}, ${r(null)}, ${r(new Date())});
  `,
    r.values()
  );

  return {
    hash,
    binaryContents,
    userId,
    length,
    mimeType: mimetype,
    userId,
  };
}

module.exports = {
  processUploadAsync,
};
