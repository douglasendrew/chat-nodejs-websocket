$(function () {
    var socket = io();
    let digitandoTimeout;

    $('form').submit(function () {
        removerStatusDigitando();
        if($('#m').val().trim() != '') {
            socket.emit('chat message', $('#m').val());
            $('#m').val('');    
            return false;
        }
    });

    socket.on('chat message', function (msg) {
        $('#messages').append($('<li message="'+msg.message_id+'">').html(`<b>${msg.id}</b>: ${msg.message}`));
        reproduzirNotificacaoSonora();
    });

    socket.on('usuarios', (usuarios) => {
        var connectedUsers = $('#usuarios-conectados');

        connectedUsers.html('');

        usuarios.forEach((usuario) => {
            connectedUsers.append(`<li class="text-white">${usuario.username}</li>`)
        });
    });

    socket.on('last-messages', (message) => {
        if ( $('li[message="'+message.message_id+'"]').length > 0 ) {
            return;
        }

        $('#messages').append($('<li message="'+message.message_id+'">').html(`<b>${message.from}</b>: ${message.message}`));
    });

    socket.on('mensagem', (data) => {
        const mensagensList = document.getElementById('mensagens');
        const li = document.createElement('li');
        removerStatusDigitando();
    });

    socket.on('digitando', (data) => {
        exibirStatusDigitando(data.usuario.username);
        clearTimeout(digitandoTimeout);
        digitandoTimeout = setTimeout(() => {
            removerStatusDigitando();
        }, 1000); 
    });

    socket.on('parou-de-digitar', (data) => {
        $('#user-status-typing').html('');
        removerStatusDigitando();
    });

    document.getElementById('form').addEventListener('submit', (event) => {
        event.preventDefault();
        const mensagem = $('#m').val();

        if(mensagem.length > 0) {
            socket.emit('mensagem', mensagem);
            $('#m').val('');
        }
    });

    document.getElementById('m').addEventListener('input', () => {
        socket.emit('digitando');
    });

    document.getElementById('m').addEventListener('focus', () => {
        removerStatusDigitando();
    });

    function exibirStatusDigitando(username) {
        $('#user-status-typing').html(`${username} está digitando...`);
    }

    function removerStatusDigitando() {
        $('#user-status-typing').html('');
    }

    function reproduzirNotificacaoSonora() {
        const somNotificacao = '/sounds/notify.wav';
        const audio = new Audio(somNotificacao);
        audio.play();
    }
});