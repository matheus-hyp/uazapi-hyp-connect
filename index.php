<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    $iniPath = __DIR__ . '/secrets.ini';
    if (!is_file($iniPath)) {
        http_response_code(500);
        echo json_encode(["code"=>500,"message"=>"Erro ini"]);
        exit;
    }

    $cfg = @parse_ini_file($iniPath, false, INI_SCANNER_TYPED);
    $apiToken  = $cfg['API_TOKEN']  ?? null;
    $baseUrl   = rtrim($cfg['URL_SERVER'] ?? '', '/');

    if (!$apiToken || !$baseUrl) {
        http_response_code(500);
        echo json_encode(["code"=>500,"message"=>"Erro ini 500"]);
        exit;
    }

    // Coleta dados do front (ou usa defaults seguros)
    $name         = $_POST['name'] ?? '';

    $payload = json_encode([
        "name"         => $name
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
    $err      = curl_error($ch);
    curl_close($ch);

    if ($respBody === false) {
        http_response_code(502);
        echo json_encode(["code"=>502,"message"=>"Erro de rede cURL","detail"=>$err]);
        exit;
    }

    http_response_code($httpCode ?: 200);
    echo $respBody; 
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>uazapi - hyp</title>
    <link rel="stylesheet" href="src/styles/design.styles.css">
</head>
<body>
    <!-- Status Bar -->
    <div id="status-bar" class="status-bar hidden">
        <span id="status-text">Carregando...</span>
    </div>
    
    <!-- App Wrapper -->
    <div class="app-wrapper">
        <!-- Sidebar com progresso -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <img src="src/img/logo.png" alt="uazapi" />
                </div>

            </div>
            
            <div class="progress-steps">
                <div class="step active" id="step-1">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h3>Identificação</h3>
                        <p>Nome da conexão</p>
                    </div>
                </div>
                
                <div class="step" id="step-2">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h3>Método</h3>
                        <p>Escolha como conectar</p>
                    </div>
                </div>
                
                <div class="step" id="step-3">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h3>Conexão</h3>
                        <p>Pareamento ativo</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Step 1: Instance Name -->
            <div id="step1-content" class="content-card">
                <div class="card-header">
                    <h2 class="card-title">Qual nome dessa conexão?</h2>
                    <p class="card-subtitle">Como deseja identificar esta conexão WhatsApp?</p>
                </div>
                <div class="card-body">
                    <form id="instanceForm">
                        <div class="form-group">
                            <label class="form-label">Identificação</label>
                            <input type="text" 
                                   id="instanceName" 
                                   name="instanceName" 
                                   class="form-input" 
                                   placeholder="Ex: empresa-vendas" 
                                   required />
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <span>Continuar</span>
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Step 2: Connection Method -->
            <div id="step2-content" class="content-card hidden">
                <div class="card-header">
                    <h2 class="card-title">Método de Conexão</h2>
                    <p class="card-subtitle">Escolha como deseja conectar seu WhatsApp</p>
                </div>
                <div class="card-body">
                    <div class="choice-grid">
                        <div class="choice-card selected" data-mode="qrcode">
                            <div class="choice-icon">📱</div>
                            <div class="choice-title">QR Code</div>
                            <div class="choice-desc">Escaneie com a câmera</div>
                        </div>
                        <div class="choice-card" data-mode="paircode">
                            <div class="choice-icon">🔢</div>
                            <div class="choice-title">Código</div>
                            <div class="choice-desc">Digite no WhatsApp</div>
                        </div>
                    </div>
                    
                    <form id="connectForm">
                        <div id="phone-field" class="form-group hidden">
                            <label class="form-label">Número do Telefone</label>
                            <input type="tel" 
                                   id="phone" 
                                   class="form-input" 
                                   placeholder="5511999999999" />
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <span>Conectar WhatsApp</span>
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Step 3: Connection Display -->
            <div id="step3-content" class="content-card hidden">
                <div class="card-header">
                    <h2 class="card-title">Conectando WhatsApp</h2>
                    <p class="card-subtitle">Siga as instruções para completar a conexão</p>
                </div>
                <div class="card-body">
                    <div id="connection-display">
                        <!-- QR Code ou Pair Code será inserido aqui -->
                    </div>
                </div>
            </div>
            
            <!-- Success Screen -->
            <div id="success-content" class="content-card hidden">
                <div class="success-content">
                    <div class="success-icon">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <h2 class="card-title">WhatsApp Conectado!</h2>
                    <p class="card-subtitle">Sua instância está pronta para uso</p>
                    <div style="margin-top: 24px; padding: 16px; background: #f8f9ff; border: 1px solid #e0e4ff; border-radius: 12px;">
                        <p style="font-size: 14px; color: #5566ff;">
                            <strong>Instância:</strong> <span id="final-instance-name">-</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

  <!-- Carregar módulos antes da classe principal -->
  <script src="./src/js/ui.manager.service.js"></script>
  <script src="./src/js/api.service.js"></script>
  <script src="./src/js/error.handler.service.js"></script>
  <script src="./src/js/status.poller.service.js"></script>
  <script src="./src/js/main.service.js"></script>
</body>
</html>
