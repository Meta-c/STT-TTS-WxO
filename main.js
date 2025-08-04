// let serviceTokens;
// let webChatInstance;
// let currentStream;
// let isRecording = false;

// const { on } = require("events");

// const { on } = require("events");

// function generateTextFromMessage(message) {
//   return message.output.generic.map(message => message.text).join(' ');
// }

// function handleMessageReceive(event) {
//   const synthText = generateTextFromMessage(event.data);
//   const audio = WatsonSpeech.TextToSpeech.synthesize({
//     text: synthText,
//     accessToken: serviceTokens.ttsToken,
//     url: serviceTokens.ttsURL,
//   });
//   audio.onerror = function (error) {
//     console.error('TextToSpeech error', error);
//   }
// }

// function sendTextToAssistant(text) {
//   const sendObject = { input: { text } };
//   webChatInstance.send(sendObject)
// }

// function onStartRecord() {
//   const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
//     accessToken: serviceTokens.sttToken,
//     url: serviceTokens.sttURL,
//     // model: 'en-US_Multimedia',
//     model: 'en-US_BroadbandModel',
//     objectMode: true,
//   });

//   stream.on('data', function (data) {
//     console.log('Received SpeechToText data', data)
//     if (data.results[0] && data.results[0].final) {
//       stream.stop();
//       currentStream = null;
//       console.log('Stopped listening');
//       setButtonState(false);

//       const text = data.results[0].alternatives.map(message => message.transcript).join(' ');
//       sendTextToAssistant(text);
//     }
//   });

//   stream.on('error', function (error) {
//     console.error('SpeechToText error', error);
//   });

//   currentStream = stream;
// }

// function onStopRecord() {
//   if (currentStream) {
//     currentStream.stop();
//   }
//   currentStream = null;
// }

// function setButtonState(localIsRecording) {
//   isRecording = localIsRecording;
//   document.querySelector('.RecordButton').innerHTML = getButtonHTML(isRecording);
// }

// function getButtonHTML(isRecording) {
//   let buttonContent;
//   if (isRecording) {
//     buttonContent = `
//       <svg viewBox="0 0 32 32">
//         <path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z" />
//         <path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22Z" />
//       </svg>
//       Stop recording
//     `;
//   } else {
//     buttonContent = `
//       <svg viewBox="0 0 32 32">
//         <path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z"/>
//         <path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22ZM13,7a3,3,0,0,1,6,0V17a3,3,0,0,1-6,0Z"/>
//       </svg>
//       Start recording
//     `;
//   }
//   return buttonContent;
// }

// function onButtonClick() {
//   setButtonState(!isRecording);
//   if (isRecording) {
//     onStartRecord();
//   } else {
//     onStopRecord();
//   }
// }

// function addRecordButton(instance) {
//   const button = document.createElement('button');
//   button.classList.add('RecordButton');
//   button.classList.add('cds--btn');
//   button.classList.add('cds--btn--primary');
//   button.innerHTML = getButtonHTML(false);
//   button.addEventListener('click', onButtonClick);

//   instance.writeableElements.beforeInputElement.appendChild(button);
// }

// async function onLoad(instance) {
//   webChatInstance = instance;
//   const result = await fetch('http://localhost:3001/getAuthTokens');
//   serviceTokens = await result.json();

//   instance.on({ type: 'receive', handler: handleMessageReceive })
//   addRecordButton(instance);
//   instance.updateHomeScreenConfig({ is_on: false });
//   await instance.render();
// }

// window.watsonAssistantChatOptions = {
//     integrationID: "27c782e2-b91d-4f08-bfbe-7e618bd675ed", // The ID of this integration.
//     region: "us-south", // The region your integration is hosted in.
//     serviceInstanceID: "b72a30ee-2c4e-48c9-9184-0c34e3885278", // The ID of your service instance.
//     onLoad: onLoad
//   };
//   setTimeout(function(){
//     const t=document.createElement('script');
//     t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
//     document.head.appendChild(t);
//   });


let serviceTokens = null;
let webChatInstance;
let currentStream = null;
let isRecording = false;

// ==== Token Caching (can be extended to localStorage if needed) ====
async function getTokens() {
  if (serviceTokens) return serviceTokens;
  const res = await getAuthTokens()
  return res;
}

// ==== TTS with Preload via Blob ====
async function playTextToSpeech(text) {
  const tokens = await getTokens();

  const ttsUrl = `${tokens.ttsURL}/v1/synthesize?text=${encodeURIComponent(text)}&voice=en-US_MichaelV3Voice&accept=audio/ogg;codecs=opus
`;
  const response = await fetch(ttsUrl, {
    headers: {
      Authorization: `Bearer ${tokens.ttsToken}`,
    }
  });

  const audioBlob = await response.blob();
  const audioURL = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioURL);
  audio.play().catch(err => console.error('Audio play failed', err));
}

async function playTextToSpeechWebSocket(text) {
  const tokens = await getTokens();

  const wsURI = `wss://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/500bc00e-f01c-45af-b239-7d69696bd0f0/v1/synthesize?access_token=${tokens.ttsToken}`;

  
  const audioParts = [];
  let finalAudio = null;

  const websocket = new WebSocket(wsURI);

  websocket.onopen = function () {
    const message = {
      text: text,
      accept: 'audio/ogg;codecs=opus',
      voice: 'en-US_AllisonV3Voice'
    };
    websocket.send(JSON.stringify(message));
  };

  websocket.onmessage = function (evt) {
    if (typeof evt.data === 'string') {
      console.log('Received JSON message:', evt.data);
    } else {
      audioParts.push(evt.data);
    }
  };

  websocket.onerror = function (evt) {
    console.error('WebSocket error:', evt);
  };

  websocket.onclose = function (evt) {
    console.log('WebSocket closed:', evt.code, evt.reason);
    finalAudio = new Blob(audioParts, { type: 'audio/ogg;codecs=opus' });
    const audioURL = URL.createObjectURL(finalAudio);
    const audio = new Audio(audioURL);
    audio.play().catch(err => console.error('Audio playback error:', err));
  };
}

// ==== Build Message Text ====
function generateTextFromMessage(message) {
  return message.output.generic.map(msg => msg.text).join(' ');
}

function prepareTextForTTS(text) {
  if (!text) return '';
   

  const lines = text.split('\n');
  const tableStartIndex = lines.findIndex(line => /\s{2,}|\t/.test(line));

  let cleanedText = '';

  if (tableStartIndex > 0) {
    // Get text before table
    cleanedText = lines.slice(0, tableStartIndex).join(' ').trim() + '. ';
    cleanedText += 'The provided table contains detailed information.';
  } else {
    // No table detected — clean full text
    cleanedText = text;
  }


  return text
    // Replace URLs with "the provided link"
    .replace(/https?:\/\/[^\s]+/g, 'the provided link')
    // Replace markdown-style links: [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    // Add pauses after numbered list items: "1. ..." becomes "1. ..."
    .replace(/^(\d+)\.\s*/gm, '$1. ') // Just makes sure there's a period and space
    // Add periods at the end of lines if missing
    .replace(/([^\.\n])\n/g, '$1.\n')
    // Convert line breaks to pauses
    .replace(/\n+/g, '. ') // Extra line breaks → longer pause
    // Normalize multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function handleMessageReceive(event) {
  // const synthText = generateTextFromMessage(event.data);
  let synthText = prepareTextForTTS(generateTextFromMessage(event.data));

   if (!synthText || synthText.length < 3 || /^(yeah|he|the)[.!]*$/i.test(synthText)) {
    console.warn('Skipping empty or irrelevant TTS text:', synthText);
    return;
  }

  // // Replace URLs with a friendly phrase
  // synthText = synthText.replace(/https?:\/\/[^\s]+/g, 'the provided link');

  // // Optional: Also remove markdown links like [click here](https://example.com)
  // synthText = synthText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');

  playTextToSpeechWebSocket(synthText);
}

// ==== STT Optimized Streaming ====
async function onStartRecord() {
  const tokens = await getTokens();
  let hasSent = false; //

  const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
    accessToken: tokens.sttToken,
    url: tokens.sttURL,
    model: 'en-US_Multimedia',
    objectMode: true,
    interim_results: true,
  });

  let silenceTimeout = setTimeout(() => {
    console.log('Auto-stop due to silence timeout');
    stream.stop();
    setButtonState(false);
  }, 10000); // Stop after 10 seconds of inactivity

  stream.on('data', function (data) {
    clearTimeout(silenceTimeout);

    // if (data.results[0] && data.results[0].final) {
    //   stream.stop();
    //   setButtonState(false);

    //   const text = data.results[0].alternatives.map(alt => alt.transcript).join(' ');
    //   sendTextToAssistant(text);
    // }


      if (data.results[0] && data.results[0].final && !hasSent) {
          const alt = data.results[0].alternatives[0];
          const text = alt.transcript.trim();
          const confidence = alt.confidence || 0; // Sometimes not available in some models

          console.log('Transcript:', text, '| Confidence:', confidence);

          // Filter: ignore meaningless text, very short, or low-confidence
          if (
            text.length > 2 &&
            confidence > 0.75 &&                     // Add confidence threshold
            !/^(yeah|he|the)[.!]*$/i.test(text)      // Filter typical noise
          ) {
            sendTextToAssistant(text);
            hasSent = true;
          }

          stream.stop();
          setButtonState(false);
        }

  });

  stream.on('error', function (err) {
    console.error('STT Error:', err);
    setButtonState(false);
  });

  currentStream = stream;
}

// ==== Stop Stream ====
function onStopRecord() {
  if (currentStream) {
    currentStream.stop();
  }
  currentStream = null;
}

// ==== UI State ====
function setButtonState(localIsRecording) {
  isRecording = localIsRecording;
  document.querySelector('.RecordButton').innerHTML = getButtonHTML(isRecording);
}

function getButtonHTML(isRecording) {
  return isRecording
    ? `
    <svg viewBox="0 0 32 32"><path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z"/>
       <path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22Z"/></svg>
    Stop recording
    `
    : `
    <svg viewBox="0 0 32 32"><path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z"/>
    <path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22ZM13,7a3,3,0,0,1,6,0V17a3,3,0,0,1-6,0Z"/></svg>
    Start recording
    `;
}

function onButtonClick() {
  setButtonState(!isRecording);
  if (isRecording) onStartRecord();
  else onStopRecord();
}

// ==== Assistant Integration ====
function sendTextToAssistant(text) {
  const sendObject = { input: { text } };
  webChatInstance.send(sendObject);
}

function addRecordButton(instance) {
  const button = document.createElement('button');
  button.className = 'RecordButton cds--btn cds--btn--primary';
  button.innerHTML = getButtonHTML(false);
  button.addEventListener('click', onButtonClick);
  instance.writeableElements.beforeInputElement.appendChild(button);
}

async function onLoad(instance) {
  webChatInstance = instance;
  await getTokens();
  instance.on({ type: 'receive', handler: handleMessageReceive });
  addRecordButton(instance);
  instance.updateHomeScreenConfig({ is_on: false });
  await instance.render();
}

// ==== Load Assistant Widget ====
// window.watsonAssistantChatOptions = {
//     integrationID: "fb941c31-2294-4808-b3f3-3306d2dc4329", // The ID of this integration.
//     region: "aws-us-east-1", // The region your integration is hosted in.
//     serviceInstanceID: "20250515-1717-0249-901a-4eeea6787c7a", // The ID of your service instance.
//     orchestrateUIAgentExtensions: false, // If you wish to enable optional UI Agent extensions.
//     onLoad: onLoad
//   };
//   setTimeout(function(){
//     const t=document.createElement('script');
//     t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
//     document.head.appendChild(t);
//   });


window.watsonAssistantChatOptions = {
  integrationID: "12a90c93-7b71-4920-8040-d9522b19e2f3", // The ID of this integration.
  region: "wxo-eu-de", // The region your integration is hosted in.
  serviceInstanceID: "c74c68d4-8fd1-4244-801e-46aaca162dc1", // The ID of your service instance.
  orchestrateUIAgentExtensions: false, // If you wish to enable optional UI Agent extensions.
  onLoad: onLoad
};
  setTimeout(function(){
    const t=document.createElement('script');
    t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
    document.head.appendChild(t);
  });


////////////////////////////////////////////////
const IamTokenManager = require('@ibm-functions/iam-token-manager');
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// These two files contain the credentials from your Watson Speech service instance.
const STT_CREDENTIALS = loadCredentials('../keys/serviceCredentialsSTT.json');
const TTS_CREDENTIALS = loadCredentials('../keys/serviceCredentialsTTS.json');

/**
 * This is the function that handles "getAuthToken" requests. It will use the provided API keys for the speech to text
 * and text to speech services and return authorization tokens that can be used by the client (browser) to
 * communicate with the service. You can host this code in your own server or you can put it in an IBM cloud function.
 * You can also find more information about the Speech SDK here:
 * https://github.com/watson-developer-cloud/speech-javascript-sdk.
 */
async function getAuthTokens() {
  const ttsManager = new IamTokenManager({
    iamApikey: TTS_CREDENTIALS.apikey,
  });
  const ttsToken = await ttsManager.getToken();

  const sttManager = new IamTokenManager({
    iamApikey: STT_CREDENTIALS.apikey,
  });
  const sttToken = await sttManager.getToken();

  return { ttsToken, ttsURL: TTS_CREDENTIALS.url, sttToken, sttURL: STT_CREDENTIALS.url };
}

/**
 * Reads the API key from the given file.
 */
function loadCredentials(fileName) {
  const filePath = path.join(__dirname, `../keys/${fileName}`);
  if (fs.existsSync(filePath)) {
    const data = String(fs.readFileSync(filePath));
    const json = JSON.parse(data);
    if (!json.apikey || !json.url) {
      throw new Error(
        `The file ${filePath} does not contain the expected service credentials. I expected "apikey" and "url" properties.`,
      );
    }
    return json;
  }
  throw new Error(
    `This example requires that you provide service credentials for access to your Watson Speech service. Please make sure the appropriate credentials can be found in keys/${fileName}.`,
  );
}

router.get('/', getAuthTokens);

module.exports = router;

