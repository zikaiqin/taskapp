<?php
namespace Api\Category;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../../classes/database.php';
require_once __DIR__ . '/../../classes/globals.php';
require_once __DIR__ . '/../../helpers/category.php';
require_once __DIR__ . '/../../helpers/update.php';
require_once __DIR__ . '/../../util/request.php';
use Database;
use Globals;
use function Category\fetch_all as fetch_categories;
use function Category\get_by_name;
use function Category\get_by_name as get_category_by_name;
use function Category\get_by_id as get_category_by_id;
use function Category\set as set_category;
use function Category\delete as delete_category;
use function Request\require_authentication;
use function Request\require_methods;
use function Request\require_privilege;
use function Request\require_values;
use function Request\to_camel_case;
use function Update\set as set_update;

class Router {
    private function __construct() {}

    public static function dispatch(array $path_arr) {
        if (count($path_arr) > 1) {
            endpoint_not_found:
            http_response_code(404);
            echo 'Nothing here';
            die();
        }

        # Honor GET requests on /api/category
        if (count($path_arr) === 0) {
            if (!require_methods('GET')) die();
            if (($table = fetch_categories(Database::get())) === false) {
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
            case 'add' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Requires authentication and admin privilege
                if (!require_authentication(Globals::get('USERNAME')) ||
                    !require_privilege(Globals::get('PRIVILEGE'), 1)) die();

                # Must send 'name'
                if (!require_values($name = $_POST['name'])) die();
                if (strlen($name) > 64) {
                    http_response_code(400);
                    echo 'Category name is too long';
                    die();
                }

                # Name must be unique
                if (get_category_by_name($name, Database::get()) !== false) {
                    http_response_code(403);
                    echo 'Duplicate names not allowed';
                    die();
                }

                # Generate 128-bit uid
                $category_id = bin2hex(random_bytes(16));
                set_category($category_id, $name, $_POST['description'] ?? '', Database::get(), false);
                set_update(1, time(), null, Database::get());
                echo 'Category created';
                exit();

            case 'edit' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Requires authentication and admin privilege
                if (!require_authentication(Globals::get('USERNAME')) ||
                    !require_privilege(Globals::get('PRIVILEGE'), 1)) die();

                # Must send 'categoryID'
                if (!require_values($category_id = $_POST['categoryID'])) die();

                # Category must exist
                if (($res = get_category_by_id($category_id, Database::get())) === false) {
                    http_response_code(404);
                    echo 'Category not found';
                    die();
                }

                # Check for changes
                if (isset($_POST['name']) && ($name = $_POST['name']) !== $res['Name']) {
                    # Name must be no longer than 64 chars
                    if (strlen($name) > 64) {
                        http_response_code(400);
                        echo 'Category name is too long';
                        die();
                    }

                    # Name must be unique
                    if (get_by_name($name, Database::get()) !== false) {
                        http_response_code(403);
                        echo 'Duplicate names not allowed';
                        die();
                    }
                } else if (!isset($_POST['description']) || ($res['Description'] === $_POST['description'])) {
                    http_response_code(200);
                    echo 'No changes';
                    exit();
                }

                set_category(
                    $category_id,
                        $name ?? $res['Name'],
                        $_POST['description'] ?? '',
                    Database::get(),
                );
                set_update(1, time(), null, Database::get());
                echo 'Category modified';
                exit();

            case 'delete' :
                # Must use POST
                if (!require_methods('POST')) die();

                # Requires authentication and admin privilege
                if (!require_authentication(Globals::get('USERNAME')) ||
                    !require_privilege(Globals::get('PRIVILEGE'), 1)) die();

                # Must send 'categoryID'
                if (!require_values($category_id = $_POST['categoryID'])) die();

                # Category must exist
                if (delete_category($category_id, Database::get()) <= 0) {
                    http_response_code(404);
                    echo 'Category not found';
                    die();
                }
                set_update(1, time(), null, Database::get());

                echo 'Category deleted';
                exit();

            default :
                goto endpoint_not_found;
        }
    }
}
