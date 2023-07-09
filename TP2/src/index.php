<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once 'actions/router.php';
require_once 'views/router.php';
use Api\Router as ApiRouter;
use View\Router as ViewRouter;

try {
    $full_path = parse_url(trim($_SERVER['REQUEST_URI'], '/'))['path'];
    if (empty($full_path)) {
        throw new Exception('Malformed url');
    }

    $trimmed_path = array_slice(explode('/', $full_path), 2);
    if (isset($trimmed_path[0]) && $trimmed_path[0] === 'api') {
        ApiRouter::dispatch(array_slice($trimmed_path, 1));
    } else {
        ViewRouter::dispatch($trimmed_path);
    }
} catch(Exception $e) {
    die($e->getMessage());
}
