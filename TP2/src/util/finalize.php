<?php
namespace Finalize;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

/**
 * Insert $headers right before the `</head>` tag
 * @param string $html
 * @param string $headers
 * @return array|string|string[]
 */
function headers(string $html, string $headers) {
    return str_replace(
        '</head>',
        "$headers</head>",
        $html
    );
}

/**
 * Replace relative path references with absolute path at runtime
 * @param string $html
 * @param string $dir
 * @return array|string|string[]
 */
function refs(string $html, string $dir) {
    return str_replace(
        ['src="./', 'href="./'],
        ["src=\"$dir/", "href=\"$dir/"],
        $html
    );
}
