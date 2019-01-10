const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');
let secret = require('./secret');

const router = express.Router();

const pusher = new Pusher({
  ...secret.pusher,
  encrypted: true,
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.post('/pusher/auth', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var presenceData = {
    user_id: 'unique_user_id',
    user_info: {
      name: 'Mr Channels',
      twitter_id: '@pusher',
    },
  };
  var auth = pusher.authenticate(socketId, channel, presenceData);
  res.send(auth);
});

module.exports = {
  router: router,
};
