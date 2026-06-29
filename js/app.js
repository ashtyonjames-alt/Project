let currentUser = '';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const app = document.getElementById('app');
    const navItems = document.querySelectorAll('.nav-item');
    const logoutBtn = document.getElementById('logout-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const notificationBell = document.getElementById('notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    const chatInput = document.getElementById('chat-input');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value || 'Citizen';
        currentUser = username;
        loginScreen.classList.add('hidden');
        app.classList.remove('hidden');
        document.getElementById('user-display-name').textContent = 'Welcome, ' + username;
        document.getElementById('health-name').textContent = username.toUpperCase();
        document.getElementById('bank-name').textContent = username.toUpperCase();
    });

    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            const section = this.getAttribute('data-section');
            navigateTo(section);
        });
    });

    logoutBtn.addEventListener('click', function () {
        app.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });

    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
    });

    notificationBell.addEventListener('click', function () {
        notificationPanel.classList.toggle('hidden');
    });

    document.addEventListener('click', function (e) {
        if (!notificationBell.contains(e.target) && !notificationPanel.contains(e.target)) {
            notificationPanel.classList.add('hidden');
        }
    });

    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendChat();
        }
    });
});

function navigateTo(section) {
    document.querySelectorAll('.content-section').forEach(function (sec) {
        sec.classList.remove('active');
    });
    document.getElementById('section-' + section).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.remove('active');
    });
    document.querySelector('[data-section="' + section + '"]').classList.add('active');

    var titles = {
        dashboard: 'Dashboard',
        immigration: 'Immigration Hub',
        residency: 'Address & Residency',
        documents: 'Document Vault',
        transport: 'Transport & Safety',
        suig: 'SUIG Grant Management',
        healthcare: 'Healthcare & Social Services',
        jobs: 'Jobs & Education',
        banking: 'Banking Integration'
    };
    document.getElementById('current-section-title').textContent = titles[section] || 'Dashboard';

    var sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
}

function bookAppointment() {
    var type = document.getElementById('appt-type').value;
    var date = document.getElementById('appt-date').value;
    var time = document.getElementById('appt-time').value;

    if (type === 'Select Appointment Type' || !date || time === 'Select Time') {
        alert('Please fill in all appointment details.');
        return;
    }

    showModal(
        '<h3>Appointment Confirmed</h3>' +
        '<p style="margin-top:15px"><strong>Type:</strong> ' + type + '</p>' +
        '<p><strong>Date:</strong> ' + date + '</p>' +
        '<p><strong>Time:</strong> ' + time + '</p>' +
        '<p style="margin-top:15px; color: var(--success)">You will receive a confirmation via the app and email.</p>'
    );

    document.getElementById('appt-type').selectedIndex = 0;
    document.getElementById('appt-date').value = '';
    document.getElementById('appt-time').selectedIndex = 0;
}

var chatResponses = [
    "Thank you for your inquiry. Let me look into that for you.",
    "I can see your file is currently being processed. Expected completion: 3-5 business days.",
    "Your residency application is progressing well. Step 5 requires property documentation.",
    "I've scheduled a follow-up with your assigned officer. You'll receive a notification.",
    "For visa renewal, please ensure all documents in your vault are up to date.",
    "Your background check has been cleared. No further action needed on your part.",
    "The SBIS office at District 7 is open Monday-Friday, 8:00-16:00.",
    "I've flagged your query for priority review. An officer will respond within 24 hours."
];

function sendChat() {
    var input = document.getElementById('chat-input');
    var message = input.value.trim();
    if (!message) return;

    var chatWindow = document.getElementById('chat-window');

    var userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = '<span class="chat-sender">You</span><p>' + escapeHtml(message) + '</p>';
    chatWindow.appendChild(userMsg);

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;

    setTimeout(function () {
        var botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        var response = chatResponses[Math.floor(Math.random() * chatResponses.length)];
        botMsg.innerHTML = '<span class="chat-sender">SBIS Agent</span><p>' + response + '</p>';
        chatWindow.appendChild(botMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 1000);
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function viewDocument(docType) {
    var docs = {
        'golden-ticket': {
            title: 'Golden Ticket',
            content: '<div style="text-align:center;padding:20px;border:3px solid #c9a227;border-radius:10px;background:#fffde7">' +
                '<h2 style="color:#c9a227">GOLDEN TICKET</h2>' +
                '<p style="font-size:12px;color:#555">Slavakian Union Immigration Authority</p>' +
                '<hr style="border-color:#c9a227;margin:15px 0">' +
                '<p><strong>Holder:</strong> ' + (currentUser || 'Citizen') + '</p>' +
                '<p><strong>Ticket #:</strong> GT-2024-SU-00891</p>' +
                '<p><strong>Issued:</strong> January 15, 2024</p>' +
                '<p><strong>Expires:</strong> July 3, 2024</p>' +
                '<p><strong>Type:</strong> Residency Path</p>' +
                '<p style="margin-top:15px;color:#c62828;font-weight:600">STATUS: ACTIVE - RENEWAL REQUIRED</p></div>'
        },
        'passport': {
            title: 'Passport Scan',
            content: '<div style="text-align:center;padding:20px;border:2px solid #1a237e;border-radius:10px">' +
                '<h3 style="color:#1a237e">PASSPORT</h3>' +
                '<p><strong>Name:</strong> ' + (currentUser || 'Citizen') + '</p>' +
                '<p><strong>Passport #:</strong> PP-48291834</p>' +
                '<p><strong>Nationality:</strong> Pending SU Residency</p>' +
                '<p><strong>Expires:</strong> March 2029</p>' +
                '<p style="margin-top:10px;color:var(--success)">Verified & Uploaded</p></div>'
        },
        'residency-cert': {
            title: 'Residency Registration Certificate',
            content: '<div style="text-align:center;padding:20px">' +
                '<h3 style="color:#f57f17">PENDING</h3>' +
                '<p>Your Residency Certificate will be issued upon completion of Step 6: Property Acquisition & Linking.</p>' +
                '<p style="margin-top:10px">Current Progress: Step 5 of 7</p></div>'
        },
        'property-deed': {
            title: 'Property Deed',
            content: '<div style="text-align:center;padding:20px">' +
                '<h3 style="color:#f57f17">PENDING UPLOAD</h3>' +
                '<p>Please acquire a qualifying property and upload the deed.</p>' +
                '<p style="margin-top:10px">Visit the Address & Residency section to search for qualified properties.</p></div>'
        },
        'idp': {
            title: 'International Driving Permit',
            content: '<div style="text-align:center;padding:20px;border:2px solid #1a237e;border-radius:10px">' +
                '<h3 style="color:#1a237e">INTERNATIONAL DRIVING PERMIT</h3>' +
                '<p><strong>Name:</strong> ' + (currentUser || 'Citizen') + '</p>' +
                '<p><strong>IDP #:</strong> IDP-SU-2024-4421</p>' +
                '<p><strong>Valid:</strong> Jan 2024 - Jan 2026</p>' +
                '<p><strong>Categories:</strong> B, B1</p>' +
                '<p style="margin-top:10px;color:var(--success)">VALID</p></div>'
        },
        'background': {
            title: 'Background Check Results',
            content: '<div style="text-align:center;padding:20px;border:2px solid var(--success);border-radius:10px;background:#e8f5e9">' +
                '<h3 style="color:var(--success)">BACKGROUND CHECK - CLEARED</h3>' +
                '<p><strong>Subject:</strong> ' + (currentUser || 'Citizen') + '</p>' +
                '<p><strong>Check Date:</strong> February 3, 2024</p>' +
                '<p><strong>Criminal Record:</strong> None</p>' +
                '<p><strong>Financial Status:</strong> Good Standing</p>' +
                '<p><strong>Security Clearance:</strong> Approved</p>' +
                '<p style="margin-top:15px;font-weight:600;color:var(--success)">APPROVED FOR RESIDENCY PROCESS</p></div>'
        }
    };

    var doc = docs[docType];
    if (doc) {
        showModal('<h3>' + doc.title + '</h3><div style="margin-top:15px">' + doc.content + '</div>');
    }
}

function openVaultDoc(docType) {
    var vaultDocs = {
        'passport': 'Passport - Valid until March 2029. Scan uploaded and verified by SBIS.',
        'golden-ticket': 'Golden Ticket #GT-2024-SU-00891. EXPIRING SOON - Renewal required by July 3.',
        'idp': 'International Driving Permit - Valid until January 2026. Categories B, B1.',
        'taxes': '2024 Tax Return filed and accepted. Tax ID: SU-TX-44821-K. No outstanding obligations.',
        'healthcare': 'Universal Healthcare Card - Tier 2. Active enrollment. ID: HC-2024-448219.',
        'employment': 'Work Permit - Full Employment. No restrictions. Valid until December 2025.',
        'suig': 'SUIG Grant #SU-G-20248. Original amount: EUR 25,000. Remaining: EUR 12,450. Deadline: 46 days.',
        'bank': 'Bank account verified with Slavik National Security Bank. Account ****4821. Status: Active.',
        'utilities': 'All utility bills current. Last payment: June 2024. No outstanding balance.'
    };

    var content = vaultDocs[docType] || 'Document details not available.';
    showModal(
        '<h3>Document Details</h3>' +
        '<p style="margin-top:15px">' + content + '</p>' +
        '<div style="margin-top:20px;display:flex;gap:10px">' +
        '<button class="btn-primary" onclick="alert(\'Download started\');closeModal()">Download</button>' +
        '<button class="btn-small" onclick="alert(\'Share link generated\');closeModal()">Share</button>' +
        '</div>'
    );
}

function searchProperties() {
    var searchInput = document.getElementById('property-search');
    var query = searchInput.value.trim().toLowerCase();
    var results = document.getElementById('property-results');

    results.style.opacity = '0.5';
    setTimeout(function () {
        results.style.opacity = '1';
        if (query) {
            alert('Showing filtered results for: "' + searchInput.value + '"');
        }
    }, 500);
}

function selectProperty(btn) {
    showModal(
        '<h3>Property Selected</h3>' +
        '<p style="margin-top:15px">You have selected this property for your residency application.</p>' +
        '<p style="margin-top:10px"><strong>Next Steps:</strong></p>' +
        '<ul style="margin-top:8px;padding-left:20px">' +
        '<li>Complete purchase agreement</li>' +
        '<li>Upload property deed</li>' +
        '<li>SBIS will be automatically notified</li>' +
        '<li>Golden Ticket will be linked to address</li>' +
        '</ul>' +
        '<button class="btn-primary" style="margin-top:20px" onclick="alert(\'Property acquisition process initiated. SBIS has been notified.\');closeModal()">Confirm Selection</button>'
    );
}

function simulateUpload(type) {
    var statusId = type + '-upload-status';
    var statusEl = document.getElementById(statusId);
    if (statusEl) {
        statusEl.classList.remove('hidden');
        setTimeout(function () {
            statusEl.classList.add('hidden');
        }, 3000);
    }
}

function triggerEmergency() {
    showModal(
        '<div style="text-align:center">' +
        '<h2 style="color:#c62828">EMERGENCY SERVICES</h2>' +
        '<p style="margin-top:15px;font-size:16px">Connecting to emergency dispatch...</p>' +
        '<div style="margin:20px 0">' +
        '<div style="width:50px;height:50px;border:4px solid #c62828;border-top-color:transparent;border-radius:50%;margin:0 auto;animation:spin 1s linear infinite"></div>' +
        '</div>' +
        '<p style="font-size:14px;color:#555">Your location has been shared with emergency services.</p>' +
        '<p style="font-size:14px;color:#555;margin-top:5px">GPS: 48.2082, 16.3738 (District 7)</p>' +
        '<style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}</style>' +
        '</div>'
    );
}

var isOnTrack = true;

function toggleSpendingStatus() {
    isOnTrack = !isOnTrack;
    var indicator = document.getElementById('spending-indicator');

    if (isOnTrack) {
        indicator.innerHTML =
            '<div class="indicator-circle on-track"><span>&#10003;</span></div>' +
            '<p class="indicator-text on-track-text">ON TRACK</p>' +
            '<p class="indicator-detail">Your spending aligns with your timeline</p>' +
            '<button class="btn-small" onclick="toggleSpendingStatus()">Simulate Status Change</button>';
    } else {
        indicator.innerHTML =
            '<div class="indicator-circle overspending"><span>&#10007;</span></div>' +
            '<p class="indicator-text overspending-text">OVERSPENDING</p>' +
            '<p class="indicator-detail">Warning: You are exceeding your budget plan</p>' +
            '<button class="btn-small" onclick="toggleSpendingStatus()">Simulate Status Change</button>';
    }

    var dashStatus = document.querySelector('.spending-status');
    if (dashStatus) {
        if (isOnTrack) {
            dashStatus.className = 'spending-status on-track';
            dashStatus.textContent = 'ON TRACK';
        } else {
            dashStatus.className = 'spending-status overspending';
            dashStatus.textContent = 'OVERSPENDING';
        }
    }
}

function calculateLoan() {
    var amount = parseFloat(document.getElementById('loan-amount').value);
    var rate = parseFloat(document.getElementById('loan-rate').value) / 100 / 12;
    var term = parseInt(document.getElementById('loan-term').value);

    if (!amount || !rate || !term) {
        alert('Please fill in all loan details.');
        return;
    }

    var monthly = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    var totalInterest = (monthly * term) - amount;

    document.getElementById('monthly-payment').textContent = '€ ' + monthly.toFixed(2);
    document.getElementById('total-interest').textContent = '€ ' + totalInterest.toFixed(2);
    document.getElementById('loan-result').classList.remove('hidden');
}

function bookHealthAppt() {
    var type = document.getElementById('health-type').value;
    var facility = document.getElementById('health-facility').value;
    var date = document.getElementById('health-date').value;

    if (type === 'Select Service' || facility === 'Select Facility' || !date) {
        alert('Please fill in all appointment details.');
        return;
    }

    document.getElementById('health-appt-confirm').classList.remove('hidden');
    setTimeout(function () {
        document.getElementById('health-appt-confirm').classList.add('hidden');
    }, 4000);

    document.getElementById('health-type').selectedIndex = 0;
    document.getElementById('health-facility').selectedIndex = 0;
    document.getElementById('health-date').value = '';
}

function applyMilitary(branch) {
    var branches = {
        army: 'Slavakian Army',
        navy: 'Slavakian Navy',
        air: 'Air Defense Force'
    };
    showModal(
        '<h3>Military Application</h3>' +
        '<p style="margin-top:15px">You are applying to the <strong>' + branches[branch] + '</strong>.</p>' +
        '<p style="margin-top:10px"><strong>Requirements:</strong></p>' +
        '<ul style="margin-top:8px;padding-left:20px">' +
        '<li>Age: 18-35</li>' +
        '<li>Physical fitness assessment</li>' +
        '<li>Background check (PASSED)</li>' +
        '<li>Residency status (IN PROGRESS)</li>' +
        '</ul>' +
        '<p style="margin-top:15px;color:var(--warning)">Note: Full residency may be required before enrollment.</p>' +
        '<button class="btn-primary" style="margin-top:15px" onclick="alert(\'Application submitted to Defense Ministry\');closeModal()">Submit Application</button>'
    );
}

function downloadCert(certType) {
    var certs = {
        'work-permit': 'Work Permit Certificate',
        'tax-clearance': 'Tax Clearance Letter',
        'employment-history': 'Employment History Report',
        'skill-assessment': 'Skill Assessment Report'
    };
    showModal(
        '<h3>Download: ' + certs[certType] + '</h3>' +
        '<p style="margin-top:15px">Your document is being prepared for download.</p>' +
        '<div style="margin:20px 0;text-align:center">' +
        '<div style="font-size:48px">&#128196;</div>' +
        '<p style="margin-top:10px;color:var(--success);font-weight:600">Ready for download</p>' +
        '</div>' +
        '<button class="btn-primary" onclick="alert(\'Document downloaded: ' + certs[certType] + '\');closeModal()">Download PDF</button>'
    );
}

function processTransfer() {
    var amount = document.getElementById('transfer-amount').value;
    if (!amount || parseFloat(amount) <= 0) {
        alert('Please enter a valid transfer amount.');
        return;
    }

    document.getElementById('transfer-confirm').classList.remove('hidden');
    document.getElementById('transfer-amount').value = '';

    setTimeout(function () {
        document.getElementById('transfer-confirm').classList.add('hidden');
    }, 4000);
}

function payUtility(btn, name) {
    btn.textContent = 'Paid';
    btn.disabled = true;
    btn.style.background = '#2e7d32';

    showModal(
        '<h3>Payment Successful</h3>' +
        '<p style="margin-top:15px"><strong>' + name + '</strong> bill has been paid.</p>' +
        '<p style="margin-top:10px;color:var(--success)">Transaction confirmed. Receipt saved to Document Vault.</p>'
    );
}

function openAccount(type) {
    var types = {
        savings: 'Savings Account (2.5% APY)',
        investment: 'Investment Account (Variable Rate)',
        business: 'Business Account (1.8% APY)'
    };
    showModal(
        '<h3>Open New Account</h3>' +
        '<p style="margin-top:15px">You are opening a <strong>' + types[type] + '</strong> with Slavik National Security Bank.</p>' +
        '<p style="margin-top:15px"><strong>Requirements:</strong></p>' +
        '<ul style="padding-left:20px;margin-top:8px">' +
        '<li>Valid ID (verified)</li>' +
        '<li>Minimum deposit: € 100</li>' +
        '<li>Residency status: Active</li>' +
        '</ul>' +
        '<button class="btn-primary" style="margin-top:20px" onclick="alert(\'Account opened successfully! Details sent to your secure inbox.\');closeModal()">Confirm & Open</button>'
    );
}

function showModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

document.addEventListener('click', function (e) {
    var modal = document.getElementById('modal');
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});
