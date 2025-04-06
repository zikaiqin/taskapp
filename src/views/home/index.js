try { CONSTANTS } catch { CONSTANTS = Object.freeze({'USERNAME': '<Username>', 'PRIVILEGE': 0}) }
jQuery(() => {
    const state = {
        context: 'task',
        tableFilters: {},
        updates: {},
    }
    buildNav(state);
    $('#profile').one('click', () => {
        buildProfile();
    });
    $('#logout').on('click', () => {
        logout();
    });
    const INTERVAL = 4000;
    state.pinger = setInterval(() => {
        if (state.lock || state.busy) return;
        state.busy = true;
        $.ajax('api/update', {
            type: 'GET',
            success: (res) => {
                const next = {};
                Array.from(res).forEach(({type, time, data}) => {
                    next[type] = {time, data}
                });
                if (state.skipNext) {
                    state.updates = next;
                    state.skipNext = false;
                    state.busy = false;
                    return;
                }
                const rebuild = Array.from(res)
                    .some(({type, time, data}) => type === state.context && time > state.updates[type]?.time);
                state.updates = next;
                if (rebuild) rebuildTable(state).then(
                    () => { state.busy = false; }
                );
                state.busy = false;
            },
            error: () => { state.busy = false; },
        });
    }, INTERVAL)
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
        task: 'Tâches',
        category: 'Catégories',
        user: 'Utilisateurs',
    }
    navLinks.find('a').on('click', function() {
        const context = $(this).attr('data-context');
        if (state.lock || !(context in title) || context === state.context) {
            return;
        }
        state.lock = true;
        state.skipNext = true;
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
            let modal = setupUserEditModal(state);
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col">Nom d'utilisateur</th>
                    <th scope="col">Courriel</th>
                    <th scope="col">Type d'utilisateur</th>
                    <th scope="col" class="row-actions"></th>
                </tr>`
            );
            table.find('thead').append(header);
            buildUserRows(state, table, modal);
            $('#table-container').append(table);
        },
    });
};
const setupUserEditModal = (state) => {
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
                        let hint = emailInput.siblings().filter('div');
                        hint.text(res.responseText);
                        emailInput.addClass('is-invalid');
                        emailInput.one('change input', () => {
                            emailInput.removeClass('is-invalid');
                            hint.text('Courriel invalide');
                        })
                        modalQuery.one('hidden.bs.modal', () => {
                            emailInput.removeClass('is-invalid');
                            hint.text('Courriel invalide');
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
                state.skipNext = true;
                rebuildTable(state);
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
                        <td>${CONSTANTS['USER_TYPE'] ? CONSTANTS['USER_TYPE'][privilege] : ''}</td>
                        <td class="row-actions">
                            <button class="btn btn-outline-light btn-sm border-0 rounded-circle">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                        </td>
                    </tr>`
        );
        row.find('button').on('click', () => {
            $('#edit-modal-label').text(`Modification de l'utilisateur ${username}`);
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
            let editModal = setupCategoryEditModal(state);
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col" style="display: none">ID de catégorie</th>
                    <th scope="col">Nom de catégorie</th>
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
            header.find('.btn-primary').on('click', () => {
                editModal.show();
            });
            table.find('thead').append(header);
            buildCategoryRows(state, table, deleteModal, editModal);
            $('#table-container').append(table);
        },
    });
};

const buildCategoryRows = (state, table, deleteModal, editModal) => {
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
        row.find('.btn-outline-light').on('click', () => {
            $('#edit-modal').attr('data-id', categoryID);
            editModal.show();
        });
        row.find('.btn-outline-danger').on('click', () => {
            triggerDeleteModal(deleteModal, `Voulez-vous supprimer la catégorie ${name}?`, () => {
                $.ajax('api/category/delete', {
                    type: 'POST',
                    data: { categoryID },
                    success: () => {
                        state.skipNext = true;
                        rebuildTable(state);
                    },
                });
            });
        });
        body.append(row);
    });
}

const setupCategoryEditModal = (state) => {
    let modalQuery = buildCategoryEditModal();
    let form = modalQuery.find('form');

    modalQuery.on('show.bs.modal', () => {
        const category = state.tableData.find(
            (row) => row.categoryID === modalQuery.attr('data-id'),
        );
        modalQuery.find('#edit-modal-label').text(
            category?.name ? `Modification de la catégorie ${category.name}` : 'Créer une catégorie',
        );
        form.find('#edit-form-name').val(category?.name ?? '');
        form.find('#edit-form-description').val(category?.description ?? '');
    });

    modalQuery.on('hidden.bs.modal', () => {
        modalQuery.removeAttr('data-id');
    });

    $('#modal-container').append(modalQuery);
    let modal = new bootstrap.Modal(modalQuery[0]);

    $('#edit-modal-submit').on('click', () => {
        if (!form[0].checkValidity()) {
            form.addClass('was-validated');
            return;
        }
        const categoryID = modalQuery.attr('data-id') ?? null;
        const action = categoryID ? 'edit' : 'add';
        $.ajax(`api/category/${action}`, {
            type: 'POST',
            data: {
                categoryID,
                name: $('#edit-form-name').val(),
                description: $('#edit-form-description').val(),
            },
            error: (res) => {
                form.removeClass('was-validated');
            },
            success: () => {
                modal.hide();
                state.skipNext = true;
                rebuildTable(state);
            },
        });
    });
    return modal;
}

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
            let editModal = setupTaskEditModal(state);
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
            header.find('.btn-primary').on('click', () => {
                editModal.show();
            });
            table.find('thead').append(header);
            buildTaskRows(state, table, deleteModal, editModal);

            $(document).on('refresh.table', () => {
                buildTaskRows(state, table, deleteModal, editModal);
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
        row.find('.btn-outline-light').on('click', () => {
            $('#edit-modal').attr('data-id', taskID);
            editModal.show();
        });
        row.find('.btn-outline-danger').on('click', () => {
            triggerDeleteModal(deleteModal, `Voulez-vous supprimer la tâche ${title}?`, () => {
                $.ajax('api/task/delete', {
                    type: 'POST',
                    data: { taskID },
                    success: () => {
                        state.skipNext = true;
                        rebuildTable(state);
                    },
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

const setupTaskEditModal = (state) => {
    let modalQuery = buildTaskEditModal();
    let form = modalQuery.find('form');
    let rebuildDropdown;
    let addBadge = (username, rebuild = true) => {
        let assigneesPreview = form.find('#edit-form-assignees-preview');
        let badge = $(
            `<span class="badge bg-secondary align-middle username-label">
                ${username}
                <button
                    class="btn btn-secondary btn-sm border-0 rounded-circle"
                    style="--bs-btn-padding-y: 0; --bs-btn-padding-x: 3.5px;"
                ><i class="bi bi-x"></i></button>
            </span>`
        );
        badge.find('button').on('click', function() {
            state.modalData.assignees =
                state.modalData.assignees.filter((name) => name !== username);
            $(this).parent().remove();
            rebuildDropdown();
        });
        assigneesPreview.append(badge);
        if (rebuild) rebuildDropdown();
    }

    rebuildDropdown = () => {
        const users = state.modalData.users.filter(
            (username) => !state.modalData.assignees.includes(username),
        );
        let button = $('#edit-form-assignees-add').show();
        let dropdown = form.find('#edit-form-assignees-dropdown');
        if (users.length === 0) {
            button.hide();
            return;
        }
        dropdown.empty();
        users.forEach((username) => {
            let item = $(`<li><a class="dropdown-item" role="button">${username}</a></li>`);
            item.on('click', function() {
                state.modalData.assignees.push(username);
                addBadge(username);
            });
            dropdown.append(item);
        });
        new bootstrap.Dropdown(button[0]);
    }

    modalQuery.on('show.bs.modal', async () => {
        state.modalData = {};
        await new Promise((resolve) => {
            $.ajax('api/user', {
                type: 'GET',
                success: (res) => {
                    state.modalData.users = res.map((row) => row['username']);
                    resolve();
                },
                error: () => {
                    state.modalData.users = [];
                    resolve();
                },
            })
        });
        const task = state.tableData.tasks.find(
            (row) => row.taskID === modalQuery.attr('data-id'),
        );
        modalQuery.find('#edit-modal-label').text(
            task?.title ? `Modification de la tâche ${task.title}` : 'Créer une tâche',
        );
        form.find('#edit-form-title').val(task?.title ?? '');
        form.find('#edit-form-description').val(task?.description ?? '');
        form.find('#edit-form-status').val(task?.status ?? 0);

        let categorySelect = form.find('#edit-form-category');
        state.tableData.categories.forEach((row) => {
            let option =
                $(`<option value="${row.categoryID}"
                        ${task?.categoryID === row.categoryID ? ' selected' : ''}>${row.name}</option>`);
            categorySelect.append(option);
        });

        let dateInput = form.find('#edit-form-date');
        dateInput.val(task?.startDate ?? new Date().toLocaleDateString('en-CA'));

        state.modalData.assignees = state.tableData.assignees
            .filter((row) => row['taskID'] === task?.taskID)
            .map((row) => row['username']);
        if (state.modalData.assignees.length > 0) {
            state.modalData.assignees.forEach(
                (assignee) => { addBadge(assignee, false) }
            );
        }
        rebuildDropdown();
    });

    modalQuery.on('hidden.bs.modal', () => {
        form.find('#edit-form-category').empty();
        form.find('#edit-form-assignees-preview').empty();
        modalQuery.removeAttr('data-id');
        delete state.modalData;
    });

    $('#modal-container').append(modalQuery);
    let modal = new bootstrap.Modal(modalQuery[0]);

    $('#edit-modal-submit').on('click', () => {
        if (!form[0].checkValidity()) {
            form.addClass('was-validated');
            return;
        }
        const taskID = modalQuery.attr('data-id') ?? null;
        const action = taskID ? 'edit' : 'add';
        $.ajax(`api/task/${action}`, {
            type: 'POST',
            data: {
                taskID,
                categoryID: $('#edit-form-category').val(),
                title: $('#edit-form-title').val(),
                description: $('#edit-form-description').val(),
                startDate: $('#edit-form-date').val(),
                status: $('#edit-form-status').val(),
                assignees: JSON.stringify(state.modalData.assignees),
            },
            error: (res) => {
                form.removeClass('was-validated');
            },
            success: () => {
                modal.hide();
                state.skipNext = true;
                rebuildTable(state);
            },
        });
    });
    return modal;
}

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
                    <h1 id="delete-modal-label" class="modal-title fs-5">Supprimer?</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button id="delete-modal-submit" class="btn btn-danger" data-bs-dismiss="modal">Supprimer</button>
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
                    <h1 id="edit-modal-label" class="modal-title fs-5">Modification de l'utilisateur</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form class="needs-validation" action="javascript:void 0" novalidate>
                        <div class="mb-3">
                            <label for="edit-form-username" class="col-form-label">Nom d'utilisateur</label>
                            <input id="edit-form-username" type="text" class="form-control" disabled readonly>
                            <div class="invalid-feedback">Cet utilisateur n'existe pas</div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-email" class="col-form-label">Courriel</label>
                            <input
                                id="edit-form-email"
                                type="email"
                                class="form-control"
                                pattern="[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$"
                                maxlength="255"
                                required
                            >
                            <div class="invalid-feedback">Courriel invalide</div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-privilege" class="col-form-label">Type d'utilisateur</label>
                            <select id="edit-form-privilege" class="form-select">
                                ${CONSTANTS['USER_TYPE'] ?
                                    CONSTANTS['USER_TYPE'].map((privilege, index) =>
                                        `<option value="${index}">${privilege}</option>`
                                    ).join('\n') : ''}
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button id="edit-modal-submit" class="btn btn-primary">Sauvegarder</button>
                </div>
            </div>
        </div>
    </div>`
);

const buildCategoryEditModal = () => $(
    `<div id="edit-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 id="edit-modal-label" class="modal-title text-truncate fs-5">Modification de la catégorie</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form action="javascript:void 0" novalidate>
                        <div class="mb-3">
                            <label for="edit-form-name" class="col-form-label">Nom de catégorie</label>
                            <input id="edit-form-name" type="text" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-description" class="col-form-label">Description</label>
                            <textarea id="edit-form-description" class="form-control"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button id="edit-modal-submit" class="btn btn-primary">Sauvegarder</button>
                </div>
            </div>
        </div>
    </div>`
);

const buildTaskEditModal = () => $(
    `<div id="edit-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 id="edit-modal-label" class="modal-title text-truncate fs-5">Modification de la tâche</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form action="javascript:void 0" novalidate>
                        <div class="mb-3">
                            <label for="edit-form-title" class="col-form-label">Titre</label>
                            <input id="edit-form-title" type="text" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-description" class="col-form-label">Description</label>
                            <textarea id="edit-form-description" class="form-control"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-category" class="col-form-label">Catégorie</label>
                            <select id="edit-form-category" class="form-select" required></select>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-assignees" class="col-form-label">Destinataires</label>
                            <input id="edit-form-assignees" type="text" style="display: none" disabled>
                            <h5 id="edit-form-assignees-preview"></h5>
                            <div class="dropdown dropend">
                                <button
                                    id="edit-form-assignees-add"
                                    class="btn btn-primary dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                >
                                    Ajouter
                                </button>
                                <ul id="edit-form-assignees-dropdown" class="dropdown-menu"></ul>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-date" class="col-form-label">Date de début</label>
                            <input
                                id="edit-form-date"
                                type="date"
                                class="form-control"
                                value="${new Date().toLocaleDateString('en-CA')}"
                                required
                            >
                        </div>
                        <div class="mb-3">
                            <label for="edit-form-status" class="col-form-label">Statut</label>
                            <select id="edit-form-status" class="form-select" required>
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
                    <button id="edit-modal-submit" class="btn btn-primary">Sauvegarder</button>
                </div>
            </div>
        </div>
    </div>`
);

const buildTaskFilterModal = () => $(
    `<div id="filter-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title text-truncate fs-5">Filtres</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form action="javascript:void 0" novalidate>
                        <div class="mb-3">
                            <label for="filter-form-title" class="col-form-label">Titre</label>
                            <input id="filter-form-title" type="text" class="form-control" placeholder="Aucun filtre">
                        </div>
                        <div class="mb-3">
                            <label for="filter-form-category" class="col-form-label">Nom de catégorie</label>
                            <input id="filter-form-category" type="text" class="form-control" placeholder="Aucun filtre">
                        </div>
                        <div class="mb-3">
                            <label for="filter-form-assignees" class="col-form-label">Destinataires</label>
                            <select id="filter-form-assignees" class="form-select mb-2">
                                <option value="-1" selected>Tous</option>
                                <option value="0">Incluant moi</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="filter-form-range" class="col-form-label">Date de début</label>
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
                            <label for="filter-form-status" class="col-form-label">Statut</label>
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
