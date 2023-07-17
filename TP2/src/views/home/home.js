try { CONSTANTS } catch { CONSTANTS = Object.freeze({'USERNAME': '<Username>', 'PRIVILEGE': 0}) }
jQuery(() => {
    const state = {
        context: 'task',
        tableFilters: {},
    }
    buildNav(state);
    $('#profile').one('click', () => {
        buildProfile();
    });
    $('#logout').on('click', () => {
        logout();
    });
    buildTaskTable(state).then(() => {
        $('body').show();
    })
});

const logout = () => {
    $.ajax('api/auth/logout', {
        type: 'POST',
        success: () => { window.location.replace('login') },
        error: () => { window.location.replace('login') },
    });
};

const buildProfile = () => {
    let el = $('#username').text(CONSTANTS['USERNAME']);
    let c = el.clone().removeClass('text-truncate').appendTo('body');
    if (el.height() > c.height()) {
        el.addClass('text-truncate');
        el.attr({
            'data-bs-toggle': 'tooltip',
            'data-bs-title': CONSTANTS['USERNAME'],
            'data-bs-delay': '{"show":150,"hide":0}',
        });
        new bootstrap.Tooltip(el[0]);
    }
    c.remove();
};

const buildNav = (state) => {
    if (CONSTANTS['PRIVILEGE'] !== 1) {
        return;
    }
    let navLinks = $(`
        <li class="nav-item">
            <a class="nav-link active" role="button" data-context="task">Tâches</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" role="button" data-context="category">Catégories</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" role="button" data-context="user">Utilisateurs</a>
        </li>
    `);

    const title = {
        task: 'Tasks',
        category: 'Categories',
        user: 'Users',
    }
    navLinks.find('a').on('click', function() {
        const context = $(this).attr('data-context');
        if (state.lock || !(context in title) || context === state.context) {
            return;
        }
        state.lock = true;
        state.context = context;
        let siblings = $(this).parent().siblings().find('a');
        siblings.removeClass('active').prop('disabled', true);
        $(this).addClass('active');
        $('#table-title').text(title[context]);
        rebuildTable(state).then(() => {
            state.lock = false;
            siblings.prop('disabled', false);
        });
    });

    $('#nav-list').empty().append(navLinks);
};

const rebuildTable = async (state) => {
    $('#table-container').empty();
    $('#modal-container').empty();
    switch (state.context) {
        case 'task':
            return buildTaskTable(state);
        case 'category':
            return buildCategoryTable(state);
        case 'user':
            return buildUserTable(state);
        default :
            return Promise.resolve();
    }
};

const buildUserTable = async (state) => {
    return $.ajax('api/user', {
        type: 'GET',
        error: () => { void 0; },
        success: (res) => {
            state.tableData = Array.from(res);
            let modal = setupUserEditModal();
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col">Nom d'utilisateur</th>
                    <th scope="col">Courriel</th>
                    <th scope="col">Privilège</th>
                    <th scope="col" class="row-actions"></th>
                </tr>`
            );
            table.find('thead').append(header);
            buildUserRows(state, table, modal);
            $('#table-container').append(table);
        },
    });
};
const setupUserEditModal = () => {
    let modalQuery = buildUserEditModal();
    $('#modal-container').append(modalQuery);
    let modal = new bootstrap.Modal(modalQuery[0])

    let form = modalQuery.find('form')
    modalQuery.on('hidden.bs.modal', () => {
        form.removeClass('was-validated');
    })
    $('#edit-modal-submit').on('click', () => {
        if (!form[0].checkValidity()) {
            form.addClass('was-validated');
            return;
        }
        $.ajax('api/user/edit', {
            type: 'POST',
            data: {
                username: $('#edit-form-username').val(),
                email: $('#edit-form-email').val(),
                privilege: $('#edit-form-privilege').val(),
            },
            error: (res) => {
                form.removeClass('was-validated');
                switch (res.responseText.split(' ')[0]) {
                    case 'Email':
                        let emailInput = $('#edit-form-email');
                        let hint = emailInput.siblings().find('div')
                        hint.text(res.responseText);
                        emailInput.addClass('is-invalid');
                        emailInput.one('change input', () => {
                            emailInput.removeClass('is-invalid');
                            hint.text('Please enter a valid email');
                        })
                        modalQuery.one('hidden.bs.modal', () => {
                            emailInput.removeClass('is-invalid');
                            hint.text('Please enter a valid email');
                        })
                        break;
                    case 'User':
                        $('#edit-modal-submit').prop('disabled', true);
                        let usernameInput = $('#edit-form-username');
                        usernameInput.addClass('is-invalid');
                        modalQuery.one('hidden.bs.modal', () => {
                            usernameInput.removeClass('is-invalid');
                        })
                        break;
                }
            },
            success: () => {
                modal.hide();
            },
        });
    });
    return modal;
}
const buildUserRows = (state, table, modal) => {
    let body = table.find('tbody');
    body.empty();
    state.tableData.forEach(({ username, email, privilege }) => {
        let row = $(
            `<tr class="align-middle">
                        <td>${username}</td>
                        <td>${email}</td>
                        <td>${privilege === 1 ? 'Administrator' : 'User'}</td>
                        <td class="row-actions">
                            <button class="btn btn-outline-light btn-sm border-0 rounded-circle">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                        </td>
                    </tr>`
        );
        row.find('button').on('click', () => {
            $('#edit-modal-label').text(`Modify user ${username}`);
            $('#edit-form-username').val(username);
            $('#edit-form-email').val(email);
            $('#edit-form-privilege').val(privilege);
            modal.show();
        })
        body.append(row);
    });
}

const buildCategoryTable = async (state) => {
    return $.ajax('api/category', {
        type: 'GET',
        error: () => { void 0; },
        success: (res) => {
            state.tableData = Array.from(res);
            let deleteModal = setupDeleteModal();
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col" style="display: none">ID de catégorie</th>
                    <th scope="col">Nom</th>
                    <th scope="col">Description</th>
                    <th scope="col" class="row-actions pt-0">
                        <div class="table-header-actions">
                            <button class="btn btn-primary btn-sm border-0 rounded-circle">
                                <i class="bi bi-plus-lg"></i>
                            </button>
                        </div>
                    </th>
                </tr>`
            );
            table.find('thead').append(header);
            let body = table.find('tbody');
            state.tableData.forEach(({ categoryID, name, description }) => {
                let row = $(
                    `<tr class="align-middle">
                        <th scope="row" style="display: none">${categoryID}</th>
                        <td>${name}</td>
                        <td class="text-truncate">${description}</td>
                        <td class="row-actions">
                            <button class="btn btn-outline-light btn-sm border-0 rounded-circle">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm border-0 rounded-circle">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </td>
                    </tr>`
                );
                row.find('.btn-outline-danger').on('click', () => {
                    triggerDeleteModal(deleteModal, `Delete category ${name}?`, () => {
                        $.ajax('api/category/delete', {
                            type: 'POST',
                            data: { categoryID },
                        });
                    });
                });
                body.append(row);
            });
            $('#table-container').append(table);
        },
    });
};

const buildTaskTable = async (state) => {
    return $.ajax('api/task', {
        type: 'GET',
        error: () => { void 0; },
        success: async (res) => {
            let c = await new Promise((resolve) => {
                $.ajax('api/category', {
                    type: 'GET',
                    error: () => resolve([]),
                    success: (r) => resolve(r),
                });
            });
            const categories = Array.from(c);
            const tasks = Array.from(res['tasks']);
            const assignees = Array.from(res['assignees']);
            state.tableData = { categories, tasks, assignees };

            let deleteModal = setupDeleteModal();
            let filterModal = setupTaskFilterModal(state);
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col" style="display: none">ID de tâche</th>
                    <th scope="col" style="display: none">Créateur</th>
                    <th scope="col">Titre</th>
                    <th scope="col">Description</th>
                    <th scope="col">Catégorie</th>
                    <th scope="col">Date de début</th>
                    <th scope="col">Destinataires</th>
                    <th scope="col">Statut</th>
                    <th scope="col" class="row-actions pt-0">
                        <button class="btn btn-outline-light btn-sm border-0 rounded-circle">
                            <i class="bi bi-funnel-fill"></i>
                        </button>
                        <button class="btn btn-primary btn-sm border-0 rounded-circle">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </th>
                </tr>`
            );
            header.find('.btn-outline-light').on('click', () => {
                filterModal.show();
            });
            table.find('thead').append(header);
            buildTaskRows(state, table, deleteModal);

            $(document).on('refresh.table', () => {
                buildTaskRows(state, table, deleteModal);
            })

            $('#table-container').append(table);
        },
    });
};

const buildTaskRows = (state, table, deleteModal, editModal) => {
    let body = table.find('tbody');
    body.empty();
    state.tableData.tasks.forEach(({ taskID, categoryID, creatorName, title, description, startDate, status }) => {
        const categoryName = state.tableData.categories
            .find((row) => row['categoryID'] === categoryID)?.name ?? '<Category not found>';
        const assignees = state.tableData.assignees
            .filter((row) => row['taskID'] === taskID)
            .map((row) => row['username']);

        const filtered = isTaskFiltered({title, categoryName, assignees, startDate, status}, state.tableFilters);
        if (filtered) return;

        let row = $(
            `<tr class="align-middle">
                        <th scope="row" style="display: none">${taskID}</th>
                        <td style="display: none">${creatorName}</td>
                        <td>${title}</td>
                        <td class="text-truncate">${description}</td>
                        <td>${categoryName}</td>
                        <td>${startDate}</td>
                        <td class="text-truncate">${assignees.join(', ')}</td>
                        <td>${CONSTANTS['TASK_STATUS']?.at(status) ?? '<Status not found>'}</td>
                        <td class="row-actions">
                           ${CONSTANTS['PRIVILEGE'] === 1 || creatorName === CONSTANTS['USERNAME'] ?
                `<button class="btn btn-outline-light btn-sm border-0 rounded-circle">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm border-0 rounded-circle">
                                <i class="bi bi-trash-fill"></i>
                            </button>` : ''}
                        </td>
                    </tr>`
        );
        row.find('.btn-outline-danger').on('click', () => {
            triggerDeleteModal(deleteModal, `Delete task ${title}?`, () => {
                $.ajax('api/task/delete', {
                    type: 'POST',
                    data: { taskID },
                });
            });
        });
        body.append(row);
    });
}

const isTaskFiltered = (row, filters) =>  (
        (filters.title && !row.title.includes(filters.title)) ||
        (filters.category && !row.categoryName.includes(filters.category)) ||
        (filters.assignees === 0 && !row.assignees.includes(CONSTANTS['USERNAME'])) ||
        (filters.status !== undefined && filters.status !== -1 && row.status !== filters.status) ||
        (filters.range !== undefined && filters.range !== -1 &&
            (filters.range === 0 ? row.startDate > filters.date : row.startDate < filters.date))
);

const setupTaskFilterModal = (state) => {
    let modalQuery = buildTaskFilterModal();
    let form = modalQuery.find('form');

    form.find('#filter-form-range').on('change', function() {
       if (Number($(this).val()) === -1) {
           form.find('#filter-form-date').hide();
       } else {
           form.find('#filter-form-date').show();
       }
    });
    modalQuery.find('#filter-modal-submit').on('click', () => {
        form.find(':input').each(function() {
            const prop = $(this).attr('id').split('-').at(-1);
            state.tableFilters[prop] =
                $(this).is('select') ? Number($(this).val()) : $(this).val();
        });
        $(document).trigger('refresh.table');
    });
    modalQuery.find('#filter-modal-clear').on('click', () => {
        state.tableFilters = {};
        $(document).trigger('refresh.table');
    });
    modalQuery.on('show.bs.modal', () => {
        Object.entries(state.tableFilters).forEach(([key, value]) => {
            form.find(`#filter-form-${key}`).val(value);
        });
        if (Number(form.find('#filter-form-range').val()) === -1) {
            form.find('#filter-form-date').hide();
        }
    });
    modalQuery.on('hidden.bs.modal', () => {
        form.find('select').val(-1);
        form.find('input').val('')
            .filter('#filter-form-date').val(new Date().toLocaleDateString('en-CA'));
    });

    $('#modal-container').append(modalQuery);
    return new bootstrap.Modal(modalQuery[0]);
}

const setupDeleteModal = () => {
    let modalQuery = buildDeleteModal();
    modalQuery.on('hidden.bs.modal', () => {
        modalQuery.find('#delete-modal-submit').off('click');
    })
    $('#modal-container').append(modalQuery);
    return new bootstrap.Modal(modalQuery[0]);
}

const triggerDeleteModal = (modal, message, callback) => {
    $('#delete-modal-label').text(message);
    $('#delete-modal-submit').on('click', () => {
        callback();
    });
    modal.show();
}

const buildDeleteModal = () => $(
    `<div id="delete-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 id="delete-modal-label" class="modal-title text-truncate fs-5">Delete</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button id="delete-modal-submit" class="btn btn-danger" data-bs-dismiss="modal">Delete</button>
                </div>
            </div>
        </div>
    </div>`
);

const buildUserEditModal = () => $(
    `<div id="edit-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 id="edit-modal-label" class="modal-title text-truncate fs-5">Modify User</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form class="needs-validation" action="javascript:void 0" novalidate>
                        <div class="mb-3">
                            <label for="edit-form-username" class="col-form-label">Username</label>
                            <input id="edit-form-username" type="text" class="form-control" disabled readonly>
                            <div class="invalid-feedback">User does not exist</div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-email" class="col-form-label">Email</label>
                            <input
                                id="edit-form-email"
                                type="email"
                                class="form-control"
                                pattern="[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$"
                                maxlength="255"
                                required
                            >
                            <div class="invalid-feedback">Please enter a valid email</div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-privilege" class="col-form-label">Privilege</label>
                            <select id="edit-form-privilege" class="form-select">
                                <option value="0">User</option>
                                <option value="1">Administrator</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button id="edit-modal-submit" class="btn btn-primary">Save</button>
                </div>
            </div>
        </div>
    </div>`
);

const buildTaskFilterModal = () => $(
    `<div id="filter-modal" class="modal fade" tabindex="-1" xmlns="http://www.w3.org/1999/html">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 id="edit-modal-label" class="modal-title text-truncate fs-5">Filtres</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form action="javascript:void 0" novalidate>
                        <div class="mb-3">
                            <label for="filter-form-title" class="col-form-label">Titre:</label>
                            <input id="filter-form-title" type="text" class="form-control" placeholder="Aucun filtre">
                        </div>
                        <div class="mb-3">
                            <label for="filter-form-category" class="col-form-label">Nom de catégorie:</label>
                            <input id="filter-form-category" type="text" class="form-control" placeholder="Aucun filtre">
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-assignees" class="col-form-label">Destinataires:</label>
                            <select id="filter-form-assignees" class="form-select mb-2">
                                <option value="-1" selected>Tous</option>
                                <option value="0">Incluant moi</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="filter-form-range" class="col-form-label">Date de début:</label>
                            <select id="filter-form-range" class="form-select mb-2">
                                <option value="-1" selected>Tous</option>
                                <option value="0">Avant</option>
                                <option value="1">Après</option>
                            </select>
                            <input
                                id="filter-form-date"
                                type="date"
                                class="form-control"
                                value="${new Date().toLocaleDateString('en-CA')}"
                            >
                        </div>
                        <div class="mb-3">
                            <label for="filter-form-status" class="col-form-label">Statut:</label>
                            <select id="filter-form-status" class="form-select">
                                <option value="-1" selected>Tous</option>
                                ${CONSTANTS['TASK_STATUS'] ?
                                    CONSTANTS['TASK_STATUS'].map((status, index) =>
                                        `<option value="${index}">${status}</option>`
                                    ).join('\n') : ''}
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button id="filter-modal-submit" class="btn btn-primary" data-bs-dismiss="modal">Sauvegarder</button>
                    <button id="filter-modal-clear" class="btn btn-danger" data-bs-dismiss="modal">Tout effacer</button>
                </div>
            </div>
        </div>
    </div>`
);

const buildTableFrame = () => $(
    `<table class="mb-0 table table-dark">
        <thead></thead>
        <tbody class="table-group-divider table-dark"></tbody>
    </table>`
);
