<?php
namespace Finalize;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function headers(string $html, string $headers) {
    return str_replace(
        '</head>',
        "$headers</head>",
        $html
    );
}
function refs(string $html, string $dir) {
    return str_replace(
        ['src="./', 'href="./'],
        ["src=\"$dir/", "href=\"$dir/"],
        $html
    );
}
