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

// Initialize the WhatsApp client
const client = new Client();

// WebSocket client connections array
const clients = [];

// Function to broadcast messages to all WebSocket clients
function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

client.on('ready', () => {
    console.log('WhatsApp client is ready!');

    // Broadcast message when the WhatsApp client is ready
    broadcast({ type: 'status', message: 'WhatsApp client is ready!' });
});

// When the WhatsApp client emits the 'qr' event
client.on('qr', async qrData => {
    console.log('QR code generated, scan it!');
    try {
        const qrCode = await generateQRCode(qrData);
        // Broadcast QR code image to all WebSocket clients
        broadcast({ type: 'qr', data: qrCode });
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
});

client.on('authenticated', (session) => {
    console.log('Client authenticated');
    // Broadcast message when client is authenticated
    broadcast({ type: 'status', message: 'Client authenticated' });
});

client.on('auth_failure', () => {
    console.error('Authentication failed, please restart the app.');
    // Broadcast message when authentication fails
    broadcast({ type: 'error', message: 'Authentication failed, please restart the app.' });
});

client.initialize();

// WebSocket server event listeners
wss.on('connection', function connection(ws) {
    console.log('New WebSocket client connected');
    // Add client to clients array
    clients.push(ws);

    ws.on('message', function incoming(message) {
        console.log('Received message from client:', message);
        handleMessageFromClient(message);
      });

    // WebSocket client event listeners
    ws.on('close', function close() {
        console.log('WebSocket client disconnected');
        // Remove client from clients array when disconnected
        clients.splice(clients.indexOf(ws), 1);
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
} catch (error) {
    console.error('Error handling message from client:', error);
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