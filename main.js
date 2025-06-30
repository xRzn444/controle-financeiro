// Configurações e constantes
const API_URL = 'http://localhost:54925/api';

const CATEGORIES = {
    income: ['Salário', 'Freelancer', 'Investimentos', 'Outros'],
    expense: ['Casa', 'Internet', 'Transporte', 'Lazer', 'Academia', 'Compras', 'Alimentação', 'Saúde', 'Educação', 'Outros'],
    savings: ['Poupança', 'Investimentos', 'Reserva de Emergência']
};

const COLORS = {
    income: '#4CAF50',
    expense: '#f44336',
    savings: '#2196F3'
};

class CarteiraDigital {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.currentTransactionType = null;
        this.editingTransaction = null;
        if (typeof document !== 'undefined') {
            const modal = document.getElementById('transactionModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadData();
    }

    // Verificação de autenticação
    checkAuth() {
        const currentUser = sessionStorage.getItem('currentUser');
        const token = sessionStorage.getItem('token');
        if (currentUser && token) {
            this.currentUser = JSON.parse(currentUser);
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
        } else {
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    }

    // Configuração de event listeners
    setupEventListeners() {
        // Event listeners para página de login
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        if (showRegister) {
            showRegister.addEventListener('click', (e) => this.toggleAuthForms(e));
        }
        if (showLogin) {
            showLogin.addEventListener('click', (e) => this.toggleAuthForms(e));
        }

        // Event listeners para dashboard
        const logoutBtn = document.getElementById('logoutBtn');
        const addIncomeBtn = document.getElementById('addIncomeBtn');
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        const addSavingsBtn = document.getElementById('addSavingsBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelTransaction = document.getElementById('cancelTransaction');
        const transactionForm = document.getElementById('transactionForm');
        const toggleTransactionsBtn = document.getElementById('toggleTransactionsBtn');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.openTransactionModal('income'));
        }
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openTransactionModal('expense'));
        }
        if (addSavingsBtn) {
            addSavingsBtn.addEventListener('click', () => this.openTransactionModal('savings'));
        }
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeTransactionModal());
        }
        if (cancelTransaction) {
            cancelTransaction.addEventListener('click', () => this.closeTransactionModal());
        }
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }
        if (toggleTransactionsBtn) {
            toggleTransactionsBtn.addEventListener('click', () => this.toggleTransactionsList());
        }

        // Event listeners para filtros
        const monthFilter = document.getElementById('monthFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');

        if (monthFilter) {
            monthFilter.addEventListener('change', () => this.filterTransactions());
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterTransactions());
        }
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterTransactions());
        }

        // Fechar modal ao clicar fora
        const transactionModal = document.getElementById('transactionModal');
        if (transactionModal) {
            transactionModal.addEventListener('click', (e) => {
                if (e.target === transactionModal) {
                    this.closeTransactionModal();
                }
            });
        }

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            const transactionModal = document.getElementById('transactionModal');
            if (e.key === 'Escape' && transactionModal && !transactionModal.classList.contains('hidden')) {
                this.closeTransactionModal();
            }
        });
    }

    // Alternar entre formulários de login e cadastro
    toggleAuthForms(e) {
        e.preventDefault();
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm && registerForm) {
            if (loginForm.classList.contains('hidden')) {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        }
    }

    // Validação de e-mail
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validação de senha
    validatePassword(password) {
        return password.length >= 6;
    }

    // Manipulação de login
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) {
            this.showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }
        if (!this.validateEmail(email)) {
            this.showNotification('Por favor, insira um e-mail válido', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                this.showNotification(data.error || 'Erro ao fazer login', 'error');
                return;
            }
            this.currentUser = data.user;
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            sessionStorage.setItem('token', data.token);
            this.showNotification('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            this.showNotification('Erro ao fazer login', 'error');
        }
    }

    // Manipulação de cadastro
    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }
        if (!this.validateEmail(email)) {
            this.showNotification('Por favor, insira um e-mail válido', 'error');
            return;
        }
        if (!this.validatePassword(password)) {
            this.showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        if (password !== confirmPassword) {
            this.showNotification('As senhas não coincidem', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                this.showNotification(data.error || 'Erro ao criar conta', 'error');
                return;
            }
            this.showNotification('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
            document.getElementById('registerForm').reset();
            this.toggleAuthForms(e);
        } catch (error) {
            this.showNotification('Erro ao criar conta', 'error');
        }
    }

    // Logout
    logout() {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        this.showNotification('Logout realizado com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // Carregar dados
    async loadData() {
        const token = sessionStorage.getItem('token');
        if (this.currentUser && token) {
            try {
                const res = await fetch(`${API_URL}/transactions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    this.showNotification(data.error || 'Erro ao carregar dados', 'error');
                    return;
                }
                this.transactions = data;
                this.setupDashboard();
            } catch (error) {
                this.showNotification('Erro ao carregar dados', 'error');
            }
        } else {
            // Usuário não autenticado
        }
    }

    // Configurar dashboard
    setupDashboard() {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = this.currentUser.name;
        }
        
        this.updateSummaryCards();
        this.updateTransactionsList();
        this.setupFilters();
        this.updateCharts();
        
        // Aguardar um pouco para garantir que todos os elementos estejam disponíveis
        // antes de carregar o estado de visibilidade
        setTimeout(() => {
            this.loadTransactionsVisibility();
        }, 50);
    }

    // Abrir modal de transação
    openTransactionModal(type, transaction = null) {
        this.currentTransactionType = type;
        this.editingTransaction = transaction;
        
        const modal = document.getElementById('transactionModal');
        const modalTitle = document.getElementById('modalTitle');
        const categorySelect = document.getElementById('transactionCategory');
        const form = document.getElementById('transactionForm');
        
        // Preencher título
        if (modalTitle) {
            const titles = {
                income: transaction ? 'Editar Ganho' : 'Adicionar Ganho',
                expense: transaction ? 'Editar Gasto' : 'Adicionar Gasto',
                savings: transaction ? 'Editar Poupança' : 'Adicionar Poupança'
            };
            modalTitle.textContent = titles[type];
        }
        
        // Preencher categorias
        if (categorySelect) {
            categorySelect.innerHTML = '';
            const categories = CATEGORIES[type] || [];
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
        
        // Preencher ou limpar formulário
        if (form) {
            form.reset();
            if (transaction) {
                document.getElementById('transactionName').value = transaction.name;
                document.getElementById('transactionValue').value = transaction.value;
                document.getElementById('transactionCategory').value = transaction.category;
                document.getElementById('transactionDate').value = transaction.date;
                document.getElementById('transactionNotes').value = transaction.notes || '';
            } else {
                // Definir data atual como padrão
                document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
            }
        }
        
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Fechar modal de transação
    closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');
        
        if (modal) {
            modal.classList.add('hidden');
        }
        if (form) {
            form.reset();
        }
        
        this.currentTransactionType = null;
        this.editingTransaction = null;
    }

    // Manipular envio de transação
    async handleTransactionSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('transactionName').value.trim();
        const value = parseFloat(document.getElementById('transactionValue').value);
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value.trim();
        if (!name || !value || !category || !date) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        if (value <= 0) {
            this.showNotification('O valor deve ser maior que zero', 'error');
            return;
        }
        const token = sessionStorage.getItem('token');
        if (!this.currentUser || !this.currentUser.id || !token) {
            this.showNotification('Usuário não autenticado', 'error');
            return;
        }
        try {
            let res, data;
            if (this.editingTransaction) {
                // Editar transação
                res = await fetch(`${API_URL}/transactions/${this.editingTransaction.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: this.currentTransactionType,
                        name,
                        value,
                        category,
                        date,
                        notes
                    })
                });
                data = await res.json();
                if (!res.ok) {
                    this.showNotification(data.error || 'Erro ao atualizar transação', 'error');
                    return;
                }
                const index = this.transactions.findIndex(t => t.id === this.editingTransaction.id);
                if (index !== -1) {
                    this.transactions[index] = data;
                }
                this.showNotification('Transação atualizada com sucesso!', 'success');
            } else {
                // Adicionar nova transação
                res = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: this.currentTransactionType,
                        name,
                        value,
                        category,
                        date,
                        notes
                    })
                });
                data = await res.json();
                if (!res.ok) {
                    this.showNotification(data.error || 'Erro ao adicionar transação', 'error');
                    return;
                }
                this.transactions.push(data);
                this.showNotification('Transação adicionada com sucesso!', 'success');
            }
            this.closeTransactionModal();
            this.updateSummaryCards();
            this.updateTransactionsList();
            this.updateCharts();
            this.setupFilters();
        } catch (error) {
            this.showNotification('Erro ao salvar transação', 'error');
        }
    }

    // Excluir transação
    async deleteTransaction(transactionId) {
        const token = sessionStorage.getItem('token');
        if (!token) {
            this.showNotification('Usuário não autenticado', 'error');
            return;
        }
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            try {
                const res = await fetch(`${API_URL}/transactions/${transactionId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    this.showNotification(data.error || 'Erro ao excluir transação', 'error');
                    return;
                }
                this.transactions = this.transactions.filter(t => t.id !== transactionId);
                this.updateSummaryCards();
                this.updateTransactionsList();
                this.updateCharts();
                this.setupFilters();
                this.showNotification('Transação excluída com sucesso!', 'success');
            } catch (error) {
                this.showNotification('Erro ao excluir transação', 'error');
            }
        }
    }

    // Editar transação
    editTransaction(transaction) {
        this.openTransactionModal(transaction.type, transaction);
    }

    // Alternar visibilidade da lista de transações
    toggleTransactionsList() {
        const transactionsSection = document.querySelector('.transactions');
        const toggleBtn = document.getElementById('toggleTransactionsBtn');
        
        // Verificar se ambos os elementos existem
        if (!transactionsSection) {
            console.warn('Elemento .transactions não encontrado');
            return;
        }
        
        if (!toggleBtn) {
            console.warn('Botão toggleTransactionsBtn não encontrado');
            return;
        }
        
        const isHidden = transactionsSection.classList.contains('hidden');
        transactionsSection.classList.toggle('hidden');
        
        // Salvar estado no localStorage
        const newState = !isHidden;
        localStorage.setItem('transactionsHidden', newState.toString());
        
        // Atualizar texto do botão baseado no novo estado
        const newText = newState ? 
            '<i class="fas fa-eye"></i> Mostrar Histórico' : 
            '<i class="fas fa-eye-slash"></i> Ocultar Histórico';
        toggleBtn.innerHTML = newText;
    }

    // Atualizar cards de resumo
    updateSummaryCards() {
        const currentMonth = new Date().toMonthYearString();
        const monthTransactions = this.transactions.filter(t => 
            new Date(t.date).toMonthYearString() === currentMonth
        );

        const totalIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.value, 0);

        const totalExpense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.value, 0);

        const totalSavings = this.transactions
            .filter(t => t.type === 'savings')
            .reduce((sum, t) => sum + t.value, 0);

        // Saldo disponível = Ganhos - Gastos - Poupança
        const totalBalance = totalIncome - totalExpense - totalSavings;

        // Atualizar elementos
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        const totalBalanceEl = document.getElementById('totalBalance');
        const totalSavingsEl = document.getElementById('totalSavings');

        if (totalIncomeEl) totalIncomeEl.textContent = this.formatCurrency(totalIncome);
        if (totalExpenseEl) totalExpenseEl.textContent = this.formatCurrency(totalExpense);
        if (totalBalanceEl) totalBalanceEl.textContent = this.formatCurrency(totalBalance);
        if (totalSavingsEl) totalSavingsEl.textContent = this.formatCurrency(totalSavings);
    }

    // Atualizar lista de transações
    updateTransactionsList() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma transação encontrada</p>';
            return;
        }

        transactionsList.innerHTML = filteredTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(transaction => this.createTransactionHTML(transaction))
            .join('');
        
        // Adicionar event listeners aos botões
        this.setupTransactionButtons();
    }

    // Configurar event listeners dos botões de transação
    setupTransactionButtons() {
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) return;

        // Event listeners para botões de editar
        const editButtons = transactionsList.querySelectorAll('.btn-edit');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const transactionId = e.currentTarget.getAttribute('data-transaction-id');
                const transaction = this.transactions.find(t => t.id === transactionId);
                if (transaction) {
                    this.editTransaction(transaction);
                }
            });
        });

        // Event listeners para botões de excluir
        const deleteButtons = transactionsList.querySelectorAll('.btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const transactionId = e.currentTarget.getAttribute('data-transaction-id');
                if (transactionId) {
                    this.deleteTransaction(transactionId);
                }
            });
        });
    }

    // Criar HTML da transação
    createTransactionHTML(transaction) {
        const date = new Date(transaction.date).toLocaleDateString('pt-BR');
        const value = this.formatCurrency(transaction.value);
        const valueClass = transaction.type;
        const icon = this.getCategoryIcon(transaction.category);

        // Escapar dados para evitar XSS
        const escapedName = this.escapeHtml(transaction.name);
        const escapedCategory = this.escapeHtml(transaction.category);
        const escapedNotes = transaction.notes ? this.escapeHtml(transaction.notes) : '';

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-name">
                        <i class="${icon}"></i>
                        ${escapedName}
                    </div>
                    <div class="transaction-details">
                        ${escapedCategory} • ${date}
                        ${escapedNotes ? ` • ${escapedNotes}` : ''}
                    </div>
                </div>
                <div class="transaction-actions">
                    <div class="transaction-value ${valueClass}">
                        ${transaction.type === 'expense' ? '-' : '+'}${value}
                    </div>
                    <div class="transaction-buttons">
                        <button class="btn-edit" data-transaction-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-transaction-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Função para escapar HTML e prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Obter ícone da categoria
    getCategoryIcon(category) {
        const icons = {
            'Salário': 'fas fa-briefcase',
            'Freelancer': 'fas fa-laptop-code',
            'Investimentos': 'fas fa-chart-line',
            'Casa': 'fas fa-home',
            'Internet': 'fas fa-wifi',
            'Transporte': 'fas fa-car',
            'Lazer': 'fas fa-gamepad',
            'Academia': 'fas fa-dumbbell',
            'Compras': 'fas fa-shopping-cart',
            'Alimentação': 'fas fa-utensils',
            'Saúde': 'fas fa-heartbeat',
            'Educação': 'fas fa-graduation-cap',
            'Poupança': 'fas fa-piggy-bank',
            'Reserva de Emergência': 'fas fa-shield-alt',
            'Outros': 'fas fa-ellipsis-h'
        };
        return icons[category] || 'fas fa-ellipsis-h';
    }

    // Configurar filtros
    setupFilters() {
        this.updateMonthFilter();
        this.updateCategoryFilter();
    }

    // Atualizar filtro de meses
    updateMonthFilter() {
        const monthFilter = document.getElementById('monthFilter');
        if (!monthFilter) return;

        const months = [...new Set(this.transactions.map(t => new Date(t.date).toMonthYearString()))];
        months.sort((a, b) => new Date(b) - new Date(a));

        monthFilter.innerHTML = '<option value="">Todos os meses</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthFilter.appendChild(option);
        });
    }

    // Atualizar filtro de categorias
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.transactions.map(t => t.category))];
        categories.sort();

        categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // Filtrar transações
    filterTransactions() {
        this.updateTransactionsList();
        this.updateCharts();
    }

    // Obter transações filtradas
    getFilteredTransactions() {
        let filtered = [...this.transactions];

        const monthFilter = document.getElementById('monthFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');

        if (monthFilter && monthFilter.value) {
            filtered = filtered.filter(t => 
                new Date(t.date).toMonthYearString() === monthFilter.value
            );
        }

        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(t => t.category === categoryFilter.value);
        }

        if (typeFilter && typeFilter.value) {
            filtered = filtered.filter(t => t.type === typeFilter.value);
        }

        return filtered;
    }

    // Atualizar gráficos
    updateCharts() {
        this.updateExpenseChart();
        this.updateMonthlyChart();
    }

    // Atualizar gráfico de gastos por categoria
    updateExpenseChart() {
        const chartContainer = document.getElementById('expenseChart');
        if (!chartContainer) return;

        const filteredTransactions = this.getFilteredTransactions();
        const expenses = filteredTransactions.filter(t => t.type === 'expense');

        if (expenses.length === 0) {
            chartContainer.innerHTML = '<p>Nenhum gasto registrado</p>';
            return;
        }

        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.value;
        });

        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        const chartHTML = Object.entries(categoryTotals)
            .map(([category, value]) => {
                const percentage = ((value / total) * 100).toFixed(1);
                return `
                    <div class="chart-bar">
                        <div class="chart-label">${category}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar-fill" style="width: ${percentage}%; background: ${COLORS.expense}"></div>
                        </div>
                        <div class="chart-value">${this.formatCurrency(value)} (${percentage}%)</div>
                    </div>
                `;
            })
            .join('');

        chartContainer.innerHTML = chartHTML;
    }

    // Atualizar gráfico mensal
    updateMonthlyChart() {
        const chartContainer = document.getElementById('monthlyChart');
        if (!chartContainer) return;

        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            chartContainer.innerHTML = '<p>Nenhuma transação registrada</p>';
            return;
        }

        const monthlyData = {};
        filteredTransactions.forEach(transaction => {
            const month = new Date(transaction.date).toMonthYearString();
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }
            monthlyData[month][transaction.type] += transaction.value;
        });

        const chartHTML = Object.entries(monthlyData)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([month, data]) => {
                const total = data.income + data.expense;
                const incomePercentage = total > 0 ? ((data.income / total) * 100).toFixed(1) : 0;
                const expensePercentage = total > 0 ? ((data.expense / total) * 100).toFixed(1) : 0;

                return `
                    <div class="chart-bar">
                        <div class="chart-label">${month}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar-fill" style="width: ${incomePercentage}%; background: ${COLORS.income}"></div>
                            <div class="chart-bar-fill" style="width: ${expensePercentage}%; background: ${COLORS.expense}"></div>
                        </div>
                        <div class="chart-value">
                            Ganhos: ${this.formatCurrency(data.income)} | Gastos: ${this.formatCurrency(data.expense)}
                        </div>
                    </div>
                `;
            })
            .join('');

        chartContainer.innerHTML = chartHTML;
    }

    // Formatar moeda
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Mostrar notificação
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Carregar estado de visibilidade das transações
    loadTransactionsVisibility() {
        const transactionsHidden = localStorage.getItem('transactionsHidden');
        const transactionsSection = document.querySelector('.transactions');
        const toggleBtn = document.getElementById('toggleTransactionsBtn');
        
        // Se não há estado salvo, não fazer nada
        if (!transactionsHidden) {
            return;
        }
        
        // Verificar se os elementos existem
        if (!transactionsSection) {
            console.warn('Elemento .transactions não encontrado em loadTransactionsVisibility');
            return;
        }
        
        if (!toggleBtn) {
            console.warn('Botão toggleTransactionsBtn não encontrado em loadTransactionsVisibility');
            return;
        }
        
        // Se o estado é 'true' (oculto), aplicar a ocultação
        if (transactionsHidden === 'true') {
            transactionsSection.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Mostrar Histórico';
        }
    }
}

// Extensão do Date para formatação
Date.prototype.toMonthYearString = function() {
    return this.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CarteiraDigital();
});

// Adicionar estilos para gráficos
const chartStyles = `
<style>
.chart-bar {
    margin-bottom: 15px;
}

.chart-label {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 5px;
}

.chart-bar-container {
    height: 20px;
    background: var(--bg-tertiary);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 5px;
    display: flex;
}

.chart-bar-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.chart-value {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.transaction-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.transaction-buttons {
    display: flex;
    gap: 5px;
}

.btn-edit, .btn-delete {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.btn-edit:hover {
    color: var(--secondary);
    background: var(--bg-tertiary);
}

.btn-delete:hover {
    color: var(--danger);
    background: var(--bg-tertiary);
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', chartStyles);