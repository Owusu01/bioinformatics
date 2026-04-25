const express = require('express');
const { Readable } = require('stream');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/interpret', async (req, res) => {
  const key = process.env.OPENAI_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: 'OPENAI_KEY environment variable is not set.' } });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ ...req.body, stream: true })
    });

    if (!upstream.ok) {
      const err = await upstream.json();
      return res.status(upstream.status).json(err);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
