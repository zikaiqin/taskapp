<?php
namespace Api\Task;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../../classes/database.php';
require_once __DIR__ . '/../../classes/globals.php';
require_once __DIR__ . '/../../helpers/assignee.php';
require_once __DIR__ . '/../../helpers/category.php';
require_once __DIR__ . '/../../helpers/task.php';
require_once __DIR__ . '/../../helpers/update.php';
require_once __DIR__ . '/../../helpers/user.php';
require_once __DIR__ . '/../../util/request.php';
use Database;
use Globals;
use function Assignee\assign as assign_to;
use function Assignee\fetch_all as fetch_assignees;
use function Assignee\verify as verify_assignees;
use function Category\get_by_id as get_category_by_id;
use function Request\require_methods;
use function Request\require_values;
use function Request\require_authentication;
use function Request\require_privilege;
use function Request\to_camel_case;
use function Task\fetch_all as fetch_tasks;
use function Task\get as get_task_by_id;
use function Task\set as set_task;
use function Task\delete as delete_task;
use function Update\set as set_update;
use function User\fetch_all as fetch_users;

class Router {
    private function __construct() {}

    public static function dispatch(array $path_arr) {
        if (count($path_arr) > 1) {
            endpoint_not_found:
            http_response_code(404);
            echo 'Nothing here';
            die();
        }

        # Honor GET requests on /api/task
        if (count($path_arr) === 0) {
            if (!require_methods('GET')) die();
            if (
                ($tasks = fetch_tasks(Database::get())) === false ||
                ($assignees = fetch_assignees(Database::get())) === false
            ) {
                http_response_code(500);
                echo 'Database error';
                die();
            }
            $res = json_encode(
                ['tasks' => to_camel_case($tasks), 'assignees' => to_camel_case($assignees)],
                JSON_UNESCAPED_UNICODE,
            );
            header('Content-type: application/json');
            echo $res;
            exit();
        }

        switch ($path_arr[0]) {
            case 'add' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Requires authentication
                if (!require_authentication($username = Globals::get('USERNAME'))) die();

                # Must send 'categoryID', 'title', 'startDate', 'status' and 'assignees' as form-data
                if (!require_values(
                    $title = $_POST['title'],
                    $raw_date = $_POST['startDate'],
                    $status = $_POST['status'],
                    $assign_json = $_POST['assignees'],
                )) die();

                # Requires 0 <= status <= 255
                if (!is_numeric($status) || ($status = (int) $status) < 0 || $status > 255) {
                    http_response_code(400);
                    echo 'Invalid status';
                    die();
                }

                # Title must not be longer than 64 chars
                if (strlen($title) > 64) {
                    http_response_code(400);
                    echo 'Title is too long';
                    die();
                }

                # Date must be formatted correctly
                if (($date_obj = date_create($raw_date)) === false) {
                    http_response_code(400);
                    echo 'Malformed date string';
                    die();
                }

                # Assignees must be formatted correctly
                if (($assignees = json_decode($assign_json, true)) === null || !is_array($assignees)) {
                    http_response_code(400);
                    echo 'Assignee data unreadable';
                    die();
                }

                # Category must exist
                $category_id = $_POST['categoryID'] === '' ? null : $_POST['categoryID'];
                if (isset($_POST['categoryID']) && get_category_by_id($category_id, Database::get()) === false) {
                    http_response_code(400);
                    echo 'Category does not exist';
                    die();
                }

                # All assignees must exist
                if (!verify_assignees($assignees, fetch_users(Database::get()))) die();

                # Generate 128-bit uid
                $task_id = bin2hex(random_bytes(16));

                # Put new task in database
                set_task(
                    $task_id,
                    $category_id,
                    $username,
                    $title,
                        $_POST['description'] ?? '',
                    $date_obj->format('Y-m-d'),
                    $status,
                    Database::get(),
                    false,
                );

                # Assign task to all assignees
                assign_to($task_id, Database::get(), ...$assignees);

                $update = ['action' => 'add', 'users' => $assignees];
                set_update(
                    2,
                    time(),
                    json_encode($update, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    Database::get()
                );

                echo 'Task created';
                exit();

            case 'edit' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Must send 'taskID', 'categoryID', 'title', 'startDate', 'status' and 'assignees' as form-data
                if (!require_values(
                    $task_id = $_POST['taskID'],
                    $category_id = $_POST['categoryID'],
                    $title = $_POST['title'],
                    $raw_date = $_POST['startDate'],
                    $status = $_POST['status'],
                    $assign_json = $_POST['assignees'],
                )) die();

                # Requires 0 <= status <= 255
                if (!is_numeric($status) || ($status = (int) $status) < 0 || $status > 255) {
                    http_response_code(400);
                    echo 'Invalid status';
                    die();
                }

                # Date must be formatted correctly
                if (($date_obj = date_create($raw_date)) === false) {
                    http_response_code(400);
                    echo 'Malformed date string';
                    die();
                }

                # Assignees must be formatted correctly
                if (($assignees = json_decode($assign_json, true)) === null || !is_array($assignees)) {
                    http_response_code(400);
                    echo 'Assignee data unreadable';
                    die();
                }

                # Task must exist
                if (($row = get_task_by_id($task_id, Database::get())) === false) {
                    task_not_found:
                    http_response_code(404);
                    echo 'Task not found';
                    die();
                }

                # Must be creator OR an admin
                if (Globals::get('USERNAME') !== $row['CreatorName'] &&
                    !require_privilege(Globals::get('PRIVILEGE'), 1)) die();

                # All assignees must exist
                if (!verify_assignees($assignees, fetch_users(Database::get()))) die();

                # Check for changes
                if (
                    $row['StartDate'] === ($date_string = $date_obj->format('Y-m-d')) &&
                    $row['CategoryID'] === $category_id &&
                    $row['Title'] === $title &&
                    $row['Status'] === $status &&
                    $row['Description'] === ($_POST['description'] ?? '')
                ) {
                    http_response_code(200);
                    echo assign_to($task_id, Database::get(), $assignees) === 0 ? 'No changes' : 'Task modified';
                    exit();
                }

                # Title must not be longer than 64 chars
                if (strlen($title) > 64) {
                    http_response_code(400);
                    echo 'Title is too long';
                    die();
                }

                # Category must exist
                if (
                    $row['CategoryID'] !== $category_id &&
                    get_category_by_id($category_id, Database::get()) === false
                ) {
                    http_response_code(400);
                    echo 'Category does not exist';
                    die();
                }

                # Put new task in database
                set_task(
                    $task_id,
                    $category_id,
                    $row['CreatorName'],
                    $title,
                    $_POST['description'] ?? '',
                    $date_string,
                    $status,
                    Database::get(),
                );

                # Assign task to all assignees
                assign_to($task_id, Database::get(), ...$assignees);

                $notify = Globals::get('USERNAME') === $row['CreatorName'] ?
                    $assignees :
                    array_unique(array_merge($assignees, [$row['CreatorName']]));
                $update = ['action' => 'edit', 'users' => $notify];
                set_update(
                    2,
                    time(),
                    json_encode($update, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    Database::get()
                );

                echo 'Task modified';
                exit();

            case 'delete' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Must send 'taskID'
                if (!require_values($task_id = $_POST['taskID'])) die();

                # Task must exist
                if (($row = get_task_by_id($task_id, Database::get())) === false) goto task_not_found;

                # Must be creator OR an admin
                if (Globals::get('USERNAME') !== $row['CreatorName'] &&
                    !require_privilege(Globals::get('PRIVILEGE'), 1)) die();

                $assignees = array_map(fn($r) => $r['Username'],
                    array_filter(fetch_assignees(Database::get()), fn($s) => $s['TaskID'] === $task_id)
                );

                # Task must exist
                if (delete_task($task_id, Database::get()) <= 0) goto task_not_found;

                $notify = Globals::get('USERNAME') === $row['CreatorName'] ?
                    $assignees :
                    array_unique(array_merge($assignees, [$row['CreatorName']]));
                $update = ['action' => 'delete', 'users' => $notify];
                set_update(
                    2,
                    time(),
                    json_encode($update, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    Database::get()
                );

                echo 'Task deleted';
                exit();

            default :
                goto endpoint_not_found;
        }

    }
}
