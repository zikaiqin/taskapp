<?php
namespace View;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

class Router {
    private function __construct() {}
    public static function dispatch($path_arr) {
        if (count($path_arr) > 1) {
            page_not_found:
            http_response_code(404);
            echo 'Page not found';
            die();
        }
        if (count($path_arr) <= 0 ) {
            $redirect = trim("https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]", '/') . '/home';
            header("Location: $redirect");
            exit();
        }

        switch ($path_arr[0]) {
            case 'home' :
                echo file_get_contents(__DIR__ . '/home/home.html');
                exit();
            case 'login' :
                echo file_get_contents(__DIR__ . '/login/login.html');
                exit();
            default :
                goto page_not_found;
        }
    }
}
