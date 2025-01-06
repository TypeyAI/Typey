require('dotenv').config();
const express = require('express');
const { TwitterApi, TwitterApiV2Settings, EUploadMimeType } = require('twitter-api-v2');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types')
const axios = require('axios')
const FormData = require('form-data');
const fileType = require('file-type');
const sharp = require('sharp');
const nodeCron = require('node-cron');
const { error } = require('console');
const cloudinary = require('./cloudinaryConfig'); 
const multer = require('multer');
const bcrypt  =require('bcrypt');




// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });



// Define storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Save files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Create a unique file name
  },
});

// Create multer upload instance for handling multiple fields (profilePicture and backgroundPicture)
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extName = allowedFileTypes.test(path.extname(file.originalname).toLowerCase()); // Check file extension
    const mimeType = allowedFileTypes.test(file.mimetype); // Check MIME type
    if (extName && mimeType) {
      return cb(null, true); // Accept the file
    } else {
      cb(new Error('Only .jpeg, .jpg, and .png formats are allowed!')); // Reject the file
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST','PUT'],
}));
app.use(express.urlencoded({ extended: true }))
TwitterApiV2Settings.deprecationWarnings = false;

// MongoDB Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  botApiKey: { type: String, required: true },
  botApiSecret: { type: String, required: true },
  botAccessToken: { type: String, required: true },
  botAccessSecret: { type: String, required: true },
  description: { type: String, required: true },
  profilePicture: { type: String },
  backgroundPicture: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const botLoginSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const BotLogin = mongoose.model('BotLogin', botLoginSchema);


const agentSchema = new mongoose.Schema({
  twitterId: { type: String,  unique: true }, 
  solanaAddress : { type: String},
  username: { type: String }, // Username of the user
  personality:{ type: String },
  bio: { type: String }, // User's bio
  followers: { type: Number }, // Number of followers
  following: { type: Number }, // Number of people the user is following
  tweetCount: { type: Number }, 
  profilePic: { type: String }, 
}, { timestamps: true });

const Agent = mongoose.model('Agent', agentSchema);




// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));



// Initialize Twitter client
const initializeTwitterClient = (apiKey, apiSecret, botAccessToken, botAccessSecret) => {
  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: botAccessToken,
    accessSecret: botAccessSecret,
  });
};

// Helper function to generate a tweet based on a description
const generateTweet = async (description) => {
  try {
    const result = await model.generateContent(
      `Based on the following description, create a short related, engaging tweet make sure to do not repeat the same tweet generation (maximum 180 characters), make sure it doesn't have any hashtags:\n\n${description}`
    );

    console.log('Gemini response:', result);

    if (
      result &&
      result.response &&
      result.response.candidates &&
      result.response.candidates.length > 0 &&
      result.response.candidates[0].content &&
      result.response.candidates[0].content.parts &&
      result.response.candidates[0].content.parts[0] &&
      result.response.candidates[0].content.parts[0].text
    ) {
      let tweetContent = result.response.candidates[0].content.parts[0].text;

      // Remove any formatting or extra headers
      tweetContent = tweetContent.replace(/^\*\*.*?\*\*:|^\>.*$/gm, '').trim();

      // Ensure the tweet content is no longer than 140 characters
      if (tweetContent.length > 140) {
        tweetContent = tweetContent.substring(0, 140); // Truncate to 140 characters
        console.log('Tweet content truncated to 140 characters:', tweetContent);
      }

      return tweetContent;
    } else {
      throw new Error('No text found in Gemini API response.');
    }
  } catch (error) {
    console.error('Error generating tweet:', error.message);
    throw new Error('Failed to generate tweet.');
  }
};

// Helper function to handle retries with improved error handling
const performWithRetries = async (operation, retries = 3, delay = 2000) => {
  while (retries > 0) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 500) {
        console.log('Internal error from Twitter, retrying...');
        retries--;
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      } else {
        throw error;
      }
    }
  }
  throw new Error('Operation failed after multiple retries.');
};

// Function to post a tweet using Twitter API v2
const postTweetV2 = async (tweetContent, twitterClient) => {
  return performWithRetries(async () => {
    const response = await twitterClient.v2.tweet({
      text: tweetContent,
    });
    console.log('Tweet posted successfully:', response.data.id);
    return response;
  });
};




// Register Agent
app.post('/register-agent', upload.single('profilePic'), async (req, res) => {
  const { twitterId, solanaAddress, username, bio, personality, followers, following, tweetCount, password } = req.body;
  const file = req.file;

  try {
    // Check if user already exists
    const existingUser = await Agent.findOne({ twitterId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePicUrl = null;

    if (file) {
      // Resize and compress the image using Sharp
      const resizedImagePath = `${file.path}-resized.jpg`;
      await sharp(file.path)
        .resize({ width: 400, height: 400 }) // Resize to 400x400 pixels
        .jpeg({ quality: 80 }) // Compress to 80% quality
        .toFile(resizedImagePath);

      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(resizedImagePath, {
        folder: 'agent-profile-pictures', // Folder in Cloudinary
        public_id: `profile-pic-${Date.now()}`, // Custom file name
        resource_type: 'image', // Specify it's an image
      });

      profilePicUrl = uploadResponse.secure_url;

      // Clean up the resized image file
      fs.unlinkSync(resizedImagePath);
    }

    // Create a new agent
    const newAgent = new Agent({
      twitterId,
      solanaAddress,
      username,
      bio,
      personality,
      followers,
      following,
      tweetCount,
      profilePic: profilePicUrl,
      password: hashedPassword,
    });

    await newAgent.save();

    res.status(201).json({ message: "Agent registered successfully", agent: newAgent });
  } catch (error) {
    console.error("Error registering agent:", error);

    // Clean up any uploaded or processed files if an error occurs
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(500).json({ message: "Internal Server Error", details: error.message });
  }
});


// Get All Agents
app.get('/agents', async (req, res) => {
  try {
    const agents = await Agent.find();
    res.status(200).json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
});

// Register API
app.post('/api/twitter/register-bot', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username already exists
    const existingBot = await BotLogin.findOne({ username });
    if (existingBot) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create a new bot login user
    const newBot = new BotLogin({ username, password });
    await newBot.save();

    res.status(201).json({ message: 'Bot registered successfully', bot: newBot });
  } catch (error) {
    console.error('Error during bot registration:', error.message);
    res.status(500).json({ message: 'Error during bot registration', error: error.message });
  }
});


app.post('/api/twitter/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const bot = await BotLogin.findOne({ username, password });

    if (!bot) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful', bot });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
});

app.post('/api/twitter/register', upload.fields([ 
  { name: 'profilePicture', maxCount: 1 }, 
  { name: 'backgroundPicture', maxCount: 1 }, 
]), async (req, res) => {
  const { name, username, botApiKey, botApiSecret, botAccessToken, botAccessSecret, description } = req.body;


  
  try {
    // Check if files are uploaded
    const profilePicture = req.files.profilePicture ? req.files.profilePicture[0] : null;
    const backgroundPicture = req.files.backgroundPicture ? req.files.backgroundPicture[0] : null;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bot already exists' });
    }

    // Upload profile picture to Cloudinary (if available)
    let profilePictureUrl = null;
    if (profilePicture) {
      const profileUploadResponse = await cloudinary.uploader.upload(profilePicture.path, {
        folder: 'twitter-bots', // Optional folder in Cloudinary
        public_id: `profile-${username}`, // Optional custom file name
        resource_type: 'image',
      });
      profilePictureUrl = profileUploadResponse.secure_url; // URL of the uploaded image
    }

    // Upload background picture to Cloudinary (if available)
    let backgroundPictureUrl = null;
    if (backgroundPicture) {
      const backgroundUploadResponse = await cloudinary.uploader.upload(backgroundPicture.path, {
        folder: 'twitter-bots',
        public_id: `background-${username}`,
        resource_type: 'image',
      });
      backgroundPictureUrl = backgroundUploadResponse.secure_url;
    }

    // Create a new user (bot)
    const newUser = new User({
      name,
      username,
      botApiKey,
      botApiSecret,
      botAccessToken,
      botAccessSecret,
      description,
      profilePicture: profilePictureUrl, // Store Cloudinary URL
      backgroundPicture: backgroundPictureUrl, // Store Cloudinary URL
    });

    const savedUser = await newUser.save();

    // Generate the first tweet
    const tweetContent = await generateTweet(description);

    // Initialize the Twitter client for this bot
    const twitterClient = initializeTwitterClient(botApiKey, botApiSecret, botAccessToken, botAccessSecret);
    const client = twitterClient.readWrite;

    // Post the first tweet using Twitter API v2
    const tweetResponse = await postTweetV2(tweetContent, client);

    res.status(200).json({
      message: 'Bot registered and first tweet posted successfully!',
      tweet: tweetContent,
      twitterResponse: tweetResponse,
    });

    // After the first tweet, start automatic tweeting every 10 minutes
    startAutomaticTweets(savedUser);

  } catch (error) {
    console.error('Error registering bot:', error.message);
    res.status(500).json({ message: 'Error registering bot', error: error.message });
  }
});

// Function to post tweet every 10 minutes
async function startAutomaticTweets(user) {
  nodeCron.schedule('*/10 * * * *', async () => {
    try {
      // Generate a new tweet based on the bot's description
      const tweetContent = await generateTweet(user.description);

      // Initialize the Twitter client
      const twitterClient = initializeTwitterClient(user.botApiKey, user.botApiSecret, user.botAccessToken, user.botAccessSecret);
      const client = twitterClient.readWrite;

      // Post the tweet using Twitter API v2
      await postTweetV2(tweetContent, client);
      console.log(`Automated tweet posted for ${user.username}: ${tweetContent}`);
    } catch (error) {
      console.error('Error posting automated tweet:', error.message);
    }
  });
}
// auto tweet api
nodeCron.schedule('*/10 * * * *', async () => {
  console.log('Starting automatic tweets for all users...');

  try {
    // Fetch all users from the database
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    // Iterate through each user and post a tweet
    for (const user of users) {
      try {
        // Initialize the Twitter client for the current user
        const twitterClient = initializeTwitterClient(
          user.botApiKey,
          user.botApiSecret,
          user.botAccessToken,
          user.botAccessSecret
        );

        // Generate a tweet based on the user's description
        const tweetContent = await generateTweet(user.description);

        // Post the tweet
        await postTweetV2(tweetContent, twitterClient.readWrite);
        console.log(`Tweet posted successfully for user: ${user.username}`);
      } catch (userError) {
        console.error(`Error posting tweet for user ${user.username}:`, userError.message);
      }
    }
  } catch (error) {
    console.error('Error fetching users or posting tweets:', error.message);
  }
});
// const image = require('./uploads')
app.put('/api/twitter/update-profile/:id', async (req, res) => {
  const userId = req.params.id
  const {  newName, newDescription } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    // Initialize Twitter client
    const twitterClient = initializeTwitterClient(
      user.botApiKey,
      user.botApiSecret,
      user.botAccessToken,
      user.botAccessSecret
    );
    const client = twitterClient.readWrite;    

    // Update profile on Twitter
    await client.v1.updateAccountProfile({
      name: newName,
      description: newDescription,
    });

    // Update profile in the database
    user.description = newDescription;
    user.name = newName
    await user.save();

    res.status(200).json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});


// Update profile picture
app.post('/api/twitter/update-profile-picture/:id', upload.single('profilePicture'), async (req, res) => {
  const userId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // Fetch user credentials from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Resize and compress the image using Sharp
    const resizedImagePath = `${file.path}-resized.jpg`; // Temporary path for the resized image
    await sharp(file.path)
      .resize({ width: 400, height: 400 }) // Resize to a max of 400x400 pixels
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toFile(resizedImagePath);

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(resizedImagePath, {
      folder: 'twitter-bots', // Optional folder in Cloudinary
      public_id: `profile-picture-${userId}`, // Optional custom file name
      resource_type: 'image', // Specify it's an image
    });

    // Update the user's profile picture URL in the database
    user.profilePicture = uploadResponse.secure_url;
    await user.save();

    // Initialize TwitterApi with user credentials
    const twitterClient = new TwitterApi({
      appKey: user.botApiKey,
      appSecret: user.botApiSecret,
      accessToken: user.botAccessToken,
      accessSecret: user.botAccessSecret,
    });

    // Read the image from Cloudinary's URL
    const mediaData = fs.readFileSync(resizedImagePath);

    // Update the profile picture on Twitter
    const response = await twitterClient.v1.updateAccountProfileImage(mediaData);

    // Clean up the local resized image
    fs.unlinkSync(resizedImagePath);

    res.json({ message: 'Profile picture updated successfully!', response });
  } catch (error) {
    console.error('Error updating profile image:', error);

    // Clean up any uploaded or processed files if an error occurs
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    if (fs.existsSync(`${file.path}-resized.jpg`)) {
      fs.unlinkSync(`${file.path}-resized.jpg`);
    }

    res.status(500).json({ error: 'Failed to update profile picture.', details: error.message });
  }
});


// Update background image (banner)
app.post('/api/twitter/update-banner/:id', upload.single('backgroundPicture'), async (req, res) => {
  const userId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // Fetch user credentials from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Resize and compress the banner image using Sharp
    const resizedBannerPath = `${file.path}-resized.jpg`; // Temporary path for the resized banner
    await sharp(file.path)
      .resize({ width: 1500, height: 500, fit: 'cover' }) // Twitter recommends 1500x500 pixels for banners
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toFile(resizedBannerPath);

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(resizedBannerPath, {
      folder: 'twitter-bots', // Optional folder in Cloudinary
      public_id: `background-picture-${userId}`, // Optional custom file name
      resource_type: 'image', // Specify it's an image
    });

    // Update the user's background picture URL in the database
    user.backgroundPicture = uploadResponse.secure_url;
    await user.save();

    // Initialize TwitterApi with user credentials
    const twitterClient = new TwitterApi({
      appKey: user.botApiKey,
      appSecret: user.botApiSecret,
      accessToken: user.botAccessToken,
      accessSecret: user.botAccessSecret,
    });

    // Read the resized banner image
    const mediaData = fs.readFileSync(resizedBannerPath);

    // Update the banner image on Twitter
    const response = await twitterClient.v1.updateAccountProfileBanner(mediaData);

    // Clean up the local resized image
    fs.unlinkSync(resizedBannerPath);

    res.json({ message: 'Banner image updated successfully!', response });
  } catch (error) {
    console.error('Error updating banner image:', error);

    // Clean up any uploaded or processed files if an error occurs
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    if (fs.existsSync(`${file.path}-resized.jpg`)) {
      fs.unlinkSync(`${file.path}-resized.jpg`);
    }

    res.status(500).json({ error: 'Failed to update banner image.', details: error.message });
  }
});

app.get('/api/twitter/getAgents' , async (req,res) => {
try{
const agents = await User.find()
res.status(200).json({message:'agentest reterive sucessfully', data: agents})
}catch (error){
  console.log(error);
  
  res.status(500).json({error: 'internal server error',})
}



})

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

