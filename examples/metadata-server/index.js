let express = require('express');
let app = express();
let port = 3000;

app.get('/', (req, res) => {
  res.setHeader('X-Castle-Project-Name', '@ccheever/game');
  res.send(/* Lua / YAML */ `
--[[
  --- !clarkevans.com/^invoice
  invoice: 34843
  date   : 2001-01-23
  bill-to: &id001
      given  : Chris
      family : Dumars
      address:
          lines: |
              458 Walkman Dr.
              Suite #292
          city    : Royal Oak
          state   : MI
          postal  : 48046
  ship-to: *id001
  product:
      - sku         : BL394D
        quantity    : 4
        description : Basketball
        price       : 450.00
      - sku         : BL4438H
        quantity    : 1
        description : Super Hoop
        price       : 2392.00
  tax  : 251.42
  total: 4443.52
  comments: >
      Late afternoon is best.
      Backup contact is Nancy
      Billsmer @ 338-4338.
]]

local x = 2

`);
});

app.get('/connect-four.castle', (req, res) => {
  res.json({
    name: 'Connect Four',
    slug: '@ccheever/connect-four',
    main: 'connect-four.lua'
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
