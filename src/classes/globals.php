<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

class Globals {
    private static $variables = [];

    public static function set(string $key, $value) {
        self::$variables[$key] = $value;
    }

    public static function get(string $key) {
        return self::$variables[$key] ?? false;
    }
}
