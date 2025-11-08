# How to Install ArduinoJson Library

If you're getting the error: `ArduinoJson.h: No such file or directory`, follow these steps:

## Method 1: Using Library Manager (Easiest)

1. **Open Arduino IDE**
2. Go to **Sketch** → **Include Library** → **Manage Libraries...**
3. In the search box, type: **ArduinoJson**
4. Find **"ArduinoJson" by Benoit Blanchon**
5. Click the **Install** button
6. **IMPORTANT**: Install version **6.x** (NOT version 7.x)
   - Version 6.21.3 is recommended for ESP8266
   - Version 7.x has breaking changes and won't work with this code
7. Wait for installation to complete
8. **Close and restart Arduino IDE completely**
9. Try compiling again

## Method 2: Manual Installation

If Library Manager doesn't work:

1. **Download ArduinoJson 6.x:**
   - Go to: https://github.com/bblanchon/ArduinoJson/releases
   - Download: **ArduinoJson-6.21.3.zip** (or latest 6.x version)
   - **DO NOT download version 7.x**

2. **Install in Arduino IDE:**
   - Open Arduino IDE
   - Go to **Sketch** → **Include Library** → **Add .ZIP Library...**
   - Select the downloaded ZIP file
   - Wait for installation message

3. **Restart Arduino IDE**

## Method 3: Verify Installation

To check if ArduinoJson is installed:

1. Go to **Sketch** → **Include Library**
2. Look for **ArduinoJson** in the list
3. If you see it, it's installed
4. If not, use Method 1 or 2 above

## Troubleshooting

### Still getting error after installation?

1. **Restart Arduino IDE completely** (close all windows)
2. **Check Arduino IDE version:**
   - Go to **Help** → **About Arduino**
   - Make sure you're using Arduino IDE 1.8.x or 2.x
3. **Check board selection:**
   - Go to **Tools** → **Board**
   - Select **NodeMCU 1.0 (ESP-12E Module)**
4. **Check library location:**
   - Go to **File** → **Preferences**
   - Note the "Sketchbook location"
   - Libraries should be in: `[Sketchbook location]/libraries/ArduinoJson/`
5. **Try reinstalling:**
   - Go to **Sketch** → **Include Library** → **Manage Libraries...**
   - Search for ArduinoJson
   - If it shows "INSTALLED", click "Remove"
   - Then click "Install" again

### Wrong version installed?

If you accidentally installed version 7.x:

1. Go to **Sketch** → **Include Library** → **Manage Libraries...**
2. Search for ArduinoJson
3. Click "Remove" to uninstall version 7.x
4. Install version 6.21.3 specifically (use the version dropdown)

### Still not working?

Try this alternative approach:

1. Download ArduinoJson 6.21.3 manually: https://github.com/bblanchon/ArduinoJson/releases/tag/v6.21.3
2. Extract the ZIP file
3. Rename the folder from `ArduinoJson-6.21.3` to `ArduinoJson`
4. Copy it to your Arduino libraries folder:
   - Windows: `Documents/Arduino/libraries/`
   - Mac: `~/Documents/Arduino/libraries/`
   - Linux: `~/Arduino/libraries/`
5. Restart Arduino IDE

## Verify It Works

After installation, try compiling your sketch. You should see:
- No errors about `ArduinoJson.h`
- Compilation should proceed (may have other errors, but not the library error)

If you still get the error, the library might be in the wrong location or Arduino IDE needs a complete restart.

