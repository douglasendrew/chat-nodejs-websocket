const sqlite3 = require('sqlite3');

const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

module.exports = {
    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE user_email = ?';
            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}