const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const router = express.Router();

router.get('/authorize', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + process.env.SPOTIFY_CLIENT_ID +
    (process.env.SPOTIFY_SCOPES ? '&scope=' + encodeURIComponent(process.env.SPOTIFY_SCOPES) : '') +
    "&scope=playlist-read-private playlist-read-collaborative" +
    '&redirect_uri=' + encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI));
});

module.exports = router;