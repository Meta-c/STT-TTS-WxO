import { IamTokenManager } from '@ibm-functions/iam-token-manager';

const STT_CREDENTIALS = {
  apikey: process.env.STT_APIKEY,
  url: process.env.STT_URL,
};

const TTS_CREDENTIALS = {
  apikey: process.env.TTS_APIKEY,
  url: process.env.TTS_URL,
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ttsManager = new IamTokenManager({ iamApikey: TTS_CREDENTIALS.apikey });
    const ttsToken = await ttsManager.getToken();

    const sttManager = new IamTokenManager({ iamApikey: STT_CREDENTIALS.apikey });
    const sttToken = await sttManager.getToken();

    return res.status(200).json({
      ttsToken,
      ttsURL: TTS_CREDENTIALS.url,
      sttToken,
      sttURL: STT_CREDENTIALS.url,
    });
  } catch (err) {
    console.error('Token fetch failed:', err);
    return res.status(500).json({ error: 'Failed to fetch tokens' });
  }
}
