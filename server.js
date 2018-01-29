/**
 * Copyright 2013 Ricard Aspeljung. All Rights Reserved.
 * Last updates by Enrico Murru (2015) (http://enree.co)
 * server.js
 * crest
 */

var fs = require("fs"),
  mongodb = require("mongodb"),
  restify = module.exports.restify = require("restify");

var DEBUGPREFIX = "DEBUG: ";

var config = {
  "db": {
    "port": 11191,
    "host": "candidate.16.mongolayer.com"
  },
  "server": {
    "port": 80,
    "address": "localhost"
  },
  "flavor": "mongodb",
  "debug": false
};

var debug = module.exports.debug = function (str) {
  if (config.debug) {
    console.log(DEBUGPREFIX + str);
  }
};

try {
  config = JSON.parse(fs.readFileSync(process.cwd() + "/config.json"));
} catch (e) {
  debug("No config.json file found. Fall back to default config.");
}

module.exports.config = config;

var https_server = restify.createServer({
  name: "crest",
  certificate: fs.readFileSync("/etc/letsencrypt/live/odata.dancecardrx.com/fullchain.pem"),
  key: fs.readFileSync("/etc/letsencrypt/live/odata.dancecardrx.com/privkey.pem")
});

var server = restify.createServer({
  name: "crest"
})
server.acceptable = ['application/json'];
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.jsonp());
module.exports.server = server;
module.exports.https_server = https_Server;

require('./lib/rest');

server.listen(process.env.PORT || config.server.port, function () {
  console.log("%s listening at %s", server.name, server.url);
});

https_server.listen(443, function() {
   console.log('%s listening at %s', https_server.name, https_server.url);
});
