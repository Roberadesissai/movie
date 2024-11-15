const functions = require('firebase-functions');
const next = require('next');

const app = next({
  dev: process.env.NODE_ENV !== 'production',
  conf: { distDir: '.next' }
});
const handle = app.getRequestHandler();

exports.nextApp = functions.https.onRequest(async (req, res) => {
  try {
    await app.prepare();
    handle(req, res);
  } catch (err) {
    console.error('Error while handling request', err);
    res.status(500).send('An error occurred while handling the request');
  }
});
