<?php
namespace Api\Auth;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../../classes/database.php';
require_once __DIR__ . '/../../classes/globals.php';
require_once __DIR__ . '/../../helpers/session.php';
require_once __DIR__ . '/../../helpers/user.php';
require_once __DIR__ . '/../../util/request.php';
use Database;
use Globals;
use function Session\set as set_session;
use function Session\delete as delete_session;
use function Request\require_methods;
use function Request\require_values;
use function Request\require_authentication;
use function User\get_by_name as get_user_by_name;
use function User\get_by_email as get_user_by_email;
use function User\set as set_user;

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
            case 'logout':
                # Must use POST
                if (!require_methods('POST')) die();

                # Must be authenticated
                if (!require_authentication(Globals::get('USERNAME'))) die();

                delete_session(session_id(), Database::get());
                session_destroy();
                echo 'Logout success';
                exit();

            case 'login':
                # Must use POST
                if (!require_methods('POST')) die();

                # Must send 'username' and 'password' as form-data
                if (!require_values(
                    $username = $_POST['username'],
                    $password = $_POST['password'],
                )) die();

                # Cannot already be logged in
                if (Globals::get('USERNAME') !== false) {
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
                set_session(session_id(), $row['Username'], $_SERVER['REQUEST_TIME'], Database::get());

                echo 'Login success';
                exit();

            case 'register' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Must send 'username', 'email', 'password' and 'confirm'(password) as form-data
                if (!require_values(
                    $username = $_POST['username'],
                    $email = $_POST['email'],
                    $password = $_POST['password'],
                    $confirm = $_POST['confirm'],
                )) die();

                if (($ul = strlen($username) > 255) || ($pl = strlen($password) > 255) || strlen($email) > 255) {
                    http_response_code(400);
                    echo ($ul ? 'Username' : ($pl ? 'Password' : 'Email')) . ' is too long';
                    die();
                }

                # Passwords must match
                if ($password !== $confirm) {
                    http_response_code(400);
                    echo 'Passwords do not match';
                    die();
                }

                # Email must be valid
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo 'Email is not valid';
                    die();
                }

                # Username must be unique
                if (get_user_by_name($username, Database::get()) !== false) {
                    http_response_code(403);
                    echo 'Username is taken';
                    die();
                }

                # Email must be unique
                if (get_user_by_email($email, Database::get()) !== false) {
                    http_response_code(403);
                    echo 'Email already in use';
                    die();
                }

                # Destroy active session if authenticated
                if (delete_session(session_id(), Database::get()) > 0) {
                    session_destroy();
                    session_start();
                }

                # Insert new non-admin user into database
                $secret = password_hash($password, PASSWORD_DEFAULT);
                set_user($username, $email, $secret, 0, Database::get(), false);

                # Insert session ID into database, or replace if already exists
                set_session(session_id(), $username, $_SERVER['REQUEST_TIME'], Database::get());

                echo 'Registration success';
                exit();

            default :
                goto endpoint_not_found;
        }
    }
}
