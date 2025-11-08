# 🚀Firebase IOT Car

A WiFi-enabled remote control car that you can control from anywhere in the world using a web browser! Built with NodeMCU (ESP8266), Firebase Realtime Database, and a beautiful web interface.

## 📖 What is This Project?

This project lets you build and control a remote car using:
- **NodeMCU (ESP8266)** - The brain of your car that connects to WiFi
- **Firebase Realtime Database** - Cloud service that connects your web browser to the car
- **Web Interface** - Control the car from any device (phone, tablet, computer) via browser
- **Motor Driver** - Controls the car's motors for movement

### Key Features:
- 🌐 **Control from anywhere** - Works over the internet, not just local WiFi
- 📱 **Mobile-friendly** - Beautiful interface that works on phones and tablets
- 🎮 **Multiple control methods** - Virtual joystick, D-pad buttons, or keyboard (WASD keys)
- ⚡ **Real-time response** - Instant commands using Firebase Realtime Database
- 🔧 **Adjustable speed** - Control how fast the car moves with a slider
- 🎨 **Modern UI** - Clean, dark-themed interface with smooth animations

### How It Works:
1. **NodeMCU connects to WiFi** and Firebase
2. **You open a web page** on any device
3. **You control the car** using the web interface
4. **Commands are sent** through Firebase to the car instantly
5. **The car responds** in real-time!

---

## 🧪Testing Preview
https://github.com/user-attachments/assets/5f5314f0-f3d4-407b-ab03-28e94e794272

# 📦Setup & Installation

This project uses Firebase Realtime Database for real-time communication.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard
4. Enable Google Analytics (optional)

## Step 2: Enable Realtime Database

1. In your Firebase project, go to **Build** > **Realtime Database**
2. Click **Create Database**
3. Choose a location (select closest to your users)
4. Start in **test mode** (we'll configure rules later)
5. Click **Enable**

## Step 3: Configure Database Rules

1. Go to **Realtime Database** > **Rules**
2. Update the rules to allow read/write (for development):

```json
{
  "rules": {
    "car": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ Security Note:** For production, implement proper authentication and restrict access.

## Step 4: Get Firebase Configuration

### For Web Client (app.js)

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (nickname: "Car Control")
5. Copy the `firebaseConfig` object
6. Paste it into `public/app.js` (replace the placeholder values)

### For Server (firebase-config.json)

1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. Rename it to `firebase-config.json`
5. Place it in the `server/` directory

**Important:** Add `firebase-config.json` to `.gitignore` to keep your credentials secure!

## Step 5: Setup Environment Variables

**This project now uses `.env` files for secure credential management!**

1. Go to `server/` directory
2. Create a `.env` file (copy from template below)
3. Fill in your Firebase credentials

See `server/ENV_SETUP.md` for detailed instructions.

### Quick Setup:

1. Create `server/.env` file with:

```env
# Firebase Service Account
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-config.json

# Server Port
PORT=8080

# Client-side Firebase Config
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_DATABASE_URL_CLIENT=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID_CLIENT=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```

2. The web client (`public/app.js`) now automatically loads config from `/api/config` endpoint
3. No need to manually edit `app.js` anymore!

### Update `nodemcu_car.ino`

1. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. Update Firebase configuration:
   ```cpp
   const char* firebaseHost = "YOUR_PROJECT_ID-default-rtdb.firebaseio.com";
   const char* firebaseAuth = "";  // Optional: Database secret (for test mode)
   ```

   To get your database URL:
   - Go to Realtime Database in Firebase Console
   - The URL is shown at the top (e.g., `https://your-project-default-rtdb.firebaseio.com/`)
   - Use only the hostname part (e.g., `your-project-default-rtdb.firebaseio.com`)

3. **Optional:** If you want to use authentication:
   - Go to **Project Settings** > **Service Accounts**
   - Click **Database Secrets** tab
   - Copy a secret (or create one)
   - Paste it in `firebaseAuth` variable

## Step 6: Install Dependencies

```bash
cd server
npm install
```

This will install `firebase-admin` and other dependencies.

## Step 7: Run the Project

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. Open your browser to `http://localhost:8080`

3. Upload the Arduino code to your NodeMCU

4. The car should now connect via Firebase!

## Database Structure

The Firebase Realtime Database will have this structure:

```
car/
├── commands/
│   ├── command: "forward" | "backward" | "left" | "right" | "stop" | ...
│   ├── speed: 0-1023
│   └── timestamp: 1234567890
├── status/
│   ├── lastCommand: "forward"
│   ├── lastSpeed: 512
│   ├── timestamp: 1234567890
│   └── source: "web" | "nodemcu"
└── carStatus/
    ├── status: "connected" | "disconnected"
    ├── online: true | false
    ├── timestamp: 1234567890
    └── ip: "192.168.1.100"
```

## Troubleshooting

### "Firebase not initialized" error
- Make sure `firebase-config.json` exists in the `server/` directory
- Verify the JSON file is valid and contains all required fields

### Web client can't connect
- Check that Firebase config in `app.js` is correct
- Verify database rules allow read/write
- Check browser console for errors

### NodeMCU can't connect to Firebase
- Verify WiFi credentials are correct
- Check that `firebaseHost` matches your database URL
- Ensure NodeMCU has internet connectivity
- Check Serial Monitor for error messages

### Commands not working
- Verify database rules allow write access
- Check that both web client and NodeMCU are using the same Firebase project
- Monitor Firebase Console > Realtime Database to see data flow

## Security Recommendations

For production use:

1. **Implement Authentication:**
   - Use Firebase Authentication
   - Restrict database access to authenticated users

2. **Update Database Rules:**
   ```json
   {
     "rules": {
       "car": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```

3. **Use Environment Variables:**
   - Store Firebase config in environment variables
   - Never commit credentials to version control

4. **Enable App Check:**
   - Protect your Firebase resources from abuse
   - Go to **Build** > **App Check** in Firebase Console

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Realtime Database Guide](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)

## 👤Authors
Namith KP

- GitHub: [Namith K P](https://github.com/Namith-kp)
- Project URL: [Firebase IOT Car](https://github.com/Namith-kp/nodemcu-firebase-iot-car/)

## License

- [MIT](https://github.com/Namith-kp/nodemcu-firebase-iot-car/blob/master/LICENSE)

