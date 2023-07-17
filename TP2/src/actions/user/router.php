<?php
namespace Api\User;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../../classes/database.php';
require_once __DIR__ . '/../../classes/globals.php';
require_once __DIR__ . '/../../helpers/user.php';
require_once __DIR__ . '/../../util/request.php';
use Database;
use Globals;
use function Request\require_methods;
use function Request\require_values;
use function Request\require_authentication;
use function Request\require_privilege;
use function Request\to_camel_case;
use function User\fetch_all as fetch_users;
use function User\get_by_email as get_user_by_email;
use function User\get_by_name as get_user_by_name;
use function User\set as set_user;

class Router {
    private function __construct() {}

    public static function dispatch(array $path_arr) {
        if (count($path_arr) > 1) {
            endpoint_not_found:
            http_response_code(404);
            echo 'Nothing here';
            die();
        }

        # Honor GET requests on /api/user
        if (count($path_arr) === 0) {
            if (!require_methods('GET')) die();
            if (($table = fetch_users(Database::get())) === false) {
                http_response_code(500);
                echo 'Database error';
                die();
            }
            $res = json_encode(to_camel_case($table), JSON_UNESCAPED_UNICODE);
            header('Content-type: application/json');
            echo $res;
            exit();
        }

        switch ($path_arr[0]) {
            case 'edit' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Requires authentication and admin privilege
                if (!require_authentication(Globals::get('USERNAME')) ||
                    !require_privilege(Globals::get('PRIVILEGE'), 1)) die();

                # Must send 'username', 'email', 'password' and 'confirm'(password) as form-data
                if (!require_values(
                    $username = $_POST['username'],
                    $email = $_POST['email'],
                    $privilege = $_POST['privilege'],
                )) die();

                if (strlen($email) > 255) {
                    http_response_code(400);
                    echo 'Email is too long';
                    die();
                }

                if (!is_numeric($privilege) || ($privilege = (int) $privilege) < 0 || $privilege > 1) {
                    http_response_code(400);
                    echo 'Privilege is invalid';
                    die();
                }

                # Email must be valid
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo 'Email is not valid';
                    die();
                }

                # Username must belong to an existing user
                if (($res = get_user_by_name($username, Database::get())) === false) {
                    http_response_code(404);
                    echo 'User not found';
                    die();
                }

                if (
                    $res['Email'] === $email &&
                    $res['Privilege'] === $privilege
                ) {
                    http_response_code(200);
                    echo 'No changes';
                    exit();
                }

                # Email must be unique
                if ($res['Email'] !== $email && get_user_by_email($email, Database::get()) !== false) {
                    http_response_code(403);
                    echo 'Email already in use';
                    die();
                }

                # Update user with new info
                set_user($username, $email, $res['Password'], $privilege, Database::get());
                echo 'User modified';
                exit();

            default :
                goto endpoint_not_found;
        }
    }
}
