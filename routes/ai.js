const express = require('express');
const OpenAI = require('openai'); // Correct OpenAI import
const Analysis = require('../models/analysisModel');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure the environment variable is set
});

// Generate AI response
router.post('/ask', async (req, res) => {
    const { twitterId, question } = req.body;

    try {
        // Fetch Twitter analysis data from MongoDB
        const analysis = await Analysis.findOne({ twitterId });
        if (!analysis) {
            return res.status(404).json({ error: 'No analysis found.' });
        }

        // Create prompt with latest Twitter data
        const prompt = `
            Based on the following Twitter data, answer the user's question:
            Latest Tweets: ${analysis.latestTweets.join(', ')}
            Question: ${question}
        `;

        // OpenAI Chat Completion API Call
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Use 'gpt-4' if you have access
            messages: [{ role: 'user', content: prompt }],
        });

        // Send back the AI response
        res.json({ answer: response.choices[0].message.content });
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'Failed to generate AI response.' });
    }
});

module.exports = router;
