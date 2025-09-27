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
    // AI CHAT ASSISTANT LOGIC (WITH FALLBACK)
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
                 addMessageToChat("Hello! I'm the TaxWise AI Assistant. How can I help you with your Indian finance questions?", 'ai');
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

        try {
            const response = await fetch('https://taxwise-api-unique.onrender.com/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput }),
            });

            if (!response.ok) {
                // If the server responds with an error (e.g., 500), throw to trigger the catch block
                throw new Error('Server responded with an error.');
            }

            const data = await response.json();
            thinkingElement.remove();
            addMessageToChat(data.reply, 'ai');

        } catch (error) {
            // CATCH BLOCK: This runs if the fetch() fails (network error, CORS, server down)
            console.error('Live Chat API Error:', error); // Log the actual error for debugging
            thinkingElement.remove();
            
            // Get hardcoded response as a fallback
            const fallbackResponse = getCuratedAiResponse(userInput);
            addMessageToChat(fallbackResponse, 'ai'); // Display the fallback response
        }
    };

    // This function provides hard-coded answers if the live API call fails.
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
    // FILE UPLOAD & API
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
            const response = await fetch('https://taxwise-api-unique.onrender.com//upload', {
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
            statusDiv.innerHTML = `<div class="text-red-500 font-semibold">Error: Failed to fetch. Please ensure the backend server is running and accessible.</div>`;
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
            const date = tx.date || tx['Transaction Date'] || 'N/A';
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
        container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="card p-6 border-2 ${isOldRecommended ? 'border-green-400' : 'border-transparent'}"><div class="flex justify-between items-center"><h3 class="text-xl font-bold text-main-header">Old Regime</h3>${isOldRecommended ? '<span class="bg-green-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>' : ''}</div><div class="mt-4 space-y-2"><p class="text-main-subheader">Taxable Income: <span class="font-semibold text-main-header">₹ ${formatCurrency(data.old_regime.taxable_income)}</span></p><p class="text-main-header font-bold text-2xl">Tax Payable: <span class="text-green-400">₹ ${formatCurrency(data.old_regime.tax_payable)}</span></p></div></div><div class="card p-6 border-2 ${!isOldRecommended ? 'border-green-400' : 'border-transparent'}"><div class="flex justify-between items-center"><h3 class="text-xl font-bold text-main-header">New Regime</h3>${!isOldRecommended ? '<span class="bg-green-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>' : ''}</div><div class="mt-4 space-y-2"><p class="text-main-subheader">Taxable Income: <span class="font-semibold text-main-header">₹ ${formatCurrency(data.new_regime.taxable_income)}</span></p><p class="text-main-header font-bold text-2xl">Tax Payable: <span class="text-green-400">₹ ${formatCurrency(data.new_regime.tax_payable)}</span></p></div></div></div><div class="card p-6 mt-6"><h3 class="text-lg font-semibold text-main-header flex items-center"><svg class="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>AI Recommendations</h3><ul class="list-disc list-inside mt-3 text-main-subheader space-y-2">${recommendationsHTML}</ul></div>`;
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

    // =============================================================================
    // PDF GENERATION LOGIC - FINAL CORRECTED VERSION
    // =============================================================================
    document.getElementById('download-pdf-button').addEventListener('click', downloadPDF);

    async function downloadPDF() {
        if (!analysisData) {
            alert('Please process your financial documents first.');
            return;
        }

        const pdfButton = document.getElementById('download-pdf-button');
        pdfButton.disabled = true;
        pdfButton.innerHTML = `<span>Generating PDF...</span>`;

        if (spendingChart) {
            spendingChart.options.animation.duration = 0;
            spendingChart.update();
        }

        const { jsPDF } = window.jspdf;
        const reportContainer = document.createElement('div');
        reportContainer.style.position = 'absolute';
        reportContainer.style.left = '-9999px';
        reportContainer.style.width = '210mm'; // A4 width for accurate rendering
        reportContainer.innerHTML = generateReportHTML(analysisData);
        document.body.appendChild(reportContainer);
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Allow render time

        try {
            const canvas = await html2canvas(reportContainer, {
                scale: 2,
                useCORS: true,
                width: reportContainer.scrollWidth,
                height: reportContainer.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            
            const imgProps = doc.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            doc.save(`TaxWise_Financial_Summary_${new Date().toLocaleDateString('en-IN')}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error creating the PDF. Please try again.");
        } finally {
            document.body.removeChild(reportContainer);
            if (spendingChart) {
                spendingChart.options.animation.duration = 1000;
                spendingChart.update();
            }
            pdfButton.disabled = false;
            pdfButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span>Download PDF Summary</span>
            `;
        }
    }
    
    function generateReportHTML(data) {
        const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        let chartImageSrc = '';
        if (spendingChart) {
             chartImageSrc = spendingChart.toBase64Image();
        }

        const taxRecsHTML = data.tax_analysis.recommendations.map(rec => `<li>${rec}</li>`).join('');
        const cibilRecsHTML = data.cibil_analysis.recommendations.map(rec => `<li>${rec}</li>`).join('');

        return `
            <style>
                body { font-family: 'Inter', sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; }
                .report-wrapper { padding: 20px; background-color: white; width: 100%; box-sizing: border-box; }
                .header { background-color: #1e293b; color: white; padding: 16px; text-align: center; border-radius: 8px; }
                .header h1 { font-size: 28px; font-weight: bold; margin: 0; }
                .header p { margin: 4px 0 0 0; font-size: 14px; }
                .section { clear: both; page-break-inside: avoid; margin-top: 25px; } 
                .section-title { font-size: 20px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-bottom: 16px;}
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
                .table th { background-color: #f1f5f9; font-weight: 600; }
                .highlight { background-color: #d1fae5; font-weight: bold; }
                .chart-container { text-align: center; margin-top: 20px; page-break-inside: avoid; }
                .chart-container img { max-width: 80%; height: auto; margin: 0 auto; display: block; }
                .recommendation-box { background-color: #f8fafc; padding: 16px; margin-top: 16px; border-left: 4px solid #10b981; border-radius: 4px; }
                .recommendation-box h3 { font-size: 16px; font-weight: bold; color: #1e293b; margin:0 0 10px 0; }
                ul { list-style-position: inside; margin: 0; padding-left: 5px; }
                li { margin-bottom: 8px; font-size: 14px; }
            </style>
            <div class="report-wrapper">
                <div class="header">
                    <h1>TaxWise Financial Summary</h1>
                    <p>Report Generated on: ${today}</p>
                </div>
                
                <div class="section">
                    <h2 class="section-title">Dashboard Overview</h2>
                    <table class="table">
                        <tr><th style="width: 50%;">Projected Tax Liability (${data.tax_analysis.recommended_regime.toUpperCase()} Regime)</th><td>INR ${formatCurrency(data.tax_analysis[`${data.tax_analysis.recommended_regime.toLowerCase()}_regime`].tax_payable)}</td></tr>
                        <tr><th>Estimated CIBIL Score</th><td>${data.cibil_analysis.score}</td></tr>
                        <tr><th>Total 80C Investments</th><td>INR ${formatCurrency(data.dashboard_data.investments_80c)}</td></tr>
                        <tr><th>Total Annual Income</th><td>INR ${formatCurrency(data.dashboard_data.total_income)}</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h2 class="section-title">Tax Regime Comparison</h2>
                    <table class="table">
                        <thead><tr><th></th><th style="font-weight: bold;">Old Regime</th><th style="font-weight: bold;">New Regime</th></tr></thead>
                        <tbody>
                            <tr><th>Taxable Income</th><td>INR ${formatCurrency(data.tax_analysis.old_regime.taxable_income)}</td><td>INR ${formatCurrency(data.tax_analysis.new_regime.taxable_income)}</td></tr>
                            <tr class="highlight"><th>Tax Payable</th><td>INR ${formatCurrency(data.tax_analysis.old_regime.tax_payable)}</td><td>INR ${formatCurrency(data.tax_analysis.new_regime.tax_payable)}</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2 class="section-title">Spending Breakdown</h2>
                    <div class="chart-container">
                        <img src="${chartImageSrc}" alt="Spending Breakdown Chart"/>
                    </div>
                </div>

                <div class="section">
                     <h2 class="section-title">AI Recommendations</h2>
                     <div class="recommendation-box">
                         <h3>Tax Savings</h3>
                         <ul>${taxRecsHTML}</ul>
                    </div>
                     <div class="recommendation-box">
                         <h3>CIBIL Score Improvement</h3>
                         <ul>${cibilRecsHTML}</ul>
                     </div>
                </div>
            </div>
        `;
    }
});

