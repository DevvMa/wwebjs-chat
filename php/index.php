<!-- index.php in your php directory -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Send WhatsApp Message</title>
</head>
<body>
    <h1>Send WhatsApp Message</h1>
    <form id="messageForm">
        <label for="number">Number:</label>
        <input type="text" id="number" name="number" required><br>
        <label for="message">Message:</label>
        <textarea id="message" name="message" required></textarea><br>
        <button type="submit">Send Message</button>
    </form>

    <script>
        document.getElementById('messageForm').addEventListener('submit', function(event) {
            event.preventDefault();

            const number = document.getElementById('number').value;
            const message = document.getElementById('message').value;
            console.log(number);
            console.log(message);
            fetch('http://localhost:3000/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ number, message })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Message sent successfully!');
                } else {
                    alert('Failed to send message: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to send message: ' + error);
            });
        });
    </script>
</body>
</html>
