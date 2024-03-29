const fs = require("fs");
const express = require("express");

const app = express();
app.use(express.static(__dirname + "/public"));

// redirect to index if no params
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// redirect everything in /public
fs.readdirSync(__dirname + '/public').forEach(file => {
  if (file.endsWith('.html') && file != "index.html") {
    app.get('/' + file.replace('.html', ''), (req, res) => {
      res.sendFile(__dirname + '/public/' + file);
    });
  }
});

// redirect everything in /routes
fs.readdirSync(__dirname + '/routes').forEach(file => {
  if (file.endsWith('.js')) {
    app.use('/api/v1/' + file.replace('.js', ''), require(__dirname + '/routes/' + file));
  }
});

// start express server
app.listen(3000, () => {
  console.log(`Started listening on port 3000.`);
});