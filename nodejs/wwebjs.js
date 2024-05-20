const { Client, LocalAuth} = require('whatsapp-web.js');
const express = require('express');
const qr = require('qrcode');
const cors = require('cors');
const WebSocket = require('ws');
require('dotenv').config();

const HOST = process.env.HOST;
const PORT = process.env.PORT;

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Map to store WhatsApp clients, keyed by user ID
const whatsappClients = new Map();

// Function to create a new WhatsApp client for a user
function createWhatsAppClient(userId) {
    const client = new Client();
    // Event listeners and initialization for the client...
    whatsappClients.set(userId, client);
    return client;
}

// Function to get the WhatsApp client for a user
function getWhatsAppClient(userId) {
    return whatsappClients.get(userId);
}

// WebSocket server event listeners
wss.on('connection', function connection(ws) {
    console.log('New WebSocket client connected');

    ws.on('message', function incoming(message) {
    console.log('Received message from client:', message);
    handleMessageFromClient(message);
    });

    ws.on('close', function close() {
    console.log('WebSocket client disconnected');
    });
});

// Function to generate QR code image
async function generateQRCode(data) {
    return new Promise((resolve, reject) => {
        qr.toDataURL(data, (err, url) => {
            if (err) reject(err);
            else resolve(url);
        });
    });
}

// Handle messages from the client
function handleMessageFromClient(message) {
    try {
        const data = JSON.parse(message);
        if (data.type === 'send_message') {
            const { number, message } = data.data;
            sendMessageToWhatsApp(number, message);
        }
        if (data.type === 'authenticate'){
            authenticateUser(data.userId, data.password);
        }
    } catch (error) {
        console.error('Error handling message from client:', error);
    }
}

// Function to authenticate user
function authenticateUser(userId, password) {
    if (users[userId] && users[userId].password === password) {
        // Successful authentication
        // Create or retrieve WhatsApp client for the user
        const client = getWhatsAppClient(userId) || createWhatsAppClient(userId);
        // Send authentication success message to client
        sendToClient(userId, { type: 'authentication_success' });
    } else {
        // Failed authentication
        // Send authentication failure message to client
        sendToClient(userId, { type: 'authentication_failure' });
    }
}


function sendMessageToWhatsApp(number, message) {
    try {
        // Validation: Check if number and message are not empty
        if (!number.trim() || !message.trim()) {
        throw new Error('Number and message cannot be empty');
        }

        // Cleaning: Sanitize number and message
        const sanitizedNumber = sanitizePhoneNumber(number);
        const sanitizedMessage = sanitizeMessage(message);

        // Use wwebjs to send the sanitized message through WhatsApp
        // Assuming 'client' is already initialized and ready to use
        client.sendMessage(sanitizedNumber+ "@c.us", sanitizedMessage);
        
        // Send a notification back to the client
        broadcastToAllClients({ type: 'notification', message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message to WhatsApp:', error);
        // Send an error notification back to the client
        broadcastToAllClients({ type: 'notification', message: 'Error sending message: ' + error.message });
    }
}
  
// Function to sanitize phone number
function sanitizePhoneNumber(number) {
    // Implement your sanitization logic here
    // For example, remove any non-numeric characters
    return number.replace(/\D/g, '');
}

// Function to sanitize message
function sanitizeMessage(message) {
    // Implement your sanitization logic here
    // For example, escape special characters
    return message.replace(/[<>&"']/g, '');
}

// Function to broadcast message to all WebSocket clients
function broadcastToAllClients(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        }
    });
}

  // Function to link WhatsApp account to user session
function linkWhatsAppAccount(userId, phoneNumber) {
    // Retrieve WhatsApp client for the user
    const client = getWhatsAppClient(userId);
    if (client) {
        // Listen for 'qr' event to generate QR code for linking
        client.on('qr', async qrData => {
        // Send QR code data to client for scanning
        sendToClient(userId, { type: 'qr_code', data: qrData });
        });

        // Start session to generate QR code
        client.initialize();

        // Additional logic to handle phone number...
    } else {
        // No WhatsApp client found for the user
        // Send error message to client
        sendToClient(userId, { type: 'error', message: 'WhatsApp client not found' });
    }
}

// Function to send message to a specific client
function sendToClient(userId, message) {
    // Find WebSocket connection associated with the user ID
    const client = getClientByUserId(userId);
    if (client) {
        // Send message to the client
        client.send(JSON.stringify(message));
    } else {
        console.error('Client not found for user:', userId);
    }
}

// Function to find WebSocket connection associated with user ID
function getClientByUserId(userId) {
    // Retrieve WebSocket client from the whatsappClients map
    return whatsappClients.get(userId);
}