<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["code" => 405, "message" => "Método não permitido"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['name'])) {
    http_response_code(400);
    echo json_encode(["code" => 400, "message" => "Dados inválidos. Campo 'name' é obrigatório"]);
    exit;
}

$iniPath = __DIR__ . '/../secrets.ini';
if (!is_file($iniPath)) {
    http_response_code(500);
    echo json_encode(["code" => 500, "message" => "secrets.ini não encontrado"]);
    exit;
}

$cfg = @parse_ini_file($iniPath, false, INI_SCANNER_TYPED);
$apiToken = $cfg['API_TOKEN'] ?? null;
$baseUrl = rtrim($cfg['URL_SERVER'] ?? '', '/');

if (!$apiToken || !$baseUrl) {
    http_response_code(500);
    echo json_encode(["code" => 500, "message" => "API_TOKEN/URL_SERVER ausentes no secrets.ini"]);
    exit;
}

$instanceName = $data['name'];

// Preparar payload para a API
$payload = json_encode([
    "name" => $instanceName
]);

$url = $baseUrl . '/instance/init';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    "admintoken: {$apiToken}"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
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