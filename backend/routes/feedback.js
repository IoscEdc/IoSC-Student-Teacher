const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/analyze', async (req, res) => {
  const { feedbackText } = req.body;

  if (!feedbackText) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a sentiment analyzer. Classify feedback as Positive, Neutral, or Negative." },
          { role: "user", content: `Feedback: "${feedbackText}"` }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiReply = response.data.choices[0].message.content.trim();

    res.json({ sentiment: aiReply });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to analyze feedback' });
  }
});

module.exports = router;
