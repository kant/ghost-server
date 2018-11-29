let luaparse = require('luaparse');
let yaml = require('yaml');

async function getRawMetadataFromSourceFileAsync(sourceCode) {
  // Rules for parsing source files:
  // Ignore shebang lines
  // Look through all the comments that are before any code in the file
  // If any of them start with a line that is `#castle` or `#castle/{format}`
  // then the rest of that comment is the metadata
  // Otherwise, take the first comment and assume that is the metadata
  // If there aren't any comments before, then assume there is no metadata in the source

  let [hasMetadataInComments, metadataText, formatType] = await new Promise((resolve, reject) => {
    let stop = false;
    let commentText = '';
    let resolved = false;

    // FYI - `luaparse` will ignore shebang lines
    let ast = luaparse.parse(sourceCode, {
      onCreateNode: (node) => {
        if (stop) {
          return;
        }
        switch (node.type) {
          case 'Comment':
            let value = node.value;
            let firstLine = value.split(/[\n\r]/, 1)[0];
            let r = /^#castle(\/([a-z0-9A-Z_\-]+))?$/;
            let m = r.exec(firstLine.trim());
            if (m) {
              let [_castle, _, formatType] = m;
              if (!value) {
                console.log(node);
                console.log('no value :/');
              }
              let commentText = value.substr(firstLine.length);
              stop = true;
              resolve([true, commentText, formatType]);
              resolved = true;
            } else {
              if (!commentText) {
                commentText = value.trim();
              }
            }
            break;
          default:
            stop = true;
        }
      },
    });
    if (!resolved) {
      if (commentText) {
        resolve([true, commentText, null]);
      } else {
        resolve([false, null, null]);
      }
      resolved = true;
    }
  });

  return {
    hasMetadataInComments,
    metadataText,
    formatType,
  };
}

async function parseSourceFileAsync(sourceCode) {
  let { hasMetadataInComments, metadataText, formatType } = await getRawMetadataFromSourceFileAsync(
    sourceCode
  );
  if (hasMetadataInComments) {
    return await parseCastleDataAsync(metadataText, formatType);
  }
}

async function parseCastleDataAsync(text, format) {
  switch (format) {
    case 'json':
      return await parseJsonCastleDataAsync(text);
    case 'yaml':
      return await parseYamlCastleDataAsync(text);
    default:
      try {
        // console.log('try json');
        return await parseJsonCastleDataAsync(text);
      } catch (e) {
        try {
          // console.log('try yaml');
          let result = await parseYamlCastleDataAsync(text);
          if (typeof result !== 'object') {
            return null;
          }
        } catch (e) {
          // console.log('huh');
          return null;
        }
      }
  }
}

async function parseYamlCastleDataAsync(text) {
  return yaml.parse(text);
}

async function parseJsonCastleDataAsync(text) {
  return JSON.parse(text);
}

module.exports = {
  parseCastleDataAsync,
  parseJsonCastleDataAsync,
  parseYamlCastleDataAsync,
  parseSourceFileAsync,
  getRawMetadataFromSourceFileAsync,
};
