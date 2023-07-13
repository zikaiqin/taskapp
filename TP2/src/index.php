<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once 'classes/database.php';
require_once 'classes/globals.php';
require_once 'util/url.php';
require_once 'util/session.php';
require_once 'actions/router.php';
require_once 'views/router.php';

use Api\Router as ApiRouter;
use View\Router as ViewRouter;

function main() {
    # Validate session cookies
    session_start();
    if (!is_bool($session_info = Session\get(session_id(), Database::get()))) {
        # User authenticated, check session expiration
        $authenticated = Session\validate_time($session_info['Time'], $_SERVER['REQUEST_TIME'], 3600);
        if (!$authenticated) {
            # Session has expired, purge cookies and start new session
            Session\delete(session_id(), Database::get());
            session_destroy();
            session_start();
        } else {
            Session\set(session_id(), $session_info['Username'], $_SERVER['REQUEST_TIME'], Database::get());
            Globals::set('USERNAME', $session_info['Username']);
        }
    }

    # Url path to the root of the project (aka this file)
    $base_path = Url\path_to(__DIR__);
    Globals::set('BASE_URL', $base_path);

    # Split request url into array
    $path_arr = explode('/', ltrim(str_replace($base_path, '', $_SERVER['REQUEST_URI']), '/'));
    if (isset($path_arr[0]) && $path_arr[0] === 'api') {
        # Request path matches '/api/*'
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
    header('Content-Type: application/json', true, 500);
    echo 'Uncaught exception: ' . $e->getMessage();
}
