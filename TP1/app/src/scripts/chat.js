$(document).ready(() => {
  const nameField = $('#name-input');

  $('#name-add').click(() => {
    showForm();
  });

  $('#name-confirm').click(() => {
    const form = $('#name-form');
    if (!form[0].checkValidity()) {
      form.addClass('was-validated');
      nameField.focus();
      return;
    }
    const name = nameField.val();
    addThread(name);
    hideForm();
  });

  $('#name-reset').click(() => {
    $('#name-form').removeClass('was-validated');
    nameField.focus();
  });

  $('#name-cancel').click(() => {
    hideForm();
  });

  addThread('Bienvenue')
    .addComment('Cliquez sur le "+" en haut \u00E0 droite pour ajouter une demande.')
    .addComment('Cliquez sur "Ajouter un commentaire" pour ajouter un commentaire.')
    .addComment('Cliquez sur la poubelle pour supprimer cet exemple.');
});

showForm = () => {
  $('#name-add').hide();
  $('#name-form').show();
  $('#name-input').focus();
}

hideForm = () => {
  $('#name-form').removeClass('was-validated').hide()[0].reset();
  $('#name-add').show();
}

addThread = (name) => {
  const thread = $(buildThread(name));
  const form = thread.find('.comment-form');
  const input = form.find('.comment-input');
  const addBtn = thread.find('.comment-add');
  const deleteBtn = thread.find('.thread-delete');
  const cancelBtn = form.find('.comment-cancel');
  const confirmBtn = form.find('.comment-confirm');

  let showCommentForm = () => {
    addBtn.hide();
    form.show();
    input.focus();
  }
  let hideCommentForm = () => {
    form.removeClass('was-validated').hide()[0].reset();
    addBtn.show();
  }

  addBtn.click(() => {
    showCommentForm();
  })

  deleteBtn.click(() => {
    thread.remove();
  })

  cancelBtn.click(() => {
    hideCommentForm();
  })

  confirmBtn.click(() => {
    if (!form[0].checkValidity()) {
      form.addClass('was-validated');
      input.focus();
      return;
    }
    const value = input.val();
    const comment = $(buildComment(value));
    thread.find('.comment-container').append(comment);
    hideCommentForm();
  });

  $('#thread-container').append(thread);

  let res = {
    addComment: (text) => {
      const comment = $(buildComment(text));
      thread.find('.comment-container').append(comment);
      return res;
    }
  }
  return res;
}

buildThread = (name) => `<div class="thread card shadow-sm">
      <div class="card-header">
        <div class="thread-header">
          <h6 class="card-subtitle mr-2 text-muted">${getTimeString()}</h6>
          <h5 class="card-title mb-0">${name.trim()}</h5>
          <button class="thread-delete btn btn-outline-danger rounded-circle">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="comment-container"></div>
        <div class="thread-footer">
          <form class="comment-form needs-validation" novalidate style="display: none">
            <textarea
              class="comment-input form-control mb-3"
              placeholder="Entrez votre commentaire"
              rows="3"
              required
            ></textarea>
            <div class="comment-actions">
              <button type="button" class="comment-cancel btn btn-danger mr-3">Annuler</button>
              <button type="button" class="comment-confirm btn btn-primary">Ajouter</button>
            </div>
          </form>
          <button class="comment-add btn btn-primary">
            Ajouter un commentaire
          </button>
        </div>
      </div>
    </div>`;

buildComment = (comment) =>
  `<div class="comment"><small class="text-secondary mr-1">${getTimeString()}</small>${comment.trim()}</div>`;

getTimeString = () => {
  const time = new Date();
  return `${
    time.getHours() < 10 ? '0' + time.getHours().toString() : time.getHours()
  }:${
    time.getMinutes() < 10 ? '0' + time.getMinutes().toString() : time.getMinutes()
  }`
};