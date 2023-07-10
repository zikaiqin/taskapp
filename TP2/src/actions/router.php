<?php
namespace Api;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

class Router {
    private function __construct() {}
    public static function dispatch(array $path_arr) {
        # All requests on '/api/* to receive json response
        header('Content-Type: application/json');

        if (count($path_arr) <= 0) {
            # For now reject requests on '/api'
            http_response_code(401);
            echo 'Unauthorized request on root endpoint';
            die();
        }
        if (count($path_arr) > 1) {
            # For now reject paths of depth greater than 1
            endpoint_not_found:
            http_response_code(404);
            echo 'Requested endpoint does not exist';
            die();
        }

        switch ($path_arr[0]) {
            case 'auth' :
                echo 'Authentication endpoint';
                exit();
            case 'user' :
                echo 'User endpoint';
                exit();
            case 'category' :
                echo 'Category endpoint';
                exit();
            case 'task' :
                echo 'Task endpoint';
                exit();
            default :
                goto endpoint_not_found;
        }
    }
}
