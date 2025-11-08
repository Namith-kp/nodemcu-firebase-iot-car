# Environment Variables Setup

This project uses `.env` files to securely store credentials. Follow these steps to set up your environment variables.

## Step 1: Create .env File

1. In the `server/` directory, create a new file named `.env`
2. Copy the template below and fill in your actual values

## Step 2: Environment Variables Template

Create `server/.env` with the following content:

```env
# Firebase Configuration
# Copy this file to .env and fill in your actual values

# Firebase Service Account (for server-side Admin SDK)
# Option 1: Use service account JSON file path
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-config.json

# Option 2: Use individual service account credentials (alternative to JSON file)
# Uncomment and fill these if you prefer not to use a JSON file:
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY_ID=your-private-key-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
# FIREBASE_CLIENT_ID=your-client-id

# Firebase Database URL (optional, will be auto-generated if not provided)
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/

# Server Configuration
PORT=8080

# Client-side Firebase Config (for web interface)
# These will be served to the client via /api/config endpoint
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_DATABASE_URL_CLIENT=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID_CLIENT=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```

## Step 3: Get Your Firebase Credentials

### For Server (FIREBASE_SERVICE_ACCOUNT_PATH)

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Save it as `firebase-config.json` in the `server/` directory
5. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-config.json` in `.env`

### For Client (Firebase Web Config)

1. Go to Firebase Console > Project Settings > General
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (nickname: "Car Control")
5. Copy the config values and paste them into `.env`:

```env
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_DATABASE_URL_CLIENT=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID_CLIENT=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 4: Verify Setup

1. Make sure `.env` file is in the `server/` directory
2. Make sure `firebase-config.json` exists (if using FIREBASE_SERVICE_ACCOUNT_PATH)
3. Start the server: `npm start`
4. Check the console for "Firebase Admin SDK initialized successfully"
5. Open `http://localhost:8080` and check browser console for Firebase connection

## Security Notes

- ✅ `.env` is already in `.gitignore` - your credentials won't be committed
- ✅ Never commit `.env` files to version control
- ✅ Never share your Firebase credentials publicly
- ✅ For production, use environment variables provided by your hosting platform

## Troubleshooting

### "Firebase not initialized" error
- Check that `.env` file exists in `server/` directory
- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` points to a valid JSON file
- Or verify all individual Firebase credentials are set correctly

### "Firebase configuration incomplete" error
- Check that all `FIREBASE_*_CLIENT` variables are set in `.env`
- Make sure values don't contain "YOUR_" placeholder text
- Restart the server after updating `.env`

### Client can't connect
- Check browser console for errors
- Verify `/api/config` endpoint returns valid config (visit `http://localhost:8080/api/config`)
- Make sure all client-side Firebase variables are set correctly

