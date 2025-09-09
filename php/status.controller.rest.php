<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["code" => 405, "message" => "Método não permitido"]);
    exit;
}

if (!isset($_GET['token'])) {
    http_response_code(400);
    echo json_encode(["code" => 400, "message" => "Token é obrigatório"]);
    exit;
}

$iniPath = __DIR__ . '/../secrets.ini';
if (!is_file($iniPath)) {
    http_response_code(500);
    echo json_encode(["code" => 500, "message" => "secrets.ini não encontrado"]);
    exit;
}

$cfg = @parse_ini_file($iniPath, false, INI_SCANNER_TYPED);
$baseUrl = rtrim($cfg['URL_SERVER'] ?? '', '/');

if (!$baseUrl) {
    http_response_code(500);
    echo json_encode(["code" => 500, "message" => "URL_SERVER ausente no secrets.ini"]);
    exit;
}

$apiToken = $_GET['token'];

$url = $baseUrl . '/instance/status';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    "token: {$apiToken}"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$respBody = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($respBody === false) {
    http_response_code(502);
    echo json_encode(["code" => 502, "message" => "Erro de rede cURL", "detail" => $err]);
    exit;
}

http_response_code($httpCode ?: 200);
echo $respBody;
?>