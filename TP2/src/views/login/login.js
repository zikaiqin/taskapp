$(window).on('load', () => {
    const state = {
        action: 'login'
    }
    $('#alt-action').on('click', () => {
        toggle(state);
    });
    $('#login-form').on('submit', () => {
        submit(state);
    })
});

const submit = (s) => {
    let username = $('#username').val(),
        password = $('#password').val();
    if (s.action === 'login') {
        login(username, password);
    } else {
        let email = $('#email').val(),
            confirm = $('#confirm').val();
        register(username, email, password, confirm);
    }
}

const toggle = (s) => {
    $('#error').text('');
    if (s.action === 'login') {
        s.action = 'signup'
        showSignupForm();
    } else {
        s.action = 'login'
        showLoginForm();
    }
}

const login = (username, password) => {
    $.ajax('api/auth/login', {
        type: 'POST',
        data: {
            username,
            password,
        },
        success: () => {
            window.location.replace('home');
        },
        error: (res) => {
            $('#error').text(res.responseText);
        },
    });
}

const register = (username, email, password, confirm) => {
    $.ajax('api/auth/register', {
        type: 'POST',
        data: {
            username,
            email,
            password,
            confirm,
        },
        success: () => {
            window.location.replace('home');
        },
        error: (res) => {
            $('#error').text(res.responseText);
        },
    });
}

const showSignupForm = () => {
    clearFields('email', 'password', 'confirm');
    $('.signup-field').show();
    $('#email', '#confirm').prop('required', true);
    $('#main-action').text('Sign up');
    $('#alt-action').text('Already registered? Log in here');
    $('#username').trigger('focus');
}

const showLoginForm = () => {
    clearFields('email', 'password', 'confirm');
    $('.signup-field').hide();
    $('#email', '#confirm').prop('required', false);
    $('#main-action').text('Sign in');
    $('#alt-action').text('No account? Sign up here');
    $('#username').trigger('focus');
}

const clearFields = (...fields) => {
    fields.forEach((field) => {
        $(`#${field}`).val('');
    });
}