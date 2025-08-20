// ==== Visual styles (injected once) ====
function ensureRecordButtonStyles() {
  if (document.getElementById('wxo-record-button-styles')) return;
  const css = `
    .RecordButton { 
      width: 56px; height: 56px; border: none; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      background: #0F62FE; /* IBM Blue 60 */
      color: #fff; cursor: pointer; user-select: none;
      box-shadow: 0 8px 24px rgba(15,98,254,.28), 0 2px 6px rgba(0,0,0,.16);
      transition: transform .12s ease, box-shadow .2s ease, background .15s ease;
      outline: none;
      backdrop-filter: saturate(120%) blur(4px);
    }
    .RecordButton:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(15,98,254,.32), 0 4px 10px rgba(0,0,0,.18); }
    .RecordButton:active { transform: translateY(0); box-shadow: 0 6px 16px rgba(15,98,254,.28), 0 2px 6px rgba(0,0,0,.2); }
    .RecordButton svg { width: 22px; height: 22px; fill: currentColor; }

    /* Recording state */
    .RecordButton.recording { background: #DA1E28; /* Red 60 */ box-shadow: 0 8px 24px rgba(218,30,40,.32), 0 2px 6px rgba(0,0,0,.16); }
    .RecordButton .pulse-ring { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }
    .RecordButton.recording .pulse-ring::before { 
      content: ""; position: absolute; inset: -6px; border-radius: 50%;
      border: 3px solid rgba(218,30,40,.5); opacity: 0; animation: wxo-pulse 1.4s ease-out infinite;
    }
    @keyframes wxo-pulse { 0% { transform: scale(.7); opacity: .65;} 80% { transform: scale(1.25); opacity: 0;} 100% { opacity: 0; } }

    /* Tooltip */
    .RecordButton[data-tooltip] { position: fixed; }
    .RecordButton[data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute; bottom: 70px; right: 0; white-space: nowrap;
      background: rgba(0,0,0,.9); color: #fff; font: 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
      padding: 6px 8px; border-radius: 6px; box-shadow: 0 6px 16px rgba(0,0,0,.25);
      transform: translateX(0); pointer-events: none; z-index: 2147483647;
    }
  `;
  const style = document.createElement('style');
  style.id = 'wxo-record-button-styles';
  style.textContent = css;
  document.head.appendChild(style);
}
// let serviceTokens = null;
// let webChatInstance;
// let currentStream = null;
// let isRecording = false;

// // ==== Token Caching (can be extended to localStorage if needed) ====
// async function getTokens() {
//   if (serviceTokens) return serviceTokens;
//   // const res = await fetch('/getAuthTokens');
//   const res = await fetch('http://localhost:3001/getAuthTokens');
//   serviceTokens = await res.json();
//   return serviceTokens;
// }

// // ==== TTS with Preload via Blob ====
// async function playTextToSpeech(text) {
//   const tokens = await getTokens();

//   const ttsUrl = `${tokens.ttsURL}/v1/synthesize?text=${encodeURIComponent(text)}&voice=en-US_MichaelV3Voice&accept=audio/ogg;codecs=opus
// `;
//   const response = await fetch(ttsUrl, {
//     headers: {
//       Authorization: `Bearer ${tokens.ttsToken}`,
//     }
//   });

//   const audioBlob = await response.blob();
//   const audioURL = URL.createObjectURL(audioBlob);
//   const audio = new Audio(audioURL);
//   audio.play().catch(err => console.error('Audio play failed', err));
// }

// async function playTextToSpeechWebSocket(text) {
//   const tokens = await getTokens();

//   const wsURI = `wss://api.eu-de.text-to-speech.watson.cloud.ibm.com/instances/30873ef5-5b92-41a4-b9a0-d554606dcca9/v1/synthesize?access_token=${encodeURIComponent(tokens.ttsToken)}`;

//   const audioParts = [];
//   let finalAudio = null;

//   const websocket = new WebSocket(wsURI);

//   websocket.onopen = function () {
//     const message = {
//       text: text,
//       accept: 'audio/ogg;codecs=opus',
//       voice: 'en-US_AllisonV3Voice'
//     };
//     websocket.send(JSON.stringify(message));
//   };

//   websocket.onmessage = function (evt) {
//     if (typeof evt.data === 'string') {
//       console.log('Received JSON message:', evt.data);
//     } else {
//       audioParts.push(evt.data);
//     }
//   };

//   websocket.onerror = function (evt) {
//     console.error('WebSocket error:', evt);
//   };

//   websocket.onclose = function (evt) {
//     console.log('WebSocket closed:', evt.code, evt.reason);
//     finalAudio = new Blob(audioParts, { type: 'audio/ogg;codecs=opus' });
//     const audioURL = URL.createObjectURL(finalAudio);
//     const audio = new Audio(audioURL);
//     audio.play().catch(err => console.error('Audio playback error:', err));
//   };
// }

// // ==== Build Message Text ====
// function generateTextFromMessage(message) {
//   return message.output.generic.map(msg => msg.text).join(' ');
// }

// function prepareTextForTTS(text) {
//   if (!text) return '';
   

//   const lines = text.split('\n');
//   const tableStartIndex = lines.findIndex(line => /\s{2,}|\t/.test(line));

//   let cleanedText = '';

//   if (tableStartIndex > 0) {
//     // Get text before table
//     cleanedText = lines.slice(0, tableStartIndex).join(' ').trim() + '. ';
//     cleanedText += 'The provided table contains detailed information.';
//   } else {
//     // No table detected — clean full text
//     cleanedText = text;
//   }


//   return text
//     // Replace URLs with "the provided link"
//     .replace(/https?:\/\/[^\s]+/g, 'the provided link')
//     // Replace markdown-style links: [text](url)
//     .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
//     // Add pauses after numbered list items: "1. ..." becomes "1. ..."
//     .replace(/^(\d+)\.\s*/gm, '$1. ') // Just makes sure there's a period and space
//     // Add periods at the end of lines if missing
//     .replace(/([^\.\n])\n/g, '$1.\n')
//     // Convert line breaks to pauses
//     .replace(/\n+/g, '. ') // Extra line breaks → longer pause
//     // Normalize multiple spaces
//     .replace(/\s{2,}/g, ' ')
//     .trim();
// }

// function handleMessageReceive(event) {
//   // const synthText = generateTextFromMessage(event.data);
//   let synthText = prepareTextForTTS(generateTextFromMessage(event.data));

//   // // Replace URLs with a friendly phrase
//   // synthText = synthText.replace(/https?:\/\/[^\s]+/g, 'the provided link');

//   // // Optional: Also remove markdown links like [click here](https://example.com)
//   // synthText = synthText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');

//   playTextToSpeechWebSocket(synthText);
// }

// // ==== STT Optimized Streaming ====
// async function onStartRecord() {
//   const tokens = await getTokens();

//   const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
//     accessToken: tokens.sttToken,
//     url: tokens.sttURL,
//     model: 'en-US_Multimedia',
//     objectMode: true,
//     interim_results: true,
//   });

//   let silenceTimeout = setTimeout(() => {
//     console.log('Auto-stop due to silence timeout');
//     stream.stop();
//     setButtonState(false);
//   }, 10000); // Stop after 10 seconds of inactivity

//   stream.on('data', function (data) {
//     clearTimeout(silenceTimeout);

//     if (data.results[0] && data.results[0].final) {
//       stream.stop();
//       setButtonState(false);

//       const text = data.results[0].alternatives.map(alt => alt.transcript).join(' ');
//       sendTextToAssistant(text);
//     }
//   });

//   stream.on('error', function (err) {
//     console.error('STT Error:', err);
//     setButtonState(false);
//   });

//   currentStream = stream;
// }

// // ==== Stop Stream ====
// function onStopRecord() {
//   if (currentStream) {
//     currentStream.stop();
//   }
//   currentStream = null;
// }

// // ==== UI State ====
// function setButtonState(localIsRecording) {
//   isRecording = localIsRecording;
//   document.querySelector('.RecordButton').innerHTML = getButtonHTML(isRecording);
// }

// function getButtonHTML(isRecording) {
//   return isRecording
//     ? `
//     <svg viewBox="0 0 32 32"><path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z"/>
//        <path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22Z"/></svg>
//     Stop recording
//     `
//     : `
//     <svg viewBox="0 0 32 32"><path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z"/>
//     <path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22ZM13,7a3,3,0,0,1,6,0V17a3,3,0,0,1-6,0Z"/></svg>
//     Start recording
//     `;
// }

// function onButtonClick() {
//   setButtonState(!isRecording);
//   if (isRecording) onStartRecord();
//   else onStopRecord();
// }

// // ==== Assistant Integration ====
// function sendTextToAssistant(text) {
//   const sendObject = { input: { text } };
//   webChatInstance.send(sendObject);
// }

// function addRecordButton(instance) {
//   const button = document.createElement('button');
//   button.className = 'RecordButton cds--btn cds--btn--primary';
//   button.innerHTML = getButtonHTML(false);
//   button.addEventListener('click', onButtonClick);
//   instance.writeableElements.beforeInputElement.appendChild(button);
// }

// async function onLoad(instance) {
//   webChatInstance = instance;
//   await getTokens();
//   instance.on({ type: 'receive', handler: handleMessageReceive });
//   addRecordButton(instance);
//   instance.updateHomeScreenConfig({ is_on: false });
//   await instance.render();
// }




                                         // -----------------Agentic Embbeding----------------------------//


// window.wxOConfiguration = {
//   orchestrationID: "8471af1899b34564b2b04be799f50d75_af7e932c-5934-4c8a-aa19-0f99c1f58012",
//   hostURL: "https://us-south.watson-orchestrate.cloud.ibm.com",
//   rootElementID: "root",
//   showLauncher: true,
//   crn: "crn:v1:bluemix:public:watsonx-orchestrate:us-south:a/8471af1899b34564b2b04be799f50d75:af7e932c-5934-4c8a-aa19-0f99c1f58012::",
//   deploymentPlatform: "ibmcloud",
//   chatOptions: {
//     agentId: "474cc822-74c2-421b-99c5-ea0bac5432df",
//     agentEnvironmentId: "567bd343-b6f2-4a09-bc9c-5306468dbc71",
//     onLoad:onLoad
//   }
// };

// setTimeout(function () {
//   const script = document.createElement('script');
//   script.src = `${window.wxOConfiguration.hostURL}/wxochat/wxoLoader.js?embed=true`;
//   script.addEventListener('load', function () {
//     wxoLoader.init();
//   });
//   document.head.appendChild(script);
// }, 0);




// agentic-chat.js
// Ready-to-run watsonx Orchestrate Agentic embed + STT → Chat → TTS glue
// No dependencies on your old Assistant embed.

/* =============================
   Config (use your real values)
   ============================= */
const WXO_CONFIG = {
  orchestrationID:
    "8471af1899b34564b2b04be799f50d75_af7e932c-5934-4c8a-aa19-0f99c1f58012",
  hostURL: "https://us-south.watson-orchestrate.cloud.ibm.com",
  rootElementID: "root",
  showLauncher: true,
  crn:
    "crn:v1:bluemix:public:watsonx-orchestrate:us-south:a/8471af1899b34564b2b04be799f50d75:af7e932c-5934-4c8a-aa19-0f99c1f58012::",
  deploymentPlatform: "ibmcloud",
  chatOptions: {
    agentId: "474cc822-74c2-421b-99c5-ea0bac5432df",
    agentEnvironmentId: "567bd343-b6f2-4a09-bc9c-5306468dbc71",
    onLoad: onAgentChatLoad, // defined below
  },
};

// Your local token endpoint
const TOKEN_ENDPOINT = "http://localhost:3001/getAuthTokens";

/* =============================
   Internal state
   ============================= */
let serviceTokens = null;
let webChatInstance = null;
let currentStream = null;
let isRecording = false;

/* =============================
   Token fetch (cached)
   ============================= */
async function getTokens() {
  if (serviceTokens) return serviceTokens;
  const res = await fetch(TOKEN_ENDPOINT);
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  serviceTokens = await res.json();
  return serviceTokens;
}

/* =============================
   TTS (WebSocket streaming)
   ============================= */
async function playTextToSpeechWebSocket(text) {
  if (!text) return;
  const tokens = await getTokens();

  // Build WS URL from your TTS instance (adjust region/instance as needed)
  const wsURI = `${tokens.ttsURL.replace('https://', 'wss://')}/v1/synthesize?access_token=${encodeURIComponent(tokens.ttsToken)}`;

  const audioParts = [];
  const ws = new WebSocket(wsURI);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        text,
        accept: "audio/ogg;codecs=opus",
        voice: "en-US_AllisonV3Voice",
      })
    );
  };

  ws.onmessage = (evt) => {
    if (typeof evt.data !== "string") audioParts.push(evt.data);
  };

  ws.onerror = (e) => console.error("TTS WS error", e);

  ws.onclose = () => {
    if (!audioParts.length) return;
    const finalAudio = new Blob(audioParts, { type: "audio/ogg;codecs=opus" });
    const url = URL.createObjectURL(finalAudio);
    const audio = new Audio(url);
    audio.play().catch((e) => console.error("Audio play error", e));
  };
}

/* =============================
   STT (Watson Speech SDK mic)
   ============================= */
// Requires Watson Speech SDK on the page (same as your old project):
// <script src="https://unpkg.com/watson-speech/dist/watson-speech.min.js"></script>
async function onStartRecord() {
  const tokens = await getTokens();

  const stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
    accessToken: tokens.sttToken,
    url: tokens.sttURL,
    model: "en-US_Multimedia",
    objectMode: true,
    interim_results: true,
  });

  let silenceTimeout = setTimeout(() => {
    console.log("Auto-stop due to silence");
    try { stream.stop(); } catch {}
    setButtonState(false);
  }, 10000);

  stream.on("data", (data) => {
    clearTimeout(silenceTimeout);
    if (data?.results?.[0]?.final) {
      try { stream.stop(); } catch {}
      setButtonState(false);

      const text = data.results[0].alternatives.map((a) => a.transcript).join(" ");
      sendTextToAssistant(text);
    } else {
      // reset silence timer while user is speaking
      silenceTimeout = setTimeout(() => {
        console.log("Auto-stop due to silence");
        try { stream.stop(); } catch {}
        setButtonState(false);
      }, 10000);
    }
  });

  stream.on("error", (err) => {
    console.error("STT error", err);
    setButtonState(false);
  });

  currentStream = stream;
}

function onStopRecord() {
  if (currentStream) {
    try { currentStream.stop(); } catch {}
  }
  currentStream = null;
}

/* =============================
   UI helpers (Record button)
   ============================= */
function getButtonHTML(recording) {
  return `
    <span class="pulse-ring"></span>
    <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M23,14v3A7,7,0,0,1,9,17V14H7v3a9,9,0,0,0,8,8.94V28H11v2H21V28H17V25.94A9,9,0,0,0,25,17V14Z"/><path d="M16,22a5,5,0,0,0,5-5V7A5,5,0,0,0,11,7V17A5,5,0,0,0,16,22ZM13,7a3,3,0,0,1,6,0V17a3,3,0,0,1-6,0Z"/></svg>
  `;
}

function setButtonState(recording) {
  isRecording = recording;
  const btn = document.querySelector('.RecordButton');
  if (!btn) return;
  btn.innerHTML = getButtonHTML(isRecording);
  btn.classList.toggle('recording', isRecording);
  btn.setAttribute('aria-pressed', String(isRecording));
  btn.setAttribute('data-tooltip', isRecording ? 'Stop recording' : 'Start recording');
}

function onRecordButtonClick() {
  setButtonState(!isRecording);
  if (isRecording) onStartRecord();
  else onStopRecord();
}

function addRecordButton(instance) {
  ensureRecordButtonStyles();
  // Create or reuse
  let button = document.querySelector('.RecordButton');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'RecordButton cds--btn cds--btn--primary';
    button.setAttribute('aria-label', 'Voice input');
    button.setAttribute('data-tooltip', 'Start recording');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = getButtonHTML(false);
    button.addEventListener('click', onRecordButtonClick);
  }

  // Try to mount inside chat input if the embed exposes a mount point
  if (instance && instance.writeableElements && instance.writeableElements.beforeInputElement) {
    try { instance.writeableElements.beforeInputElement.appendChild(button); } catch (e) { /* ignore */ }
  }

  // Always keep a floating fallback so the button is visible even if we can't mount inside the chat DOM
  if (!document.body.contains(button)) {
    Object.assign(button.style, {
      position: 'fixed',
      right: '40px',
      bottom: '96px', // place above the chat input area
      zIndex: 2147483647, // sit above overlays
      pointerEvents: 'auto'
    });
    document.body.appendChild(button);
  }
}

/* =============================
   Chat send/receive glue
   ============================= */
function sendTextToAssistant(text) {
  if (!webChatInstance) return;
  webChatInstance.send(text); // agentic API: plain string
}

function generateTextFromAgentEvent(event) {
  // Agentic "receive" event has shape: { message: { content: [{text?, title?, ...}, ...] } }
  try {
    const parts = Array.isArray(event?.message?.content) ? event.message.content : [];
    return parts
      .map((p) => (typeof p?.text === "string" ? p.text : (typeof p?.title === "string" ? p.title : "")))
      .filter(Boolean)
      .join(" ");
  } catch (e) {
    console.warn("Unable to parse agent message for TTS", e, event);
    return "";
  }
}

function prepareTextForTTS(text) {
  if (!text) return "";
  return text
    .replace(/https?:\/\/[^\s]+/g, "the provided link")        // URLs → friendly phrase
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")    // Markdown links
    .replace(/^(\d+)\.\s*/gm, "$1. ")                          // Normalize list items
    .replace(/([^\.\n])\n/g, "$1.\n")                          // Ensure end-of-line periods
    .replace(/\n+/g, ". ")                                     // Breaks → pauses
    .replace(/\s{2,}/g, " ")                                   // Spaces
    .trim();
}

function handleAgentReceive(event) {
  const synthText = prepareTextForTTS(generateTextFromAgentEvent(event));
  if (synthText) playTextToSpeechWebSocket(synthText);
}

/* =============================
   Agentic onLoad handler
   ============================= */
async function onAgentChatLoad(instance) {
  console.log('[Agentic] onLoad fired');
  webChatInstance = instance;
  await getTokens(); // warm tokens

  // Add the Record button ASAP (some environments may not emit chat:ready reliably)
  try { addRecordButton(instance); } catch (e) { console.warn('addRecordButton early mount failed', e); }

  // When chat is ready, add the Record button
  instance.on("chat:ready", () => {
    try { addRecordButton(instance); } catch (e) { console.warn("addRecordButton failed", e); }
  });

  // Speak assistant replies
  instance.on("receive", (event) => {
    try { handleAgentReceive(event); } catch (e) { console.error("receive handler failed", e); }
  });

  // Optional: if you later enable secure embed, handle token refresh
  instance.on("authTokenNeeded", async (_evt) => {
    // _evt.authToken = "<Refreshed Token>";
  });
}

/* =============================
   Boot the Agentic embed
   ============================= */

(function loadWXO() {
  window.wxOConfiguration = { ...WXO_CONFIG };
  const script = document.createElement("script");
  script.src = `${WXO_CONFIG.hostURL}/wxochat/wxoLoader.js?embed=true`;
  script.addEventListener("load", () => {
    if (typeof wxoLoader?.init === "function") wxoLoader.init();
  });
  document.head.appendChild(script);
})();

// DOMContentLoaded fallback: always show floating mic button even if onLoad/chat:ready don't fire
document.addEventListener('DOMContentLoaded', () => {
  // If the chat hasn’t loaded yet, still show the floating mic button
  try { addRecordButton(null); } catch (e) { console.warn('Fallback addRecordButton failed', e); }

  // Warn if Watson Speech SDK is missing (button will still show)
  if (typeof window.WatsonSpeech === 'undefined') {
    console.warn('Watson Speech SDK not found on page. Include https://unpkg.com/watson-speech/dist/watson-speech.min.js');
  }
});
