var socket = io();

document.getElementById('form_signin').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const requestBody = {};

    formData.forEach((value, key) => {
        requestBody[key] = value;
    });

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                Swal.fire({
                    icon: data.error ? 'error' : 'success',
                    text: data.message
                });

                return;
            } 


            window.location.href = '/';
        })
        .catch(error => {
            console.error('Erro:', error);
        });
});