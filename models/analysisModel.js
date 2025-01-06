const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    twitterId: { type: String, required: true },
    latestTweets: [String],
    sentimentAnalysis: String,
    frequentTopics: [String],
});

module.exports = mongoose.model('Analysis', analysisSchema);
