<?php
namespace Api\Update;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../../classes/database.php';
require_once __DIR__ . '/../../helpers/update.php';
require_once __DIR__ . '/../../util/request.php';
use Database;
use function Request\require_methods;
use function Request\to_camel_case;
use function Update\fetch_all;

class Router {
    private function __construct() {}

    public static function dispatch(array $path_arr) {
        if (count($path_arr) !== 0) {
            endpoint_not_found:
            http_response_code(404);
            echo 'Nothing here';
            die();
        }

        # Honor GET requests on /api/update
        if (!require_methods('GET')) die();

        $update_type = ['user', 'category', 'task'];
        $updates = array_map(
            fn($row) => array_replace($row, ['Type' => $update_type[$row['Type']]]),
            fetch_all(Database::get()),
        );
        $res = json_encode(to_camel_case($updates), JSON_UNESCAPED_UNICODE);
        header('Content-type: application/json');
        echo $res;
        exit();
    }
}
