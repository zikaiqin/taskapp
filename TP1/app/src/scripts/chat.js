$(document).ready(() => {
  $('#name-add').click(() => {
    showForm();
  });

  $('#name-confirm').click(() => {
    let form = $('#name-form');
    if (!form[0].checkValidity()) {
      form.addClass('was-validated');
      return;
    }
    hideForm();
  });

  $('#name-reset').click(() => {
    $('#name-form').removeClass('was-validated');
    $('#name-input').focus();
  });

  $('#name-cancel').click(() => {
    hideForm();
  });

});

function showForm () {
  $('#name-add').hide();
  $('#name-form').show();
  $('#name-input').focus();
}

function hideForm () {
  $('#name-add').show();
  $('#name-form').hide()[0].reset();
}