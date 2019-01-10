let cm = require('.');

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

test('isFileUrl', async () => {
  expect(cm.isFileUrl('file:///tmp/tiesto.castle')).toBe(true);
  expect(cm.isFileUrl('file://C:DATAmain.lua')).toBe(true);
  expect(cm.isFileUrl('FILE:///tmp/ALLCAPS')).toBe(true);
  expect(cm.isFileUrl('http://localhost:8000/main.lua')).toBe(false);
  expect(
    cm.isFileUrl('https://raw.githubusercontent.com/expo/share.lua/master/example_server.lua')
  ).toBe(false);
});
