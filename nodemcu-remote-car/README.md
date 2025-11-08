# NodeMCU Remote Controlled Car

A modern, internet-controlled car using NodeMCU (ESP8266) with a beautiful web interface that works from anywhere in the world.

## Features

- 🌐 **Internet Control**: Control your car from anywhere via web browser
- 📱 **Mobile Friendly**: Responsive design works on phones, tablets, and desktops
- 🎮 **Multiple Control Methods**: 
  - Virtual joystick
  - D-pad buttons
  - Keyboard controls (WASD/Arrow keys)
- ⚡ **Real-time Communication**: Firebase Realtime Database for instant response
- 🎨 **Modern UI**: Beautiful, dark-themed interface with smooth animations
- 🔧 **Adjustable Speed**: Control motor speed with a slider

## Hardware Requirements

### Components Needed:
- NodeMCU (ESP8266) development board
- L298N Motor Driver Module (or similar)
- 2x DC Motors with wheels
- Chassis/frame for the car
- Battery pack (for motors, separate from NodeMCU power)
- Jumper wires
- Breadboard (optional)

### Wiring Diagram:

```
NodeMCU          L298N Motor Driver
------          -------------------
D1 (GPIO5)  -->  IN1
D2 (GPIO4)  -->  IN2
D5 (GPIO14) -->  IN3
D6 (GPIO12) -->  IN4
D7 (GPIO13) -->  ENA (PWM)
D8 (GPIO15) -->  ENB (PWM)
5V          -->  5V
GND         -->  GND

L298N Motor Driver:
- Connect motors to OUT1/OUT2 (left motor) and OUT3/OUT4 (right motor)
- Connect battery pack to motor driver power input
- Connect GND of battery to common GND
```

## Software Setup

### 1. Install Arduino IDE and Required Libraries

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP8266 board support:
   - Go to File → Preferences
   - Add to Additional Board Manager URLs: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
   - Go to Tools → Board → Boards Manager
   - Search for "ESP8266" and install
3. Install required libraries:
   - Go to Sketch → Include Library → Manage Libraries
   - Install:
     - **ArduinoJson** by Benoit Blanchon
     - **ESP8266HTTPClient** (usually included with ESP8266 board package)

### 2. Configure NodeMCU Firmware

1. Open `nodemcu_car.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update Firebase configuration:
   ```cpp
   const char* firebaseHost = "YOUR_PROJECT_ID-default-rtdb.firebaseio.com";
   const char* firebaseAuth = "";  // Optional: Database secret
   ```
   Get your Firebase database URL from Firebase Console > Realtime Database
4. Select board: Tools → Board → NodeMCU 1.0 (ESP-12E Module)
5. Select port: Tools → Port → (your COM port)
6. Upload the code to NodeMCU

### 3. Setup Firebase Realtime Database

**See `FIREBASE_SETUP.md` for detailed instructions.**

Quick setup:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database
3. Get your Firebase configuration:
   - **For web client**: Project Settings > General > Your apps > Web app config
   - **For server**: Project Settings > Service Accounts > Generate new private key
4. Update configuration files:
   - `public/app.js` - Add Firebase config
   - `server/firebase-config.json` - Add service account key
   - `nodemcu_car.ino` - Add Firebase host

### 4. Setup Backend Server

1. Install Node.js (v14 or higher)
2. Navigate to server directory:
   ```bash
   cd server
   npm install
   ```
3. Make sure `firebase-config.json` is in the server directory
4. Start the server:
   ```bash
   npm start
   ```
5. Open browser to `http://localhost:8080`

**Note:** With Firebase, you don't need to deploy a server for global access! The web interface and NodeMCU connect directly to Firebase, so it works from anywhere in the world.

### 5. Access the Web Interface

- **Local**: `http://localhost:8080` (when running local server)
- **Global**: Deploy the `public/` folder to any static hosting (Firebase Hosting, Netlify, GitHub Pages, etc.)
- The web interface connects directly to Firebase, so it works from anywhere!

## Usage

1. Power on your NodeMCU car
2. Wait for WiFi connection (check Serial Monitor)
3. Open the web interface
4. Wait for "Car is online" status
5. Control using:
   - **Joystick**: Click and drag
   - **D-pad**: Click buttons
   - **Keyboard**: WASD or Arrow keys
   - **Stop Button**: Emergency stop

## Troubleshooting

### NodeMCU won't connect to WiFi
- Check SSID and password are correct
- Ensure WiFi is 2.4GHz (ESP8266 doesn't support 5GHz)
- Check Serial Monitor for error messages

### Firebase connection fails
- Verify Firebase configuration is correct in all files
- Check database rules allow read/write access
- Ensure NodeMCU has internet connectivity
- Check Firebase Console > Realtime Database to see if data is being written
- Verify `firebaseHost` in NodeMCU code matches your database URL

### Motors not responding
- Check motor driver connections
- Verify power supply to motors
- Test motors directly with battery
- Check pin assignments match your wiring

### Car disconnects frequently
- Check WiFi signal strength
- Ensure stable power supply
- Add capacitor to power lines if needed

## Customization

### Change Motor Speed Range
Edit in `nodemcu_car.ino`:
```cpp
int motorSpeed = 512;  // Default (0-1023)
```

### Add More Commands
1. Add command handler in `handleCommand()` function
2. Add corresponding motor control function
3. Update web UI buttons/controls

### Change Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 8080;  // Change 8080 to your port
```

### Firebase Configuration
See `FIREBASE_SETUP.md` for detailed Firebase setup instructions.

## Security Notes

⚠️ **Important**: This is a basic implementation for demonstration. For production use, consider:
- Adding authentication
- Using WSS (secure WebSocket)
- Implementing rate limiting
- Adding command validation

## License

MIT License - Feel free to use and modify!

## Contributing

Contributions welcome! Feel free to submit issues or pull requests.

