// const express = require("express");
// const bodyParser = require("body-parser");
// const Twitter = require("twitter-lite");
// const axios = require("axios");
// const schedule = require("node-schedule");
// require("dotenv").config();

// const app = express();
// const PORT = 5000;

// // Middleware
// app.use(bodyParser.json());

// // Twitter Client
// const twitterClient = new Twitter({
//   consumer_key: process.env.TWITTER_API_KEY,
//   consumer_secret: process.env.TWITTER_API_SECRET,
//   access_token_key: process.env.TWITTER_ACCESS_TOKEN,
//   access_token_secret: process.env.TWITTER_ACCESS_SECRET,
// });

// // Route: Create Bot
// app.post("/create-bot", async (req, res) => {
//   const { agentName, description, walletAddress, personalityStyle } = req.body;

//   if (!agentName || !description || !walletAddress || !personalityStyle) {
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   try {
//     // Update Twitter profile
//     await twitterClient.post("account/update_profile", {
//       name: agentName,
//       description: `${description}\nAutomated by: ${walletAddress}`,
//     });

//     // Schedule daily tweets
//     schedule.scheduleJob(`${agentName}-daily-tweet`, "0 12 * * *", async () => {
//       try {
//         // Generate a tweet using OpenAI API
//         const openAIResponse = await axios.post(
//           "https://api.openai.com/v1/completions",
//           {
//             model: "text-davinci-003",
//             prompt: `Analyze the following personality and generate a creative tweet:\n\nDescription: ${description}\nPersonality Style: ${personalityStyle}`,
//             max_tokens: 100,
//           },
//           {
//             headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
//           }
//         );

//         const tweet = openAIResponse.data.choices[0].text.trim();
//         await twitterClient.post("statuses/update", { status: tweet });
//         console.log(`Tweet posted for ${agentName}: ${tweet}`);
//       } catch (error) {
//         console.error(`Error posting tweet for ${agentName}:`, error.message);
//       }
//     });

//     res.json({ message: "Twitter bot created and daily tweets scheduled!" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


/* Niks bot2 clinet id= RHhTOGY5blZQYmZrdFRrRHQ3WW86MTpjaQ

niks bot 2 clint secret = N4XEibSZ21FceLcko5xB_Z8IAGRyqvnqNY2bccqu8gJFrmOOJm

niks bot 2 api key = N4XEibSZ21FceLcko5xB_Z8IAGRyqvnqNY2bccqu8gJFrmOOJm

niks bot 2 api key secret = tJL3gsfVPNOnDlv2yUaaFzzW9yFBBmEplYnP5GUxr9UqUGcM5k

niks bot 2 Bear token = AAAAAAAAAAAAAAAAAAAAACGgxgEAAAAAGWXWLCqS7WRXr%2BDovmqMaa270XE%3DH2YEuO8TF38xXMUx5Tgm4Mwe9eYH6frbXJZs0wkAEd1KLKMGyj

niks bot 2 access token = 1870022405114236928-Cc97Ii1xpOLFbLdKbkAEBoi3sKdAkD

niks bot 2 token secret = lkJwVzZv6qnaYlEfNS1G95uZnoY3gFEAcP76WWbq3mDST */







// require('dotenv').config();
// const express = require('express');
// const { TwitterApi } = require('twitter-api-v2');
// const cors = require('cors');

// const app = express();
// app.use(express.json());
// app.use(cors());

// // Initialize the Twitter client
// const client = new TwitterApi({
//   appKey: process.env.TWITTER_API_KEY,
//   appSecret: process.env.TWITTER_API_SECRET,
//   accessToken: process.env.TWITTER_ACCESS_TOKEN,
//   accessSecret: process.env.TWITTER_ACCESS_SECRET,
// });

// // Helper function to handle retries
// const performWithRetries = async (operation, retries = 3, delay = 2000) => {
//   while (retries > 0) {
//     try {
//       return await operation();
//     } catch (error) {
//       if (error.code === 500 && error.data?.errors?.[0]?.code === 131) {
//         console.log('Internal error from Twitter, retrying...');
//         retries--;
//         await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
//       } else {
//         throw error; // Non-retryable error
//       }
//     }
//   }
//   throw new Error('Operation failed after multiple retries.');
// };

// // Function to update display name
// const updateDisplayName = async (newName) => {
//   return performWithRetries(async () => {
//     const response = await client.v1.post('account/update_profile.json', { name: newName });
//     console.log('Display name updated successfully:', response.name);
//     return response;
//   });
// };

// // Function to update username
// const updateUsername = async (newUsername) => {
//   return performWithRetries(async () => {
//     const response = await client.v1.post('account/update_profile.json', { screen_name: newUsername });
//     console.log('Username updated successfully:', response.screen_name);
//     return response;
//   });
// };

// // Route to update display name
// app.post('/api/twitter/update-display-name', async (req, res) => {
//   const { newName } = req.body;
//   try {
//     const response = await updateDisplayName(newName);
//     res.status(200).json({ message: 'Display name updated successfully!', data: response });
//   } catch (error) {
//     console.log(error,"error for name");
    
//     res.status(500).json({ message: 'Error updating display name', error: error.message });
//   }
// });

// // Route to update username
// app.post('/api/twitter/update-username', async (req, res) => {
//   const { newUsername } = req.body;
//   try {
//     const response = await updateUsername(newUsername);
//     res.status(200).json({ message: 'Username updated successfully!', data: response });
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating username', error: error.message });
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));




// Load environment variables from .env file  
// require('dotenv').config();
// const express = require('express');
// const { TwitterApi } = require('twitter-api-v2');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // Initialize Google Generative AI client
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// // Initialize Express app
// const app = express();
// app.use(express.json());
// app.use(cors());

// // MongoDB Schema and Model
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   botApiKey: { type: String, required: true },
//   botApiSecret: { type: String, required: true },
//   botAccessToken: { type: String, required: true },
//   botAccessSecret: { type: String, required: true },
//   description: { type: String, required: true },
// });

// const User = mongoose.model('User', userSchema);

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('MongoDB Connected'))
//   .catch((err) => console.error('MongoDB Connection Error:', err));

// // Helper function to initialize a Twitter client
// const initializeTwitterClient = (apiKey, apiSecret, botAccessToken, botAccessSecret) => {
//   return new TwitterApi({
//     appKey: apiKey,
//     appSecret: apiSecret,
//     accessToken: botAccessToken,
//     accessSecret: botAccessSecret,
//   });
// };

// // Helper function to generate a tweet based on a description
// const generateTweet = async (description) => {
//   try {
//     const result = await model.generateContent(
//       `Based on the following description, create a short, engaging tweet (maximum 140 characters):\n\n${description}`
//     );

//     console.log('Gemini response:', result);

//     if (
//       result &&
//       result.response &&
//       result.response.candidates &&
//       result.response.candidates.length > 0 &&
//       result.response.candidates[0].content &&
//       result.response.candidates[0].content.parts &&
//       result.response.candidates[0].content.parts[0] &&
//       result.response.candidates[0].content.parts[0].text
//     ) {
//       let tweetContent = result.response.candidates[0].content.parts[0].text;

//       // Remove any formatting or extra headers
//       tweetContent = tweetContent.replace(/^\*\*.*?\*\*:|^\>.*$/gm, '').trim();

//       // Ensure the tweet content is no longer than 140 characters
//       if (tweetContent.length > 140) {
//         tweetContent = tweetContent.substring(0, 140); // Truncate to 140 characters
//         console.log('Tweet content truncated to 140 characters:', tweetContent);
//       }

//       return tweetContent;
//     } else {
//       throw new Error('No text found in Gemini API response.');
//     }
//   } catch (error) {
//     console.error('Error generating tweet:', error.message);
//     throw new Error('Failed to generate tweet.');
//   }
// };

// // Helper function to handle retries with improved error handling
// const performWithRetries = async (operation, retries = 3, delay = 2000) => {
//   while (retries > 0) {
//     try {
//       return await operation();
//     } catch (error) {
//       if (error.code === 500 && error.data?.errors?.[0]?.code === 131) {
//         console.log('Internal error from Twitter, retrying...');
//         retries--;
//         await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
//       } else if (error.code === 403 && error.data?.errors?.[0]?.message === 'Username is unavailable.') {
//         console.error('Username unavailable, consider a different username.');
//         throw error; // Don't retry for unavailable usernames
//       } else {
//         console.error('Non-retryable Twitter error:', error.message, error.data);
//         throw error; // Non-retryable error
//       }
//     }
//   }
//   throw new Error('Operation failed after multiple retries.');
// };

// // Function to post a tweet using Twitter API v2
// const postTweetV2 = async (tweetContent, twitterClient) => {
//   return performWithRetries(async () => {
//     const response = await twitterClient.v2.tweet({
//       text: tweetContent,
//     });
//     console.log('Tweet posted successfully:', response.data.id);
//     return response;
//   });
// };

// // Route to register a Twitter bot
// app.post('/api/twitter/register', async (req, res) => {
//   const { username, botApiKey, botApiSecret, botAccessToken, botAccessSecret, description } = req.body;

//   try {
//     const newUser = new User({ username, botApiKey, botApiSecret, botAccessToken, botAccessSecret, description });
//     const savedUser = await newUser.save();
//     res.status(201).json({ message: 'Bot registered successfully!', user: savedUser });
//   } catch (error) {
//     console.error('Error registering bot:', error.message);
//     res.status(500).json({ message: 'Error registering bot', error: error.message });
//   }
// });

// // Route to generate and post a tweet
// app.post('/api/twitter/tweet', async (req, res) => {
//   const { username } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ message: 'Bot not found' });
//     }

//     // Generate the tweet
//     const tweetContent = await generateTweet(user.description);

//     // Initialize the Twitter client for this bot
//     const twitterClient = initializeTwitterClient(user.botApiKey, user.botApiSecret, user.botAccessToken, user.botAccessSecret);
//     const client = twitterClient.readWrite;

//     // Post the tweet using Twitter API v2
//     const tweetResponse = await postTweetV2(tweetContent, client);

//     res.status(200).json({ message: 'Tweet generated and posted successfully!', tweet: tweetContent, twitterResponse: tweetResponse });
//   } catch (error) {
//     console.error('Error posting tweet:', error.message);
//     res.status(500).json({ message: 'Error generating or posting tweet', error: error.message });
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



// Helper function to initialize a Twitter client
// const initializeTwitterClient = (apiKey, apiSecret, botAccessToken, botAccessSecret) => {
//   return new TwitterApi({
//     appKey: apiKey,
//     appSecret: apiSecret,
//     accessToken: botAccessToken,
//     accessSecret: botAccessSecret,
//   });
// };

// // Helper function to generate a tweet based on a description
// const generateTweet = async (description) => {
//     try {
//       const result = await model.generateContent(
//         `Based on the following description, create a short, engaging tweet (maximum 140 characters):\n\n${description}`
//       );

//       console.log('Gemini response:', result);

//       if (
//         result &&
//         result.response &&
//         result.response.candidates &&
//         result.response.candidates.length > 0 &&
//         result.response.candidates[0].content &&
//         result.response.candidates[0].content.parts &&
//         result.response.candidates[0].content.parts[0] &&
//         result.response.candidates[0].content.parts[0].text
//       ) {
//         let tweetContent = result.response.candidates[0].content.parts[0].text;

//         // Remove any formatting or extra headers
//         tweetContent = tweetContent.replace(/^\*\*.*?\*\*:|^\>.*$/gm, '').trim();

//         // Ensure the tweet content is no longer than 140 characters
//         if (tweetContent.length > 140) {
//           tweetContent = tweetContent.substring(0, 140); // Truncate to 140 characters
//           console.log('Tweet content truncated to 140 characters:', tweetContent);
//         }

//         return tweetContent;
//       } else {
//         throw new Error('No text found in Gemini API response.');
//       }
//     } catch (error) {
//       console.error('Error generating tweet:', error.message);
//       throw new Error('Failed to generate tweet.');
//     }
//   };

// // Helper function to handle retries with improved error handling
// const performWithRetries = async (operation, retries = 3, delay = 2000) => {
//   while (retries > 0) {
//     try {
//       return await operation();
//     } catch (error) {
//       if (error.code === 500) {
//         console.log('Internal error from Twitter, retrying...');
//         retries--;
//         await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
//       } else {
//         throw error;
//       }
//     }
//   }
//   throw new Error('Operation failed after multiple retries.');
// };

// // Function to post a tweet using Twitter API v2
// const postTweetV2 = async (tweetContent, twitterClient) => {
//   return performWithRetries(async () => {
//     const response = await twitterClient.v2.tweet({
//       text: tweetContent,
//     });
//     console.log('Tweet posted successfully:', response.data.id);
//     return response;
//   });
// };
// // Route to generate and post a tweet
// app.post('/api/twitter/tweet', async (req, res) => {
//   const { username } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ message: 'Bot not found' });
//     }

//     // Generate the tweet
//     const tweetContent = await generateTweet(user.description);

//     // Initialize the Twitter client for this bot
//     const twitterClient = initializeTwitterClient(user.botApiKey, user.botApiSecret, user.botAccessToken, user.botAccessSecret);
//     const client = twitterClient.readWrite;

//     // Post the tweet using Twitter API v2
//     const tweetResponse = await postTweetV2(tweetContent, client);

//     res.status(200).json({ message: 'Tweet generated and posted successfully!', tweet: tweetContent, twitterResponse: tweetResponse });
//   } catch (error) {
//     console.error('Error posting tweet:', error.message);
//     res.status(500).json({ message: 'Error generating or posting tweet', error: error.message });
//   }
// });

// Route to register a Twitter bot
// app.post(
//   '/api/twitter/register',
//   upload.fields([
//     { name: 'profilePicture', maxCount: 1 },
//     { name: 'backgroundPicture', maxCount: 1 },
//   ]),
//   async (req, res) => {
//     const { name, username, botApiKey, botApiSecret, botAccessToken, botAccessSecret, description } = req.body;

//     // Validate required fields
//     if (!name || !username || !botApiKey || !botApiSecret || !botAccessToken || !botAccessSecret) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     try {
//       // Check if files are uploaded
//       const profilePicture = req.files.profilePicture ? req.files.profilePicture[0] : null;
//       const backgroundPicture = req.files.backgroundPicture ? req.files.backgroundPicture[0] : null;

//       // Create a new user
//       const newUser = new User({
//         name,
//         username,
//         botApiKey,
//         botApiSecret,
//         botAccessToken,
//         botAccessSecret,
//         description,
//         profilePicture: profilePicture ? `/uploads/${profilePicture.filename}` : null,
//         backgroundPicture: backgroundPicture ? `/uploads/${backgroundPicture.filename}` : null,
//       });

//       // Save user to the database
//       const savedUser = await newUser.save();
//       res.status(201).json({ message: 'Bot registered successfully!', user: savedUser });

//     } catch (error) {
//       console.error('Error registering bot:', error.message);
//       res.status(500).json({ message: 'Error registering bot', error: error.message });

//       // Cleanup uploaded files on error if they exist
//       if (req.files) {
//         if (req.files.profilePicture) {
//           try {
//             fs.unlinkSync(req.files.profilePicture[0].path);
//           } catch (deleteError) {
//             console.error('Error deleting profile picture:', deleteError.message);
//           }
//         }
//         if (req.files.backgroundPicture) {
//           try {
//             fs.unlinkSync(req.files.backgroundPicture[0].path);
//           } catch (deleteError) {
//             console.error('Error deleting background picture:', deleteError.message);
//           }
//         }
//       }
//     }
//   }
// );
