try { CONSTANTS } catch { CONSTANTS = Object.freeze({'USERNAME': '<Username>', 'PRIVILEGE': 0}) }
jQuery(() => {
    const state = {
        context: 'task'
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
            <a class="nav-link active" role="button" data-context="task">Tasks</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" role="button" data-context="category">Categories</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" role="button" data-context="user">Users</a>
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
                    <th scope="col">Username</th>
                    <th scope="col">Email</th>
                    <th scope="col">Privilege</th>
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
            error: () => {
                form.addClass('was-validated');
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
                    <th scope="col" style="display: none">Category ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Description</th>
                    <th scope="col" class="row-actions pt-0">
                        <div class="table-header-actions">
                            <button class="btn btn-primary btn-sm border-0 rounded-pill flex-grow-1">
                                <i class="bi bi-plus-lg"></i>
                                <span>New</span>
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
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col" style="display: none">Task ID</th>
                    <th scope="col" style="display: none">Creator</th>
                    <th scope="col">Title</th>
                    <th scope="col">Description</th>
                    <th scope="col">Category</th>
                    <th scope="col">Start Date</th>
                    <th scope="col">Assignees</th>
                    <th scope="col">Status</th>
                    <th scope="col" class="row-actions pt-0">
                        <div class="table-header-actions">
                            <button class="btn btn-primary btn-sm border-0 rounded-pill flex-grow-1">
                                <i class="bi bi-plus-lg"></i>
                                <span>New</span>
                            </button>
                        </div>
                    </th>
                </tr>`
            );
            table.find('thead').append(header);

            const body = table.find('tbody');
            tasks.forEach(({ taskID, categoryID, creatorName, title, description, startDate, status }) => {
                const categoryName =
                    categories.find((row) => row['categoryID'] === categoryID)?.name ?? '<Category not found>';
                const assigned = assignees
                    .filter((row) => row['taskID'] === taskID)
                    .map((row) => row['username']);
                let row = $(
                    `<tr class="align-middle">
                        <th scope="row" style="display: none">${taskID}</th>
                        <td style="display: none">${creatorName}</td>
                        <td>${title}</td>
                        <td class="text-truncate">${description}</td>
                        <td>${categoryName}</td>
                        <td>${startDate}</td>
                        <td class="text-truncate">${assigned.join(', ')}</td>
                        <td>${(CONSTANTS['TASK_STATUS'] ?? {})[status] ?? '<Status not found>'}</td>
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
            $('#table-container').append(table);
        },
    });
};

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

const buildTableFrame = () => $(
    `<table class="mb-0 table table-dark">
        <thead></thead>
        <tbody class="table-group-divider table-dark"></tbody>
    </table>`
);
