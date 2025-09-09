// ===== CLASSE PRINCIPAL - INSTANCE MANAGER =====
// Os módulos UIManager, APIManager e StatusPoller estão em arquivos separados

class InstanceManager {
    constructor() {
        this.currentStep = 1;
        this.autoMode = false;
        this.mode = 'qrcode';
        this.currentToken = null;
        this.currentInstance = null;
        
        // Inicializar managers (as classes são carregadas via script tags)
        this.ui = new UIManager();
        this.api = new APIManager();
        this.errorHandler = new ErrorHandler();
        this.statusPoller = new StatusPoller(this.api, this.ui, {
            onConnected: (instance) => this.onConnectionSuccess(instance),
            onRetry: () => this.retryConnection(),
            onConnectionInProgress: (data) => this.onConnectionInProgress(data)
        });
        
        this.initEventListeners();
        this.loadUrlParams();
    }

    initEventListeners() {
        const instanceForm = document.getElementById('instanceForm');
        const connectForm = document.getElementById('connectForm');
        const choiceCards = document.querySelectorAll('.choice-card');
        
        if (instanceForm) {
            instanceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateInstance();
            });
        }
        
        if (connectForm) {
            connectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleConnect();
            });
        }
        
        choiceCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectMode(card.dataset.mode);
            });
        });
    }
    
    selectMode(mode) {
        this.mode = mode;
        
        // Atualizar UI dos cards
        document.querySelectorAll('.choice-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');
        
        // Mostrar/ocultar campo de telefone
        const phoneField = document.getElementById('phone-field');
        const submitBtn = document.querySelector('#connectForm button[type="submit"]');
        
        if (mode === 'paircode') {
            phoneField.classList.remove('hidden');
            document.getElementById('phone').required = true;
        } else {
            phoneField.classList.add('hidden');
            document.getElementById('phone').required = false;
        }
        
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    loadUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const cliente = urlParams.get('cliente');
        const numero = urlParams.get('numero');
        const modo = urlParams.get('modo');

        if (cliente) {
            const instanceNameInput = document.getElementById('instanceName');
            if (instanceNameInput) {
                instanceNameInput.value = cliente;
            }
        }
        
        if (numero) {
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                phoneInput.value = numero;
            }
        }
        
        if (modo && (modo === 'qrcode' || modo === 'paircode')) {
            this.selectMode(modo);
        }
        
        // Auto-start se cliente fornecido
        if (cliente) {
            this.autoMode = true;
            setTimeout(() => {
                this.executeAutoMode();
            }, 1000);
        }
    }

    async handleCreateInstance() {
        const nameInput = document.getElementById('instanceName');
        if (!nameInput?.value?.trim()) {
            this.ui.showError('Nome da instância é obrigatório');
            return;
        }

        this.ui.setButtonLoading('#instanceForm button[type="submit"]', true, 'Criando...');
        this.ui.showLoading('Criando instância...');
        
        const result = await this.api.createInstance(nameInput.value);
        
        // Verificar se é erro de limite de instâncias
        if (!result.success && result.data && this.errorHandler.isInstanceLimitError(result.data)) {
            this.errorHandler.showInstanceLimitError(result.data);
            return;
        }
        
        if (result.success && result.data.token) {
            this.currentToken = result.data.token;
            this.currentInstance = result.data.name || result.data.instance?.name || nameInput.value;
            
            this.ui.showSuccess(`Instância "${this.currentInstance}" criada com sucesso!`);
            
            if (!this.autoMode) {
                setTimeout(() => {
                    this.ui.showStep(2);
                }, 1500);
            }
        } else {
            this.ui.showError(result.data.message || 'Erro ao criar instância');
            this.ui.setButtonLoading('#instanceForm button[type="submit"]', false);
        }
    }

    async handleConnect() {
        const phoneInput = document.getElementById('phone');
        const instanceNameInput = document.getElementById('instanceName');
        
        if (!phoneInput || !instanceNameInput) {
            this.ui.showError('Campos necessários não encontrados');
            return;
        }

        let phone = phoneInput.value.trim();
        
        // Validações baseadas no modo
        if (this.mode === 'qrcode') {
            phone = '';
        } else if (this.mode === 'paircode' && !phone) {
            this.ui.showError('Número do telefone é obrigatório no modo Pair Code');
            return;
        }
        
        if (!this.currentToken) {
            this.ui.showError('Token não encontrado. Crie uma instância primeiro.');
            return;
        }

        // Validar formato do telefone se fornecido
        if (phone && !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) {
            this.ui.showError('Formato de telefone inválido. Use apenas números (10-15 dígitos)');
            return;
        }

        this.ui.setButtonLoading('#connectForm button[type="submit"]', true, 'Conectando...');
        this.ui.showLoading('Conectando telefone...');
        
        const result = await this.api.connectInstance(phone, instanceNameInput.value, this.currentToken);
        
        // Verificar se é resposta de conexão em progresso
        if (result.data && this.errorHandler.isConnectionInProgress(result.data)) {
            this.statusPoller.setConnectionInProgress(); // Para o polling
            this.errorHandler.showConnectionInProgress(result.data, () => {
                // Callback: retomar polling após 2 minutos
                this.statusPoller.start(this.currentToken, this.mode);
            });
            return;
        }
        
        // Aceitar tanto connected=true quanto instância com status connecting
        if (result.success && result.data.instance && 
            (result.data.connected || result.data.instance.status === 'connecting')) {
            const instance = result.data.instance;
            
            // Mostrar códigos baseado no modo
            if (this.mode === 'qrcode' && instance.qrcode) {
                this.ui.showQRCode(instance.qrcode);
            } else if (this.mode === 'paircode' && instance.paircode) {
                this.ui.showPairCode(instance.paircode, this.currentInstance);
            } else {
                this.ui.showSuccess('Conexão iniciada! Aguarde os códigos...');
                this.ui.showStep(3);
            }
            
            this.statusPoller.start(this.currentToken, this.mode);
            
            // Comentado para manter parâmetros da URL
            // if (this.autoMode) {
            //     setTimeout(() => {
            //         window.history.replaceState({}, document.title, window.location.pathname);
            //     }, 5000);
            // }
        } else {
            this.ui.showError(result.data.message || 'Erro ao conectar telefone');
            this.ui.setButtonLoading('#connectForm button[type="submit"]', false);
        }
    }

    async executeAutoMode() {
        try {
            
            this.ui.showLoading('Etapa 1/2: Criando instância...');
            
            await this.handleCreateInstance();
            
            if (this.currentToken) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                this.ui.showLoading('Etapa 2/2: Conectando telefone...');
                
                await this.handleConnect();
            }
            
        } catch (error) {
            this.ui.showError(`Erro no modo automático: ${error.message}`);
        }
    }

    async retryConnection() {
        
        const phoneInput = document.getElementById('phone');
        const instanceNameInput = document.getElementById('instanceName');
        
        if (!phoneInput || !instanceNameInput) return;

        let phone = phoneInput.value.trim();
        if (this.mode === 'qrcode') phone = '';

        const result = await this.api.connectInstance(phone, instanceNameInput.value, this.currentToken);
        
        // Verificar se é resposta de conexão em progresso no retry
        if (result.data && this.errorHandler.isConnectionInProgress(result.data)) {
            this.statusPoller.setConnectionInProgress(); // Para o polling
            this.errorHandler.showConnectionInProgress(result.data, () => {
                // Callback: retomar polling após 2 minutos
                this.statusPoller.start(this.currentToken, this.mode);
            });
            return;
        }
        
        // Aceitar tanto connected=true quanto instância com status connecting
        if (result.success && result.data.instance && 
            (result.data.connected || result.data.instance.status === 'connecting')) {
            const instance = result.data.instance;
            
            if (this.mode === 'qrcode' && instance.qrcode) {
                this.ui.updateQRCode(instance.qrcode);
            } else if (this.mode === 'paircode' && instance.paircode) {
                this.ui.updatePairCode(instance.paircode);
            }
        }
    }

    onConnectionSuccess(instance) {
        
        // Comentado para manter parâmetros da URL
        // if (this.autoMode) {
        //     setTimeout(() => {
        //         window.history.replaceState({}, document.title, window.location.pathname);
        //     }, 3000);
        // }
    }

    onConnectionInProgress(data) {
        this.errorHandler.showConnectionInProgress(data, () => {
            // Callback: retomar polling após 2 minutos
            this.statusPoller.start(this.currentToken, this.mode);
        });
    }

    // Métodos de compatibilidade (delegar para UI Manager)
    showSuccess(message) { this.ui.showSuccess(message); }
    showError(message) { this.ui.showError(message); }
    showLoading(message) { this.ui.showLoading(message); }
    hideCreateForm() { this.ui.hideCreateForm(); }
    showConnectForm(name) { this.ui.showConnectForm(name); }
    updateProgressStep(step) { this.ui.updateProgressStep(step); }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new InstanceManager();
});
