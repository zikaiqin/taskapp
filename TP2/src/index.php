<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once 'util/url.php';
require_once 'util/globals.php';
require_once 'actions/router.php';
require_once 'views/router.php';
use Api\Router as ApiRouter;
use View\Router as ViewRouter;

function main() {
    $base_path = Url\get(__DIR__);
    Globals\set('BASE_URL', $base_path);
    $path_arr = explode('/', trim(str_replace($base_path, '', $_SERVER['REQUEST_URI']), '/'));

    if (isset($path_arr[0]) && $path_arr[0] === 'api') {
        ApiRouter::dispatch(array_slice($path_arr, 1));
    } else {
        ViewRouter::dispatch($path_arr);
    }
}

try {
    main();
} catch(Exception $e) {
    die($e->getMessage());
}
