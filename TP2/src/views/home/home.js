$(window).on('load', () => {
    $('#logout').on('click', () => {
        logout();
    });
});

const logout = () => {
    $.ajax('api/auth/logout', {
        type: 'POST',
        success: () => { window.location.replace('login') },
        error: () => { window.location.replace('login') },
    });
}
