const DB = require('~/utils/db');
const Permissions = require('~/utils/permissions');
const ClientError = require('~/common/ClientError');
let secret = require('~/utils/secret');

let crypto = require('crypto');
let AWS = require('aws-sdk');
let streamBuffers = require('stream-buffers');
let bufferImageSize = require('buffer-image-size');

let S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  accessKeyId: secret.aws.accessKeyId,
  secretAccessKey: secret.aws.secretAccessKey,
  region: 'us-west-2',
});

const typeDefs = `
  type HostedFile {
    width: Int
    height: Int
    url: Null

    # Deprecated
    imgixUrl: String
    fileId: ID
    hash: String
    name: String
    encoding: String
    mimeType: String
    userId: ID
    user: User
    uploadedTime: Datetime
    originUrl: String
  }

  extend type Mutation {
    uploadFile(file: Upload!): HostedFile
  }
`;

function md5(x) {
  return crypto
    .createHash('md5')
    .update(x, 'utf8')
    .digest('hex');
}

const resolvers = {
  Mutation: {
    uploadFile: async (_, { file }, context) => {
      await Permissions.loginRequiredAsync(context);

      let { stream } = await file;

      if (!stream) {
        throw ClientError(
          'No upload file stream; did you include it in the request?',
          'NO_UPLOAD_STREAM'
        );
      }

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

      if (content.byteLength > 31457280) {
        throw ClientError(
          'The file you have you uploaded exceeds the upload file size limit for this service (currently 30MB)',
          'UPLOADED_FILE_TOO_BIG'
        );
      }

      let hash = md5(content);

      let dimensions = null;
      try {
        dimensions = bufferImageSize(content);
      } catch (e) {}
      let height = null;
      let width = null;
      if (dimensions) {
        height = dimensions.height;
        width = dimensions.width;
      }

      let s3Result = await S3.putObject({
        Bucket: 'castle-uploads',
        Key: hash,
        Body: content,
      }).promise();

      console.log(s3Result);

      let url = 'http://d1vkcv80qw9qqp.cloudfront.net/' + hash;
      let fileRow = await DB('files')
        .insert({ url, width, height, user_id: context.userId })
        .returning('*')
        .get(0);

      fileRow.imgixUrl = fileRow.url;
      return fileRow;
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
