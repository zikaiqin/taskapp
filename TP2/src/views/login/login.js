$(document).ready(() => {
    const state = {
        action: 'login'
    }
    $('#main-action').click(() => {
        submit(state);
    });
    $('#alt-action').click(() => {
        toggle(state);
    });
});

const submit = (s) => {
    let values = {
        username: $('username').val(),
        password: $('password').val(),
    }
    if (s.action === 'login') {
        postLogin(values);
    } else {
        values.confirm = $('confirm').val();
        postNewUser(values);
    }
}

const toggle = (s) => {
    if (s.action === 'login') {
        s.action = 'signup'
        showSignupForm();
    } else {
        s.action = 'login'
        showLoginForm();
    }
}

const postLogin = (values) => {
    // TODO: Login
}

const postNewUser = (values) => {
    // TODO: Login
}

const showSignupForm = () => {
    clearForm(['password', 'confirm']);
    $('#confirm-group').show();
    $('#confirm').prop('required', true);
    $('#main-action').text('Sign up');
    $('#alt-action').text('Already signed up? Log in here');
    $('#username').focus();
}

const showLoginForm = () => {
    clearForm(['password', 'confirm']);
    $('#confirm-group').hide();
    $('#confirm').prop('required', false);
    $('#main-action').text('Sign in');
    $('#alt-action').text('No account? Sign up here');
    $('#username').focus();
}

const clearForm = (fields) => {
    fields.forEach((field) => {
        $(`#${field}`).val('');
    });
}