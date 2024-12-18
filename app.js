const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express();


// Configuración de express
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

// Página de inicio
app.get('/', (req, res) => {
    res.render('login');
});

// Registro de usuario
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;
    
    // Verificar si las contraseñas coinciden
    if (password !== confirmPassword) {
        return res.send('Las contraseñas no coinciden');
    }

    // Cifrar la contraseña
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.send('Error al registrar el usuario');
        }
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                return res.send('Error al registrar');
            }
            res.redirect('/login');
        });
    });
});

// Iniciar sesión
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) {
            return res.send('Usuario no encontrado');
        }
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                req.session.userId = user.id;
                res.redirect('/dashboard');
            } else {
                res.send('Contraseña incorrecta');
            }
        });
    });
});

// Panel de gestión de contraseñas
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    db.all(`SELECT * FROM passwords WHERE user_id = ?`, [req.session.userId], (err, passwords) => {
        res.render('dashboard', { passwords });
    });
});

// Añadir una contraseña
app.get('/addPassword', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('addPassword');
});

app.post('/addPassword', (req, res) => {
    const { title, username, url, password } = req.body;

    if (!title || !username || !password) {
        return res.send('Faltan campos obligatorios');
    }

    // Cifrar la contraseña
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.log("Error al cifrar la contraseña:", err);
            return res.send('Error al cifrar la contraseña');
        }

        // Guardar la contraseña cifrada en la base de datos
        db.run(`INSERT INTO passwords (user_id, title, url, password) VALUES (?, ?, ?, ?, ?)`, 
            [req.session.userId, title, username, url, hashedPassword], function(err) {
                if (err) {
                    console.log("Error al guardar la contraseña:", err);
                    return res.send('Error al guardar la contraseña');
                }
                console.log('Contraseña guardada correctamente');
                res.redirect('/dashboard');
            });
    });
});


// Cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});


