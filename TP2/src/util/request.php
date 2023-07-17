<?php
namespace Request;
use Exception;

if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function require_methods(...$methods) : bool {
    $found = in_array($_SERVER['REQUEST_METHOD'], $methods);
    if (!$found) {
        http_response_code(405);
        echo 'Méthode non autorisée.';
    }
    return $found;
}

function require_values(...$values) : bool {
    foreach ($values as $value) {
        if (!isset($value) || $value === '') {
            http_response_code(400);
            echo 'Formulaire incomplet.';
            return false;
        }
    }
    return true;
}

function require_authentication($username) : bool {
    if ($username === false) {
        http_response_code(401);
        echo 'Pas authentifié.';
        return false;
    }
    return true;
}
function require_privilege($actual, $expected) : bool {
    if (!is_numeric($actual) || ((int) $actual !== $expected)) {
        http_response_code(403);
        echo 'Interdit.';
        return false;
    }
    return true;
}

function to_camel_case(array $table) {
    return array_map(function($row) {
        $acc = [];
        foreach ($row as $key => $value) {
            $acc[lcfirst($key)] = $value;
        }
        return $acc;
    }, $table);
}
