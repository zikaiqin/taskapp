$(window).on('load', () => {
    $('#logout').on('click', () => {
        logout();
    });
    $('#test').on('submit', () => {
        console.log($('#toast').val());
    });
    setupTooltips();
});

const logout = () => {
    $.ajax('api/auth/logout', {
        type: 'POST',
        success: () => { window.location.replace('login') },
        error: () => { window.location.replace('login') },
    });
}

const setupTooltips = () => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}
