require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS for web client
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  let serviceAccount;
  
  // Option 1: Use service account file path from .env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      throw new Error(`Service account file not found: ${serviceAccountPath}`);
    }
  }
  // Option 2: Use individual credentials from .env
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
    };
  } else {
    throw new Error('Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or individual credentials in .env');
  }
  
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 
    `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`;
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
  });
  
  firebaseInitialized = true;
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('\nPlease configure Firebase credentials in .env file:');
  console.error('1. Copy .env.example to .env');
  console.error('2. Set FIREBASE_SERVICE_ACCOUNT_PATH or individual credentials');
  console.error('3. Or download service account key from Firebase Console');
}

// Get Firebase Realtime Database reference
const db = firebaseInitialized ? admin.database() : null;
const commandsRef = db ? db.ref('car/commands') : null;
const statusRef = db ? db.ref('car/status') : null;
const carStatusRef = db ? db.ref('car/carStatus') : null;

// Listen for commands from web clients
if (commandsRef) {
  commandsRef.on('value', (snapshot) => {
    const command = snapshot.val();
    if (command && command.timestamp) {
      console.log('Command received:', command);
      
      // Update car status to show command was received
      if (statusRef) {
        statusRef.set({
          lastCommand: command.command,
          lastSpeed: command.speed,
          timestamp: command.timestamp,
          source: 'web'
        });
      }
    }
  });
}

// Listen for status updates from NodeMCU
if (carStatusRef) {
  carStatusRef.on('value', (snapshot) => {
    const status = snapshot.val();
    if (status) {
      console.log('Car status update:', status);
    }
  });
}

// API endpoint to serve Firebase config to client
app.get('/api/config', (req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL_CLIENT,
    projectId: process.env.FIREBASE_PROJECT_ID_CLIENT,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  
  // Check if all required config values are set
  const missing = Object.entries(config)
    .filter(([key, value]) => !value || value.includes('YOUR_'))
    .map(([key]) => key);
  
  if (missing.length > 0) {
    return res.status(503).json({
      error: 'Firebase configuration incomplete',
      missing: missing,
      message: 'Please configure Firebase credentials in .env file'
    });
  }
  
  res.json(config);
});

// REST API endpoint for status
app.get('/api/status', (req, res) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      error: 'Firebase not initialized',
      message: 'Please configure Firebase credentials'
    });
  }
  
  res.json({
    firebase: 'connected',
    status: 'running',
    database: 'realtime'
  });
});

// REST API endpoint to send command (alternative to direct Firebase write)
app.post('/api/command', (req, res) => {
  if (!commandsRef) {
    return res.status(503).json({ error: 'Firebase not initialized' });
  }
  
  const { command, speed } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  commandsRef.set({
    command: command,
    speed: speed || null,
    timestamp: Date.now()
  });
  
  res.json({ success: true, command: command });
});

// Serve the web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Web interface: http://localhost:${PORT}`);
  console.log(`Using Firebase Realtime Database`);
  
  if (!firebaseInitialized) {
    console.warn('\n⚠️  WARNING: Firebase not initialized!');
    console.warn('Please configure Firebase:');
    console.warn('1. Copy .env.example to .env');
    console.warn('2. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
    console.warn('3. Or configure individual Firebase credentials');
  }
});
