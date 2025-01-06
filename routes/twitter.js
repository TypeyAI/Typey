const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const User = require('../models/userModel');
const Analysis = require('../models/analysisModel');

const router = express.Router();
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Fetch Twitter user data
router.post('/fetch', async (req, res) => {
    const { username } = req.body;

    try {
        // Fetch user details
        const userResponse = await twitterClient.v2.userByUsername(username, {
            "user.fields": "description,public_metrics,profile_image_url",
        });

        const userData = userResponse.data;

        // Save user in database
        let user = await User.findOne({ twitterId: userData.id });
        if (!user) {
            user = await User.create({
                twitterId: userData.id,
                username: userData.username,
                bio: userData.description,
                followers: userData.public_metrics.followers_count,
                following: userData.public_metrics.following_count,
                tweetCount: userData.public_metrics.tweet_count,
                profilePic: userData.profile_image_url,
            });
        }

        // Fetch recent tweets
        const tweetsResponse = await twitterClient.v2.userTimeline(userData.id, {
            max_results: 5,
            "tweet.fields": "text,created_at",
        });

        const tweets = tweetsResponse.data.map(tweet => tweet.text);

        // Save analysis
        await Analysis.updateOne(
            { twitterId: userData.id },
            { latestTweets: tweets },
            { upsert: true }
        );

        res.json({ user, tweets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch Twitter data.' });
    }
});

module.exports = router;
    