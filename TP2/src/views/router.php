<?php
namespace View;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }
require_once __DIR__ . '/../util/globals.php';

class Router {
    private function __construct() {}
    public static function dispatch(array $path_arr) {
        if (count($path_arr) > 1) {
            page_not_found:
            http_response_code(404);
            echo 'Page not found';
            die();
        }
        if (count($path_arr) <= 0) {
            redirect:
            $redirect = rtrim("https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]", '/') . '/home';
            header("Location: $redirect");
            exit();
        }

        switch ($path_arr[0]) {
            case '' :
                goto redirect;
            case 'home' :
            case 'login' :
                $fname = $path_arr[0];
                echo file_get_contents(__DIR__ . "/$fname/$fname.html");
                exit();
            default :
                goto page_not_found;
        }
    }
}
