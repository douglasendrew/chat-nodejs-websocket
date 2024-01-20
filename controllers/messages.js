const sqlite3 = require('sqlite3');
const uuid = require('uuid');
const security = require('./security');
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

module.exports = {
    saveMessageFromUser(user, message) {
        const message_id = uuid.v4();
        var sql = 'INSERT INTO messages (message_id, message_from, message_content) VALUES (?, ?, ?)';
        db.run(sql, [message_id, user, security.encrypt(message)], (err) => {
            if (err) {
                return true;
            }
    
            return true;
        });
    
        var sql = 'INSERT INTO users_messages_pivot (message_id, user_id) VALUES (?, ?)';
        db.run(sql, [message_id, user], (err) => {
            if (err) {
                return true;
            }
    
            return true;
        });

        return message_id;
    },

    getLastMessages() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT 
                    users.user_name,
                    messages.message_content,
                    strftime('%d/%m/%Y %H:%i', messages.message_sended_at) as sended_at,
                    messages.message_id
                FROM users_messages_pivot
                    LEFT JOIN users ON users_messages_pivot.user_id = users.user_id
                    LEFT JOIN messages ON users_messages_pivot.message_id = messages.message_id
                ORDER BY message_sended_at ASC
                LIMIT 20;
            `;
            db.all(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}