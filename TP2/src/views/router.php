<?php
namespace View;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../util/finalize.php';
require_once __DIR__ . '/../util/globals.php';
use function Finalize\headers as write_head;
use function Finalize\refs as write_refs;
use function Globals\get as global_get;

class Router {
    private function __construct() {}
    public static function dispatch(array $path_arr) {
        if (count($path_arr) > 1) {
            # For now reject paths of depth greater than 1
            page_not_found:
            http_response_code(404);
            echo 'Page not found';
            die();
        }
        if (count($path_arr) <= 0) {
            # Redirect requests on '/' to '/home'
            redirect:
            $redirect = rtrim("https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]", '/') . '/home';
            header("Location: $redirect");
            exit();
        }

        # File to be served
        $fname = $path_arr[0];
        switch ($fname) {
            case '' :
                goto redirect;
            case 'home' :
            case 'login' :
                $fdir = __DIR__ . "/$fname";

                # Raw string of requested HTML file
                $html = file_get_contents("$fdir/$fname.html");
                if (!$html) {
                    throw new \Exception("File not found at $fdir/$fname.html");
                }

                # Back-end constants we need to pass to front-end
                $constants = [
                    'BASE_URL' => $_SERVER['HTTP_HOST'] . global_get('BASE_URL')
                ];

                # Write constants as JSON string in html header
                $serialized = json_encode($constants, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES);
                $headers = "\t<script>const CONSTANTS = Object.freeze($serialized);</script>\n";
                echo write_refs(
                    write_head($html, $headers),
                    "views/$fname"
                );
                exit();
            default :
                goto page_not_found;
        }
    }
}
