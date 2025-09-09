// ===== MÓDULO UI MANAGER =====
// Interface moderna com navegação por steps sem scroll

class UIManager {
    constructor() {
        this.currentStep = 1;
        this.statusBar = document.getElementById('status-bar');
        this.statusText = document.getElementById('status-text');
    }

    // Navegar entre steps
    showStep(stepNumber) {
        // Ocultar todos os contents
        for (let i = 1; i <= 3; i++) {
            const content = document.getElementById(`step${i}-content`);
            const step = document.getElementById(`step-${i}`);
            
            if (content) content.classList.add('hidden');
            if (step) {
                step.classList.remove('active', 'completed');
                if (i < stepNumber) {
                    step.classList.add('completed');
                } else if (i === stepNumber) {
                    step.classList.add('active');
                }
            }
        }
        
        // Mostrar o content atual
        const currentContent = document.getElementById(`step${stepNumber}-content`);
        if (currentContent) {
            currentContent.classList.remove('hidden');
        }
        
        // Ocultar success se existir
        const successContent = document.getElementById('success-content');
        if (successContent) {
            successContent.classList.add('hidden');
        }
        
        this.currentStep = stepNumber;
    }

    // Mostrar tela de sucesso
    showSuccessScreen(instance) {
        // Ocultar todos os steps
        for (let i = 1; i <= 3; i++) {
            const content = document.getElementById(`step${i}-content`);
            const step = document.getElementById(`step-${i}`);
            
            if (content) content.classList.add('hidden');
            if (step) step.classList.add('completed');
        }
        
        // Mostrar success
        const successContent = document.getElementById('success-content');
        if (successContent) {
            successContent.classList.remove('hidden');
        }
        
        // Atualizar nome da instância
        const finalInstanceName = document.getElementById('final-instance-name');
        if (finalInstanceName) {
            finalInstanceName.textContent = instance.name || instance.instanceName || 'N/A';
        }
        
        this.showStatus('connected', 'WhatsApp conectado com sucesso!');
    }

    // Mostrar QR Code
    showQRCode(qrCodeData) {
        this.showStep(3);
        
        const connectionDisplay = document.getElementById('connection-display');
        if (connectionDisplay && qrCodeData) {
            const imageSrc = qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`;
            
            connectionDisplay.innerHTML = `
                <div class="qr-display">
                    <div class="qr-code-container">
                        <img src="${imageSrc}" alt="QR Code" />
                    </div>
                    <div class="waiting-progress">
                        <div class="waiting-progress-bar"></div>
                    </div>
                    <div class="loading-indicator">
                        <div class="loading-dots">
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                        </div>
                        <span>Aguardando leitura do QR Code...</span>
                    </div>
                    <div style="margin-top: 20px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        <p style="margin-bottom: 8px;"><strong>1.</strong> Abra o WhatsApp no celular</p>
                        <p style="margin-bottom: 8px;"><strong>2.</strong> Vá em "Dispositivos vinculados"</p>
                        <p><strong>3.</strong> Escaneie este código QR</p>
                    </div>
                </div>
            `;
        }
        
        this.showStatus('connecting', 'Aguardando leitura do QR Code...');
    }

    // Mostrar código de pareamento
    showPairCode(pairCode, instanceName = '') {
        this.showStep(3);
        
        const connectionDisplay = document.getElementById('connection-display');
        if (connectionDisplay && pairCode) {
            connectionDisplay.innerHTML = `
                <div style="text-align: center;">
                    <div class="pair-code-display">
                        <div class="pair-code-value">${pairCode}</div>
                        <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Digite este código no WhatsApp</p>
                    </div>
                    <div class="waiting-progress">
                        <div class="waiting-progress-bar"></div>
                    </div>
                    <div class="loading-indicator">
                        <div class="loading-dots">
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                            <div class="loading-dot"></div>
                        </div>
                        <span>Aguardando confirmação do código...</span>
                    </div>
                    <div style="margin-top: 20px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        <p style="margin-bottom: 8px;"><strong>1.</strong> Abra o WhatsApp no celular</p>
                        <p style="margin-bottom: 8px;"><strong>2.</strong> Vá em Configurações → Dispositivos vinculados</p>
                        <p style="margin-bottom: 8px;"><strong>3.</strong> Toque em "Vincular um dispositivo"</p>
                        <p><strong>4.</strong> Digite o código: <strong style="color: #5566ff;">${pairCode}</strong></p>
                    </div>
                </div>
            `;
        }
        
        this.showStatus('connecting', 'Aguardando confirmação do código...');
    }

    // Atualizar QR Code existente
    updateQRCode(qrCodeData) {
        const existingQR = document.querySelector('#connection-display img[alt="QR Code"]');
        if (existingQR && qrCodeData) {
            const imageSrc = qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`;
            existingQR.src = imageSrc;
        }
    }

    // Atualizar código de pareamento existente
    updatePairCode(pairCode) {
        const existingPairCode = document.querySelector('.pair-code-value');
        if (existingPairCode && pairCode) {
            existingPairCode.textContent = pairCode;
            
            // Atualizar também a instrução com o novo código
            const instructionText = document.querySelector('#connection-display p strong');
            if (instructionText) {
                instructionText.textContent = pairCode;
            }
        }
    }

    // Status bar moderno
    showStatus(type, message) {
        if (this.statusBar && this.statusText) {
            this.statusBar.className = `status-bar status-${type}`;
            this.statusText.textContent = message;
            this.statusBar.classList.remove('hidden');
        }
    }

    hideStatus() {
        if (this.statusBar) {
            this.statusBar.classList.add('hidden');
        }
    }

    // Loading states para botões
    setButtonLoading(buttonSelector, isLoading, loadingText = 'Processando...') {
        const button = document.querySelector(buttonSelector);
        if (button) {
            button.disabled = isLoading;
            if (isLoading) {
                button.innerHTML = `
                    <div class="loading-spinner"></div>
                    <span>${loadingText}</span>
                `;
            } else {
                // Restaurar texto original baseado no contexto
                if (button.closest('#instanceForm')) {
                    button.innerHTML = '<span>Continuar</span>';
                } else if (button.closest('#connectForm')) {
                    button.innerHTML = '<span>Conectar WhatsApp</span>';
                }
            }
        }
    }

    // Métodos de compatibilidade
    showSuccess(message) {
        this.showStatus('connected', message);
        setTimeout(() => this.hideStatus(), 3000);
    }

    showError(message) {
        this.showStatus('error', message);
        setTimeout(() => this.hideStatus(), 5000);
    }

    showLoading(message = 'Processando...') {
        this.showStatus('connecting', message);
    }

    hideCreateForm() {
        this.showStep(2);
    }
    
    showConnectForm(instanceName, token = null) {
        this.showStep(2);
    }

    updateProgressStep(step) {
        this.showStep(step);
    }

    updateStatusBar(status, text) {
        this.showStatus(status, text);
    }

    resetButtons() {
        this.setButtonLoading('#instanceForm button[type="submit"]', false);
        this.setButtonLoading('#connectForm button[type="submit"]', false);
    }
}
