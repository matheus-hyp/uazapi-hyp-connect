// ===== MÓDULO STATUS POLLER =====
// Gerencia o polling de status da instância

class StatusPoller {
    constructor(apiManager, uiManager, callbacks = {}) {
        this.apiManager = apiManager;
        this.uiManager = uiManager;
        this.callbacks = callbacks;
        this.pollingInterval = null;
        this.retryCount = 0;
        this.maxRetries = 10;
        this.connectionInProgress = false; // Flag para controlar se conexão está em progresso
    }

    start(token, mode) {
        this.stop();
        this.token = token;
        this.mode = mode;
        this.retryCount = 0;
        this.connectionInProgress = false; // Reset flag sempre que iniciar
        
        
        this.pollingInterval = setInterval(async () => {
            await this.checkStatus();
        }, 5000);
    }

    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Método para marcar que conexão está em progresso e parar tentativas
    setConnectionInProgress() {
        this.connectionInProgress = true;
        this.stop(); // Para o polling quando conexão está em progresso
    }

    async checkStatus() {
        if (!this.token || this.connectionInProgress) return; // Para se conexão está em progresso

        const result = await this.apiManager.checkInstanceStatus(this.token);
        
        if (!result.success) {
            return;
        }

        const data = result.data;
        console.log('Status response:', data); // Debug

        // Verificar se a resposta contém mensagem de conexão em progresso
        if (data && data.response && data.response.includes("Connection attempt in progress")) {
            this.setConnectionInProgress();
            // Notificar o InstanceManager para mostrar o modal
            if (this.callbacks.onConnectionInProgress) {
                this.callbacks.onConnectionInProgress(data);
            }
            return;
        }

        // Verificar estrutura: { instance: { status: "connected", ... } }
        if (data.instance) {
            const instance = data.instance;
            const status = instance.status;

            console.log('Instance status:', status); // Debug

            // Verificar se está conectado (pode ser 'connected' ou 'open')
            if (status === 'connected' || status === 'open') {
                this.stop();
                this.uiManager.showSuccessScreen(instance);
                
                if (this.callbacks.onConnected) {
                    this.callbacks.onConnected(instance);
                }
                return;
            }

            // Atualizar códigos se ainda está conectando
            if (status === 'connecting') {
                if (this.mode === 'qrcode' && instance.qrcode) {
                    this.uiManager.updateQRCode(instance.qrcode);
                } else if (this.mode === 'paircode' && instance.paircode) {
                    this.uiManager.updatePairCode(instance.paircode);
                }
                
                // Se não tem código ainda e não excedeu tentativas, tentar novamente
                if (!instance.qrcode && !instance.paircode && this.retryCount < this.maxRetries && !this.connectionInProgress) {
                    this.retryCount++;
                    
                    if (this.callbacks.onRetry) {
                        await this.callbacks.onRetry();
                    }
                }
            }
        }
    }
}
