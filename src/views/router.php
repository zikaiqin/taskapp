<?php
namespace View;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

require_once __DIR__ . '/../classes/globals.php';
require_once __DIR__ . '/../util/finalize.php';

use Exception;
use Globals;
use function Finalize\headers as write_head;
use function Finalize\refs as write_refs;

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
            self::redirect('/home');
            exit();
        }

        # File to be served
        $fname = $path_arr[0];
        switch ($fname) {
            case '' :
                # Redirect requests on '/' to '/home'
                self::redirect('/home');
                exit();
            case 'home' :
                if (Globals::get('USERNAME') === false) {
                    # User not authenticated
                    # Redirecting to '/login'
                    self::redirect('/login');
                    exit();
                }
                goto skip;
            case 'login' :
                if (Globals::get('USERNAME') !== false) {
                    # User already authenticated
                    # Redirecting to '/home'
                    self::redirect('/home');
                    exit();
                }

                skip:
                $fdir = __DIR__ . "/$fname";

                # Raw string of requested HTML file
                $html = file_get_contents("$fdir/index.html");
                if (!$html) {
                    throw new Exception("File not found at $fdir/index.html");
                }

                # Constants needed to communicate with back-end
                $constants = [
                    'BASE_URL' => $_SERVER['HTTP_HOST'] . Globals::get('BASE_URL')
                ];
                if (Globals::get('USERNAME') !== false) $constants['USERNAME'] = Globals::get('USERNAME');
                if (Globals::get('PRIVILEGE') !== false) $constants['PRIVILEGE'] = Globals::get('PRIVILEGE');
                if ($fname === 'home') {
                    $constants['TASK_STATUS'] = ['À faire', 'Complet'];
                    $constants['USER_TYPE'] = ['Utilisateur', 'Administrateur'];
                }

                # Write constants as JSON string in html header
                $serialized = json_encode($constants, JSON_UNESCAPED_SLASHES);
                $headers = "\t<script>const CONSTANTS = Object.freeze($serialized)</script>\n";
                echo write_refs(
                    write_head($html, $headers),
                    Globals::get('BASE_URL') . "/views/$fname",
                );
                exit();
            default :
                goto page_not_found;
        }
    }

    private static function redirect($path) {
        $redirect = Globals::get('BASE_URL') . $path;
        header("Location: $redirect");
    }
}
