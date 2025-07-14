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
  const res = await fetch('/getAuthTokens');
  serviceTokens = await res.json();
  return serviceTokens;
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

// ==== Build Message Text ====
function generateTextFromMessage(message) {
  return message.output.generic.map(msg => msg.text).join(' ');
}

function prepareTextForTTS(text) {
  if (!text) return '';

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

  // // Replace URLs with a friendly phrase
  // synthText = synthText.replace(/https?:\/\/[^\s]+/g, 'the provided link');

  // // Optional: Also remove markdown links like [click here](https://example.com)
  // synthText = synthText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');

  playTextToSpeech(synthText);
}

// ==== STT Optimized Streaming ====
async function onStartRecord() {
  const tokens = await getTokens();

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
  }, 8000); // Stop after 8 seconds of inactivity

  stream.on('data', function (data) {
    clearTimeout(silenceTimeout);

    if (data.results[0] && data.results[0].final) {
      stream.stop();
      setButtonState(false);

      const text = data.results[0].alternatives.map(alt => alt.transcript).join(' ');
      sendTextToAssistant(text);
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
window.watsonAssistantChatOptions = {
    integrationID: "fb941c31-2294-4808-b3f3-3306d2dc4329", // The ID of this integration.
    region: "aws-us-east-1", // The region your integration is hosted in.
    serviceInstanceID: "20250515-1717-0249-901a-4eeea6787c7a", // The ID of your service instance.
    orchestrateUIAgentExtensions: false, // If you wish to enable optional UI Agent extensions.
    onLoad: onLoad
  };
  setTimeout(function(){
    const t=document.createElement('script');
    t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
    document.head.appendChild(t);
  });
