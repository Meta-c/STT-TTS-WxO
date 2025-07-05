/**
 * This file starts up a basic NodeJS server with express, adds some routes, and adds some error handling. This is
 * mostly boilerplate content that can be adjusted as needed.
 *
 * The server defaults to being available on port 3001.
 */

const { createServer } = require('http');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');

const PORT = 3001;

const app = express();

// Enable all CORS requests. In a production environment, you will likely want to remove this or set it to something
// more restrictive.
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// The routes needed by the application.
const getAuthTokensRouter = require('./routes/getAuthTokens');

app.use('/getAuthTokens/', getAuthTokensRouter);

// Send a 404 response if no handler was found.
app.use(function (request, response) {
  response.status(404).send();
});

// Error handler.
app.use(function (error, request, response) {
  console.error('An error occurred', error);
  response.status(500).send();
});

// Get port from environment and store in Express.
app.set('port', PORT);

// Create HTTP server.
const server = createServer(app);

// Listen on provided port, on all network interfaces.
server.listen(PORT);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  console.log(`Listening on ${server.address().port}`);
}


// const express = require('express');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const axios = require('axios');
// const { createServer } = require('http');
// const dotenv = require('dotenv');

// dotenv.config(); // Load IBM credentials from .env file

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(cors({ origin: '*' }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

// // Token cache
// let tokenCache = {
//   sttToken: null,
//   ttsToken: null,
//   expiry: null,
// };

// // Fetch and cache IAM tokens
// async function getIamToken(apiKey) {
//   const response = await axios.post(
//     'https://iam.cloud.ibm.com/identity/token',
//     new URLSearchParams({
//       grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
//       apikey: apiKey,
//     }),
//     {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//     }
//   );
//   return {
//     token: response.data.access_token,
//     expires_in: response.data.expiration * 1000,
//   };
// }

// // Return STT & TTS Tokens
// app.get('/getAuthTokens', async (req, res) => {
//   try {
//     const now = Date.now();
//     if (!tokenCache.expiry || now >= tokenCache.expiry) {
//       console.log('Fetching fresh tokens from IBM...');
//       const stt = await getIamToken(process.env.IBM_STT_APIKEY);
//       const tts = await getIamToken(process.env.IBM_TTS_APIKEY);
//       tokenCache = {
//         sttToken: stt.token,
//         ttsToken: tts.token,
//         expiry: now + 50 * 60 * 1000, // 50 minutes cache
//       };
//     }

//     res.json({
//       sttToken: tokenCache.sttToken,
//       sttURL: process.env.IBM_STT_URL,
//       ttsToken: tokenCache.ttsToken,
//       ttsURL: process.env.IBM_TTS_URL,
//     });
//   } catch (err) {
//     console.error('Token fetch failed:', err);
//     res.status(500).json({ error: 'Failed to get tokens' });
//   }
// });

// // Optional TTS streaming from backend
// app.get('/synthesize', async (req, res) => {
//   const text = req.query.text;
//   if (!text) return res.status(400).send('Missing text param');

//   try {
//     const now = Date.now();
//     if (!tokenCache.ttsToken || now >= tokenCache.expiry) {
//       const tts = await getIamToken(process.env.IBM_TTS_APIKEY);
//       tokenCache.ttsToken = tts.token;
//       tokenCache.expiry = now + 50 * 60 * 1000;
//     }

//     const ttsResp = await axios({
//       method: 'post',
//       url: `${process.env.IBM_TTS_URL}/v1/synthesize`,
//       headers: {
//         'Authorization': `Bearer ${tokenCache.ttsToken}`,
//         'Content-Type': 'application/json',
//         'Accept': 'audio/mp3',
//       },
//       data: { text },
//       responseType: 'stream',
//     });

//     res.setHeader('Content-Type', 'audio/mp3');
//     ttsResp.data.pipe(res);
//   } catch (err) {
//     console.error('TTS synthesis failed:', err);
//     res.status(500).send('Failed to synthesize');
//   }
// });

// // 404 fallback
// app.use((req, res) => res.status(404).send());

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server error:', err);
//   res.status(500).send('Server Error');
// });

// // Start server
// const server = createServer(app);
// server.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
