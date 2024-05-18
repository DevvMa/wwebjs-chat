const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors');

require('dotenv').config();

const HOST = process.env.HOST;
const PORT = process.env.PORT;

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost', // Replace with your specific origin if needed
    methods: ['POST'], // Allow only GET and POST methods
    allowedHeaders: ['Content-Type'] // Allow only these headers
}));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--no-experiments',
            '--hide-scrollbars',
            '--disable-plugins',
            '--disable-infobars',
            '--disable-translate',
            '--disable-pepper-3d',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-notifications',
            '--disable-setuid-sandbox',
            '--disable-crash-reporter',
            '--disable-smooth-scrolling',
            '--disable-login-animations',
            '--disable-dinosaur-easter-egg',
            '--disable-accelerated-2d-canvas',
            '--disable-rtc-smoothness-algorithm'
        ],
        headless: true
    }
});

// Notify client when device is successfully linked
client.on('ready', () => {
    res.json({ status: 'success', message: 'Device linked successfully' });
});

// Handle authentication failure
client.on('auth_failure', () => {
    res.status(500).json({ status: 'error', message: 'Failed to link device' });
});

// Initialize the client
client.initialize();

app.post('/generate-qr', (req, res) => {
    // Generate and send QR code to client
    client.on('qr', qr => {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Failed to generate QR code' });
            }
            res.json({ status: 'success', qrCode: url });
        });
    });
});

app.post('/send', (req, res) => {
    const number = req.body.number;
    const message = req.body.message;

    if (!number || !message) {
        return res.status(400).send({ status: 'error', message: 'Number or message is missing' });
    }

    client.sendMessage(number + "@c.us", message).then(response => {
        res.send({status: 'success', message: 'Message sent'});
    }).catch(err => {
        res.status(500).send({status: 'error', message: 'Failed to send message yeeaaa'});
    });
});

app.listen(PORT, HOST, () => {
    console.log('Server is running on port 3000');
});
