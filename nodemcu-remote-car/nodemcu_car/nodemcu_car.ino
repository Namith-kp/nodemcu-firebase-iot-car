/*
 * NodeMCU Remote Controlled Car
 * Controls a car via WiFi using Firebase Realtime Database
 * NO EXTERNAL JSON LIBRARY REQUIRED - Uses simple string parsing
 * 
 * Hardware Connections:
 * - Motor Driver (L298N or similar):
 *   - IN1 -> D1 (GPIO5)
 *   - IN2 -> D2 (GPIO4)
 *   - IN3 -> D5 (GPIO14)
 *   - IN4 -> D6 (GPIO12)
 *   - ENA -> D7 (GPIO13) - Left motor speed
 *   - ENB -> D8 (GPIO15) - Right motor speed
 * 
 * - Power: Connect 5V and GND from NodeMCU to motor driver
 * - Motors: Connect to motor driver outputs
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// WiFi credentials - UPDATE THESE
const char* ssid = "SSID_HERE";
const char* password = "PASSWORD_HERE";

// Firebase Realtime Database - UPDATE THESE
const char* firebaseHost = "YOUR_PROJECT_ID-default-rtdb.firebaseio.com";
const char* firebaseAuth = "";  // Optional: Database secret or auth token
const char* firebasePath = "/car";

// Motor pins
#define MOTOR_LEFT_IN1 D1   // GPIO5
#define MOTOR_LEFT_IN2 D2   // GPIO4
#define MOTOR_RIGHT_IN3 D5  // GPIO14
#define MOTOR_RIGHT_IN4 D6  // GPIO12
#define MOTOR_LEFT_ENA D7   // GPIO13 (PWM)
#define MOTOR_RIGHT_ENB D8  // GPIO15 (PWM)

// Motor speed (0-1023 for 10-bit PWM)
int motorSpeed = 512;  // Default speed (50%)

// Firebase polling interval
unsigned long lastFirebaseCheck = 0;
const unsigned long firebaseCheckInterval = 100;  // Check every 100ms for responsiveness

WiFiClientSecure client;
HTTPClient http;

// Simple JSON parsing functions (no library needed)
String getJsonValue(String json, String key) {
  // Find the key in the JSON string
  String searchKey = "\"" + key + "\"";
  int keyIndex = json.indexOf(searchKey);
  
  if (keyIndex == -1) {
    return "";  // Key not found
  }
  
  // Find the colon after the key
  int colonIndex = json.indexOf(":", keyIndex);
  if (colonIndex == -1) {
    return "";
  }
  
  // Find the start of the value (skip whitespace)
  int valueStart = colonIndex + 1;
  while (valueStart < json.length() && (json.charAt(valueStart) == ' ' || json.charAt(valueStart) == '\t')) {
    valueStart++;
  }
  
  // Check if value is a string (starts with ")
  if (json.charAt(valueStart) == '"') {
    // String value - find the closing quote
    valueStart++;  // Skip opening quote
    int valueEnd = json.indexOf('"', valueStart);
    if (valueEnd == -1) {
      return "";
    }
    return json.substring(valueStart, valueEnd);
  } else {
    // Number or boolean value - find the end (comma, }, or whitespace)
    int valueEnd = valueStart;
    while (valueEnd < json.length()) {
      char c = json.charAt(valueEnd);
      if (c == ',' || c == '}' || c == ' ' || c == '\t' || c == '\n' || c == '\r') {
        break;
      }
      valueEnd++;
    }
    return json.substring(valueStart, valueEnd);
  }
}

// Build JSON string manually
String buildJson(String key1, String value1, String key2 = "", String value2 = "", String key3 = "", String value3 = "", String key4 = "", String value4 = "") {
  String json = "{";
  json += "\"" + key1 + "\":\"" + value1 + "\"";
  
  if (key2.length() > 0) {
    json += ",\"" + key2 + "\":\"" + value2 + "\"";
  }
  if (key3.length() > 0) {
    json += ",\"" + key3 + "\":" + value3;  // Number, no quotes
  }
  if (key4.length() > 0) {
    json += ",\"" + key4 + "\":\"" + value4 + "\"";
  }
  
  json += "}";
  return json;
}

// Build JSON with number values
String buildJsonWithNumbers(String key1, String value1, String key2, int value2, String key3, unsigned long value3, String key4, String value4) {
  String json = "{";
  json += "\"" + key1 + "\":\"" + value1 + "\"";
  json += ",\"" + key2 + "\":" + String(value2);
  json += ",\"" + key3 + "\":" + String(value3);
  json += ",\"" + key4 + "\":\"" + value4 + "\"";
  json += "}";
  return json;
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\nNodeMCU Remote Car Starting...");
  
  // Initialize motor pins
  pinMode(MOTOR_LEFT_IN1, OUTPUT);
  pinMode(MOTOR_LEFT_IN2, OUTPUT);
  pinMode(MOTOR_RIGHT_IN3, OUTPUT);
  pinMode(MOTOR_RIGHT_IN4, OUTPUT);
  pinMode(MOTOR_LEFT_ENA, OUTPUT);
  pinMode(MOTOR_RIGHT_ENB, OUTPUT);
  
  // Stop motors initially
  stopMotors();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // For Firebase HTTPS, we need to skip certificate validation
  // In production, you should validate the certificate
  client.setInsecure();
  
  // Send initial status to Firebase
  updateCarStatus(true);
  
  Serial.println("Firebase client started");
}

void loop() {
  // Check Firebase for new commands periodically
  if (millis() - lastFirebaseCheck >= firebaseCheckInterval) {
    checkFirebaseCommands();
    lastFirebaseCheck = millis();
  }
}

void checkFirebaseCommands() {
  // Read commands from Firebase
  String url = String("https://") + firebaseHost + firebasePath + "/commands.json";
  if (strlen(firebaseAuth) > 0) {
    url += "?auth=" + String(firebaseAuth);
  }
  
  http.begin(client, url);
  http.setTimeout(2000);
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    
    // Skip if payload is null or empty
    if (payload.length() == 0 || payload == "null") {
      http.end();
      return;
    }
    
    // Parse JSON manually (no library needed)
    String command = getJsonValue(payload, "command");
    String speedStr = getJsonValue(payload, "speed");
    
    if (command.length() > 0) {
      // Update speed if provided
      if (speedStr.length() > 0) {
        motorSpeed = speedStr.toInt();
        motorSpeed = constrain(motorSpeed, 0, 1023);
      }
      
      Serial.print("Command received: ");
      Serial.println(command);
      
      // Execute command
      if (command == "forward") {
        moveForward();
      } else if (command == "backward") {
        moveBackward();
      } else if (command == "left") {
        turnLeft();
      } else if (command == "right") {
        turnRight();
      } else if (command == "stop") {
        stopMotors();
      } else if (command == "forward_left") {
        moveForwardLeft();
      } else if (command == "forward_right") {
        moveForwardRight();
      } else if (command == "backward_left") {
        moveBackwardLeft();
      } else if (command == "backward_right") {
        moveBackwardRight();
      }
      
      // Send acknowledgment
      updateStatus(command);
      
      // Clear the command after processing (optional - prevents re-execution)
      // clearCommand();
    }
  } else if (httpCode < 0) {
    Serial.print("HTTP error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void updateStatus(String command) {
  String url = String("https://") + firebaseHost + firebasePath + "/status.json";
  if (strlen(firebaseAuth) > 0) {
    url += "?auth=" + String(firebaseAuth);
  }
  
  // Build JSON manually
  String json = buildJsonWithNumbers(
    "lastCommand", command,
    "lastSpeed", motorSpeed,
    "timestamp", millis(),
    "source", "nodemcu"
  );
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.PUT(json);
  http.end();
}

void updateCarStatus(bool online) {
  String url = String("https://") + firebaseHost + firebasePath + "/carStatus.json";
  if (strlen(firebaseAuth) > 0) {
    url += "?auth=" + String(firebaseAuth);
  }
  
  // Build JSON manually
  String statusStr = online ? "connected" : "disconnected";
  String json = buildJsonWithNumbers(
    "status", statusStr,
    "online", online ? 1 : 0,
    "timestamp", millis(),
    "ip", WiFi.localIP().toString()
  );
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.PUT(json);
  http.end();
}

void clearCommand() {
  // Optional: Clear command after processing to prevent re-execution
  String url = String("https://") + firebaseHost + firebasePath + "/commands.json";
  if (strlen(firebaseAuth) > 0) {
    url += "?auth=" + String(firebaseAuth);
  }
  
  http.begin(client, url);
  http.DELETE();
  http.end();
}

void moveForward() {
  digitalWrite(MOTOR_LEFT_IN1, HIGH);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN3, HIGH);
  digitalWrite(MOTOR_RIGHT_IN4, LOW);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed);
}

void moveBackward() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, HIGH);
  digitalWrite(MOTOR_RIGHT_IN3, LOW);
  digitalWrite(MOTOR_RIGHT_IN4, HIGH);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed);
}

void turnLeft() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, HIGH);
  digitalWrite(MOTOR_RIGHT_IN3, HIGH);
  digitalWrite(MOTOR_RIGHT_IN4, LOW);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed);
}

void turnRight() {
  digitalWrite(MOTOR_LEFT_IN1, HIGH);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN3, LOW);
  digitalWrite(MOTOR_RIGHT_IN4, HIGH);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed);
}

void moveForwardLeft() {
  digitalWrite(MOTOR_LEFT_IN1, HIGH);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN3, HIGH);
  digitalWrite(MOTOR_RIGHT_IN4, LOW);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed / 2);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed);
}

void moveForwardRight() {
  digitalWrite(MOTOR_LEFT_IN1, HIGH);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN3, HIGH);
  digitalWrite(MOTOR_RIGHT_IN4, LOW);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed / 2);
}

void moveBackwardLeft() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, HIGH);
  digitalWrite(MOTOR_RIGHT_IN3, LOW);
  digitalWrite(MOTOR_RIGHT_IN4, HIGH);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed / 2);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed);
}

void moveBackwardRight() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, HIGH);
  digitalWrite(MOTOR_RIGHT_IN3, LOW);
  digitalWrite(MOTOR_RIGHT_IN4, HIGH);
  analogWrite(MOTOR_LEFT_ENA, motorSpeed);
  analogWrite(MOTOR_RIGHT_ENB, motorSpeed / 2);
}

void stopMotors() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN3, LOW);
  digitalWrite(MOTOR_RIGHT_IN4, LOW);
  analogWrite(MOTOR_LEFT_ENA, 0);
  analogWrite(MOTOR_RIGHT_ENB, 0);
}
