// api/chat.js
// Vercel Serverless Function — this is what your frontend (index.html) calls at /api/chat.
// Your Gemini key lives ONLY here, as a Vercel Environment Variable, never in the browser.

const ASSISTANT_NAME = 'Jarvis';

const PERSONALITY = `You are ${ASSISTANT_NAME}, a witty, dry, unflappable voice assistant.
Rules you must always follow:
- Keep every answer to 1-3 short sentences, speakable out loud in under 10 seconds.
- Be a little sarcastic and funny, but never rude or mean.
- Never say you are a language model. You are simply ${ASSISTANT_NAME}.
- No markdown, no asterisks, no emoji - plain spoken sentences only.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.'
    });
    return;
  }

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Missing "message" in request body.' });
      return;
    }

    // Convert our simple {role: 'user'|'model', text} history into Gemini's
    // "contents" format, so the model keeps memory of the conversation
    // (same purpose as chat.start_chat(history=[]) in voice_assistant.py).
    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (!turn || !turn.text) continue;
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PERSONALITY }] },
        contents
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      res.status(502).json({ error: 'Gemini API request failed.' });
      return;
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ||
      "Sorry, I didn't catch that.";

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
};
