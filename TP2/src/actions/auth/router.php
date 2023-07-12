<?php
namespace Api\Auth;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../../classes/database.php';
require_once __DIR__ . '/../../util/globals.php';
require_once __DIR__ . '/../../util/session.php';
require_once __DIR__ . '/../../util/request.php';
require_once __DIR__ . '/../../util/user.php';
use Database;
use function Session\get as get_session;
use function Session\add as add_session;
use function Request\require_methods;
use function Request\require_values;
use function User\get_by_name as get_user_by_name;
use function User\add as add_user;

class Router {
    private function __construct() {}

    public static function dispatch(array $path_arr) {
        if (count($path_arr) <= 0 || count($path_arr) > 1) {
            endpoint_not_found:
            http_response_code(404);
            echo 'Nothing here';
            die();
        }

        switch ($path_arr[0]) {
            case 'login':
                # Must use POST
                if (!require_methods('POST')) die();

                # Must send 'username' and 'password' as form-data
                if (!require_values(
                    $username = $_POST['username'],
                    $password = $_POST['password'],
                )) die();

                # Cannot already be logged in
                if (!is_bool(get_session(session_id(), Database::get()))) {
                    http_response_code(403);
                    echo 'Already logged in';
                    die();
                }

                # Username and password must match
                $row = get_user_by_name($username, Database::get());
                if (!is_array($row) || !password_verify($password, $row['Password'])) {
                    http_response_code(401);
                    echo 'Incorrect login credentials';
                    die();
                }

                # Insert session ID into database, or replace if already exists
                add_session(session_id(), $row['UserID'], $_SERVER['REQUEST_TIME'], Database::get());

                echo 'Login success';
//                $redirect =
//                    rtrim("https://$_SERVER[HTTP_HOST]", '/') . global_get('BASE_URL') . '/home';
//                header("Location: $redirect");
                exit();

            case 'register' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Must send 'username', 'password' and 'confirm'(password) as form-data
                if (!require_values(
                    $username = $_POST['username'],
                    $password = $_POST['password'],
                    $confirm = $_POST['confirm'],
                )) die();

                # Username must be a valid email
                if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo 'Email is not valid';
                    die();
                }

                # Passwords must match
                if ($password !== $confirm) {
                    http_response_code(400);
                    echo 'Passwords do not match';
                    die();
                }

                # Username must be unique
                if (!is_bool(get_user_by_name($username, Database::get()))) {
                    http_response_code(401);
                    echo 'Account already exists';
                    die();
                }

                $secret = password_hash($password, PASSWORD_DEFAULT);

                # Generate a unique ID for the user
                $uid = bin2hex(random_bytes(16));

                # Insert new non-admin user into database
                add_user($uid, $username, $secret, 0, Database::get());

                # Insert session ID into database, or replace if already exists
                add_session(session_id(), $uid, $_SERVER['REQUEST_TIME'], Database::get());

                echo 'Registration success';
//                $redirect =
//                    rtrim("https://$_SERVER[HTTP_HOST]", '/') . global_get('BASE_URL') . '/home';
//                header("Location: $redirect");
                exit();

            default :
                goto endpoint_not_found;
        }
    }
}
