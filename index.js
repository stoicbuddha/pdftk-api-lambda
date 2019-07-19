process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const restify = require('restify'),
	  plugins = require('restify').plugins,
	  env = process.env.NODE_ENV,
	  testsRunning = process.env.TESTS_RUNNING,
	  initialConfig = require('./config'),
	  jwt = require('restify-jwt-community'),
	  corsMiddleware = require('restify-cors-middleware');

// We modify config, so we need to leave it mutable
let config = initialConfig;

if (testsRunning) {
	config = Object.assign(initialConfig, initialConfig.tests);
}

var server = restify.createServer();

const cors = corsMiddleware({
  origins: ['*'],
  allowHeaders: ['Authorization']
})

server.pre(cors.preflight)
server.use(cors.actual)

server.pre(restify.pre.userAgentConnection());
server.pre(restify.pre.sanitizePath());

server.pre(function(req, res, next) {
  req.headers.accept = 'application/json';
  return next();
});

server.use(restify.plugins.acceptParser(server.acceptable));

server.use(restify.plugins.queryParser({
	mapParams: true
}));
server.use(restify.plugins.bodyParser({
	mapParams: true
}));
server.use(restify.plugins.jsonp());

// server.use(jwt({ secret: config.jwt.secret}).unless({path: ['/users/register', '/users/authenticate', '/users/passwordreset']}));

// Bring in our routes
require('./routes/main')(server);

server.listen(config.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

module.exports = server;
