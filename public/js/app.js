/* ======================================================
   HUMA FARM - APP.JS
   Fixed Viewport Engine + Supabase Cloud Realtime Database Sync
   ====================================================== */

// LARAVEL API CONFIGURATION
const API_BASE = '/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    // Attach admin token header automatically when present
    if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
    }
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan sistem.');
    }
    return data;
}

/**
 * Sets a button into loading state (disabled + spinner text) or restores it.
 * Usage: setButtonLoading(btn, true) before fetch, setButtonLoading(btn, false) in finally.
 */
function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> Menyimpan...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    }
}

let currentRole = 'visitor'; // 'visitor' | 'user' | 'admin'
let currentUser = null; // { id, name, phone, password, avatar } if logged in as user
let adminToken  = localStorage.getItem('huma_farm_admin_token') || null; // X-Admin-Token
let pendingResetIdentifier = null;

let currentPanenMode = 'add'; // 'add' (Panen) | 'sub' (Kurangi)
let editingRecordId = null;
let deletingRecordId = null;
let deletingOrderId = null;

let selectedProfileEmoji = '👤'; // Active emoji chosen in the picker

// DEFAULT EGG PRICING (LOKAL STORAGE: huma_farm_prices)
const DEFAULT_PRICES = {
    negeriPack: 25000,
    negeriEgg: 2500,
    kampungPack: 35000,
    kampungEgg: 3500
};

// AUTOMATIC STOCK CALCULATION ENGINE (PANEN minus PENGURANGAN minus ORDER LUNAS)
function getCalculatedReadyStock() {
    const panenHistory = JSON.parse(localStorage.getItem('huma_farm_panen_history') || '[]');
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');

    let stockNegeri = 0;
    let stockKampung = 0;

    // 1. Calculate from Harvest entries
    panenHistory.forEach(item => {
        if (item.type === 'sub') {
            stockNegeri -= (item.negeri || 0);
            stockKampung -= (item.kampung || 0);
        } else {
            stockNegeri += (item.negeri || 0);
            stockKampung += (item.kampung || 0);
        }
    });

    // 2. Automatically subtract completed/active orders (excluding PO & Cancelled)
    orders.forEach(o => {
        if (o.status !== 'po' && o.paymentStatus !== 'Batal') {
            const qtyEggs = o.totalEggs || 0;
            if (o.category === 'negeri') {
                stockNegeri -= qtyEggs;
            } else if (o.category === 'kampung') {
                stockKampung -= qtyEggs;
            }
        }
    });

    if (stockNegeri < 0) stockNegeri = 0;
    if (stockKampung < 0) stockKampung = 0;

    return { negeri: stockNegeri, kampung: stockKampung };
}

// FARM & PETERNAKAN EMOJI KEYBOARD COLLECTION
const FARM_EMOJI_LIST = [
    // Unggas & Telur
    '🥚', '🪺', '🐣', '🐥', '🐔', '🐓', '🦆', '🦃', '🍳',
    // Peternak & Tokoh
    '👨‍🌾', '👩‍🌾', '🧑‍🌾', '🤠', '👑', '🌟', '👤',
    // Hewan Ternak
    '🐄', '🐂', '🐐', '🐑', '🐎', '🐖', '🐕', '🐝',
    // Hasil Tani & Alam
    '🌾', '🌽', '🌻', '🚜', '🏡', '🥛', '🧀', '🍯', '☀️', '🍃'
];

document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Close multi-select menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multi-select-wrapper')) {
            closeAllMultiSelectDropdowns();
        }
    });
});

async function initApp() {
    initTheme();
    setupNavigation();
    loadSession();
    updateRoleVisibility();
    showCenterWelcome();

    // Initial render from local
    renderPanenData();
    updateDashboardData();
    renderTokoData();
    renderTokoOrdersData();

    // Init QRIS Image Setting
    const savedQrisUrl = localStorage.getItem('huma_farm_qris_image') || 'images/qris_huma_farm.png';
    const qrisImg = document.getElementById('qris-img-element');
    if (qrisImg) qrisImg.src = savedQrisUrl;
    const qrisInput = document.getElementById('setting-qris-url');
    if (qrisInput) qrisInput.value = savedQrisUrl;

    // Init Bank Settings
    const savedBankName = localStorage.getItem('huma_farm_bank_name') || 'BSI';
    const savedBankNumber = localStorage.getItem('huma_farm_bank_number') || '7367004597';
    const savedBankOwner = localStorage.getItem('huma_farm_bank_owner') || 'Mela Mufida';
    const bankNameInput = document.getElementById('setting-bank-name');
    const bankNumberInput = document.getElementById('setting-bank-number');
    const bankOwnerInput = document.getElementById('setting-bank-owner');
    if (bankNameInput) bankNameInput.value = savedBankName;
    if (bankNumberInput) bankNumberInput.value = savedBankNumber;
    if (bankOwnerInput) bankOwnerInput.value = savedBankOwner;

    // Apply saved bank to payment modal
    const bsiNumEl = document.getElementById('pay-bsi-number');
    const bsiOwnerEl = document.getElementById('pay-bsi-owner');
    const bsiLabelEl = document.getElementById('pay-bsi-bank-name');
    if (bsiNumEl) bsiNumEl.textContent = savedBankNumber;
    if (bsiOwnerEl) bsiOwnerEl.textContent = savedBankOwner;
    if (bsiLabelEl) bsiLabelEl.textContent = savedBankName;

    // Init QRIS Merchant
    const savedMerchant = localStorage.getItem('huma_farm_qris_merchant') || 'Huma Farm';
    const merchantInput = document.getElementById('setting-qris-merchant');
    if (merchantInput) merchantInput.value = savedMerchant;
    const qrisPreviewSettings = document.getElementById('qris-preview-settings');
    if (qrisPreviewSettings) qrisPreviewSettings.src = savedQrisUrl;

    // Async sync from Laravel API
    fetchCloudData();
    setupSupabaseRealtime();
}


// ----------------------------------------------------
// LARAVEL BACKEND SYNC ENGINE (SOURCE OF TRUTH)
// ----------------------------------------------------
async function fetchCloudData() {
    try {
        const res = await apiRequest('/sync');
        if (res && res.success) {
            // 1. Sync Prices
            if (res.prices) {
                const fetchedPrices = {
                    negeriPack: res.prices.negeri_pack || 25000,
                    negeriEgg: res.prices.negeri_egg || 2500,
                    kampungPack: res.prices.kampung_pack || 35000,
                    kampungEgg: res.prices.kampung_egg || 3500
                };
                localStorage.setItem('huma_farm_prices', JSON.stringify(fetchedPrices));
            }

            // 2. Sync Panen
            if (res.panen_history) {
                const cloudPanen = res.panen_history.map(p => ({
                    id: String(p.id),
                    type: p.type || 'add',
                    negeri: p.negeri || 0,
                    kampung: p.kampung || 0,
                    date: p.date,
                    reason: p.reason || '',
                    createdAt: p.created_at
                }));
                localStorage.setItem('huma_farm_panen_history', JSON.stringify(cloudPanen));
            }

            // 3. Sync Orders
            if (res.orders) {
                const cloudOrders = res.orders.map(o => ({
                    id: String(o.id),
                    poNumber: o.po_number,
                    buyerName: o.buyer_name,
                    buyerPhone: o.buyer_phone || '',
                    category: o.category,
                    unit: o.unit,
                    qty: o.qty,
                    totalEggs: o.total_eggs,
                    totalPrice: parseFloat(o.total_price),
                    status: o.status,
                    shortageEggs: o.shortage_eggs,
                    paymentStatus: o.payment_status,
                    createdAt: o.created_at
                }));
                localStorage.setItem('huma_farm_orders', JSON.stringify(cloudOrders));
            }

            // 4. Sync Expenses
            if (res.expenses) {
                const cloudExp = res.expenses.map(e => ({
                    id: String(e.id),
                    category: e.category,
                    amount: parseFloat(e.amount),
                    note: e.note || '',
                    date: e.date,
                    createdAt: e.created_at
                }));
                localStorage.setItem('huma_farm_expenses', JSON.stringify(cloudExp));
            }

            // 5. Sync Users
            if (res.registered_users) {
                localStorage.setItem('huma_farm_registered_users', JSON.stringify(res.registered_users));
            }

            // 6. Sync Settings (Bank, QRIS)
            if (res.settings) {
                localStorage.setItem('huma_farm_bank_name', res.settings.bank_name);
                localStorage.setItem('huma_farm_bank_number', res.settings.bank_number);
                localStorage.setItem('huma_farm_bank_owner', res.settings.bank_owner);
                localStorage.setItem('huma_farm_qris_merchant', res.settings.qris_merchant);
                localStorage.setItem('huma_farm_qris_image', res.settings.qris_image_url);

                // Update UI settings elements
                const bankNameInput = document.getElementById('setting-bank-name');
                const bankNumberInput = document.getElementById('setting-bank-number');
                const bankOwnerInput = document.getElementById('setting-bank-owner');
                if (bankNameInput) bankNameInput.value = res.settings.bank_name;
                if (bankNumberInput) bankNumberInput.value = res.settings.bank_number;
                if (bankOwnerInput) bankOwnerInput.value = res.settings.bank_owner;

                const merchantInput = document.getElementById('setting-qris-merchant');
                if (merchantInput) merchantInput.value = res.settings.qris_merchant;
                const qrisPreviewSettings = document.getElementById('qris-preview-settings');
                if (qrisPreviewSettings) qrisPreviewSettings.src = res.settings.qris_image_url;

                // Apply to payment modal
                const bsiNumEl = document.getElementById('pay-bsi-number');
                const bsiOwnerEl = document.getElementById('pay-bsi-owner');
                const bsiLabelEl = document.getElementById('pay-bsi-bank-name');
                if (bsiNumEl) bsiNumEl.textContent = res.settings.bank_number;
                if (bsiOwnerEl) bsiOwnerEl.textContent = res.settings.bank_owner;
                if (bsiLabelEl) bsiLabelEl.textContent = res.settings.bank_name;

                const qrisImg = document.getElementById('qris-img-element');
                if (qrisImg) qrisImg.src = res.settings.qris_image_url;
                const merchantLabel = document.getElementById('pay-qris-merchant');
                if (merchantLabel) merchantLabel.textContent = res.settings.qris_merchant;
            }

            // Render all UI components
            renderPanenData();
            renderTokoOrdersData();
            renderLeaderboardData();
            renderTokoData();
            renderKeuanganData();
            updateDashboardData();
        }
    } catch (e) {
        console.warn('API Sync Error:', e);
    }
}

function setupSupabaseRealtime() {
    // Poll Laravel API every 15s to keep dashboard and stocks updated
    setInterval(() => {
        fetchCloudData();
    }, 15000);

    // Sync on app foreground visibility return
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchCloudData();
        }
    });
}



// ----------------------------------------------------
// MULTI-SELECT DROPDOWN FILTER ENGINE (RESPONSIVE & DYNAMIC)
// ----------------------------------------------------
function toggleMultiSelectDropdown(type, event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById(`ms-wrapper-${type}`);
    if (!wrapper) return;

    const isOpen = wrapper.classList.contains('open');
    closeAllMultiSelectDropdowns();

    if (!isOpen) {
        wrapper.classList.add('open');
    }
}

function closeAllMultiSelectDropdowns() {
    document.querySelectorAll('.multi-select-wrapper').forEach(w => w.classList.remove('open'));
}

function toggleSelectAllMonths(allCb) {
    const monthCbs = document.querySelectorAll('.cb-month');
    monthCbs.forEach(cb => {
        cb.checked = allCb.checked;
    });
    handleTokoFilterChange();
}

function handleTokoFilterChange() {
    updateMultiSelectLabels();
    renderTokoOrdersData();
}

function updateMultiSelectLabels() {
    // 1. Jenis Pesanan
    const typeChecked = Array.from(document.querySelectorAll('#ms-menu-type input:checked')).map(i => i.value);
    const labelType = document.getElementById('ms-label-type');
    if (labelType) {
        if (typeChecked.length === 4 || typeChecked.length === 0) {
            labelType.textContent = '📋 Jenis: Semua';
        } else {
            labelType.textContent = `📋 Jenis: ${typeChecked.length} Pilih`;
        }
    }

    // 2. Bulan
    const monthCbs = Array.from(document.querySelectorAll('.cb-month'));
    const monthChecked = monthCbs.filter(c => c.checked).map(c => c.value);
    const labelMonth = document.getElementById('ms-label-month');
    const cbAllMonths = document.getElementById('cb-all-months');

    if (cbAllMonths) {
        cbAllMonths.checked = (monthChecked.length === monthCbs.length);
    }

    if (labelMonth) {
        if (monthChecked.length === monthCbs.length || monthChecked.length === 0) {
            labelMonth.textContent = '🗓️ Bulan: Semua';
        } else {
            labelMonth.textContent = `🗓️ Bulan: ${monthChecked.length} Pilih`;
        }
    }

    // 3. Tahun
    const yearCbs = Array.from(document.querySelectorAll('.cb-year'));
    const yearChecked = yearCbs.filter(c => c.checked).map(c => c.value);
    const labelYear = document.getElementById('ms-label-year');

    if (labelYear) {
        if (yearChecked.length === yearCbs.length || yearChecked.length === 0) {
            labelYear.textContent = '📅 Tahun: Semua';
        } else {
            labelYear.textContent = `📅 Tahun: ${yearChecked.join(', ')}`;
        }
    }
}

// ----------------------------------------------------
// TOKO PRICING SETTINGS ENGINE (KHUSUS AKUN ADMIN)
// ----------------------------------------------------
function getTokoPrices() {
    const saved = localStorage.getItem('huma_farm_prices');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_PRICES;
}

function openTokoPricingModal() {
    if (currentRole !== 'admin') {
        openUnifiedAuthModal('login');
        return;
    }

    const modal = document.getElementById('modal-toko-pricing');
    if (!modal) return;

    const prices = getTokoPrices();
    document.getElementById('price-negeri-pack').value = prices.negeriPack || 25000;
    document.getElementById('price-negeri-egg').value = prices.negeriEgg || 2500;
    document.getElementById('price-kampung-pack').value = prices.kampungPack || 35000;
    document.getElementById('price-kampung-egg').value = prices.kampungEgg || 3500;

    modal.classList.add('active');
}

function closeTokoPricingModal() {
    const modal = document.getElementById('modal-toko-pricing');
    if (modal) modal.classList.remove('active');
}

async function handleSaveTokoPricingSubmit(e) {
    e.preventDefault();
    const prices = {
        negeriPack: parseInt(document.getElementById('price-negeri-pack').value, 10) || 0,
        negeriEgg: parseInt(document.getElementById('price-negeri-egg').value, 10) || 0,
        kampungPack: parseInt(document.getElementById('price-kampung-pack').value, 10) || 0,
        kampungEgg: parseInt(document.getElementById('price-kampung-egg').value, 10) || 0
    };

    showNotificationModal('Sedang Menyimpan...', 'Mengirim pembaruan harga ke server...', '☁️', 'info');
    try {
        await apiRequest('/settings/prices', 'POST', {
            negeri_pack: prices.negeriPack,
            negeri_egg: prices.negeriEgg,
            kampung_pack: prices.kampungPack,
            kampung_egg: prices.kampungEgg
        });
        localStorage.setItem('huma_farm_prices', JSON.stringify(prices));
        closeTokoPricingModal();
        renderTokoData();
        renderTokoOrdersData();
        showNotificationModal(
            'Harga Berhasil Disimpan!',
            'Pengaturan harga 1 Pack dan Eceran untuk Telur Negeri & Kampung telah diperbarui.',
            '⚙️',
            'success'
        );
    } catch (err) {
        console.error('API save prices error:', err);
        showNotificationModal('Gagal Menyimpan', 'Gagal memperbarui harga di server.', '❌', 'error');
    }
}

// ----------------------------------------------------
// UNIFIED SYSTEM NOTIFICATION MODAL
// ----------------------------------------------------
function showNotificationModal(title, message, icon = '🎉', type = 'info') {
    const modal = document.getElementById('modal-system-notification');
    const titleEl = document.getElementById('sys-notif-title');
    const messageEl = document.getElementById('sys-notif-message');
    const iconBox = document.getElementById('sys-notif-icon-box');

    if (!modal) return;

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.innerHTML = message;
    if (iconBox) {
        iconBox.textContent = icon;
        if (type === 'error') {
            iconBox.style.background = 'rgba(190, 18, 60, 0.15)';
            iconBox.style.borderColor = 'var(--ranch-rose)';
        } else if (type === 'success') {
            iconBox.style.background = 'rgba(16, 185, 129, 0.15)';
            iconBox.style.borderColor = 'var(--ranch-green)';
        } else {
            iconBox.style.background = 'rgba(217, 119, 6, 0.15)';
            iconBox.style.borderColor = 'var(--ranch-amber)';
        }
    }

    modal.classList.add('active');
}

function closeSystemNotificationModal() {
    const modal = document.getElementById('modal-system-notification');
    if (modal) modal.classList.remove('active');
}

// ----------------------------------------------------
// THEME TOGGLE ENGINE (DEFAULT STRICT: DARK MODE)
// ----------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem('huma_farm_theme');
    // Enforce dark mode as default fallback if not explicitly set by user to light
    const initialTheme = (savedTheme === 'light') ? 'light' : 'dark';
    setTheme(initialTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('huma_farm_theme', theme);

    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// ----------------------------------------------------
// CENTER SCREEN WELCOME POPUP OVERLAY
// ----------------------------------------------------
function showCenterWelcome() {
    // Only show once per session (not on refresh), resets when app is closed
    const hasSeenWelcome = sessionStorage.getItem('huma_farm_seen_welcome');
    if (hasSeenWelcome) return;

    const overlay = document.getElementById('center-welcome-overlay');
    const title = document.getElementById('welcome-title');
    const subtitle = document.getElementById('welcome-subtitle');

    if (!overlay) return;

    if (currentRole === 'admin') {
        title.textContent = 'Selamat Datang Bos!';
        subtitle.textContent = 'Kelola panen & penjualan Huma Farm.';
    } else if (currentRole === 'user' && currentUser) {
        title.textContent = `Selamat Datang, ${currentUser.name}!`;
        subtitle.textContent = 'Ayo makan telur sehat!';
    } else {
        title.textContent = 'Selamat datang di Huma Farm!';
        subtitle.textContent = 'Ayo makan telur sehat!';
    }

    // Mark as seen for this session
    sessionStorage.setItem('huma_farm_seen_welcome', '1');

    overlay.classList.add('show');
    setTimeout(() => {
        closeCenterWelcome();
    }, 3800);
}

function closeCenterWelcome() {
    const overlay = document.getElementById('center-welcome-overlay');
    if (overlay) overlay.classList.remove('show');
}

// ----------------------------------------------------
// SESSION MANAGEMENT & ROLE VISIBILITY
// ----------------------------------------------------
function loadSession() {
    const savedRole = localStorage.getItem('huma_farm_role') || 'visitor';
    const savedUser = localStorage.getItem('huma_farm_current_user');

    currentRole = savedRole;
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            currentUser = null;
        }
    }
}

function handleTopbarUserBadgeClick() {
    if (currentRole === 'visitor') {
        openUnifiedAuthModal('login');
    } else {
        switchPage('pengaturan');
    }
}

function updateRoleVisibility() {
    const adminTabs = document.querySelectorAll('[data-role="admin"]');
    const userTabs = document.querySelectorAll('[data-role="user"]');
    const visitorTabs = document.querySelectorAll('[data-role="visitor"]');
    const stickyBanner = document.getElementById('auth-sticky-banner');
    const visitorWaBanner = document.getElementById('visitor-wa-banner');
    const visitorLoginHint = document.getElementById('visitor-login-hint');
    
    const userBadge = document.getElementById('topbar-user-badge');
    const avatarImg = document.getElementById('topbar-avatar-img');
    const userNameEl = document.getElementById('topbar-user-name');
    
    const settingsBtn = document.getElementById('topbar-settings-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tokoPricingBtn = document.getElementById('btn-toko-pricing');

    if (currentRole === 'admin') {
        adminTabs.forEach(el => el.style.display = '');
        const adminPaymentCard = document.getElementById('admin-payment-setting-card');
        if (adminPaymentCard) adminPaymentCard.style.display = 'block';
        userTabs.forEach(el => el.style.display = 'none');
        visitorTabs.forEach(el => el.style.display = 'none');
        if (stickyBanner) stickyBanner.style.display = 'none';
        if (visitorWaBanner) visitorWaBanner.style.display = 'none';
        if (visitorLoginHint) visitorLoginHint.style.display = 'none';

        if (userBadge) userBadge.style.display = 'flex';
        const adminAvatar = localStorage.getItem('huma_farm_admin_avatar') || '👑';
        if (avatarImg) avatarImg.textContent = adminAvatar;
        if (userNameEl) userNameEl.textContent = 'Bos Admin';

        const walletBtn = document.getElementById('topbar-wallet-btn');
        if (walletBtn) walletBtn.style.display = 'inline-flex';

        const finCardsRow = document.getElementById('dash-financial-cards-row');
        if (finCardsRow) finCardsRow.style.display = 'grid';

        const dashCharts = document.getElementById('dash-charts-section');
        if (dashCharts) dashCharts.style.display = 'block';

        if (settingsBtn) settingsBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (tokoPricingBtn) tokoPricingBtn.style.display = 'inline-flex';

        // Hide login button when logged in as admin
        const loginBtn = document.getElementById('topbar-login-btn');
        if (loginBtn) loginBtn.style.display = 'none';

        loadSettingsPageData();
        switchPage('panenku');

    } else if (currentRole === 'user' && currentUser) {
        adminTabs.forEach(el => el.style.display = 'none');
        userTabs.forEach(el => el.style.display = '');
        visitorTabs.forEach(el => el.style.display = 'none');
        if (stickyBanner) stickyBanner.style.display = 'none';
        if (visitorWaBanner) visitorWaBanner.style.display = 'none';
        if (visitorLoginHint) visitorLoginHint.style.display = 'none';

        if (userBadge) userBadge.style.display = 'flex';
        if (avatarImg) avatarImg.textContent = currentUser.avatar || '👤';
        if (userNameEl) userNameEl.textContent = currentUser.name;

        const walletBtn = document.getElementById('topbar-wallet-btn');
        if (walletBtn) walletBtn.style.display = 'none';

        const finCardsRow = document.getElementById('dash-financial-cards-row');
        if (finCardsRow) finCardsRow.style.display = 'none';

        const dashCharts = document.getElementById('dash-charts-section');
        if (dashCharts) dashCharts.style.display = 'none';

        if (settingsBtn) settingsBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (tokoPricingBtn) tokoPricingBtn.style.display = 'none';

        // Hide login button when logged in as user
        const loginBtn = document.getElementById('topbar-login-btn');
        if (loginBtn) loginBtn.style.display = 'none';

        loadSettingsPageData();
        switchPage('toko');

    } else {
        adminTabs.forEach(el => el.style.display = 'none');
        userTabs.forEach(el => el.style.display = 'none');
        visitorTabs.forEach(el => el.style.display = '');
        if (stickyBanner) stickyBanner.style.display = 'none';
        if (visitorWaBanner) visitorWaBanner.style.display = 'flex';
        if (visitorLoginHint) visitorLoginHint.style.display = 'flex';

        if (userBadge) userBadge.style.display = 'flex';
        if (avatarImg) avatarImg.textContent = '👤';
        if (userNameEl) userNameEl.textContent = 'Pengunjung';

        const walletBtn = document.getElementById('topbar-wallet-btn');
        if (walletBtn) walletBtn.style.display = 'none';

        const finCardsRow = document.getElementById('dash-financial-cards-row');
        if (finCardsRow) finCardsRow.style.display = 'none';

        const dashCharts = document.getElementById('dash-charts-section');
        if (dashCharts) dashCharts.style.display = 'none';


        if (settingsBtn) settingsBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (tokoPricingBtn) tokoPricingBtn.style.display = 'none';

        // Show login button for visitors
        const loginBtn = document.getElementById('topbar-login-btn');
        if (loginBtn) loginBtn.style.display = 'inline-flex';

        switchPage('edukasi'); // VISITORS OPEN EDUKASI PAGE BY DEFAULT
    }


    updateCenterActionTab();
}

function updateCenterActionTab() {
    const iconEl = document.getElementById('center-action-icon');
    const labelEl = document.getElementById('center-action-label');
    const centerBtn = document.getElementById('fab-center-action');

    const activeSection = document.querySelector('.page-section.active');
    const activePageId = activeSection ? activeSection.id : '';

    if (activePageId === 'toko' || currentRole === 'user' || currentRole === 'visitor') {
        if (iconEl) iconEl.textContent = '🛒';
        if (labelEl) labelEl.textContent = 'Beli';
        if (centerBtn) centerBtn.title = 'Form Pesan / Beli Telur Cepat';
    } else if (activePageId === 'panenku' && currentRole === 'admin') {
        if (iconEl) iconEl.textContent = '➕';
        if (labelEl) labelEl.textContent = 'Panen';
        if (centerBtn) centerBtn.title = 'Input Panen / Kurangi Stok Telur';
    } else {
        if (iconEl) iconEl.textContent = '🛒';
        if (labelEl) labelEl.textContent = 'Beli';
        if (centerBtn) centerBtn.title = 'Form Pesan / Beli Telur Cepat';
    }
}

// ----------------------------------------------------
// PAGE ROUTING & NAVIGATION
// ----------------------------------------------------
function setupNavigation() {
    const navItems = document.querySelectorAll('.mobile-nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            const requiresAdmin = item.getAttribute('data-role') === 'admin';
            const requiresUser = item.getAttribute('data-role') === 'user';

            if (requiresAdmin && currentRole !== 'admin') {
                openUnifiedAuthModal('login');
                return;
            }

            if (requiresUser && currentRole !== 'user') {
                openUnifiedAuthModal('login');
                return;
            }

            switchPage(targetPage);
        });
    });
}

function switchPage(pageId) {
    if ((pageId === 'panenku' || pageId === 'pengaturan') && currentRole === 'visitor') {
        openUnifiedAuthModal('login');
        return;
    }

    document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
    
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.remove('active');
    });

    const targetMobileNav = document.querySelector(`.mobile-nav-item[data-page="${pageId}"][data-role="${currentRole}"]`) || document.querySelector(`.mobile-nav-item[data-page="${pageId}"]`);
    const targetSection = document.getElementById(pageId);

    if (targetMobileNav) targetMobileNav.classList.add('active');
    
    if (targetSection) {
        targetSection.classList.add('active');
    }

    updateCenterActionTab();

    if (pageId === 'dashboard') {
        updateDashboardData();
    } else if (pageId === 'panenku') {
        renderPanenData();
    } else if (pageId === 'toko') {
        renderTokoData();
        renderTokoOrdersData();
    } else if (pageId === 'keuangan') {
        renderKeuanganData();
    } else if (pageId === 'leaderboard') {
        renderLeaderboardData();
    } else if (pageId === 'pengaturan') {
        loadSettingsPageData();
    }



    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) mainContainer.scrollTop = 0;
}

// ----------------------------------------------------
// CENTER DOCKED FAB MULTI-ROLE ACTION ENGINE WITH BOUNCE POP
// ----------------------------------------------------
function handleCenterFabClick() {
    const mobileFab = document.getElementById('fab-center-action');

    if (mobileFab) {
        mobileFab.classList.remove('bounce-pop-action');
        void mobileFab.offsetWidth;
        mobileFab.classList.add('bounce-pop-action');
    }

    const activeSection = document.querySelector('.page-section.active');
    const activePageId = activeSection ? activeSection.id : '';

    setTimeout(() => {
        if (activePageId === 'panenku' && currentRole === 'admin') {
            openInputPanenModal('add');
        } else {
            openQuickUserOrderModal();
        }

        setTimeout(() => {
            if (mobileFab) mobileFab.classList.remove('bounce-pop-action');
        }, 450);
    }, 150);
}

// ============================================================
// ORDER FORM v3 - MULTI PACK + ECERAN SUPPORT PER EGG TYPE
// ============================================================

let orderQtyNegeriPack = 0;
let orderQtyNegeriEgg = 0;
let orderQtyKampungPack = 0;
let orderQtyKampungEgg = 0;

function openQuickUserOrderModal() {
    const modal = document.getElementById('modal-user-order');
    if (!modal) return;

    // Reset state
    orderQtyNegeriPack = 0;
    orderQtyNegeriEgg = 0;
    orderQtyKampungPack = 0;
    orderQtyKampungEgg = 0;

    // Reset UI inputs
    const np = document.getElementById('order-qty-negeri-pack');
    const ne = document.getElementById('order-qty-negeri-egg');
    const kp = document.getElementById('order-qty-kampung-pack');
    const ke = document.getElementById('order-qty-kampung-egg');
    if (np) np.value = '0';
    if (ne) ne.value = '0';
    if (kp) kp.value = '0';
    if (ke) ke.value = '0';

    // Buyer row & Phone row handling
    const buyerRow = document.getElementById('order-buyer-row');
    const buyerInput = document.getElementById('quick-order-buyer-input');
    const phoneInput = document.getElementById('quick-order-phone-input');
    const dd = document.getElementById('order-buyer-dropdown');
    if (dd) dd.style.display = 'none';

    if (buyerRow) buyerRow.style.display = 'block';

    if (buyerInput) {
        if (currentRole === 'admin') {
            buyerInput.readOnly = false;
            buyerInput.style.opacity = '1';
            buyerInput.style.cursor = 'text';
            buyerInput.placeholder = 'Cari nama user atau ketik manual...';
            buyerInput.value = '';
        } else if (currentRole === 'user' && currentUser) {
            buyerInput.readOnly = true;
            buyerInput.style.opacity = '0.85';
            buyerInput.style.cursor = 'not-allowed';
            buyerInput.value = currentUser.name;
        } else {
            buyerInput.readOnly = false;
            buyerInput.style.opacity = '1';
            buyerInput.style.cursor = 'text';
            buyerInput.placeholder = 'Masukkan nama lengkap Anda...';
            buyerInput.value = '';
        }
    }

    if (phoneInput) {
        if (currentUser && currentUser.phone) {
            phoneInput.value = currentUser.phone;
        } else {
            phoneInput.value = '';
        }
    }

    // CALCULATE CURRENT READY STOCK
    const activeStock = getCalculatedReadyStock();
    let stockNegeri = activeStock.negeri;
    let stockKampung = activeStock.kampung;

    const packN = Math.floor(stockNegeri / 10);
    const eggN = stockNegeri % 10;
    const packK = Math.floor(stockKampung / 10);
    const eggK = stockKampung % 10;

    // 2-baris kompak: Pack + Ecer terpisah
    const packNegeriEl = document.getElementById('modal-stock-pack-negeri');
    const eggNegeriEl  = document.getElementById('modal-stock-egg-negeri');
    const packKampungEl = document.getElementById('modal-stock-pack-kampung');
    const eggKampungEl  = document.getElementById('modal-stock-egg-kampung');

    if (packNegeriEl) packNegeriEl.textContent = `${packN} Pack`;
    if (eggNegeriEl)  eggNegeriEl.textContent  = `${eggN} Butir`;
    if (packKampungEl) packKampungEl.textContent = `${packK} Pack`;
    if (eggKampungEl)  eggKampungEl.textContent  = `${eggK} Butir`;

    // Warning + button reset
    const warn = document.getElementById('order-stock-warning');
    if (warn) warn.style.display = 'none';
    const priceSum = document.getElementById('order-price-summary');
    if (priceSum) priceSum.style.display = 'none';

    const btn = document.getElementById('order-submit-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Lanjut ke Pembayaran ➔'; btn.classList.remove('btn-po'); btn.classList.add('btn-ranch'); }

    modal.classList.add('active');
}

function closeQuickUserOrderModal() {
    const modal = document.getElementById('modal-user-order');
    if (modal) modal.classList.remove('active');
    const dd = document.getElementById('order-buyer-dropdown');
    if (dd) dd.style.display = 'none';
}

function changeOrderQty(key, delta) {
    if (key === 'negeri_pack') {
        orderQtyNegeriPack = Math.max(0, orderQtyNegeriPack + delta);
        const el = document.getElementById('order-qty-negeri-pack');
        if (el) el.value = orderQtyNegeriPack;
    } else if (key === 'negeri_egg') {
        orderQtyNegeriEgg = Math.max(0, orderQtyNegeriEgg + delta);
        const el = document.getElementById('order-qty-negeri-egg');
        if (el) el.value = orderQtyNegeriEgg;
    } else if (key === 'kampung_pack') {
        orderQtyKampungPack = Math.max(0, orderQtyKampungPack + delta);
        const el = document.getElementById('order-qty-kampung-pack');
        if (el) el.value = orderQtyKampungPack;
    } else if (key === 'kampung_egg') {
        orderQtyKampungEgg = Math.max(0, orderQtyKampungEgg + delta);
        const el = document.getElementById('order-qty-kampung-egg');
        if (el) el.value = orderQtyKampungEgg;
    }
    refreshOrderStockStatus();
}

function onOrderQtyInput(key, val) {
    const parsed = parseInt(val, 10);
    const validVal = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    if (key === 'negeri_pack') orderQtyNegeriPack = validVal;
    else if (key === 'negeri_egg') orderQtyNegeriEgg = validVal;
    else if (key === 'kampung_pack') orderQtyKampungPack = validVal;
    else if (key === 'kampung_egg') orderQtyKampungEgg = validVal;
    refreshOrderStockStatus();
}

function refreshOrderStockStatus() {
    const btn = document.getElementById('order-submit-btn');
    const warn = document.getElementById('order-stock-warning');
    const warnText = document.getElementById('order-stock-warning-text');
    const priceSummary = document.getElementById('order-price-summary');
    const detailsContainer = document.getElementById('order-price-details-container');
    const totalEl = document.getElementById('order-price-total');

    const totalItems = orderQtyNegeriPack + orderQtyNegeriEgg + orderQtyKampungPack + orderQtyKampungEgg;

    if (totalItems === 0) {
        if (btn) { btn.disabled = true; btn.innerHTML = '🛒 Pesan via WhatsApp'; btn.classList.remove('btn-po'); btn.classList.add('btn-ranch'); }
        if (warn) warn.style.display = 'none';
        if (priceSummary) priceSummary.style.display = 'none';
        return;
    }

    const prices = getTokoPrices();
    let grandTotal = 0;
    let detailsHTML = '';

    if (orderQtyNegeriPack > 0) {
        const sub = orderQtyNegeriPack * prices.negeriPack;
        grandTotal += sub;
        detailsHTML += `<div style="display:flex; justify-content:space-between; color:var(--text-muted);">
            <span>Telur Negeri (${orderQtyNegeriPack} Pack)</span>
            <span style="font-weight:700; color:var(--text-main);">Rp ${sub.toLocaleString('id-ID')}</span>
        </div>`;
    }
    if (orderQtyNegeriEgg > 0) {
        const sub = orderQtyNegeriEgg * prices.negeriEgg;
        grandTotal += sub;
        detailsHTML += `<div style="display:flex; justify-content:space-between; color:var(--text-muted);">
            <span>Telur Negeri (${orderQtyNegeriEgg} Butir)</span>
            <span style="font-weight:700; color:var(--text-main);">Rp ${sub.toLocaleString('id-ID')}</span>
        </div>`;
    }
    if (orderQtyKampungPack > 0) {
        const sub = orderQtyKampungPack * prices.kampungPack;
        grandTotal += sub;
        detailsHTML += `<div style="display:flex; justify-content:space-between; color:var(--text-muted);">
            <span>Telur Kampung (${orderQtyKampungPack} Pack)</span>
            <span style="font-weight:700; color:var(--text-main);">Rp ${sub.toLocaleString('id-ID')}</span>
        </div>`;
    }
    if (orderQtyKampungEgg > 0) {
        const sub = orderQtyKampungEgg * prices.kampungEgg;
        grandTotal += sub;
        detailsHTML += `<div style="display:flex; justify-content:space-between; color:var(--text-muted);">
            <span>Telur Kampung (${orderQtyKampungEgg} Butir)</span>
            <span style="font-weight:700; color:var(--text-main);">Rp ${sub.toLocaleString('id-ID')}</span>
        </div>`;
    }

    if (detailsContainer) detailsContainer.innerHTML = detailsHTML;
    if (totalEl) totalEl.textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');
    if (priceSummary) priceSummary.style.display = 'block';

    // Calculate Stock Shortage
    const activeStock = getCalculatedReadyStock();
    let stockNegeri = activeStock.negeri;
    let stockKampung = activeStock.kampung;

    const needNegeriEggs = (orderQtyNegeriPack * 10) + orderQtyNegeriEgg;
    const needKampungEggs = (orderQtyKampungPack * 10) + orderQtyKampungEgg;

    const shortN = Math.max(0, needNegeriEggs - stockNegeri);
    const shortK = Math.max(0, needKampungEggs - stockKampung);
    const hasShortage = shortN > 0 || shortK > 0;

    if (hasShortage) {
        let msgs = [];
        if (shortN > 0) msgs.push(`Negeri kurang ${shortN} butir`);
        if (shortK > 0) msgs.push(`Kampung kurang ${shortK} butir`);
        if (warn) warn.style.display = 'flex';
        if (warnText) warnText.textContent = '⚠️ Stok kurang (' + msgs.join(', ') + '). Silakan ajukan Pre-Order via WhatsApp.';
        if (btn) { btn.disabled = false; btn.innerHTML = '📋 Ajukan PO via WhatsApp'; btn.classList.add('btn-po'); btn.classList.remove('btn-ranch'); }
    } else {
        if (warn) warn.style.display = 'none';
        if (btn) { btn.disabled = false; btn.innerHTML = '🛒 Pesan via WhatsApp'; btn.classList.remove('btn-po'); btn.classList.add('btn-ranch'); }
    }
}

// ADMIN: Buyer name search
function handleOrderBuyerSearch(query) {
    const dd = document.getElementById('order-buyer-dropdown');
    if (!dd) return;
    if (!query || query.length < 1) { dd.style.display = 'none'; return; }

    const registeredUsers = JSON.parse(localStorage.getItem('huma_farm_registered_users') || '[]');
    const matches = registeredUsers.filter(u => u.name && u.name.toLowerCase().includes(query.toLowerCase()));

    if (matches.length === 0) { dd.style.display = 'none'; return; }

    dd.innerHTML = matches.slice(0, 6).map(u =>
        `<div class="order-buyer-option" onclick="selectOrderBuyer('${u.name.replace(/'/g, "\\'")}')">
            <span class="buyer-opt-avatar">${u.avatar || '👤'}</span>
            <span class="buyer-opt-name">${u.name}</span>
        </div>`
    ).join('');
    dd.style.display = 'block';
}

function selectOrderBuyer(name) {
    const input = document.getElementById('quick-order-buyer-input');
    if (input) input.value = name;
    const dd = document.getElementById('order-buyer-dropdown');
    if (dd) dd.style.display = 'none';
}

let pendingOrderData = null;
let redirectCountdownTimer = null;

function anonymizeBuyerName(name) {
    if (!name) return 'P***';
    const parts = name.trim().split(/\s+/);
    return parts.map(part => {
        const len = part.length;
        if (len <= 1) return part;
        if (len === 2) return part[0] + '*';
        const visibleCount = Math.max(1, Math.round(len * 0.3));
        const maskCount = len - visibleCount;
        return part.substring(0, visibleCount) + '*'.repeat(maskCount);
    }).join(' ');
}

function handleQuickUserOrderStep1Submit(e) {
    e.preventDefault();

    const totalItems = orderQtyNegeriPack + orderQtyNegeriEgg + orderQtyKampungPack + orderQtyKampungEgg;
    if (totalItems === 0) return;

    let buyerName;
    const inp = document.getElementById('quick-order-buyer-input');
    if (inp && inp.value.trim()) {
        buyerName = inp.value.trim();
    } else {
        buyerName = currentUser ? currentUser.name : 'Pengunjung Huma Farm';
    }

    const phoneInp = document.getElementById('quick-order-phone-input');
    const buyerPhone = phoneInp ? phoneInp.value.trim() : '';

    const prices = getTokoPrices();
    let orderDescArr = [];
    let grandTotal = 0;
    let itemsToProcess = [];

    if (orderQtyNegeriPack > 0) {
        const sub = orderQtyNegeriPack * prices.negeriPack;
        grandTotal += sub;
        orderDescArr.push(`Telur Negeri: ${orderQtyNegeriPack} Pack (Rp ${sub.toLocaleString('id-ID')})`);
        itemsToProcess.push({ category: 'negeri', unit: 'pack', qty: orderQtyNegeriPack });
    }
    if (orderQtyNegeriEgg > 0) {
        const sub = orderQtyNegeriEgg * prices.negeriEgg;
        grandTotal += sub;
        orderDescArr.push(`Telur Negeri: ${orderQtyNegeriEgg} Butir (Rp ${sub.toLocaleString('id-ID')})`);
        itemsToProcess.push({ category: 'negeri', unit: 'egg', qty: orderQtyNegeriEgg });
    }
    if (orderQtyKampungPack > 0) {
        const sub = orderQtyKampungPack * prices.kampungPack;
        grandTotal += sub;
        orderDescArr.push(`Telur Kampung: ${orderQtyKampungPack} Pack (Rp ${sub.toLocaleString('id-ID')})`);
        itemsToProcess.push({ category: 'kampung', unit: 'pack', qty: orderQtyKampungPack });
    }
    if (orderQtyKampungEgg > 0) {
        const sub = orderQtyKampungEgg * prices.kampungEgg;
        grandTotal += sub;
        orderDescArr.push(`Telur Kampung: ${orderQtyKampungEgg} Butir (Rp ${sub.toLocaleString('id-ID')})`);
        itemsToProcess.push({ category: 'kampung', unit: 'egg', qty: orderQtyKampungEgg });
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `#ORD-${randomSuffix}`;

    pendingOrderData = {
        orderId,
        buyerName,
        buyerPhone,
        orderDescArr,
        grandTotal,
        itemsToProcess
    };

    closeQuickUserOrderModal();

    // Populate Modal Payment Instructions
    const modalIdEl = document.getElementById('pay-modal-order-id');
    const modalNameEl = document.getElementById('pay-modal-buyer-name');
    const modalPhoneEl = document.getElementById('pay-modal-buyer-phone');
    const modalDescEl = document.getElementById('pay-modal-order-desc');
    const modalTotalEl = document.getElementById('pay-modal-total-amount');

    if (modalIdEl) modalIdEl.textContent = orderId;
    if (modalNameEl) modalNameEl.textContent = buyerName;
    if (modalPhoneEl) modalPhoneEl.textContent = buyerPhone || '-';
    if (modalDescEl) modalDescEl.textContent = orderDescArr.join(' + ');
    if (modalTotalEl) modalTotalEl.textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');

    // DYNAMIC QRIS & BANK POPULATE FROM LATEST SETTINGS
    const savedQrisUrl = localStorage.getItem('huma_farm_qris_image') || 'images/qris_huma_farm.png';
    const savedMerchant = localStorage.getItem('huma_farm_qris_merchant') || 'Huma Farm';
    const qrisImg = document.getElementById('qris-img-element');
    const merchantLabel = document.getElementById('pay-qris-merchant');
    if (qrisImg) qrisImg.src = savedQrisUrl;
    if (merchantLabel) merchantLabel.textContent = `📱 QRIS ${savedMerchant}`;

    const savedBankName = localStorage.getItem('huma_farm_bank_name') || 'BSI';
    const savedBankNumber = localStorage.getItem('huma_farm_bank_number') || '7367004597';
    const savedBankOwner = localStorage.getItem('huma_farm_bank_owner') || 'Mela Mufida';
    const bsiNumEl = document.getElementById('pay-bsi-number');
    const bsiOwnerEl = document.getElementById('pay-bsi-owner');
    const bsiLabelEl = document.getElementById('pay-bsi-bank-name');
    if (bsiNumEl) bsiNumEl.textContent = savedBankNumber;
    if (bsiOwnerEl) bsiOwnerEl.textContent = savedBankOwner;
    if (bsiLabelEl) bsiLabelEl.textContent = `🏦 ${savedBankName}`;

    // Default to BSI payment view
    selectPaymentMethod('bsi');

    const modalPay = document.getElementById('modal-payment-instructions');
    if (modalPay) modalPay.classList.add('active');
}

function selectPaymentMethod(method) {
    const bsiBox = document.getElementById('bsi-payment-box');
    const qrisBox = document.getElementById('qris-payment-box');
    const labelBsi = document.getElementById('label-pay-bsi');
    const labelQris = document.getElementById('label-pay-qris');

    if (method === 'qris') {
        if (bsiBox) bsiBox.style.display = 'none';
        if (qrisBox) qrisBox.style.display = 'block';
        if (labelBsi) labelBsi.classList.remove('selected');
        if (labelQris) labelQris.classList.add('selected');
    } else {
        if (bsiBox) bsiBox.style.display = 'block';
        if (qrisBox) qrisBox.style.display = 'none';
        if (labelBsi) labelBsi.classList.add('selected');
        if (labelQris) labelQris.classList.remove('selected');
    }
}

function closePaymentInstructionsModal() {
    const modal = document.getElementById('modal-payment-instructions');
    if (modal) modal.classList.remove('active');
}

async function executeOrderWithCountDown() {
    if (!pendingOrderData) return;

    const { orderId, buyerName, buyerPhone, orderDescArr, grandTotal, itemsToProcess } = pendingOrderData;

    // Determine chosen payment method
    const selectedPay = document.querySelector('input[name="pay_choice"]:checked');
    const payMethod = selectedPay ? selectedPay.value : 'bsi';
    const payMethodText = payMethod === 'qris' 
        ? '📱 QRIS Code (All E-Wallet)' 
        : '🏦 Transfer Bank BSI (7367004597 a.n Mela Mufida)';

    showNotificationModal('Mengirim Pesanan...', 'Menyimpan pesanan ke database farm...', '☁️', 'info');

    try {
        // Send all items to Laravel API
        for (const item of itemsToProcess) {
            const prices = getTokoPrices();
            const pricePerUnit = (item.category === 'negeri') 
                ? (item.unit === 'pack' ? prices.negeriPack : prices.negeriEgg)
                : (item.unit === 'pack' ? prices.kampungPack : prices.kampungEgg);
            const itemTotalPrice = item.qty * pricePerUnit;

            await apiRequest('/orders', 'POST', {
                buyer_name: buyerName,
                buyer_phone: buyerPhone || '',
                category: item.category,
                unit: item.unit,
                qty: item.qty,
                total_price: itemTotalPrice
            });
        }
        
        // Pull latest sync state
        await fetchCloudData();
        closePaymentInstructionsModal();

        // Construct WhatsApp Message
        const orderDescStr = orderDescArr.map(d => `- ${d}`).join('\n');
        const waMessage = `Halo Huma Farm! 🥚\nAku mau pesan telurnya ya!\n\n📌 *Order ID*: ${orderId}\n👤 *Pemesan*: ${buyerName}\n📱 *No. WA*: ${buyerPhone || '-'}\n\n📦 *Rincian Pesanan*:\n${orderDescStr}\n\n💳 *Total Tagihan*: Rp ${grandTotal.toLocaleString('id-ID')}\n💳 *Metode Pembayaran*: ${payMethodText}\n\nMohon konfirmasi pesanan saya ya! Terima kasih!`;
        const encodedMessage = encodeURIComponent(waMessage);
        const waUrl = `https://wa.me/6282299336676?text=${encodedMessage}`;

        // Open Countdown Modal
        const countdownModal = document.getElementById('modal-wa-redirect-countdown');
        if (countdownModal) countdownModal.classList.add('active');

        let secondsLeft = 5;
        const numEl = document.getElementById('wa-countdown-num');
        const numTextEl = document.getElementById('wa-countdown-num-text');

        if (numEl) numEl.textContent = secondsLeft;
        if (numTextEl) numTextEl.textContent = secondsLeft + ' detik';

        if (redirectCountdownTimer) clearInterval(redirectCountdownTimer);

        redirectCountdownTimer = setInterval(() => {
            secondsLeft -= 1;
            if (numEl) numEl.textContent = secondsLeft;
            if (numTextEl) numTextEl.textContent = secondsLeft + ' detik';

            if (secondsLeft <= 0) {
                clearInterval(redirectCountdownTimer);
                if (countdownModal) countdownModal.classList.remove('active');
                window.open(waUrl, '_blank');
            }
        }, 1000);

        // Save pending waUrl for forced click
        window.pendingWaUrl = waUrl;

    } catch (err) {
        console.error('API checkout error:', err);
        showNotificationModal('Gagal Mengirim Pesanan', 'Gagal menghubungi server database. Silakan coba lagi.', '❌', 'error');
    }
}

function forceOpenWhatsAppNow() {
    if (redirectCountdownTimer) clearInterval(redirectCountdownTimer);
    const countdownModal = document.getElementById('modal-wa-redirect-countdown');
    if (countdownModal) countdownModal.classList.remove('active');
    if (window.pendingWaUrl) {
        window.open(window.pendingWaUrl, '_blank');
    }
}

function copyBSIAccountNumber() {
    const num = '7367004597';
    navigator.clipboard.writeText(num).then(() => {
        showNotificationModal(
            'Nomor Rekening Disalin!',
            'Nomor rekening <strong>Bank BSI: 7367004597</strong> (a.n. Mela Mufida) telah berhasil disalin ke clipboard.',
            '📋',
            'success'
        );
    }).catch(err => {
        showNotificationModal(
            'BSI 7367004597',
            'Nomor Rekening Bank BSI: <strong>7367004597</strong> (a.n. Mela Mufida)',
            '🏦',
            'info'
        );
    });
}

// Deleted processOrderOrPOWithId






// ----------------------------------------------------
// ORDER & PRE-ORDER (PO) PROCESSING ENGINE WITH SHORTAGE CALCULATION & SUPABASE SYNC
// ----------------------------------------------------
// Deleted processOrderOrPO

// ----------------------------------------------------
// RENDERING TOKO DATA & ORDERS HISTORY WITH MULTI-SELECT FILTERS
// ----------------------------------------------------
function renderTokoData() {
    // Get stock dynamically subtracting completed orders
    const activeStock = getCalculatedReadyStock();
    const totalNegeri = activeStock.negeri;
    const totalKampung = activeStock.kampung;

    const prices = getTokoPrices();

    const tokoStokNegeri = document.getElementById('toko-stok-negeri');
    const tokoStokKampung = document.getElementById('toko-stok-kampung');
    if (tokoStokNegeri) tokoStokNegeri.textContent = `${totalNegeri} Butir`;
    if (tokoStokKampung) tokoStokKampung.textContent = `${totalKampung} Butir`;

    const packNegeri = Math.floor(totalNegeri / 10);
    const eceranNegeri = totalNegeri % 10;

    const packKampung = Math.floor(totalKampung / 10);
    const eceranKampung = totalKampung % 10;

    const packNegeriEl = document.getElementById('toko-pack-negeri-val');
    const eceranNegeriEl = document.getElementById('toko-eceran-negeri-val');
    const packKampungEl = document.getElementById('toko-pack-kampung-val');
    const eceranKampungEl = document.getElementById('toko-eceran-kampung-val');

    if (packNegeriEl) packNegeriEl.textContent = `${packNegeri} Pack`;
    if (eceranNegeriEl) eceranNegeriEl.textContent = `${eceranNegeri} Butir`;
    if (packKampungEl) packKampungEl.textContent = `${packKampung} Pack`;
}



function renderTokoOrdersData() {
    let orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const container = document.getElementById('toko-history-container');
    if (!container) return;

    // Sort by newest date (createdAt) first (safe ISO parsing)
    orders.sort((a, b) => {
        const timeA = a.createdAt || '';
        const timeB = b.createdAt || '';
        if (timeA && timeB) {
            return new Date(timeB) - new Date(timeA);
        }
        return timeB.localeCompare(timeA);
    });

    // Filter by Role Permissions:
    // USER: Only view orders placed by user's name
    // VISITOR: View all, but buyer names are anonymized
    // ADMIN: View all with full edit/delete & confirm actions
    if (currentRole === 'user' && currentUser) {
        orders = orders.filter(item => item.buyerName && item.buyerName.toLowerCase() === currentUser.name.toLowerCase());
    }

    const typeChecked = Array.from(document.querySelectorAll('#ms-menu-type input:checked')).map(i => i.value);
    const monthChecked = Array.from(document.querySelectorAll('.cb-month:checked')).map(i => i.value);
    const yearChecked = Array.from(document.querySelectorAll('.cb-year:checked')).map(i => i.value);

    let filteredOrders = orders.filter(item => {
        let matchType = true;
        if (typeChecked.length > 0) {
            const isCompleted = item.status === 'completed';
            const isPO = item.status === 'po';
            const isPending = item.status === 'pending_confirm';
            const isLunas = item.paymentStatus === 'Lunas';
            const isUnpaid = item.paymentStatus === 'Belum Bayar' || item.paymentStatus === 'Menunggu Konfirmasi';

            matchType = (
                (typeChecked.includes('completed') && isCompleted) ||
                (typeChecked.includes('po') && isPO) ||
                (typeChecked.includes('pending') && isPending) ||
                (typeChecked.includes('lunas') && isLunas) ||
                (typeChecked.includes('unpaid') && isUnpaid)
            );
        }

        let matchMonth = true;
        let matchYear = true;

        if (item.createdAt) {
            const [datePart] = item.createdAt.split('T');
            const [year, month] = datePart.split('-');

            if (monthChecked.length > 0) {
                matchMonth = monthChecked.includes(month);
            }
            if (yearChecked.length > 0) {
                matchYear = yearChecked.includes(year);
            }
        }

        return matchType && matchMonth && matchYear;
    });

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="card-placeholder" style="margin-top: 6px;">
                <span class="placeholder-icon">🛍️</span>
                <p>Belum ada riwayat pesanan atau Pre-Order untuk filter ini.</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    filteredOrders.forEach(item => {
        const isPO = item.status === 'po';
        const isPendingConfirm = item.status === 'pending_confirm';
        const categoryText = item.category === 'negeri' ? 'Telur Negeri' : 'Telur Kampung';
        const unitText = item.unit === 'pack' ? 'Pack (isi 10)' : 'Butir';

        // Anonymize buyer name for visitors
        const displayName = currentRole === 'visitor' ? anonymizeBuyerName(item.buyerName) : (item.buyerName || 'Pembeli');

        let poBadge = `<span class="badge-status-completed">🛍️ Langsung</span>`;
        if (isPO) {
            poBadge = `<span class="badge-status-pending">🏷️ PO #${item.poNumber || 1}</span>`;
        } else if (isPendingConfirm) {
            poBadge = `<span class="badge-status-pending">⏳ Menunggu Konfirmasi</span>`;
        }

        let paymentBadge = `<span class="badge-status-completed">🟢 Lunas</span>`;
        if (item.paymentStatus === 'Belum Bayar') {
            paymentBadge = `<span class="badge-status-unpaid">🔴 Belum Bayar</span>`;
        } else if (item.paymentStatus === 'Menunggu Konfirmasi') {
            paymentBadge = `<span class="badge-status-pending">🟡 Menunggu Konfirmasi Admin</span>`;
        }

        let shortageWarning = '';
        if (isPO && item.shortageEggs > 0) {
            shortageWarning = `<div style="font-size: 0.72rem; color: var(--ranch-rose); font-weight: 700; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                ⚠️ <span>Stok Kurang ${item.shortageEggs} Butir lagi untuk memenuhi PO ini!</span>
            </div>`;
        }

        const formattedDate = formatIndonesianDate(item.createdAt.split('T')[0]);

        // Action Buttons according to Role
        let actionButtons = '';
        if (currentRole === 'admin') {
            actionButtons = `
                <div style="display: flex; gap: 5px; margin-top: 4px; justify-content: flex-end;">
                    ${item.paymentStatus !== 'Lunas' ? `<button class="btn btn-ranch" style="font-size: 0.68rem; padding: 3px 9px; min-height: 26px;" onclick="confirmUserOrderPayment('${item.id}')">✓ Lunas</button>` : ''}
                    <button class="btn btn-outline" style="font-size: 0.68rem; padding: 3px 8px; min-height: 26px; color: var(--ranch-amber); border-color: var(--ranch-amber);" onclick="editUserOrderRecord('${item.id}')">✏️ Edit</button>
                    <button class="btn btn-rose" style="font-size: 0.68rem; padding: 3px 7px; min-height: 26px;" onclick="deleteUserOrderRecord('${item.id}')">🗑️ Hapus</button>
                </div>
            `;
        } else if (currentRole === 'user' && item.paymentStatus !== 'Lunas') {
            actionButtons = `
                <div style="display: flex; gap: 4px; margin-top: 4px; justify-content: flex-end;">
                    <button class="btn btn-outline" style="font-size: 0.68rem; padding: 2px 6px; min-height: 24px; color: var(--ranch-rose);" onclick="deleteUserOrderRecord('${item.id}')">❌ Batalkan</button>
                </div>
            `;
        }

        html += `
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                
                <!-- ROW 1: ID + Timestamp -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 0.65rem; background: var(--bg-card); border: 1px solid var(--border-color); padding: 2px 7px; border-radius: 5px; font-weight: 800; color: var(--ranch-amber);">${item.id || '#ORD-000'}</span>
                    <span style="font-size: 0.67rem; color: var(--text-muted);">📅 ${formattedDate}</span>
                </div>

                <!-- ROW 2: Buyer Name -->
                <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 0.78rem;">👤</span>
                    <strong style="font-size: 0.82rem; color: var(--text-main);">${displayName}</strong>
                    ${poBadge}
                </div>

                <!-- ROW 3: Detail Box -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 7px; padding: 7px 10px; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">🥚 ${item.qty} ${unitText} ${categoryText}</span>
                        <strong style="color: var(--ranch-amber); font-size: 0.88rem;">Rp ${item.totalPrice.toLocaleString('id-ID')}</strong>
                    </div>
                    ${shortageWarning}
                </div>

                <!-- ROW 4: Status -->
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.74rem; margin-bottom: 6px;">
                    <span style="color: var(--text-muted);">Status:</span>
                    ${paymentBadge}
                </div>

                <!-- ROW 5: Action Buttons -->
                ${actionButtons}
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// CONFIRMATION & DELETION ACTIONS FOR ORDERS
async function confirmUserOrderPayment(orderId) {
    let orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
        showNotificationModal('Sedang Mengonfirmasi...', 'Mengonfirmasi status pembayaran...', '☁️', 'info');
        try {
            await apiRequest(`/orders/${orderId}`, 'PUT', {
                payment_status: 'Lunas'
            });
            await fetchCloudData();
            showNotificationModal(
                'Pesanan Dikonfirmasi Lunas!',
                `Pesanan atas nama <strong>${orders[idx].buyerName}</strong> sebesar <strong>Rp ${orders[idx].totalPrice.toLocaleString('id-ID')}</strong> telah dikonfirmasi Lunas & kas bertambah.`,
                '🟢',
                'success'
            );
        } catch (err) {
            console.error('API confirm order error:', err);
            showNotificationModal('Gagal Sinkronisasi', 'Gagal memperbarui status ke server. Silakan coba lagi.', '❌', 'error');
        }
    }
}

function deleteUserOrderRecord(orderId) {
    console.log('deleteUserOrderRecord called with orderId:', orderId);
    deletingOrderId = orderId;
    const modal = document.getElementById('modal-delete-order-confirm');
    console.log('Found modal element:', modal);
    if (modal) {
        modal.classList.add('active');
        console.log('Active class added to modal-delete-order-confirm');
    } else {
        console.error('Modal element modal-delete-order-confirm not found in DOM!');
    }
}

function closeDeleteOrderConfirmModal() {
    console.log('closeDeleteOrderConfirmModal called');
    const modal = document.getElementById('modal-delete-order-confirm');
    if (modal) modal.classList.remove('active');
    deletingOrderId = null;
}

async function executeDeleteOrderRecord() {
    if (!deletingOrderId) return;

    showNotificationModal('Sedang Menghapus...', 'Menghapus data pesanan di server...', '☁️', 'info');
    try {
        await apiRequest(`/orders/${deletingOrderId}`, 'DELETE');
        await fetchCloudData();
        closeDeleteOrderConfirmModal();
        showNotificationModal(
            'Pesanan Dibatalkan / Dihapus',
            'Pesanan telah dihapus dari daftar riwayat toko.',
            '🗑️',
            'info'
        );
    } catch (err) {
        console.error('API delete order error:', err);
        showNotificationModal('Gagal Menghapus', 'Gagal menghapus data dari server.', '❌', 'error');
    }
}

async function togglePaymentStatus(orderId) {
    let orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        const newPaymentStatus = orders[idx].paymentStatus === 'Lunas' ? 'Belum Bayar' : 'Lunas';
        showNotificationModal('Sedang Memperbarui...', 'Memperbarui status pembayaran di server...', '☁️', 'info');
        try {
            await apiRequest(`/orders/${orderId}`, 'PUT', {
                payment_status: newPaymentStatus
            });
            await fetchCloudData();
            showNotificationModal('Status Pembayaran Diperbarui!', 'Status pembayaran berhasil diperbarui.', '💰', 'success');
        } catch (err) {
            console.error('API toggle payment status error:', err);
            showNotificationModal('Gagal Sinkronisasi', 'Gagal memperbarui status ke server.', '❌', 'error');
        }
    }
}

// ----------------------------------------------------
function loadSettingsPageData() {
    const setPhoneInput = document.getElementById('set-new-phone');
    const previewBox = document.getElementById('settings-avatar-preview');

    if (currentRole === 'admin') {
        selectedProfileEmoji = localStorage.getItem('huma_farm_admin_avatar') || '👑';
        if (previewBox) previewBox.textContent = selectedProfileEmoji;
        if (setPhoneInput) setPhoneInput.value = '081234567890';
    } else if (currentUser) {
        selectedProfileEmoji = currentUser.avatar || '👤';
        if (previewBox) previewBox.textContent = selectedProfileEmoji;
        if (setPhoneInput) setPhoneInput.value = currentUser.phone || '';
    }

    renderFarmEmojiPickerGrid(selectedProfileEmoji);
}

function renderFarmEmojiPickerGrid(activeEmoji) {
    const gridContainer = document.getElementById('farm-emoji-picker-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    FARM_EMOJI_LIST.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `emoji-key-btn ${emoji === activeEmoji ? 'active' : ''}`;
        btn.textContent = emoji;
        btn.onclick = () => selectFarmEmoji(emoji);
        gridContainer.appendChild(btn);
    });
}

function selectFarmEmoji(emoji) {
    selectedProfileEmoji = emoji;

    const previewBox = document.getElementById('settings-avatar-preview');
    if (previewBox) previewBox.textContent = emoji;

    const allButtons = document.querySelectorAll('.emoji-key-btn');
    allButtons.forEach(btn => {
        if (btn.textContent === emoji) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

async function handleUpdateAvatarSubmit(e) {
    e.preventDefault();

    if (currentRole === 'admin') {
        localStorage.setItem('huma_farm_admin_avatar', selectedProfileEmoji);
        updateRoleVisibility();
        showNotificationModal(
            'Logo Profil Diperbarui!',
            `Logo profil Bos Admin berhasil diperbarui ke <strong>${selectedProfileEmoji}</strong>.`,
            '🎨',
            'success'
        );
    } else if (currentUser) {
        showNotificationModal('Sedang Menyimpan...', 'Memperbarui avatar profil Anda...', '☁️', 'info');
        try {
            const res = await apiRequest('/settings/profile', 'POST', {
                id: currentUser.id,
                avatar: selectedProfileEmoji
            });
            if (res.success) {
                currentUser.avatar = selectedProfileEmoji;
                localStorage.setItem('huma_farm_current_user', JSON.stringify(currentUser));
                await fetchCloudData();
                
                updateRoleVisibility();
                showNotificationModal(
                    'Logo Profil Diperbarui!',
                    `Logo profil akun Anda berhasil diperbarui ke <strong>${selectedProfileEmoji}</strong>.`,
                    '🎨',
                    'success'
                );
            }
        } catch (err) {
            console.error('API update avatar error:', err);
            showNotificationModal('Gagal Memperbarui', 'Gagal menyimpan perubahan avatar profil ke server.', '❌', 'error');
        }
    }
}

// UPLOAD FILE GAMBAR QRIS KE SUPABASE STORAGE
async function handleQrisFileSelect(input) {
    const statusEl = document.getElementById('upload-qris-status');
    const previewEl = document.getElementById('qris-preview-settings');
    
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (statusEl) { 
        statusEl.textContent = 'File Dipilih (Belum Disimpan)'; 
        statusEl.style.color = 'var(--ranch-amber)'; 
    }

    // Show preview immediately using FileReader
    const reader = new FileReader();
    reader.onload = function(e) {
        if (previewEl) previewEl.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function handleUpdateQrisSubmit(e) {
    e.preventDefault();
    const qrisUrl = document.getElementById('setting-qris-url').value.trim();
    const merchantInput = document.getElementById('setting-qris-merchant');
    const merchantName = merchantInput ? merchantInput.value.trim() : 'Huma Farm';
    const fileInput = document.getElementById('setting-qris-file');

    const formData = new FormData();
    formData.append('qris_merchant', merchantName);
    if (fileInput && fileInput.files.length > 0) {
        formData.append('qris_image', fileInput.files[0]);
    } else {
        formData.append('qris_url', qrisUrl);
    }

    showNotificationModal('Sedang Menyimpan...', 'Mengunggah QRIS ke server...', '☁️', 'info');

    try {
        const response = await fetch('/api/settings/qris', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        });
        const res = await response.json();
        if (!response.ok) throw new Error(res.message || 'Gagal menyimpan QRIS.');

        await fetchCloudData();
        
        const statusEl = document.getElementById('upload-qris-status');
        if (statusEl) {
            statusEl.textContent = 'Tersimpan';
            statusEl.style.color = 'var(--ranch-green)';
        }

        showNotificationModal('QRIS Diperbarui!', `Gambar QRIS dan nama merchant berhasil diperbarui.`, '📱', 'success');
    } catch(err) {
        console.error('API QRIS Submit Error:', err);
        showNotificationModal('Gagal Memperbarui', 'Gagal menyimpan pengaturan QRIS ke server.', '❌', 'error');
    }
}

async function handleUpdatePhoneSubmit(e) {
    e.preventDefault();
    // Fixed: HTML uses 'set-new-phone', not 'set-phone-input'
    const newPhone = document.getElementById('set-new-phone').value.trim();
    const confirmPass = document.getElementById('set-confirm-curr-pass').value.trim();

    if (!newPhone) return;

    if (!confirmPass) {
        return showNotificationModal(
            'Password Konfirmasi Wajib',
            'Sistem perlu verifikasi password Anda untuk merubah nomor WhatsApp.',
            '⚠️',
            'error'
        );
    }

    if (!currentUser) {
        return showNotificationModal('Tidak Login', 'Anda harus login terlebih dahulu untuk mengubah nomor WA.', '⚠️', 'error');
    }

    const submitBtn = e.target.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        await apiRequest('/settings/profile', 'POST', {
            id: currentUser.id,
            phone: newPhone,
            old_password: confirmPass
        });
        
        currentUser.phone = newPhone;
        localStorage.setItem('huma_farm_current_user', JSON.stringify(currentUser));
        await fetchCloudData();

        document.getElementById('set-new-phone').value = '';
        document.getElementById('set-confirm-curr-pass').value = '';
        showNotificationModal(
            'Nomor WA Diperbarui!',
            `Nomor WhatsApp akun Anda berhasil diperbarui ke <strong>${newPhone}</strong>.`,
            '📱',
            'success'
        );
    } catch (err) {
        console.error('API update phone error:', err);
        showNotificationModal('Gagal Memperbarui', err.message || 'Gagal memperbarui nomor WhatsApp.', '❌', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    // Fixed: HTML uses chg-old-pass / chg-new-pass / chg-confirm-pass
    const oldPass = document.getElementById('chg-old-pass').value.trim();
    const newPass = document.getElementById('chg-new-pass').value.trim();
    const confirmPass = document.getElementById('chg-confirm-pass').value.trim();

    if (!oldPass || !newPass || !confirmPass) {
        return showNotificationModal('Form Belum Lengkap', 'Semua kolom password wajib diisi!', '⚠️', 'error');
    }

    if (newPass !== confirmPass) {
        return showNotificationModal(
            'Konfirmasi Gagal',
            'Password baru dan konfirmasi tidak cocok!',
            '⚠️',
            'error'
        );
    }

    const submitBtn = e.target.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    const clearFields = () => {
        document.getElementById('chg-old-pass').value = '';
        document.getElementById('chg-new-pass').value = '';
        document.getElementById('chg-confirm-pass').value = '';
    };

    if (currentRole === 'admin') {
        // Admin: verify via API instead of hardcoded passwords
        try {
            await apiRequest('/settings/profile', 'POST', {
                id: currentUser ? currentUser.id : 1,
                old_password: oldPass,
                password: newPass
            });
            clearFields();
            showNotificationModal('Password Diperbarui!', 'Password admin berhasil diperbarui.', '🔑', 'success');
        } catch (err) {
            showNotificationModal('Password Lama Salah', err.message || 'Password lama yang Anda masukkan salah!', '🔑', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    } else if (currentUser) {
        try {
            await apiRequest('/settings/profile', 'POST', {
                id: currentUser.id,
                old_password: oldPass,
                password: newPass
            });
            await fetchCloudData();
            clearFields();
            showNotificationModal('Password Diperbarui!', 'Password akun Anda berhasil diperbarui di server.', '🔑', 'success');
        } catch (err) {
            console.error('API update password error:', err);
            showNotificationModal('Gagal Memperbarui', err.message || 'Gagal memperbarui password.', '❌', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    } else {
        setButtonLoading(submitBtn, false);
    }
}

// ----------------------------------------------------
// PANEN/PENGURANGAN MODAL ENGINE (ADMIN) & SUPABASE SYNC
// ----------------------------------------------------
function toggleCustomReasonInput() {
    const selectEl = document.getElementById('input-panen-reason');
    const customInput = document.getElementById('input-panen-reason-custom');
    if (!selectEl || !customInput) return;

    if (selectEl.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
}

function switchPanenInputTab(mode) {
    currentPanenMode = mode;
    const tabAdd = document.getElementById('tab-panen-add');
    const tabSub = document.getElementById('tab-panen-sub');

    const titleEl = document.getElementById('modal-panen-title');
    const subtitleEl = document.getElementById('modal-panen-subtitle');
    const reasonContainer = document.getElementById('row-reason-container');
    const submitBtn = document.getElementById('btn-panen-submit');

    if (mode === 'sub') {
        if (tabAdd) tabAdd.className = 'btn btn-outline';
        if (tabSub) tabSub.className = 'btn btn-ranch';

        if (titleEl) titleEl.innerHTML = '<span>➖ Kurangi Stok Telur</span>';
        if (subtitleEl) subtitleEl.textContent = 'Masukkan jumlah telur yang dimakan sendiri, disedekahkan, atau rusak.';
        if (reasonContainer) reasonContainer.style.display = 'block';
        toggleCustomReasonInput();

        if (submitBtn) {
            submitBtn.textContent = editingRecordId ? 'Simpan Perubahan' : 'Simpan Pengurangan';
            submitBtn.className = 'btn btn-rose';
        }
    } else {
        if (tabAdd) tabAdd.className = 'btn btn-ranch';
        if (tabSub) tabSub.className = 'btn btn-outline';

        if (titleEl) titleEl.innerHTML = '<span>🧺 Input Hasil Panen Telur</span>';
        if (subtitleEl) subtitleEl.textContent = 'Masukkan jumlah butir panen hari ini untuk menambah stok.';
        if (reasonContainer) reasonContainer.style.display = 'none';
        if (submitBtn) {
            submitBtn.textContent = editingRecordId ? 'Simpan Perubahan' : 'Input Panen';
            submitBtn.className = 'btn btn-ranch';
        }
    }
}

function openInputPanenModal(mode = 'add', editId = null) {
    const modal = document.getElementById('modal-input-panen');
    if (!modal) return;

    editingRecordId = editId;

    if (editId) {
        let panenHistory = JSON.parse(localStorage.getItem('huma_farm_panen_history') || '[]');
        const rec = panenHistory.find(item => item.id === editId);
        if (rec) {
            document.getElementById('input-panen-negeri').value = rec.negeri || 0;
            document.getElementById('input-panen-kampung').value = rec.kampung || 0;
            document.getElementById('input-panen-date').value = rec.date;

            const selectEl = document.getElementById('input-panen-reason');
            const customInput = document.getElementById('input-panen-reason-custom');

            if (rec.reason) {
                const templateValues = ['Dimakan Sendiri', 'Sedekah / Hadiah', 'Telur Pecah / Rusak'];
                if (templateValues.includes(rec.reason)) {
                    if (selectEl) selectEl.value = rec.reason;
                    if (customInput) {
                        customInput.value = '';
                        customInput.style.display = 'none';
                    }
                } else {
                    if (selectEl) selectEl.value = 'custom';
                    if (customInput) {
                        customInput.value = rec.reason;
                        customInput.style.display = 'block';
                    }
                }
            }

            switchPanenInputTab(rec.type || 'add');
        }
    } else {
        document.getElementById('input-panen-negeri').value = '0';
        document.getElementById('input-panen-kampung').value = '0';
        document.getElementById('input-panen-reason-custom').value = '';

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        document.getElementById('input-panen-date').value = `${yyyy}-${mm}-${dd}`;

        switchPanenInputTab(mode);
    }

    modal.classList.add('active');
}

function closeInputPanenModal() {
    const modal = document.getElementById('modal-input-panen');
    if (modal) modal.classList.remove('active');

    editingRecordId = null;
}

function changePanenQty(type, delta) {
    const inputEl = document.getElementById(`input-panen-${type}`);
    if (!inputEl) return;
    let currentVal = parseInt(inputEl.value, 10) || 0;
    currentVal += delta;
    if (currentVal < 0) currentVal = 0;
    inputEl.value = currentVal;
}

async function handleInputPanenSubmit(e) {
    e.preventDefault();

    const negeriQty = parseInt(document.getElementById('panen-negeri').value, 10) || 0;
    const kampungQty = parseInt(document.getElementById('panen-kampung').value, 10) || 0;
    const dateVal = document.getElementById('panen-date').value;
    const reasonVal = document.getElementById('panen-reason').value.trim();

    if (negeriQty < 0 || kampungQty < 0) {
        return showNotificationModal('Jumlah Telur Salah', 'Jumlah telur tidak boleh bernilai negatif!', '⚠️', 'error');
    }
    if (negeriQty === 0 && kampungQty === 0) {
        return showNotificationModal('Data Kosong', 'Jumlah telur Negeri atau Kampung wajib diisi!', '⚠️', 'error');
    }
    if (!dateVal) {
        return showNotificationModal('Tanggal Wajib', 'Tanggal pencatatan wajib diisi!', '⚠️', 'error');
    }

    const finalReason = currentPanenMode === 'add' 
        ? (reasonVal || 'Hasil panen harian peternakan') 
        : (reasonVal || 'Pengurangan konsumsi/sedekah');

    showNotificationModal('Sedang Menyimpan...', 'Mengunggah catatan panen ke server...', '☁️', 'info');

    try {
        await apiRequest('/panen', 'POST', {
            id: editingRecordId,
            type: currentPanenMode,
            negeri: negeriQty,
            kampung: kampungQty,
            date: dateVal,
            reason: finalReason
        });
        await fetchCloudData();
        closeInputPanenModal();
        showNotificationModal(
            'Catatan Disimpan!',
            `Catatan panen/pengurangan telur berhasil disimpan.`,
            '🟢',
            'success'
        );
    } catch (err) {
        console.error('API panen submit error:', err);
        showNotificationModal('Gagal Menyimpan', 'Gagal menyinkronkan data panen ke server.', '❌', 'error');
    }
}

// EDIT RECORD
function editPanenRecord(id) {
    openInputPanenModal('add', id);
}

// DELETE RECORD CONFIRMATION
function deletePanenRecord(id) {
    deletingRecordId = id;
    const modal = document.getElementById('modal-delete-confirm');
    if (modal) modal.classList.add('active');
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('modal-delete-confirm');
    if (modal) modal.classList.remove('active');
    deletingRecordId = null;
}

async function executeDeletePanenRecord() {
    if (!deletingRecordId) return;

    showNotificationModal('Sedang Menghapus...', 'Menghapus catatan panen di server...', '☁️', 'info');
    try {
        await apiRequest(`/panen/${deletingRecordId}`, 'DELETE');
        await fetchCloudData();
        closeDeleteConfirmModal();
        showNotificationModal(
            'Catatan Dihapus',
            'Catatan panen/pengurangan berhasil dihapus.',
            '🗑️',
            'info'
        );
    } catch (err) {
        console.error('API delete panen error:', err);
        showNotificationModal('Gagal Menghapus', 'Gagal menghapus data dari server.', '❌', 'error');
    }
}

function formatIndonesianDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parseInt(parts[2], 10);
    return day + ' ' + month + ' ' + year;
}

// ----------------------------------------------------
// UNIFIED AUTHENTICATION ENGINE
// ----------------------------------------------------
function handleLogoutClick() {
    const modal = document.getElementById('modal-logout-confirm');
    if (modal) modal.classList.add('active');
}

function closeLogoutConfirmModal() {
    const modal = document.getElementById('modal-logout-confirm');
    if (modal) modal.classList.remove('active');
}

function confirmLogoutAction() {
    closeLogoutConfirmModal();
    currentRole = 'visitor';
    currentUser = null;
    // Clear admin token so session is fully invalidated
    adminToken = null;
    localStorage.removeItem('huma_farm_admin_token');
    localStorage.setItem('huma_farm_role', 'visitor');
    localStorage.removeItem('huma_farm_current_user');
    updateRoleVisibility();
    showCenterWelcome();
}

function openUnifiedAuthModal(tab) {
    const modal = document.getElementById('modal-unified-auth');
    if (modal) {
        const loginIdent = document.getElementById('login-identifier');
        const loginPass = document.getElementById('login-pass');
        const regName = document.getElementById('user-reg-name');
        const regPhone = document.getElementById('user-reg-phone');
        const regPass = document.getElementById('user-reg-pass');
        const regConfirm = document.getElementById('user-reg-confirm-pass');

        if (loginIdent) loginIdent.value = '';
        if (loginPass) loginPass.value = '';
        if (regName) regName.value = '';
        if (regPhone) regPhone.value = '';
        if (regPass) regPass.value = '';
        if (regConfirm) regConfirm.value = '';

        modal.classList.add('active');
        switchUnifiedAuthTab(tab || 'login');
    }
}

function closeUnifiedAuthModal() {
    const modal = document.getElementById('modal-unified-auth');
    if (modal) modal.classList.remove('active');
}

function switchUnifiedAuthTab(tab) {
    const loginForm = document.getElementById('form-unified-login');
    const regForm = document.getElementById('form-unified-register');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabReg = document.getElementById('tab-btn-register');

    if (tab === 'register') {
        if (loginForm) loginForm.style.display = 'none';
        if (regForm) {
            regForm.style.display = 'block';
            regForm.classList.remove('tab-form-container');
            void regForm.offsetWidth;
            regForm.classList.add('tab-form-container');
        }
        if (tabLogin) tabLogin.className = 'btn btn-outline';
        if (tabReg) tabReg.className = 'btn btn-ranch';
    } else {
        if (loginForm) {
            loginForm.style.display = 'block';
            loginForm.classList.remove('tab-form-container');
            void loginForm.offsetWidth;
            loginForm.classList.add('tab-form-container');
        }
        if (regForm) regForm.style.display = 'none';
        if (tabLogin) tabLogin.className = 'btn btn-ranch';
        if (tabReg) tabReg.className = 'btn btn-outline';
    }
}

// UNIFIED LOGIN SUBMIT
async function handleUnifiedLoginSubmit(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    // 1. Admin login — always goes through API to get a secure token
    if (identifier.toLowerCase() === 'admin') {
        const submitBtn = e.target.querySelector('[type="submit"]');
        setButtonLoading(submitBtn, true);
        try {
            const res = await apiRequest('/login', 'POST', { username: identifier, password: pass });
            if (res.success && res.role === 'admin') {
                // Store token globally and in localStorage
                adminToken = res.token;
                localStorage.setItem('huma_farm_admin_token', res.token);

                currentRole = 'admin';
                currentUser = null;
                localStorage.setItem('huma_farm_role', 'admin');
                localStorage.removeItem('huma_farm_current_user');

                closeUnifiedAuthModal();
                document.getElementById('login-identifier').value = '';
                document.getElementById('login-pass').value = '';

                await fetchCloudData();
                updateRoleVisibility();
                showCenterWelcome();
            }
        } catch (err) {
            showNotificationModal('Password Salah', err.message || 'Password admin yang Anda masukkan salah!', '🔑', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
        return;
    }

    // 2. Check Registered Users via Laravel API
    showNotificationModal('Sedang Masuk...', 'Menghubungkan ke server farm...', '☁️', 'info');
    try {
        const res = await apiRequest('/login', 'POST', {
            username: identifier,
            password: pass
        });
        if (res.success) {
            currentRole = 'user';
            currentUser = res.user;
            localStorage.setItem('huma_farm_role', 'user');
            localStorage.setItem('huma_farm_current_user', JSON.stringify(res.user));

            await fetchCloudData();

            closeUnifiedAuthModal();
            document.getElementById('login-identifier').value = '';
            document.getElementById('login-pass').value = '';

            updateRoleVisibility();
            showCenterWelcome();
            
            showNotificationModal('Selamat Datang Kembali!', `Halo ${res.user.name}, berhasil masuk ke Huma Farm.`, '🎉', 'success');
        }
    } catch (err) {
        console.error('API login error:', err);
        showNotificationModal('Gagal Masuk', err.message || 'Username/Password salah.', '❌', 'error');
    }
}

// USER REGISTER SUBMIT WITH SUPABASE SYNC
async function handleUserRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('user-reg-name').value.trim();
    const phone = document.getElementById('user-reg-phone').value.trim();
    const pass = document.getElementById('user-reg-pass').value.trim();
    const confirmPass = document.getElementById('user-reg-confirm-pass').value.trim();

    if (!name || !phone || !pass || !confirmPass) {
        return showNotificationModal(
            'Form Belum Lengkap',
            'Mohon lengkapi seluruh kolom pendaftaran!',
            '⚠️',
            'error'
        );
    }

    if (name.includes(' ') || name.split(/\s+/).length > 1) {
        return showNotificationModal(
            'Aturan Nama Panggil',
            '⚠️ Nama Panggil hanya boleh 1 kata saja (tanpa spasi).<br><br>Contoh: <strong>Budi</strong>, <strong>Agus</strong>, atau <strong>Siti</strong>.',
            '⚠️',
            'error'
        );
    }

    if (pass !== confirmPass) {
        return showNotificationModal(
            'Konfirmasi Password Gagal',
            'Konfirmasi password tidak cocok dengan password baru Anda!',
            '⚠️',
            'error'
        );
    }

    showNotificationModal('Pendaftaran...', 'Mendaftarkan akun Anda di server...', '☁️', 'info');
    try {
        const res = await apiRequest('/register', 'POST', {
            name,
            phone,
            password: pass,
            avatar: '👤'
        });
        if (res.success) {
            currentRole = 'user';
            currentUser = res.user;
            localStorage.setItem('huma_farm_role', 'user');
            localStorage.setItem('huma_farm_current_user', JSON.stringify(res.user));

            await fetchCloudData();

            closeUnifiedAuthModal();
            updateRoleVisibility();
            showCenterWelcome();
            
            showNotificationModal('Pendaftaran Sukses', `Selamat bergabung ${name}! Anda sudah masuk ke sistem Huma Farm.`, '🎉', 'success');
        }
    } catch (err) {
        console.error('API register error:', err);
        return showNotificationModal('Gagal Mendaftar', err.message || 'Gagal membuat akun. Silakan coba lagi.', '❌', 'error');
    }
}

// FORGOT & RESET PASSWORD MODALS
function openForgotPasswordModal() {
    closeUnifiedAuthModal();
    const modal = document.getElementById('modal-forgot-password');
    if (modal) {
        const nameInput = document.getElementById('forgot-name');
        const phoneInput = document.getElementById('forgot-phone');
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        modal.classList.add('active');
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('modal-forgot-password');
    if (modal) modal.classList.remove('active');
}

function handleVerifyPhoneSubmit(e) {
    e.preventDefault();
    const inputName = document.getElementById('forgot-name').value.trim();
    const inputPhone = document.getElementById('forgot-phone').value.trim();

    if (!inputName || !inputPhone) {
        return showNotificationModal(
            'Form Belum Lengkap',
            'Mohon isi Nama Panggil terdaftar dan Nomor WA terdaftar!',
            '⚠️',
            'error'
        );
    }

    let registeredUsers = JSON.parse(localStorage.getItem('huma_farm_registered_users') || '[]');
    const user = registeredUsers.find(u => 
        u.name.toLowerCase() === inputName.toLowerCase() && u.phone === inputPhone
    );

    if (user) {
        pendingResetIdentifier = user.phone;
        closeForgotPasswordModal();

        const modalReset = document.getElementById('modal-reset-password');
        if (modalReset) {
            const rNew = document.getElementById('reset-new-pass');
            const rConf = document.getElementById('reset-confirm-pass');
            if (rNew) rNew.value = '';
            if (rConf) rConf.value = '';
            modalReset.classList.add('active');
        }
    } else {
        showNotificationModal(
            'Verifikasi Akun Gagal',
            'Kombinasi <strong>Nama Panggil</strong> dan <strong>Nomor WhatsApp</strong> tidak cocok atau tidak terdaftar di sistem Huma Farm!',
            '❓',
            'error'
        );
    }
}

function closeResetPasswordModal() {
    const modal = document.getElementById('modal-reset-password');
    if (modal) modal.classList.remove('active');
    pendingResetIdentifier = null;
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    const pass = document.getElementById('reset-new-pass').value;
    const confirmPass = document.getElementById('reset-confirm-pass').value;

    if (pass !== confirmPass) {
        return showNotificationModal(
            'Konfirmasi Gagal',
            'Password baru dan konfirmasi tidak cocok!',
            '⚠️',
            'error'
        );
    }

    if (!pendingResetIdentifier) return;

    showNotificationModal('Sedang Mereset...', 'Mereset password akun Anda...', '☁️', 'info');

    try {
        await apiRequest('/reset-password', 'POST', {
            phone: pendingResetIdentifier,
            password: pass
        });
        await fetchCloudData();

        closeResetPasswordModal();
        showNotificationModal(
            'Password Berhasil Direset!',
            'Password akun Anda telah berhasil diperbarui! Silakan Login kembali.',
            '🎉',
            'success'
        );
        openUnifiedAuthModal('login');
    } catch (err) {
        console.error('API reset password error:', err);
        showNotificationModal('Gagal Mereset', err.message || 'Gagal memperbarui password di server.', '❌', 'error');
    }
}

// ============================================================
// MODULE: DOMPET & KEUANGAN (WALLET & EXPENSES ENGINE)
// ============================================================

function renderKeuanganData() {
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const expenses = JSON.parse(localStorage.getItem('huma_farm_expenses') || '[]');

    // Calculate total income from completed/lunas orders
    let totalIncome = 0;
    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            totalIncome += (o.totalPrice || 0);
        }
    });

    // Calculate total expenses
    let totalExpense = 0;
    expenses.forEach(e => {
        totalExpense += (e.amount || 0);
    });

    const netBalance = totalIncome - totalExpense;

    // Render Summary Cards
    const balEl = document.getElementById('wallet-total-balance');
    const incEl = document.getElementById('wallet-total-income');
    const expEl = document.getElementById('wallet-total-expense');

    if (balEl) balEl.textContent = 'Rp ' + netBalance.toLocaleString('id-ID');
    if (incEl) incEl.textContent = 'Rp ' + totalIncome.toLocaleString('id-ID');
    if (expEl) expEl.textContent = 'Rp ' + totalExpense.toLocaleString('id-ID');

    // Also update Dashboard KPI Cards if Admin
    const kpiInc = document.getElementById('kpi-income-val');
    const kpiExp = document.getElementById('kpi-expense-val');
    const kpiBal = document.getElementById('kpi-balance-val');
    if (kpiInc) kpiInc.textContent = 'Rp ' + totalIncome.toLocaleString('id-ID');
    if (kpiExp) kpiExp.textContent = 'Rp ' + totalExpense.toLocaleString('id-ID');
    if (kpiBal) kpiBal.textContent = 'Rp ' + netBalance.toLocaleString('id-ID');

    // Render Transactions History (Combined Pemasukan & Pengeluaran)
    const container = document.getElementById('wallet-transaction-list');
    if (!container) return;

    let mutasiList = [];
    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            mutasiList.push({
                id: o.id,
                type: 'income',
                category: `Penjualan Toko (${o.buyerName || 'Pembeli'})`,
                amount: o.totalPrice,
                note: `${o.qty} ${o.unit === 'pack' ? 'Pack' : 'Butir'} ${o.category === 'negeri' ? 'Telur Negeri' : 'Telur Kampung'}`,
                date: o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
            });
        }
    });

    expenses.forEach(e => {
        mutasiList.push({
            id: e.id,
            type: 'expense',
            category: e.category || 'Pengeluaran Kas',
            amount: e.amount,
            note: e.note || '-',
            date: e.date
        });
    });

    mutasiList.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (mutasiList.length === 0) {
        container.innerHTML = `
            <div class="card-placeholder" style="margin-top: 6px;">
                <span class="placeholder-icon">💳</span>
                <p>Belum ada riwayat mutasi kas uang masuk atau pengeluaran.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = mutasiList.map(item => {
        const isIncome = item.type === 'income';
        const icon = isIncome ? '📥' : '📤';
        const colorClass = isIncome ? 'text-green' : 'text-rose';
        const prefix = isIncome ? '+ Rp ' : '- Rp ';

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem; width: 30px; height: 30px; background: var(--bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">${icon}</span>
                    <div>
                        <strong style="font-size: 0.8rem; color: var(--text-main); display: block;">${item.category}</strong>
                        <span style="font-size: 0.68rem; color: var(--text-muted);">${item.note} • 📅 ${formatIndonesianDate(item.date)}</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <strong style="font-size: 0.88rem;" class="${colorClass}">${prefix}${item.amount.toLocaleString('id-ID')}</strong>
                    ${!isIncome ? `<button class="btn btn-rose" style="font-size: 0.62rem; padding: 1px 6px; min-height: 20px; margin-top: 2px;" onclick="deleteExpenseRecord('${item.id}')">Hapus</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function openInputPengeluaranModal() {
    const modal = document.getElementById('modal-input-pengeluaran');
    if (!modal) return;
    const amt = document.getElementById('expense-amount');
    const note = document.getElementById('expense-note');
    const dt = document.getElementById('expense-date');
    if (amt) amt.value = '';
    if (note) note.value = '';
    if (dt) dt.value = new Date().toISOString().split('T')[0];
    modal.classList.add('active');
}

function closeInputPengeluaranModal() {
    const modal = document.getElementById('modal-input-pengeluaran');
    if (modal) modal.classList.remove('active');
}

async function handleInputPengeluaranSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('expense-category').value;
    const amount = parseInt(document.getElementById('expense-amount').value, 10) || 0;
    const note = document.getElementById('expense-note').value.trim();
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];

    if (amount <= 0) return;

    showNotificationModal('Sedang Menyimpan...', 'Mengunggah data pengeluaran ke server...', '☁️', 'info');
    try {
        await apiRequest('/expenses', 'POST', {
            category,
            amount,
            note,
            date
        });
        await fetchCloudData();
        closeInputPengeluaranModal();
        showNotificationModal(
            'Pengeluaran Disimpan!',
            `Pengeluaran kas sebesar <strong>Rp ${amount.toLocaleString('id-ID')}</strong> (${category}) telah dicatat ke kas dompet.`,
            '💸',
            'success'
        );
    } catch (err) {
        console.error('API insert expense error:', err);
        showNotificationModal('Gagal Menyimpan', 'Gagal menyinkronkan data pengeluaran ke server.', '❌', 'error');
    }
}

async function deleteExpenseRecord(id) {
    showNotificationModal('Sedang Menghapus...', 'Menghapus pengeluaran di server...', '☁️', 'info');
    try {
        await apiRequest(`/expenses/${id}`, 'DELETE');
        await fetchCloudData();
        showNotificationModal(
            'Catatan Dihapus',
            'Catatan pengeluaran berhasil dihapus.',
            '🗑️',
            'info'
        );
    } catch (err) {
        console.error('API delete expense error:', err);
        showNotificationModal('Gagal Menghapus', 'Gagal menghapus data dari server.', '❌', 'error');
    }
}

// ============================================================
// MODULE: DASHBOARD ANALYTICS & CHART.JS ENGINE
// ============================================================

let chartWeeklyInstance = null;
let chartMonthlyInstance = null;
let chartAllocationInstance = null;

function updateDashboardData() {
    const panenHistory = JSON.parse(localStorage.getItem('huma_farm_panen_history') || '[]');
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const registeredUsers = JSON.parse(localStorage.getItem('huma_farm_registered_users') || '[]');

    // Calculate Harvest Totals
    let totalHarvest = 0;
    let totalSedekah = 0;

    panenHistory.forEach(item => {
        const n = item.negeri || 0;
        const k = item.kampung || 0;
        if (item.type === 'sub') {
            totalSedekah += (n + k);
        } else {
            totalHarvest += (n + k);
        }
    });

    // Calculate Sales Totals
    let totalSoldEggs = 0;
    let totalSoldPack = 0;
    let totalSoldEcer = 0;

    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            totalSoldEggs += (o.totalEggs || 0);
            if (o.unit === 'pack') totalSoldPack += (o.qty || 0);
            else totalSoldEcer += (o.qty || 0);
        }
    });

    // Update KPI Cards UI
    const harvestVal = document.getElementById('kpi-harvest-val');
    const soldVal = document.getElementById('kpi-sold-val');
    const soldSub = document.getElementById('kpi-sold-sub');
    const sedekahVal = document.getElementById('kpi-sedekah-val');
    const custVal = document.getElementById('kpi-customers-val');

    if (harvestVal) harvestVal.textContent = `${totalHarvest} Butir`;
    if (soldVal) soldVal.textContent = `${totalSoldEggs} Butir`;
    if (soldSub) soldSub.textContent = `${totalSoldPack} Pack + ${totalSoldEcer} Ecer`;
    if (sedekahVal) sedekahVal.textContent = `${totalSedekah} Butir`;
    if (custVal) custVal.textContent = `${registeredUsers.length} Pembeli`;

    // Render Keuangan Data (Updates Financial KPIs)
    renderKeuanganData();

    // Render Charts
    initDashboardCharts(panenHistory, orders);
}

function initDashboardCharts(panenHistory, orders) {
    if (typeof Chart === 'undefined') return;

    // --- CHART 1: 7-DAY HARVEST VS SALES LINE CHART ---
    const ctxWeekly = document.getElementById('chartWeeklyHarvestSales');
    if (ctxWeekly) {
        const labels = [];
        const harvestData = [0, 0, 0, 0, 0, 0, 0];
        const salesData = [0, 0, 0, 0, 0, 0, 0];

        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));

            panenHistory.filter(p => p.type !== 'sub' && (p.date === dateStr || p.createdAt?.startsWith(dateStr)))
                .forEach(p => { harvestData[6 - i] += ((p.negeri || 0) + (p.kampung || 0)); });

            orders.filter(o => o.paymentStatus === 'Lunas' && o.createdAt?.startsWith(dateStr))
                .forEach(o => { salesData[6 - i] += (o.totalEggs || 0); });
        }

        if (chartWeeklyInstance) chartWeeklyInstance.destroy();
        chartWeeklyInstance = new Chart(ctxWeekly, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Panen (Butir)',
                        data: harvestData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        fill: true,
                        tension: 0.35
                    },
                    {
                        label: 'Terjual (Butir)',
                        data: salesData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        fill: true,
                        tension: 0.35
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#d1d5db', font: { size: 11 } } } },
                scales: {
                    x: { ticks: { color: '#9ca3af', font: { size: 10 } } },
                    y: { ticks: { color: '#9ca3af', font: { size: 10 } }, beginAtZero: true }
                }
            }
        });
    }

    // --- CHART 2: MONTHLY PRODUCTION BAR CHART (NEGERI VS KAMPUNG) ---
    const ctxMonthly = document.getElementById('chartMonthlyProduction');
    if (ctxMonthly) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const negeriMonthly = new Array(12).fill(0);
        const kampungMonthly = new Array(12).fill(0);

        panenHistory.filter(p => p.type !== 'sub').forEach(p => {
            const dateObj = new Date(p.createdAt || p.date);
            const monthIdx = dateObj.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
                negeriMonthly[monthIdx] += (p.negeri || 0);
                kampungMonthly[monthIdx] += (p.kampung || 0);
            }
        });

        if (chartMonthlyInstance) chartMonthlyInstance.destroy();
        chartMonthlyInstance = new Chart(ctxMonthly, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: 'Telur Negeri',
                        data: negeriMonthly,
                        backgroundColor: '#b06530'
                    },
                    {
                        label: 'Telur Kampung',
                        data: kampungMonthly,
                        backgroundColor: '#10b981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#d1d5db', font: { size: 11 } } } },
                scales: {
                    x: { ticks: { color: '#9ca3af', font: { size: 10 } } },
                    y: { ticks: { color: '#9ca3af', font: { size: 10 } }, beginAtZero: true }
                }
            }
        });
    }

    // --- CHART 3: ALLOCATION DISTRIBUTION DOUGHNUT CHART ---
    const ctxAllocation = document.getElementById('chartAllocationDistribution');
    if (ctxAllocation) {
        let totalSold = 0;
        orders.filter(o => o.paymentStatus === 'Lunas').forEach(o => totalSold += (o.totalEggs || 0));

        let totalConsumsi = 0;
        let totalBroken = 0;
        panenHistory.filter(p => p.type === 'sub').forEach(p => {
            const qty = (p.negeri || 0) + (p.kampung || 0);
            if (p.reason && p.reason.toLowerCase().includes('pecah')) totalBroken += qty;
            else totalConsumsi += qty;
        });

        if (chartAllocationInstance) chartAllocationInstance.destroy();
        chartAllocationInstance = new Chart(ctxAllocation, {
            type: 'doughnut',
            data: {
                labels: ['Terjual (Toko)', 'Dimakan / Sedekah', 'Pecah / Rusak'],
                datasets: [{
                    data: [totalSold, totalConsumsi, totalBroken],
                    backgroundColor: ['#10b981', '#f59e0b', '#be123c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#d1d5db', font: { size: 10 } } } }
            }
        });
    }
}

// ============================================================
// MODULE: LEADERBOARD RANKING ENGINE
// ============================================================

function renderLeaderboardData() {
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const registeredUsers = JSON.parse(localStorage.getItem('huma_farm_registered_users') || '[]');
    const container = document.getElementById('leaderboard-ranking-list');
    if (!container) return;

    // Accumulate totals per unique buyer (Name + Last 4 WA Digits key)
    const userTotals = {};

    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            const rawName = (o.buyerName || 'Pembeli').trim();
            const phone = (o.buyerPhone || '').replace(/\D/g, '');
            const last4 = phone.length >= 4 ? phone.slice(-4) : '0000';
            const groupKey = `${rawName.toLowerCase()}_${last4}`;

            if (!userTotals[groupKey]) {
                userTotals[groupKey] = {
                    name: rawName,
                    last4: last4,
                    totalEggs: 0,
                    totalSpent: 0,
                    orderCount: 0
                };
            }
            userTotals[groupKey].totalEggs += (o.totalEggs || 0);
            userTotals[groupKey].totalSpent += (o.totalPrice || 0);
            userTotals[groupKey].orderCount += 1;
        }
    });

    const rankings = Object.keys(userTotals).map(key => {
        const item = userTotals[key];
        const uObj = registeredUsers.find(u => u.name && u.name.toLowerCase() === item.name.toLowerCase());
        return {
            name: item.name,
            last4: item.last4,
            avatar: uObj ? (uObj.avatar || '👤') : '👤',
            totalEggs: item.totalEggs,
            totalSpent: item.totalSpent,
            orderCount: item.orderCount
        };
    }).sort((a, b) => {
        // 1. Prioritas utama: Jumlah Butir (kombinasi pack + eceran)
        if (b.totalEggs !== a.totalEggs) {
            return b.totalEggs - a.totalEggs;
        }
        // 2. Prioritas kedua: Total nominal belanja (spending)
        if (b.totalSpent !== a.totalSpent) {
            return b.totalSpent - a.totalSpent;
        }
        // 3. Prioritas ketiga: Jumlah transaksi
        return b.orderCount - a.orderCount;
    });

﻿    if (rankings.length === 0) {
        container.innerHTML = '<div class="card-placeholder"><span>trophy</span><p>Belum ada transaksi lunas untuk ditampilkan di leaderboard.</p></div>';
        return;
    }
    var lBadges = ['first','second','third'];
    var lLabels = ['Top 1','Top 2','Top 3'];
    container.innerHTML = rankings.map(function(item, idx) {
        var isTop3 = idx < 3;
        var bgS = isTop3 ? 'background: rgba(245,158,11,0.12); border: 1.5px solid rgba(245,158,11,0.3);' : 'background: var(--bg-card-subtle); border: 1px solid var(--border-color);';
        var be = lBadges[idx] || ('#' + (idx+1));
        var bl = lLabels[idx] || ('#' + (idx+1));
        var mn = currentRole === 'visitor' ? anonymizeBuyerName(item.name) : item.name;
        var dn = mn + ' (***' + item.last4 + ')';
        return '<div style="' + bgS + ' border-radius:10px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">'
            + '<div style="display:flex;align-items:center;gap:10px;min-width:0;">'
            + '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px;">'
            + '<span>' + be + '</span><span style="font-size:0.6rem;font-weight:800;color:var(--ranch-amber);">' + bl + '</span>'
            + '</div>'
            + '<span>' + item.avatar + '</span>'
            + '<div style="min-width:0;"><strong style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + dn + '</strong>'
            + '<span style="font-size:0.67rem;color:var(--text-muted);">' + item.orderCount + ' Transaksi Lunas</span></div></div>'
            + '<div style="text-align:right;flex-shrink:0;margin-left:6px;">'
            + '<strong style="color:var(--ranch-green);display:block;">' + item.totalEggs + ' Butir</strong>'
            + '<span style="font-size:0.67rem;color:var(--ranch-amber);font-weight:700;">Rp ' + item.totalSpent.toLocaleString('id-ID') + '</span>'
            + '</div></div>';
    }).join('');
}

async function handleUpdateBankSubmit(e) {
    e.preventDefault();
    var bankName = document.getElementById('setting-bank-name').value.trim();
    var bankNumber = document.getElementById('setting-bank-number').value.trim();
    var bankOwner = document.getElementById('setting-bank-owner').value.trim();
    if (!bankName || !bankNumber || !bankOwner) {
        return showNotificationModal('Lengkapi Data Bank', 'Nama bank, nomor rekening, dan atas nama wajib diisi.', 'warn', 'error');
    }
    var submitBtn = e.target.querySelector('[type=submit]');
    setButtonLoading(submitBtn, true);
    try {
        var res = await fetch('/api/settings/bank', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ bank_name: bankName, bank_number: bankNumber, bank_owner: bankOwner }) });
        if (!res.ok) throw new Error('Gagal menyimpan ke server.');
        localStorage.setItem('huma_farm_bank_name', bankName);
        localStorage.setItem('huma_farm_bank_number', bankNumber);
        localStorage.setItem('huma_farm_bank_owner', bankOwner);
        var b1 = document.getElementById('pay-bsi-number');
        var b2 = document.getElementById('pay-bsi-owner');
        var b3 = document.getElementById('pay-bsi-bank-name');
        if (b1) b1.textContent = bankNumber;
        if (b2) b2.textContent = bankOwner;
        if (b3) b3.textContent = bankName;
        showNotificationModal('Data Bank Disimpan!', 'Rekening ' + bankName + ' berhasil disimpan ke server.', 'bank', 'success');
    } catch (err) {
        showNotificationModal('Gagal Menyimpan', err.message || 'Gagal menyimpan data bank.', 'err', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

function editUserOrderRecord(orderId) {
    var orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    var order = orders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    document.getElementById('edit-order-id-hidden').value = orderId;
    var buyerInput = document.getElementById('edit-order-buyer');
    var phoneInput = document.getElementById('edit-order-phone');
    if (buyerInput) buyerInput.value = order.buyerName || '';
    if (phoneInput) phoneInput.value = order.buyerPhone || '';
    var productLabel = document.getElementById('edit-order-product-label');
    var qtyInput = document.getElementById('edit-order-qty');
    var catLbl = order.category === 'negeri' ? 'Telur Negeri' : 'Telur Kampung';
    var unitLbl = order.unit === 'pack' ? 'Pack (isi 10)' : 'Butir';
    if (productLabel) productLabel.textContent = catLbl + ' (' + unitLbl + ')';
    if (qtyInput) qtyInput.value = order.qty || 1;
    var timestampInput = document.getElementById('edit-order-timestamp');
    var timestampHint = document.getElementById('edit-timestamp-hint');
    var dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
    if (isNaN(dateObj.getTime())) dateObj = new Date();
    var tzoffset = dateObj.getTimezoneOffset() * 60000;
    var localISOTime = (new Date(dateObj - tzoffset)).toISOString().slice(0, 16);
    if (timestampInput) timestampInput.value = localISOTime;
    var statusSelect = document.getElementById('edit-order-payment-status');
    if (statusSelect) statusSelect.value = order.paymentStatus || 'Menunggu Konfirmasi';
    var statusRow = document.getElementById('edit-order-status-row');
    if (currentRole === 'admin') {
        if (buyerInput) { buyerInput.readOnly = false; buyerInput.style.opacity = '1'; }
        if (phoneInput) { phoneInput.readOnly = false; phoneInput.style.opacity = '1'; }
        if (timestampInput) { timestampInput.readOnly = false; timestampInput.style.opacity = '1'; }
        if (statusSelect) { statusSelect.disabled = false; }
        if (statusRow) statusRow.style.display = 'block';
        if (timestampHint) timestampHint.textContent = 'Admin bebas merubah tanggal dan waktu transaksi.';
    } else {
        if (buyerInput) { buyerInput.readOnly = true; buyerInput.style.opacity = '0.8'; }
        if (phoneInput) { phoneInput.readOnly = true; phoneInput.style.opacity = '0.8'; }
        if (timestampInput) { timestampInput.readOnly = true; timestampInput.style.opacity = '0.8'; }
        if (statusSelect) { statusSelect.disabled = true; }
        if (statusRow) statusRow.style.display = 'none';
        if (timestampHint) timestampHint.textContent = 'Waktu terkunci untuk hari ini.';
        var nowOffset = new Date().getTimezoneOffset() * 60000;
        var nowLocal = (new Date(new Date() - nowOffset)).toISOString().slice(0, 16);
        if (timestampInput) timestampInput.value = nowLocal;
    }
    var modal = document.getElementById('modal-edit-order');
    if (modal) modal.classList.add('active');
}

function closeEditOrderModal() {
    var modal = document.getElementById('modal-edit-order');
    if (modal) modal.classList.remove('active');
    qtyInput.value = curr;
}

async function handleSaveEditOrderSubmit(e) {
    e.preventDefault();
    const orderId = document.getElementById('edit-order-id-hidden').value;
    const buyerName = document.getElementById('edit-order-buyer').value.trim();
    const buyerPhone = document.getElementById('edit-order-phone').value.trim();
    const qty = parseInt(document.getElementById('edit-order-qty').value) || 1;
    const datetimeVal = document.getElementById('edit-order-timestamp').value;
    const paymentStatus = document.getElementById('edit-order-payment-status').value;

    showNotificationModal('Sedang Menyimpan...', 'Mengirim perubahan pesanan ke server...', '☁️', 'info');

    try {
        const payload = {
            buyer_name: buyerName,
            buyer_phone: buyerPhone || '',
            qty: qty
        };

        if (currentRole === 'admin') {
            payload.payment_status = paymentStatus;
            if (datetimeVal) {
                payload.created_at = new Date(datetimeVal).toISOString();
            }
        }

        await apiRequest(`/orders/${orderId}`, 'PUT', payload);
        await fetchCloudData();

        closeEditOrderModal();
        renderTokoOrdersData();
        renderLeaderboardData();
        updateDashboardData();

        showNotificationModal('Perubahan Disimpan!', `Pesanan ${orderId} berhasil diperbarui.`, '✏️', 'success');

    } catch (err) {
        console.error('API save edit order error:', err);
        showNotificationModal('Gagal Menyimpan', 'Gagal menyimpan perubahan pesanan ke server.', '❌', 'error');
    }
}
