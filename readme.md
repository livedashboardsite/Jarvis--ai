# Jarvis — Vercel Deployment

Live, judge-ready version of Jarvis. Frontend is `index.html` (voice UI), backend is
`api/chat.js` (a Vercel Serverless Function that holds your Gemini key so it never
reaches the browser).

## How the sync works

```
index.html  →  fetch('/api/chat', {message, history})  →  api/chat.js  →  Gemini API
                                                              ↑
                                                    reads process.env.GEMINI_API_KEY
```

Nothing in `index.html` contains a key — it only talks to your own `/api/chat` route.
`api/chat.js` reads the key from a Vercel **Environment Variable** at request time.

## Deploy steps

1. Push this folder (`index.html`, `api/chat.js`, `package.json`) to your Vercel repo.
2. In the Vercel dashboard → your project → **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | your real key from aistudio.google.com |

   Set it for **Production** (and Preview/Development too if you test branches).
3. **Redeploy** — env vars only take effect on a fresh deployment, not the one already
   running. If you add the variable after your first deploy, trigger a redeploy
   (Vercel dashboard → Deployments → ⋯ → Redeploy).
4. Open the live URL, allow microphone access, tap the orb.

## Quick way to check it's actually wired up

Open your deployed URL, open the browser dev tools → Network tab, and send Jarvis
any message that isn't a local instant-answer (e.g. "tell me a joke"). You should
see a `POST /api/chat` request return `200` with a JSON body like
`{"reply": "..."}`. If it returns `500` with a message about `GEMINI_API_KEY`, the
env var isn't set yet or the deployment hasn't picked it up — redeploy after adding it.

## Notes

- No npm packages required — `api/chat.js` calls the Gemini REST endpoint directly
  with the built-in `fetch`, so there's nothing to install or that can go out of date.
- The key is **never** sent to or read by the browser at any point — only the server
  function touches it.
- If you rotate your key later, just update the same environment variable value and
  redeploy — no code changes needed.
