<?php
namespace Url;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function get(string $dir) {
    $fp_arr = explode('/', trim($dir, '/'));
    if (($index = array_search('public_html', $fp_arr)) !== false) {
        $path_arr = array_merge([$fp_arr[$index - 1]], array_slice($fp_arr, $index + 1));
        return '/~' . implode('/', $path_arr);
    }
    return false;
}
