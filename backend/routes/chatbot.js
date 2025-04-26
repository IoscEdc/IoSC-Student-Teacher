const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  const { message, role } = req.body;
  const systemPrompt = {
    admin: "You are an assistant for an Admin managing a school dashboard.",
    teacher: "You help teachers manage class, attendance and student performance.",
    student: "You assist students with assignments, attendance and studies."
  };

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt[role] || systemPrompt["student"] },
          { role: "user", content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
