let registeredMediaPathRegex = /@([a-z0-9\-]+)\/([a-z0-9\-]+)/;

function parseRegisteredMediaPath(registeredMediaPath) {
  let parts = registeredMediaPathRegex.exec(registeredMediaPath);
  let [_, username, slug] = parts;
  return {
    username,
    slug,
  };
}

module.exports = {
  parseRegisteredMediaPath,
};
