const mysql = require('mysql');

class MySQLStore {
    constructor() {
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root', // replace with your MySQL username
            password: 'password', // replace with your MySQL password
            database: 'whatsapp_sessions'
        });

        this.connection.connect(err => {
            if (err) throw err;
            console.log('MySQL connected...');
        });

        this._clientId = null; // private variable for clientId
    }

    // Getter for clientId
    get clientId() {
        return this._clientId;
    }

    // Setter for clientId
    set clientId(id) {
        this._clientId = id;
    }

    async get(id) {
        return new Promise((resolve, reject) => {
            this.connection.query('SELECT session_data FROM sessions WHERE user_id = ?', [id], (err, results) => {
                if (err) return reject(err);
                if (results.length > 0) {
                    resolve(JSON.parse(results[0].session_data));
                } else {
                    resolve(null);
                }
            });
        });
    }

    async set(id, session) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                'INSERT INTO sessions (user_id, session_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE session_data = VALUES(session_data)', 
                [id, JSON.stringify(session)], 
                err => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    async remove(id) {
        return new Promise((resolve, reject) => {
            this.connection.query('DELETE FROM sessions WHERE user_id = ?', [id], err => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

module.exports = MySQLStore;
