<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function set_global(string $key, $value) {
    if (empty($GLOBALS['VARS'])) {
        global $VARS;
        $VARS = [];
    }
    $VARS[$key] = $value;
}

function get_global(string $key) {
    return isset($GLOBALS['VARS']) ? $GLOBALS['VARS'][$key] ?? false : false;
}
