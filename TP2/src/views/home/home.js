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
    if (c.width() > el.width()) {
        el.attr({
            'data-bs-toggle': 'tooltip',
            'data-bs-placement': 'left',
            'data-bs-title': CONSTANTS['USERNAME'],
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
            state.data = Array.from(res);
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
            let body = table.find('tbody');
            state.data.forEach(({ username, email, privilege }) => {
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
                body.append(row);
            });
            $('#table-container').append(table);
        },
    });
};

const buildCategoryTable = async (state) => {
    return $.ajax('api/category', {
        type: 'GET',
        error: () => { void 0; },
        success: (res) => {
            state.data = Array.from(res);
            let table = buildTableFrame();
            let header = $(
                `<tr>
                    <th scope="col" style="display: none">Category ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Description</th>
                    <th scope="col" class="row-actions">
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
            state.data.forEach(({ categoryID, name, description }) => {
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
            state.data = { categories, tasks, assignees };

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
                        <th scope="col" class="row-actions">
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
                const categoryName = categories.find((row) => row['categoryID'] === categoryID)?.name;
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
                        <td>${(CONSTANTS['TASK_STATUS'] ?? {})[status]}</td>
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
                body.append(row);
            });
            $('#table-container').append(table);
        },
    });
};

const buildTableFrame = () => $(
    `<table class="mb-0 table table-dark">
        <thead></thead>
        <tbody class="table-group-divider table-dark"></tbody>
    </table>`
);
