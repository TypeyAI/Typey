const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    twitterId: { type: String, required: true, unique: true },
    username: String,
    bio: String,
    followers: Number,
    following: Number,
    tweetCount: Number,
    profilePic: String,
});

module.exports = mongoose.model('User', userSchema);
