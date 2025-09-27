// =============================================================================
// GLOBAL VARIABLES & ELEMENT SELECTORS
// =============================================================================

// Object to hold references to the main page containers
const pages = {
    dashboard: document.getElementById('page-dashboard'),
    optimizer: document.getElementById('page-optimizer'),
    cibil: document.getElementById('page-cibil'),
    reports: document.getElementById('page-reports'),
};

// Object to hold references to the sidebar navigation links
const navLinks = {
    dashboard: document.getElementById('nav-dashboard'),
    optimizer: document.getElementById('nav-optimizer'),
    cibil: document.getElementById('nav-cibil'),
    reports: document.getElementById('nav-reports'),
};

// Global variables to store the analysis data and the chart instance
let analysisData = null;
let spendingChart = null;

// =============================================================================
// NAVIGATION HANDLING
// =============================================================================

/**
 * Handles switching between different pages of the application.
 * @param {string} page - The key of the page to display (e.g., 'dashboard').
 */
function navigate(page) {
    // Hide all pages
    Object.values(pages).forEach(p => p.classList.add('hidden'));
    // Deactivate all navigation links
    Object.values(navLinks).forEach(l => l.classList.remove('active'));
    
    // Show the selected page and activate its corresponding link
    pages[page].classList.remove('hidden');
    navLinks[page].classList.add('active');
}

// Add click event listeners to all navigation links
navLinks.dashboard.addEventListener('click', () => navigate('dashboard'));
navLinks.optimizer.addEventListener('click', () => navigate('optimizer'));
navLinks.cibil.addEventListener('click', () => navigate('cibil'));
navLinks.reports.addEventListener('click', () => navigate('reports'));

// =============================================================================
// FILE UPLOAD & API COMMUNICATION
// =============================================================================

// Trigger the hidden file input when the main upload button is clicked
document.getElementById('upload-button').addEventListener('click', () => {
    document.getElementById('file-upload').click();
});

// Listen for changes on the file input to start the upload process
document.getElementById('file-upload').addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        handleFileUpload(files);
    }
});

/**
 * Handles the file upload process, sends data to the backend, and processes the response.
 * @param {FileList} files - The list of files selected by the user.
 */
async function handleFileUpload(files) {
    const statusDiv = document.getElementById('upload-status');
    const cibilLoader = document.getElementById('cibil-loader');
    const cibilDisplay = document.getElementById('cibil-score-display');
    
    // Update UI to show loading state
    statusDiv.innerHTML = `<div class="flex items-center text-blue-600"><div class="loader w-5 h-5 mr-2 border-t-blue-600"></div> Processing ${files.length} file(s)...</div>`;
    cibilLoader.classList.remove('hidden');
    cibilDisplay.classList.add('hidden');
    document.getElementById('cibil-status').textContent = 'Analyzing...';
    
    // Prepare form data to send to the backend
    const formData = new FormData();
    for (const file of files) {
        formData.append('statements', file);
    }

    try {
        // Send the files to the Flask backend API
        const response = await fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData,
        });

        // Handle potential errors from the server
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process file');
        }
        
        // On success, parse the JSON response and update the UI
        analysisData = await response.json();
        statusDiv.innerHTML = `<div class="text-green-600 font-semibold">Analysis complete! ${files.length} file(s) processed.</div>`;
        
        updateDashboard(analysisData.dashboard_data);
        updateTaxOptimizer(analysisData.tax_analysis);
        updateCibilAdvisor(analysisData.cibil_analysis);

        // Enable the PDF download button
        document.getElementById('download-pdf-button').disabled = false;
        document.getElementById('pdf-note').textContent = "Your financial summary is ready for download.";

    } catch (error) {
        // Display any errors to the user
        statusDiv.innerHTML = `<div class="text-red-600 font-semibold">Error: ${error.message}</div>`;
    } finally {
        // Hide the loader regardless of success or failure
        cibilLoader.classList.add('hidden');
        cibilDisplay.classList.remove('hidden');
    }
}

// =============================================================================
// UI UPDATE FUNCTIONS
// =============================================================================

/**
 * Formats a number as Indian Rupees (₹).
 * @param {number} amount - The number to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
}

/**
 * Populates the main dashboard with data from the analysis.
 * @param {object} data - The dashboard-specific data from the backend.
 */
function updateDashboard(data) {
    const taxRegime = analysisData.tax_analysis.recommended_regime.toUpperCase();
    document.getElementById('tax-liability').textContent = formatCurrency(analysisData.tax_analysis[`${taxRegime.toLowerCase()}_regime`].tax_payable);
    document.getElementById('tax-regime-label').textContent = `Regime: ${taxRegime}`;

    document.getElementById('cibil-score').textContent = analysisData.cibil_analysis.score;
    document.getElementById('cibil-status').textContent = 'Analysis complete';

    document.getElementById('investments-80c').textContent = formatCurrency(data.investments_80c);
    
    // Dynamically create and display the list of recent transactions
    const transactionsContainer = document.getElementById('recent-transactions');
    transactionsContainer.innerHTML = ''; // Clear previous transactions
    data.transactions.forEach(tx => {
        const amount = tx.credit > 0 ? `+ ₹ ${formatCurrency(tx.credit)}` : `- ₹ ${formatCurrency(tx.debit)}`;
        const amountColor = tx.credit > 0 ? 'text-green-500' : 'text-red-500';
        const date = tx.date || tx['transaction date'] || 'N/A';

        transactionsContainer.innerHTML += `
            <div class="flex justify-between items-center py-1">
                <div>
                    <p class="font-medium text-gray-700">${tx.description || 'N/A'}</p>
                    <p class="text-sm text-gray-400">${date}</p>
                </div>
                <p class="font-semibold ${amountColor}">${amount}</p>
            </div>
        `;
    });
    
    // Render the spending breakdown chart
    renderSpendingChart(data.spending_breakdown);
}

/**
 * Populates the Tax Optimizer page with comparison data.
 * @param {object} data - The tax analysis data from the backend.
 */
function updateTaxOptimizer(data) {
    const container = document.getElementById('tax-optimizer-content');
    const isOldRecommended = data.recommended_regime === 'old';

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card p-6 border-2 ${isOldRecommended ? 'border-indigo-500' : 'border-transparent'}">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold text-gray-800">Old Regime</h3>
                    ${isOldRecommended ? '<span class="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>' : ''}
                </div>
                <div class="mt-4 space-y-2">
                    <p class="text-gray-600">Taxable Income: <span class="font-semibold">₹ ${formatCurrency(data.old_regime.taxable_income)}</span></p>
                    <p class="text-gray-800 font-bold text-2xl">Tax Payable: <span class="text-indigo-600">₹ ${formatCurrency(data.old_regime.tax_payable)}</span></p>
                </div>
            </div>
            <div class="card p-6 border-2 ${!isOldRecommended ? 'border-indigo-500' : 'border-transparent'}">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold text-gray-800">New Regime</h3>
                    ${!isOldRecommended ? '<span class="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>' : ''}
                </div>
                <div class="mt-4 space-y-2">
                    <p class="text-gray-600">Taxable Income: <span class="font-semibold">₹ ${formatCurrency(data.new_regime.taxable_income)}</span></p>
                    <p class="text-gray-800 font-bold text-2xl">Tax Payable: <span class="text-indigo-600">₹ ${formatCurrency(data.new_regime.tax_payable)}</span></p>
                </div>
            </div>
        </div>
        <div class="card p-6 mt-6">
            <h3 class="text-lg font-semibold text-gray-700 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>AI Recommendations</h3>
            <ul class="list-disc list-inside mt-3 text-gray-600 space-y-2">
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

/**
 * Populates the CIBIL Advisor page with score, factors, and recommendations.
 * @param {object} data - The CIBIL analysis data from the backend.
 */
function updateCibilAdvisor(data) {
     const container = document.getElementById('cibil-advisor-content');
     container.innerHTML = `
        <div class="card p-6">
             <h3 class="text-xl font-bold text-gray-800">Your CIBIL Score: <span class="text-green-500">${data.score}</span></h3>
             <p class="text-gray-500">This score is an estimate based on your financial data.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div class="card p-4 text-center">
                <h4 class="font-semibold text-gray-600">Payment History</h4>
                <p class="text-2xl font-bold text-green-500 mt-2">100%</p>
                <p class="text-sm text-gray-400">(Estimated)</p>
            </div>
            <div class="card p-4 text-center">
                <h4 class="font-semibold text-gray-600">Credit Utilization</h4>
                <p class="text-2xl font-bold text-orange-500 mt-2">${(data.factors.credit_utilization * 100).toFixed(0)}%</p>
                <p class="text-sm text-gray-400">(High Impact)</p>
            </div>
             <div class="card p-4 text-center">
                <h4 class="font-semibold text-gray-600">Credit Mix</h4>
                <p class="text-2xl font-bold text-blue-500 mt-2">${data.factors.credit_mix}</p>
                <p class="text-sm text-gray-400">(Medium Impact)</p>
            </div>
        </div>
         <div class="card p-6 mt-6">
            <h3 class="text-lg font-semibold text-gray-700 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 2a3 3 0 00-3 3v1.432l.21.018a22.99 22.99 0 0115.58 0l.21-.018V5a3 3 0 00-3-3H5zm12 5.432l-.21.018a22.99 22.99 0 01-15.58 0L3 7.432V15a3 3 0 003 3h12a3 3 0 003-3V7.432zM14 12a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" /></svg>How to Improve Your Score</h3>
            <ul class="list-disc list-inside mt-3 text-gray-600 space-y-2">
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
     `;
}

// =============================================================================
// CHART RENDERING
// =============================================================================

/**
 * Renders the spending breakdown doughnut chart using Chart.js.
 * @param {object} spendingData - An object with categories as keys and amounts as values.
 */
function renderSpendingChart(spendingData) {
    const ctx = document.getElementById('spending-chart').getContext('2d');
    const labels = Object.keys(spendingData);
    const data = Object.values(spendingData);
    
    const backgroundColors = [
        '#818cf8', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'
    ];
    
    // Destroy the previous chart instance if it exists to prevent rendering issues
    if (spendingChart) {
        spendingChart.destroy();
    }

    // Create a new chart instance
    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8
                    }
                }
            },
            animation: {
               animateScale: true,
               animateRotate: true
            }
        }
    });
}

// =============================================================================
// PDF GENERATION
// =============================================================================

// Add click listener to the PDF download button
document.getElementById('download-pdf-button').addEventListener('click', downloadPDF);

/**
 * Generates and downloads a PDF summary of the financial analysis.
 */
async function downloadPDF() {
    if (!analysisData) {
        alert('Please process your financial documents first.');
        return;
    }

    // Temporarily disable chart animation for a clean screenshot
    if (spendingChart) {
        spendingChart.options.animation.duration = 0;
        spendingChart.update();
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Create an off-screen container to render the report HTML
    const reportContainer = document.createElement('div');
    reportContainer.style.position = 'absolute';
    reportContainer.style.left = '-9999px';
    reportContainer.style.width = '210mm'; 
    reportContainer.innerHTML = generateReportHTML(analysisData);
    document.body.appendChild(reportContainer);
    
    // Wait for the content and images to render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use html2canvas to capture the rendered report as an image
    const canvas = await html2canvas(reportContainer.querySelector('.report-wrapper'), {
        scale: 2, // Higher scale for better quality
        useCORS: true
    });

    // Add the captured image to the PDF document
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Save the PDF
    doc.save(`TaxWise_Financial_Summary_${new Date().toLocaleDateString('en-IN')}.pdf`);

    // Clean up the off-screen container
    document.body.removeChild(reportContainer);

    // Re-enable chart animation
    if (spendingChart) {
        spendingChart.options.animation.duration = 1000;
        spendingChart.update();
    }
}

/**
 * Generates the HTML content for the PDF report.
 * @param {object} data - The full analysis data object.
 * @returns {string} The HTML string for the report.
 */
function generateReportHTML(data) {
    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    let chartImageSrc = '';
    if (spendingChart) {
         // Get a base64 image representation of the current chart state
         chartImageSrc = spendingChart.toBase64Image();
    }

    // This HTML structure is designed specifically for clean PDF rendering
    return `
        <style>
            body { font-family: 'Inter', sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; }
            .report-wrapper { padding: 20px; background-color: white; width: 100%; box-sizing: border-box; }
            .header { background-color: #4a5568; color: white; padding: 16px; text-align: center; border-radius: 8px; }
            .header h1 { font-size: 28px; font-weight: bold; margin: 0; }
            .header p { margin: 4px 0 0 0; font-size: 14px; }
            .section { clear: both; page-break-inside: avoid; margin-top: 30px; } 
            .section-title { font-size: 20px; font-weight: bold; color: #4a5568; border-bottom: 2px solid #667eea; padding-bottom: 8px; margin-bottom: 16px;}
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
            .table th { background-color: #f0f2f5; font-weight: 600; }
            .highlight { background-color: #e0e7ff; font-weight: bold; }
            .chart-container { text-align: center; margin-top: 20px; page-break-inside: avoid; }
            .chart-container img { max-width: 70%; height: auto; margin: 0 auto; display: block; }
            .recommendation-box { background-color: #f3f4f6; padding: 16px; margin-top: 16px; border-left: 4px solid #667eea; border-radius: 4px; }
            .recommendation-box h3 { font-size: 16px; font-weight: bold; color: #2d3748; margin:0 0 10px 0; }
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
                     <ul>${data.tax_analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
                </div>
                 <div class="recommendation-box">
                     <h3>CIBIL Score Improvement</h3>
                     <ul>${data.cibil_analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
                 </div>
            </div>
        </div>
    `;
}

