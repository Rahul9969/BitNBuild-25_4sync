document.addEventListener('DOMContentLoaded', () => {
    // =============================================================================
    // ELEMENT SELECTORS
    // =============================================================================
    const landingPage = document.getElementById('landing-page');
    const loginModal = document.getElementById('login-modal');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const welcomeUsername = document.getElementById('welcome-username');
    const profileUsername = document.getElementById('profile-username');
    const getStartedButton = document.getElementById('get-started-button');
    const loginNavButton = document.getElementById('login-nav-button');
    const closeModalButton = document.getElementById('close-modal-button');

    // AI Chat Selectors
    const aiChatButton = document.getElementById('ai-chat-button');
    const aiChatModal = document.getElementById('ai-chat-modal');
    const closeChatButton = document.getElementById('close-chat-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatPrompts = document.getElementById('chat-prompts');
    
    const pages = {
        dashboard: document.getElementById('page-dashboard'),
        optimizer: document.getElementById('page-optimizer'),
        cibil: document.getElementById('page-cibil'),
        reports: document.getElementById('page-reports'),
        profile: document.getElementById('page-profile'),
    };
    const navLinks = {
        dashboard: document.getElementById('nav-dashboard'),
        optimizer: document.getElementById('nav-optimizer'),
        cibil: document.getElementById('nav-cibil'),
        reports: document.getElementById('nav-reports'),
        profile: document.getElementById('nav-profile'),
    };
    let analysisData = null;
    let spendingChart = null;

    // =============================================================================
    // AUTH & PAGE VISIBILITY
    // =============================================================================
    const showLoginModal = () => loginModal.classList.remove('hidden');
    const hideLoginModal = () => loginModal.classList.add('hidden');
    
    const showAppPage = (username) => {
        welcomeUsername.textContent = username;
        profileUsername.textContent = username;
        hideLoginModal();
        landingPage.style.display = 'none';
        appContainer.classList.remove('hidden');
    };

    const showLandingPage = () => {
        appContainer.classList.add('hidden');
        landingPage.style.display = 'block';
        hideLoginModal();
        navigate('dashboard');
    };

    getStartedButton.addEventListener('click', showLoginModal);
    loginNavButton.addEventListener('click', showLoginModal);
    closeModalButton.addEventListener('click', hideLoginModal);
    loginModal.addEventListener('click', (e) => {
        if(e.target === loginModal) hideLoginModal();
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        if (username.trim() && e.target.password.value.trim()) {
            showAppPage(username);
        } else {
            alert('Please enter a username and password.');
        }
    });

    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        showLandingPage();
    });

    showLandingPage();

    // =============================================================================
    // AI CHAT ASSISTANT LOGIC
    // =============================================================================
    const toggleChat = () => {
        const isHidden = aiChatModal.classList.contains('hidden');
        if (isHidden) {
            aiChatModal.classList.remove('hidden');
            setTimeout(() => {
                aiChatModal.style.opacity = '1';
                aiChatModal.style.transform = 'translateY(0)';
            }, 10);
            if (chatMessages.children.length === 0) {
                 addMessageToChat("Hello! I'm the TaxWise AI Assistant. How can I help?", 'ai');
            }
        } else {
            aiChatModal.style.opacity = '0';
            aiChatModal.style.transform = 'translateY(20px)';
            setTimeout(() => aiChatModal.classList.add('hidden'), 300);
        }
    };
    
    const addMessageToChat = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender === 'user' ? 'user-message' : 'ai-message'}`;
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleChatMessage = async (e) => {
        e.preventDefault();
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        addMessageToChat(userInput, 'user');
        chatInput.value = '';
        chatPrompts.classList.add('hidden');

        const thinkingElement = document.createElement('div');
        thinkingElement.className = 'chat-message ai-message';
        thinkingElement.innerHTML = '<span class="italic text-gray-400">Thinking...</span>';
        chatMessages.appendChild(thinkingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        await new Promise(res => setTimeout(res, 1000));

        const aiResponse = getCuratedAiResponse(userInput);
        thinkingElement.remove();
        addMessageToChat(aiResponse, 'ai');
    };

    const getCuratedAiResponse = (prompt) => {
        const p = prompt.toLowerCase();
        if (p.includes('cibil') || p.includes('score')) {
            return "To improve your CIBIL score, always pay your bills on time, keep your credit utilization below 30%, and maintain a healthy mix of credit types (like credit cards and loans). Avoid applying for too much credit at once.";
        } else if (p.includes('tax') || p.includes('regime')) {
            return "The Old Tax Regime allows claiming deductions (like HRA, 80C). The New Tax Regime has lower slab rates but fewer deductions. The better option depends on your income and investments.";
        } else if (p.includes('80c')) {
            return "Section 80C allows reducing taxable income by up to ₹1,50,000 via investments in PPF, ELSS mutual funds, life insurance, etc.";
        } else if (p.includes('hello') || p.includes('hi')) {
            return "Hello there! How can I assist you with your tax and finance questions?";
        } else {
            return "I can help with questions about Indian tax regimes, CIBIL scores, and investments like 80C. Please try asking about one of those topics.";
        }
    };

    aiChatButton.addEventListener('click', toggleChat);
    closeChatButton.addEventListener('click', toggleChat);
    chatForm.addEventListener('submit', handleChatMessage);
    chatPrompts.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') {
            chatInput.value = e.target.textContent;
            const mockEvent = { preventDefault: () => {}, target: chatForm };
            handleChatMessage(mockEvent);
        }
    });

    // =============================================================================
    // NAVIGATION HANDLING
    // =============================================================================
    function navigate(page) {
        Object.values(pages).forEach(p => {
            if (p) p.classList.add('hidden');
        });
        Object.values(navLinks).forEach(l => {
            if(l) l.classList.remove('active');
        });
        if (pages[page]) pages[page].classList.remove('hidden');
        if (navLinks[page]) navLinks[page].classList.add('active');
    }
    Object.keys(navLinks).forEach(key => {
        if (navLinks[key]) {
            navLinks[key].addEventListener('click', (e) => {
                e.preventDefault();
                navigate(key);
            });
        }
    });

    // =============================================================================
    // FILE UPLOAD & API (REAL)
    // =============================================================================
    document.getElementById('upload-button').addEventListener('click', () => document.getElementById('file-upload').click());
    document.getElementById('file-upload').addEventListener('change', (event) => {
        if (event.target.files.length > 0) handleFileUpload(event.target.files);
    });

    async function handleFileUpload(files) {
        const statusDiv = document.getElementById('upload-status');
        const cibilLoader = document.getElementById('cibil-loader');
        const cibilDisplay = document.getElementById('cibil-score-display');
        
        statusDiv.innerHTML = `<div class="flex items-center text-amber-400"><div class="loader w-5 h-5 mr-2 !border-t-amber-400"></div> Processing ${files.length} file(s)...</div>`;
        cibilLoader.classList.remove('hidden');
        cibilDisplay.classList.add('hidden');
        document.getElementById('cibil-status').textContent = 'Analyzing...';
        
        const formData = new FormData();
        for (const file of files) {
            formData.append('statements', file);
        }

        try {
            const response = await fetch('https://taxwise-api-unique.onrender.com/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process file');
            }
            
            analysisData = await response.json();
            
            statusDiv.innerHTML = `<div class="text-green-400 font-semibold">Analysis complete!</div>`;
            
            updateDashboard(analysisData.dashboard_data);
            updateTaxOptimizer(analysisData.tax_analysis);
            updateCibilAdvisor(analysisData.cibil_analysis);

            document.getElementById('download-pdf-button').disabled = false;
            document.getElementById('pdf-note').textContent = "Your financial summary is ready for download.";
        } catch (error) {
            statusDiv.innerHTML = `<div class="text-red-500 font-semibold">Error: ${error.message}. Is the backend server running?</div>`;
        } finally {
            cibilLoader.classList.add('hidden');
            cibilDisplay.classList.remove('hidden');
        }
    }

    // =============================================================================
    // UI UPDATE FUNCTIONS
    // =============================================================================
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN').format(Math.round(amount));
    }

    function updateDashboard(data) {
        const taxRegime = analysisData.tax_analysis.recommended_regime.toUpperCase();
        document.getElementById('tax-liability').textContent = formatCurrency(analysisData.tax_analysis[`${taxRegime.toLowerCase()}_regime`].tax_payable);
        document.getElementById('tax-regime-label').textContent = `Regime: ${taxRegime}`;
        document.getElementById('cibil-score').textContent = analysisData.cibil_analysis.score;
        document.getElementById('cibil-status').textContent = 'Analysis complete';
        document.getElementById('investments-80c').textContent = formatCurrency(data.investments_80c);
        
        const transactionsContainer = document.getElementById('recent-transactions');
        transactionsContainer.innerHTML = '';
        data.transactions.forEach(tx => {
            const amount = tx.credit > 0 ? `+ ₹ ${formatCurrency(tx.credit)}` : `- ₹ ${formatCurrency(tx.debit)}`;
            const amountColor = tx.credit > 0 ? 'text-green-400' : 'text-red-400';
            const date = tx.date || 'N/A';
            transactionsContainer.innerHTML += `<div class="flex justify-between items-center py-1.5 border-b border-gray-700/50"><div><p class="font-medium text-main-header">${tx.description || 'N/A'}</p><p class="text-sm text-main-subheader">${date}</p></div><p class="font-semibold ${amountColor}">${amount}</p></div>`;
        });
        
        renderSpendingChart(data.spending_breakdown);
        renderInvestmentOpportunities(data.investments_80c);
    }

    function renderInvestmentOpportunities(investments80c) {
        const container = document.getElementById('investment-opportunities');
        const remaining80c = 150000 - investments80c;
        let content = `<h3 class="text-lg font-semibold text-main-header mb-4">Investment Opportunities</h3>`;

        if (remaining80c > 0) {
            content += `<div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg"><p class="font-semibold text-amber-300">Maximize Your 80C Savings!</p><p class="text-amber-400 mt-1">You can still invest <span class="font-bold">₹ ${formatCurrency(remaining80c)}</span> in options like PPF, ELSS, or NPS to save more tax.</p></div>`;
        } else {
             content += `<div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"><p class="font-semibold text-green-300">Congratulations!</p><p class="text-green-400 mt-1">You have maximized your tax savings under Section 80C.</p></div>`;
        }
        container.innerHTML = content;
    }

    function updateTaxOptimizer(data) {
        const container = document.getElementById('tax-optimizer-content');
        const isOldRecommended = data.recommended_regime === 'old';
        const recommendationsHTML = data.recommendations?.length ? data.recommendations.map(rec => `<li>${rec}</li>`).join('') : '<li>No specific tax recommendations.</li>';
        container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="card p-6 border-2 ${isOldRecommended ? 'border-amber-400' : 'border-transparent'}"><div class="flex justify-between items-center"><h3 class="text-xl font-bold text-main-header">Old Regime</h3>${isOldRecommended ? '<span class="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>' : ''}</div><div class="mt-4 space-y-2"><p class="text-main-subheader">Taxable Income: <span class="font-semibold text-main-header">₹ ${formatCurrency(data.old_regime.taxable_income)}</span></p><p class="text-main-header font-bold text-2xl">Tax Payable: <span class="text-green-400">₹ ${formatCurrency(data.old_regime.tax_payable)}</span></p></div></div><div class="card p-6 border-2 ${!isOldRecommended ? 'border-amber-400' : 'border-transparent'}"><div class="flex justify-between items-center"><h3 class="text-xl font-bold text-main-header">New Regime</h3>${!isOldRecommended ? '<span class="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>' : ''}</div><div class="mt-4 space-y-2"><p class="text-main-subheader">Taxable Income: <span class="font-semibold text-main-header">₹ ${formatCurrency(data.new_regime.taxable_income)}</span></p><p class="text-main-header font-bold text-2xl">Tax Payable: <span class="text-green-400">₹ ${formatCurrency(data.new_regime.tax_payable)}</span></p></div></div></div><div class="card p-6 mt-6"><h3 class="text-lg font-semibold text-main-header flex items-center"><svg class="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>AI Recommendations</h3><ul class="list-disc list-inside mt-3 text-main-subheader space-y-2">${recommendationsHTML}</ul></div>`;
    }
    
    function updateCibilAdvisor(data) {
          const container = document.getElementById('cibil-advisor-content');
          const recommendationsHTML = data.recommendations?.length ? data.recommendations.map(rec => `<li>${rec}</li>`).join('') : '<li>No recommendations.</li>';
          container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="card p-6"><h3 class="text-xl font-bold text-main-header">Your CIBIL Score: <span class="text-green-400">${data.score}</span></h3><p class="text-main-subheader mt-1">Estimate based on your financial data.</p><div class="grid grid-cols-2 gap-4 mt-6 text-center"><div><h4 class="font-semibold text-main-subheader">Payment History</h4><p class="text-2xl font-bold text-green-400 mt-2">100%</p></div><div><h4 class="font-semibold text-main-subheader">Credit Utilization</h4><p class="text-2xl font-bold text-amber-400 mt-2" id="cibil-utilization-display">${(data.factors.credit_utilization * 100).toFixed(0)}%</p></div></div></div><div class="card p-6"><h3 class="text-lg font-semibold text-main-header">What-If Scenario</h3><p class="text-sm text-main-subheader mt-1">See how your CIBIL score could change.</p><div class="mt-4"><label for="utilization-slider" class="block mb-2 text-sm font-medium text-main-header">Adjust Credit Utilization (<span id="slider-value-display"></span>%)</label><input id="utilization-slider" type="range" min="1" max="100" value="${(data.factors.credit_utilization * 100).toFixed(0)}" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"><p class="text-center mt-3 text-lg text-main-subheader">Simulated Score: <span id="simulated-cibil-score" class="font-bold text-green-400"></span></p></div></div></div><div class="card p-6 mt-6"><h3 class="text-lg font-semibold text-main-header flex items-center"><svg class="h-6 w-6 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 2a3 3 0 00-3 3v1.432l.21.018a22.99 22.99 0 0115.58 0l.21-.018V5a3 3 0 00-3-3H5zm12 5.432l-.21.018a22.99 22.99 0 01-15.58 0L3 7.432V15a3 3 0 003 3h12a3 3 0 003-3V7.432zM14 12a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" /></svg>How to Improve Your Score</h3><ul class="list-disc list-inside mt-3 text-main-subheader space-y-2">${recommendationsHTML}</ul></div>`;
        setupCibilSimulator();
    }

    function setupCibilSimulator() {
        const slider = document.getElementById('utilization-slider');
        if (!slider) return;
        const sliderValueDisplay = document.getElementById('slider-value-display');
        const simulatedScoreDisplay = document.getElementById('simulated-cibil-score');
        
        const estimateScore = (utilization) => {
            let score = 750;
            if (utilization > 90) score -= 100; else if (utilization > 70) score -= 75;
            else if (utilization > 50) score -= 50; else if (utilization > 30) score -= 25;
            else score += 20;
            return Math.max(Math.min(score, 900), 300);
        };

        const updateSimulation = () => {
            sliderValueDisplay.textContent = slider.value;
            simulatedScoreDisplay.textContent = estimateScore(slider.value);
        };
        slider.addEventListener('input', updateSimulation);
        updateSimulation();
    }

    // =============================================================================
    // CHART RENDERING
    // =============================================================================
    function renderSpendingChart(spendingData) {
        const ctx = document.getElementById('spending-chart').getContext('2d');
        const consolidatedData = Object.entries(spendingData).reduce((acc, [cat, amt]) => {
            if (!cat.toLowerCase().includes('income')) acc[cat] = (acc[cat] || 0) + amt;
            return acc;
        }, {});
        
        if (spendingChart) spendingChart.destroy();
        Chart.defaults.color = '#9ca3af'; // Chart text color
        spendingChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(consolidatedData),
                datasets: [{
                    data: Object.values(consolidatedData),
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#ec4899', '#f97316', '#06b6d4'],
                    borderColor: '#0f172a', borderWidth: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }
        });
    }

});



