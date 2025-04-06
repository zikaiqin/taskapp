<?php
namespace Url;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

/**
 * Get the url path to $dir <br>
 * Only works on www-ens
 * @todo Configure base path manually in config.json
 * @param string $dir
 * @return false|string
 */
function path_to(string $dir) {
    $fp_arr = explode('/', trim($dir, '/'));
    if (($index = array_search('public_html', $fp_arr)) !== false) {
        $path_arr = array_merge([$fp_arr[$index - 1]], array_slice($fp_arr, $index + 1));
        return '/~' . implode('/', $path_arr);
    }
    return false;
}
