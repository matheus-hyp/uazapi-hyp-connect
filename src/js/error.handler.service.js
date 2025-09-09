// ===== MÓDULO ERROR HANDLER =====
// Gerencia erros específicos como limite de instâncias

class ErrorHandler {
    constructor() {
        this.errorOverlay = null;
        this.autoCloseTimer = null; // Timer para fechar automaticamente
        this.onAutoClose = null; // Callback para quando fechar automaticamente
    }

    // Verifica se é erro de limite de instâncias
    isInstanceLimitError(data) {
        return data && data.error === "Maximum number of instances reached";
    }

    // Verifica se é resposta de conexão em progresso
    isConnectionInProgress(data) {
        return data && data.response && data.response.includes("Connection attempt in progress");
    }

    // Mostra tela de erro de limite de instâncias
    showInstanceLimitError(data) {
        this.createErrorOverlay();
        
        const currentInstances = data.current_instances || 'N/A';
        const maxInstances = data.max_instances || 'N/A';
        
        this.errorOverlay.innerHTML = `
            <div class="error-modal">
                <div class="error-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h2>Atenção Necessária</h2>
                <p>Por favor, entre em contato com o suporte.</p>
                <div class="error-details">
                 
                    <p>Entre em contato com o suporte para mais informações.</p>
                </div>
                <button class="btn-refresh" onclick="window.location.reload()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4L18.36 18.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    Atualizar Página
                </button>
            </div>
        `;
        
        document.body.appendChild(this.errorOverlay);
    }

    // Mostra tela de conexão em progresso com barra de progresso
    showConnectionInProgress(data, onAutoClose = null) {
        this.createErrorOverlay();
        this.onAutoClose = onAutoClose; // Salvar callback
        
        const message = this.translateConnectionMessage(data.response);
        
        this.errorOverlay.innerHTML = `
            <div class="error-modal connection-progress">
                <div class="progress-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <h2>Conexão em Andamento</h2>
                <p>${message}</p>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <p class="progress-text">Aguarde 2 minutos antes de tentar novamente</p>
                </div>
                <div class="warning-message">
                    Não feche esta aba durante o processo.</p>
                </div>
                <button class="btn-refresh" onclick="window.location.reload()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4L18.36 18.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                    Atualizar Página
                </button>
            </div>
        `;
        
        document.body.appendChild(this.errorOverlay);
        this.startProgressAnimation();
        this.startAutoCloseTimer(); // Iniciar timer de 2 minutos
    }

    // Traduz mensagem de conexão
    translateConnectionMessage(message) {
        if (message.includes("Connection attempt in progress, please wait 2 minutes before trying again")) {
            return "Tentativa de conexão em andamento, aguarde 2 minutos antes de tentar novamente.";
        }
        return message;
    }

    // Cria overlay de erro
    createErrorOverlay() {
        // Remove overlay existente se houver
        if (this.errorOverlay) {
            this.errorOverlay.remove();
        }

        this.errorOverlay = document.createElement('div');
        this.errorOverlay.className = 'error-overlay';
        this.errorOverlay.innerHTML = '';
        
        // Adiciona estilos CSS inline para garantir funcionamento
        const style = document.createElement('style');
        style.textContent = `
            .error-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }
            
            .error-modal {
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: errorModalIn 0.3s ease-out;
            }
            
            @keyframes errorModalIn {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            
            .error-icon svg {
                color: #dc2626;
                margin-bottom: 16px;
            }
            
            .progress-icon svg {
                color: #5566ff;
                margin-bottom: 16px;
                animation: rotate 2s linear infinite;
            }
            
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .error-modal h2 {
                font-size: 24px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 12px;
            }
            
            .error-modal p {
                color: #6b7280;
                font-size: 16px;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            
            .error-details {
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
            }
            
            .error-details p {
                color: #dc2626;
                font-size: 14px;
                margin: 4px 0;
            }
            
            .progress-container {
                margin: 24px 0;
            }
            
            .progress-bar {
                width: 100%;
                height: 6px;
                background: #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 12px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #5566ff, #4455ee);
                border-radius: 3px;
                animation: progressFill 120s linear infinite;
            }
            
            @keyframes progressFill {
                from { width: 0%; }
                to { width: 100%; }
            }
            
            .progress-text {
                font-size: 14px;
                color: #6b7280;
                margin: 0;
            }
            
            .warning-message {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                padding: 12px;
                margin: 20px 0;
            }
            
            .warning-message p {
                color: #92400e;
                font-size: 14px;
                margin: 0;
            }
            
            .btn-refresh {
                background: #5566ff;
                color: white;
                border: none;
                border-radius: 12px;
                padding: 14px 24px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 24px auto 0;
                transition: all 0.2s ease;
            }
            
            .btn-refresh:hover {
                background: #4455ee;
                transform: translateY(-2px);
            }
            
            .btn-refresh svg {
                animation: refreshSpin 1s ease-in-out infinite;
            }
            
            @keyframes refreshSpin {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(180deg); }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Inicia animação da barra de progresso
    startProgressAnimation() {
        const progressFill = this.errorOverlay.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
            setTimeout(() => {
                progressFill.style.transition = 'width 120s linear';
                progressFill.style.width = '100%';
            }, 100);
        }
    }

    // Inicia timer para fechar automaticamente após 2 minutos
    startAutoCloseTimer() {
        this.clearAutoCloseTimer(); // Limpar timer anterior se existir
        
        this.autoCloseTimer = setTimeout(() => {
            this.hideError(); // Fechar modal
            
            // Chamar callback se fornecido
            if (this.onAutoClose) {
                this.onAutoClose();
            }
        }, 120000); // 2 minutos (120 segundos)
    }

    // Limpa timer de auto-close
    clearAutoCloseTimer() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
    }

    // Remove overlay de erro
    hideError() {
        this.clearAutoCloseTimer(); // Limpar timer ao fechar
        if (this.errorOverlay) {
            this.errorOverlay.remove();
            this.errorOverlay = null;
        }
    }
}
