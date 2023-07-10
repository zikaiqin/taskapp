<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once 'util/url.php';
require_once 'util/globals.php';
require_once 'actions/router.php';
require_once 'views/router.php';
use Api\Router as ApiRouter;
use View\Router as ViewRouter;

function main() {
    # Url path to the root of the project (aka this file)
    $base_path = Url\get(__DIR__);
    Globals\set('BASE_URL', $base_path);

    # Split request url into array
    $path_arr = explode('/', trim(str_replace($base_path, '', $_SERVER['REQUEST_URI']), '/'));
    if (isset($path_arr[0]) && $path_arr[0] === 'api') {
        # The request path matches '/api/*'
        # Try resolving with api router
        ApiRouter::dispatch(array_slice($path_arr, 1));
    } else {
        # Otherwise try serving static files
        ViewRouter::dispatch($path_arr);
    }
}

try {
    main();
} catch(Exception $e) {
    die($e->getMessage());
}
