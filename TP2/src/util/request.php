<?php
namespace Request;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function require_methods(...$methods) : bool {
    $found = array_reduce(
        $methods,
        fn($carry, $next) => $carry || in_array($_SERVER['REQUEST_METHOD'], $methods),
        false
    );
    if (!$found) {
        http_response_code(405);
        echo 'Method not allowed';
    }
    return $found;
}

function require_values(...$values) : bool {
    foreach ($values as $value) {
        if (!isset($value) || $value === '') {
            http_response_code(400);
            echo 'Form incomplete';
            return false;
        }
    }
    return true;
}
