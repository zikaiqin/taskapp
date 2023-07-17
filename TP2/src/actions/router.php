<?php
namespace Api;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }
require_once __DIR__ . '/auth/router.php';
require_once __DIR__ . '/category/router.php';
require_once __DIR__ . '/task/router.php';
require_once __DIR__ . '/user/router.php';

class Router {
    private function __construct() {}
    public static function dispatch(array $path_arr) {
        if (count($path_arr) <= 0) {
            endpoint_not_found:
            http_response_code(404);
            echo 'Rien ici.';
            die();
        }

        switch ($path_arr[0]) {
            case 'auth' :
                Auth\Router::dispatch(array_slice($path_arr, 1));
                exit();
            case 'user' :
                User\Router::dispatch(array_slice($path_arr, 1));
                exit();
            case 'category' :
                Category\Router::dispatch(array_slice($path_arr, 1));
                exit();
            case 'task' :
                Task\Router::dispatch(array_slice($path_arr, 1));
                exit();
            default :
                goto endpoint_not_found;
        }
    }
}
