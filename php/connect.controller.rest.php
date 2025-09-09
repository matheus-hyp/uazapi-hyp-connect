<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["code" => 405, "message" => "Método não permitido"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['token'])) {
    http_response_code(400);
    echo json_encode(["code" => 400, "message" => "Dados inválidos. Campo 'token' é obrigatório"]);
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

$apiToken = $data['token'];

$phone = $data['phone'] ?? '';
$instance = $data['instance'] ?? 'default';

// Preparar payload base
$payload = [
    'phone' => ''
];

// Processar telefone apenas se fornecido
if (!empty($phone)) {
    // Limpar o telefone (remover caracteres não numéricos)
    $cleanPhone = preg_replace('/\D/', '', $phone);
    
    // Validar formato do telefone
    if (strlen($cleanPhone) < 10 || strlen($cleanPhone) > 15) {
        http_response_code(400);
        echo json_encode(["code" => 400, "message" => "Formato de telefone inválido"]);
        exit;
    }
    
    $payload['phone'] = $cleanPhone;
}

// Preparar payload para a API
$payload = json_encode($payload);

$url = $baseUrl . '/instance/connect';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    "token: {$apiToken}"
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