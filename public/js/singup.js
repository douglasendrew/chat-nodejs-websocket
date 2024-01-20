var socket = io();

document.getElementById('form_signup').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const requestBody = {};

    formData.forEach((value, key) => {
        requestBody[key] = value;
    });

    console.log(requestBody);

    fetch('/signup', {
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

            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Erro:', error);
        });
});