const http = require('http');
const session = require('express-session');
const express = require('express');
const socketIo = require('socket.io');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const secretKey = 'amplimed';
const empresa = 'Empresa X';
const db = new sqlite3.Database('database.db');

const security = require('./controllers/security');
const messages = require('./controllers/messages');
const users = require('./controllers/users');

var user = null;

app.use(bodyParser.json());

app.use(session({
    secret: 'amplimed',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static('public'));
app.use('/js', express.static('public/js'));

app.set('view engine', 'ejs');
app.set('views', 'views');


/**
 * Rotas Web
 */
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    io.emit('login', 'ok');
    
    res.render('chat', { titulo: 'Chat Interno', empresa: empresa });
});

app.get('/login', (req, res) => {
    res.render('login', { titulo: 'Login', empresa: empresa });
});

app.get('/logout', async (req, res) => {
    user = null;
    await req.session.destroy();

    return res.redirect('/login');
});

app.get('/singup', (req, res) => {
    res.render('singup', { titulo: 'Registro', empresa: empresa });
});

app.post('/signup', async (req, res) => {
    const { user_name, user_email, user_password, user_confirm_password } = req.body;

    if (user_password !== user_confirm_password) {
        return res.status(400).json({ message: `As senhas não conferem.`, error: true });
    }

    const existingUser = await users.getUserByEmail(user_email);
    if (existingUser) {
        return res.status(400).json({ message: 'E-mail já cadastrado', error: true });
    }

    const hashedPassword = await bcrypt.hash(user_password, 10);

    const user_id = uuid.v4();

    const sql = 'INSERT INTO users (user_id, user_name, user_email, user_password) VALUES (?, ?, ?, ?)';
    db.run(sql, [user_id, user_name, user_email, hashedPassword], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro interno do servidor', error: true });
        }
        return res.status(201).json({ message: 'Usuário registrado com sucesso', error: false });
    });
});

app.post('/login', async (req, res) => {
    const { user_email, user_password } = req.body;

    db.get('SELECT * FROM users WHERE user_email = ?', [user_email], async (err, row) => {
        if (err) {
            return res.status(500).send({ message: 'Erro no servidor, tente novamente', error: true });
        }

        if (!row) {
            return res.status(401).send({ message: 'Usuário não encontrado', error: true });
        }

        const match = await bcrypt.compare(user_password, row.user_password);

        if (!match) {
            return res.status(401).send({ message: 'Senha incorreta', error: true });
        }

        req.session.user = row;

        user = row;

        res.status(200).send({ message: 'Logado(a) com sucesso', error: false });
    });
});


/**
 * Websocket - Chat
 */
var usuariosConectados = {};

io.on('connection', async (socket) => {

    const usuario = user;
    if (!usuario) {
        return;
    }

    usuariosConectados[socket.id] = {
        id: socket.id,
        username: user.user_name,
        userid: user.user_id
    };

    io.emit('usuarios', Object.values(usuariosConectados));
    
    const msg_list = await messages.getLastMessages();

    for (const msg of msg_list) {
        io.emit('last-messages', { message: security.decrypt(msg.message_content), from: msg.user_name, message_id: msg.message_id });
    }
    
    socket.on('mensagem', (mensagem) => {
        io.emit('mensagem', { usuario: usuariosConectados[socket.id], mensagem });
    });

    socket.on('digitando', () => {
        io.emit('digitando', { usuario: usuariosConectados[socket.id] });
    });

    socket.on('parou-de-digitar', () => {
        io.emit('parou-de-digitar', { usuario: usuariosConectados[socket.id] });
    });

    socket.on('chat message', (message) => {
        var message_id = messages.saveMessageFromUser(usuariosConectados[socket.id].userid, message);

        io.emit('chat message', { message_id: message_id, id: usuariosConectados[socket.id].username, message: message });
    });

    socket.on('disconnect', () => {
        delete usuariosConectados[socket.id];
        io.emit('usuarios', Object.values(usuariosConectados));
    });

});


/**
 * Config de servidor
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});