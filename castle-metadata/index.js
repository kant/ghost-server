let url = require('url');

let fetch = require('cross-fetch');
let ip = require('ip');
let yaml = require('yaml');

function MetadataError(message) {
  let e = new Error(message);
  e.type = 'CLIENT_ERROR';
  e.code = 'METADATA_ERROR';
  return e;
}

async function parseCastleDataAsync(text) {
  return yaml.parse(text);
}

function isFileUrl(url_) {
  let parsedUrl = url.parse(url_);
  return parsedUrl && parsedUrl.protocol && parsedUrl.protocol === 'file:';
}

async function readFileUrlAsync(url_) {
  if (typeof fs === 'undefined') {
    throw new Error('`fs` not available in this context');
  }

  // We don't check that `url_` is a file URL here
  // We just assume that the caller will only pass
  // file:// URLs into this function
  let filename = url.fileURLToPath(url_);
  return await new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function isPublicUrlAsync(url_) {
  if (isFileUrl(url_)) {
    return false;
  }
  let parsedUrl = url.parse(url_);
  if (!parsedUrl) {
    return false;
  }
  if (parsedUrl.hostname) {
    let hostname = parsedUrl.hostname;
    if (hostname === 'localhost') {
      return false;
    }

    // For textual hostnames, this will return true
    // For numeric IP addresses or IPv6 addresses,
    // this will return true unless the IP is a LAN
    // address (ex. 192.168.0.1 or 127.0.0.1, etc.)
    return ip.isPublic(hostname);
  }

  return false;
}

async function fetchMetadataForUrlAsync(url_, opts) {
  opts = opts || {};
  let info = {};
  let metadata;
  let urlIsPublicUrl = await isPublicUrlAsync(url_);
  info.isPublicUrl = urlIsPublicUrl;
  info.isFileUrl = isFileUrl(url_);
  let response = null;

  let warnings = [];
  let errors = [];

  if (!opts.publicUrlsOnly || urlIsPublicUrl) {
    let body = null;
    if (info.isFileUrl) {
      if (opts.readFileUrlAsyncFunction) {
        body = await opts.readFileUrlAsyncFunction(url_);
      } else {
        body = await readFileUrlAsync(url_);
      }
    } else {
      response = await fetch(url_, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      body = await response.text();
    }

    let metadata = {};
    try {
      metadata = await parseCastleDataAsync(body);
    } catch (e) {
      metadata = {};
      errors.push(e.message);
    }

    info.requestedUrl = url_;

    if (metadata.main) {
      info.main = url.resolve(info.requestedUrl, metadata.main);
      if (info.main === metadata.main) {
        // absolute entrypoints are disallowed
        info.main = null;
        errors.push('The `main` key in a .castle file must be a relative path');
      }
    } else {
      info.main = url.resolve(info.requestedUrl, 'main.lua');
    }

    if (!errors.length) {
      let mainIsPublicUrl = await isPublicUrlAsync(info.main);
      if (urlIsPublicUrl && !mainIsPublicUrl) {
        // This could be a security risk so we'll disallow it
        info.main = null;
        errors.push('Cannot have a private URL be main URL for a public .castle URL');
      }
    }

    if (!errors.length && metadata.canonicalUrl) {
      info.canonicalUrl = metadata.canonicalUrl;
      if (!(await isPublicUrlAsync(info.canonicalUrl))) {
        info.canonicalUrl = null;
        errors.push('Canonical URL must be a public URL');
      } else {
        if (urlIsPublicUrl) {
          info.canonicalUrl = url;
        }
      }
    }

    return {
      metadata,
      info,
      errors,
      warnings,
    };
  } else {
    throw MetadataError(
      "Won't get metadata from a private URL when the `publicUrlsOnly` option is set"
    );
  }
}

module.exports = {
  parseCastleDataAsync,
  isPublicUrlAsync,
  fetchMetadataForUrlAsync,
  isFileUrl,
  readFileUrlAsync,
};
