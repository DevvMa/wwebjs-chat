const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost', // Replace with your specific origin if needed
    methods: ['POST'], // Allow only GET and POST methods
    allowedHeaders: ['Content-Type'] // Allow only these headers
}));

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

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

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
