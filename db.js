const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./passwords.db');

// Crear las tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        password TEXT NOT NULL,
        url TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
