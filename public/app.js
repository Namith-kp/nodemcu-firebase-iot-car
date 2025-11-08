// Firebase configuration - Loaded from server /api/config endpoint
let firebaseConfig = null;
let database = null;
let isConnected = false;
let currentCommand = null;
let joystickActive = false;

// Firebase Realtime Database references
let commandsRef = null;
let statusRef = null;
let carStatusRef = null;

// Initialize Firebase by fetching config from server
async function initializeFirebase() {
    try {
        console.log('Fetching Firebase configuration from server...');
        const response = await fetch('/api/config');
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to load Firebase configuration');
        }
        
        firebaseConfig = await response.json();
        
        // Check if config is valid
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
            throw new Error('Firebase configuration not set. Please configure .env file');
        }
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // Setup database references
        commandsRef = database.ref('car/commands');
        statusRef = database.ref('car/status');
        carStatusRef = database.ref('car/carStatus');
        
        console.log('Firebase initialized successfully');
        setupFirebaseListeners();
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        updateConnectionStatus(false);
        
        const carStatus = document.getElementById('carStatus');
        carStatus.textContent = `❌ Configuration Error: ${error.message}`;
        carStatus.style.color = '#ef4444';
    }
}

function setupFirebaseListeners() {
    // Check connection status
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        isConnected = snapshot.val() === true;
        updateConnectionStatus(isConnected);
        
        if (isConnected) {
            console.log('Firebase connected');
        } else {
            console.log('Firebase disconnected');
        }
    });
    
    // Listen for car status updates
    carStatusRef.on('value', (snapshot) => {
        const status = snapshot.val();
        if (status) {
            handleCarStatus(status);
        }
    });
    
    // Listen for command acknowledgments
    statusRef.on('value', (snapshot) => {
        const status = snapshot.val();
        if (status && status.lastCommand) {
            const lastCommand = document.getElementById('lastCommand');
            lastCommand.textContent = `Last command: ${status.lastCommand}`;
        }
    });
}

function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');
    
    if (connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
    } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Disconnected';
    }
}

function handleCarStatus(status) {
    const carStatus = document.getElementById('carStatus');
    
    if (status.status === 'connected' || status.online === true) {
        carStatus.textContent = '✅ Car is online and ready!';
        carStatus.style.color = '#10b981';
    } else if (status.status === 'disconnected' || status.online === false) {
        carStatus.textContent = '❌ Car disconnected';
        carStatus.style.color = '#ef4444';
    } else {
        carStatus.textContent = '⏳ Waiting for car...';
        carStatus.style.color = '#f59e0b';
    }
}

function sendCommand(command, speed = null) {
    if (!isConnected || !commandsRef) {
        console.warn('Not connected to Firebase');
        return;
    }
    
    // Get current speed from slider if not provided
    if (speed === null) {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = Math.round((speedSlider.value / 100) * 1023);
        speed = speedValue;
    }
    
    // Write command to Firebase
    commandsRef.set({
        command: command,
        speed: speed,
        timestamp: Date.now()
    });
    
    currentCommand = command;
    
    const lastCommand = document.getElementById('lastCommand');
    lastCommand.textContent = `Sending: ${command}`;
    
    console.log('Command sent:', command, 'Speed:', speed);
}

// Speed control
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = e.target.value;
});

// Stop button
const stopBtn = document.getElementById('stopBtn');
stopBtn.addEventListener('click', () => {
    sendCommand('stop');
});

stopBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    sendCommand('stop');
});

// D-pad buttons
const buttons = {
    forwardBtn: 'forward',
    backwardBtn: 'backward',
    leftBtn: 'left',
    rightBtn: 'right',
    forwardLeftBtn: 'forward_left',
    forwardRightBtn: 'forward_right',
    backwardLeftBtn: 'backward_left',
    backwardRightBtn: 'backward_right'
};

Object.keys(buttons).forEach(btnId => {
    const btn = document.getElementById(btnId);
    const command = buttons[btnId];
    
    btn.addEventListener('mousedown', () => sendCommand(command));
    btn.addEventListener('mouseup', () => sendCommand('stop'));
    btn.addEventListener('mouseleave', () => sendCommand('stop'));
    
    // Touch events for mobile
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sendCommand(command);
    });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        sendCommand('stop');
    });
    btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        sendCommand('stop');
    });
});

// Joystick control
const joystickArea = document.getElementById('joystickArea');
const joystick = document.getElementById('joystick');
const joystickRadius = 100; // Max distance from center

let joystickCenter = { x: 0, y: 0 };
let joystickPosition = { x: 0, y: 0 };

function updateJoystickPosition(x, y) {
    const dx = x - joystickCenter.x;
    const dy = y - joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > joystickRadius) {
        const angle = Math.atan2(dy, dx);
        joystickPosition.x = joystickCenter.x + Math.cos(angle) * joystickRadius;
        joystickPosition.y = joystickCenter.y + Math.sin(angle) * joystickRadius;
    } else {
        joystickPosition.x = x;
        joystickPosition.y = y;
    }
    
    joystick.style.transform = `translate(calc(-50% + ${joystickPosition.x - joystickCenter.x}px), calc(-50% + ${joystickPosition.y - joystickCenter.y}px))`;
    
    // Determine command based on position
    const normalizedX = (joystickPosition.x - joystickCenter.x) / joystickRadius;
    const normalizedY = (joystickCenter.y - joystickPosition.y) / joystickRadius; // Inverted Y
    
    let command = 'stop';
    const threshold = 0.3;
    
    if (Math.abs(normalizedX) < threshold && Math.abs(normalizedY) < threshold) {
        command = 'stop';
    } else if (normalizedY > threshold) {
        if (normalizedX < -threshold) {
            command = 'forward_left';
        } else if (normalizedX > threshold) {
            command = 'forward_right';
        } else {
            command = 'forward';
        }
    } else if (normalizedY < -threshold) {
        if (normalizedX < -threshold) {
            command = 'backward_left';
        } else if (normalizedX > threshold) {
            command = 'backward_right';
        } else {
            command = 'backward';
        }
    } else {
        if (normalizedX < -threshold) {
            command = 'left';
        } else if (normalizedX > threshold) {
            command = 'right';
        }
    }
    
    if (command !== currentCommand) {
        sendCommand(command);
    }
}

function resetJoystick() {
    joystickPosition = { x: joystickCenter.x, y: joystickCenter.y };
    joystick.style.transform = 'translate(-50%, -50%)';
    sendCommand('stop');
}

function getJoystickCenter() {
    const rect = joystickArea.getBoundingClientRect();
    joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Mouse events for joystick
joystickArea.addEventListener('mousedown', (e) => {
    joystickActive = true;
    getJoystickCenter();
    updateJoystickPosition(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
    if (joystickActive) {
        updateJoystickPosition(e.clientX, e.clientY);
    }
});

document.addEventListener('mouseup', () => {
    if (joystickActive) {
        joystickActive = false;
        resetJoystick();
    }
});

// Touch events for joystick
joystickArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    getJoystickCenter();
    const touch = e.touches[0];
    updateJoystickPosition(touch.clientX, touch.clientY);
});

document.addEventListener('touchmove', (e) => {
    if (joystickActive) {
        e.preventDefault();
        const touch = e.touches[0];
        updateJoystickPosition(touch.clientX, touch.clientY);
    }
});

document.addEventListener('touchend', (e) => {
    if (joystickActive) {
        e.preventDefault();
        joystickActive = false;
        resetJoystick();
    }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    
    switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            sendCommand('forward');
            break;
        case 's':
        case 'arrowdown':
            sendCommand('backward');
            break;
        case 'a':
        case 'arrowleft':
            sendCommand('left');
            break;
        case 'd':
        case 'arrowright':
            sendCommand('right');
            break;
        case ' ':
            e.preventDefault();
            sendCommand('stop');
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'w':
        case 's':
        case 'a':
        case 'd':
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
            sendCommand('stop');
            break;
    }
});

// Initialize on page load
window.addEventListener('load', () => {
    initializeFirebase();
    getJoystickCenter();
    
    // Update joystick center on resize
    window.addEventListener('resize', getJoystickCenter);
});
