// ===== MÓDULO API MANAGER =====
// Gerencia todas as chamadas para a API

class APIManager {
    constructor() {
        this.baseUrl = './php/';
    }

    async createInstance(name) {
        try {
            const response = await fetch(`${this.baseUrl}init.controller.rest.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name.trim() })
            });
            
            const result = await response.text();
            
            try {
                return {
                    success: response.ok,
                    data: JSON.parse(result),
                    status: response.status
                };
            } catch (e) {
                return {
                    success: response.ok,
                    data: { message: result },
                    status: response.status
                };
            }
        } catch (error) {
            return {
                success: false,
                data: { message: `Erro de rede: ${error.message}` },
                status: 500
            };
        }
    }

    async connectInstance(phone, instanceName, token) {
        try {
            const response = await fetch(`${this.baseUrl}connect.controller.rest.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: phone,
                    instance: instanceName,
                    token: token
                })
            });
            
            const result = await response.text();
            
            try {
                const parsedResult = JSON.parse(result);
                return {
                    success: response.ok,
                    data: parsedResult,
                    status: response.status
                };
            } catch (e) {
                return {
                    success: false,
                    data: { message: 'Erro ao processar resposta da API' },
                    status: response.status
                };
            }
        } catch (error) {
            return {
                success: false,
                data: { message: `Erro ao conectar: ${error.message}` },
                status: 500
            };
        }
    }

    async checkInstanceStatus(token) {
        try {
            const response = await fetch(`${this.baseUrl}status.controller.rest.php?token=${encodeURIComponent(token)}`);
            const result = await response.json();

            return {
                success: response.ok,
                data: result,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                data: { message: `Erro ao verificar status: ${error.message}` },
                status: 500
            };
        }
    }
}
