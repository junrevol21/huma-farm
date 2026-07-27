/* ======================================================
   HUMA FARM - APP.JS
   Fixed Viewport Engine + Supabase Cloud Realtime Database Sync
   ====================================================== */

// LARAVEL API CONFIGURATION
const API_BASE = '/api';

/**
 * Normalize QRIS image URL to always be a relative path.
 * Prevents broken images when switching between local IP and public domain (e.g. belitelur.my.id).
 * - Absolute URL with same or different host  → extract pathname only (/uploads/qris/...)
 * - External QR generator API URL             → keep as-is (api.qrserver.com etc)
 * - Raw QRIS string (starts with 000201)      → keep as-is
 * - Already relative path                     → keep as-is
 */
function normalizeQrisImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('000201')) return url; // raw QRIS EMV string
    if (url.startsWith('data:')) return url;  // base64 image
    // External QR code generator APIs - keep as-is
    if (url.startsWith('https://api.qrserver.com') ||
        url.startsWith('https://chart.googleapis.com') ||
        url.startsWith('https://quickchart.io')) return url;
    // Absolute URL (http:// or https://) - extract only the pathname
    try {
        const parsed = new URL(url);
        return parsed.pathname; // e.g. '/uploads/qris/qris_code_xxx.png'
    } catch(e) {
        // Already a relative path like '/uploads/qris/...' or 'images/qris_huma_farm.png'
        return url;
    }
}


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
        if (response.status === 401 || response.status === 403 || data.error === 'INVALID_TOKEN') {
            // Show session expired popup first, THEN switch to visitor mode
            showSessionExpiredModal();
            throw new Error('Sesi berakhir. Silakan login kembali.');
        }
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

/**
 * Smart CRUD error handler — shows session expired modal if token is invalid,
 * otherwise shows a generic error notification.
 * @param {Error} err - The caught error object
 * @param {string} fallbackTitle - Title to show for non-session errors
 * @param {string} fallbackMsg - Message to show for non-session errors
 */
function handleCrudError(err, fallbackTitle = 'Gagal Menyimpan', fallbackMsg = 'Terjadi kesalahan sistem saat menyimpan data.') {
    const msg = err?.message || fallbackMsg;
    showNotificationModal(fallbackTitle, msg, '❌', 'error');
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
            let qtyEggs = o.totalEggs || o.total_eggs || 0;
            if (!qtyEggs) {
                const q = o.qty || o.quantity || 0;
                if (o.unit === 'pack') {
                    qtyEggs = q * 10;
                } else {
                    qtyEggs = q;
                }
            }

            if (o.category === 'negeri') {
                stockNegeri -= qtyEggs;
            } else if (o.category === 'kampung' || o.category === 'reward') {
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

    // Reveal bottom nav immediately after role visibility is computed (synchronous, always fires)
    document.body.classList.add('app-loaded');

    // Initial render from local
    renderPanenData();
    updateDashboardData();
    renderTokoData();
    renderTokoOrdersData();

    // Init QRIS Image Setting - normalize any old absolute URL from localStorage
    const rawSavedQris = localStorage.getItem('huma_farm_qris_image') || 'images/qris_huma_farm.png';
    const savedQrisUrl = normalizeQrisImageUrl(rawSavedQris);
    if (savedQrisUrl !== rawSavedQris) {
        localStorage.setItem('huma_farm_qris_image', savedQrisUrl); // Update with normalized path
    }
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
    if (bsiLabelEl) bsiLabelEl.textContent = `🏦 TRANSFER ${savedBankName.toUpperCase()}`;

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
                const knownIncomeCategories = ['Injeksi Modal', 'Penjualan Off-Grid', 'Penjualan Afkir', 'Subsidi / Lainnya', 'Pemasukan Kas'];
                const cloudExp = res.expenses.map(e => ({
                    id: String(e.id),
                    type: e.type || (knownIncomeCategories.includes(e.category) ? 'income' : 'expense'),
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
                localStorage.setItem('huma_farm_qris_image', normalizeQrisImageUrl(res.settings.qris_image_url));

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
                if (bsiLabelEl) bsiLabelEl.textContent = `🏦 TRANSFER ${res.settings.bank_name.toUpperCase()}`;

                const qrisImg = document.getElementById('qris-img-element');
                if (qrisImg) {
                    let finalQrSrc = normalizeQrisImageUrl(res.settings.qris_image_url) || 'images/qris_huma_farm.png';
                    if (finalQrSrc.startsWith('000201')) {
                        finalQrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' + encodeURIComponent(finalQrSrc);
                    }
                    qrisImg.src = finalQrSrc;
                }
                const merchantLabel = document.getElementById('pay-qris-merchant');
                if (merchantLabel) merchantLabel.textContent = `📱 SCAN QRIS (${res.settings.qris_merchant.toUpperCase()})`;
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
        handleCrudError(err, 'Gagal Menyimpan', 'Gagal memperbarui harga di server.');
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

    const btnEl = document.getElementById('sys-notif-btn');
    if (btnEl) {
        if (title && title.startsWith('Sedang')) {
            btnEl.style.display = 'none';
        } else {
            btnEl.style.display = 'block';
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
    document.documentElement.setAttribute('data-user-role', currentRole);
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

    // Retrieve previously selected page from sessionStorage
    let targetPage = sessionStorage.getItem('huma_farm_active_page');

    if (currentRole === 'admin') {
        adminTabs.forEach(el => el.style.display = '');
        const adminPaymentCard = document.getElementById('admin-payment-setting-card');
        if (adminPaymentCard) adminPaymentCard.style.display = 'block';
        userTabs.forEach(el => el.style.display = 'none');
        visitorTabs.forEach(el => el.style.display = 'none');
        if (stickyBanner) stickyBanner.style.display = 'none';
        if (visitorWaBanner) visitorWaBanner.style.display = 'none';
        if (visitorLoginHint) visitorLoginHint.style.display = 'none';

        const adminAvatar = localStorage.getItem('huma_farm_admin_avatar') || '👑';
        const adminAvatarBg = localStorage.getItem('huma_farm_admin_avatar_bg') || 'linear-gradient(135deg, #f59e0b, #d97706)';
        if (avatarImg) {
            avatarImg.textContent = adminAvatar;
            avatarImg.style.background = adminAvatarBg;
        }
        if (userNameEl) userNameEl.textContent = 'Bos Admin';

        const walletBtn = document.getElementById('topbar-wallet-btn');
        if (walletBtn) walletBtn.style.display = 'inline-flex';

        const finCardsRow = document.getElementById('dash-financial-cards-row');
        if (finCardsRow) finCardsRow.style.display = 'grid';

        const dashCharts = document.getElementById('dash-charts-section');
        if (dashCharts) dashCharts.style.display = 'block';

        const btnEditEggTrooper = document.getElementById('btn-edit-egg-trooper');
        if (btnEditEggTrooper) btnEditEggTrooper.style.display = 'inline-block';

        if (settingsBtn) settingsBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (tokoPricingBtn) tokoPricingBtn.style.display = 'inline-flex';

        // Hide login button when logged in as admin
        const loginBtn = document.getElementById('topbar-login-btn');
        if (loginBtn) loginBtn.style.display = 'none';

        loadSettingsPageData();

        // Validate and apply targetPage (default fallback is 'panenku')
        if (!targetPage) {
            targetPage = 'panenku';
        }
        switchPage(targetPage);

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

        // Validate and apply targetPage (default fallback is 'toko')
        if (!targetPage || ['panenku', 'keuangan'].includes(targetPage)) {
            targetPage = 'toko';
        }
        switchPage(targetPage);

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

        // Validate and apply targetPage (default fallback is 'edukasi')
        if (!targetPage || ['panenku', 'keuangan', 'pengaturan'].includes(targetPage)) {
            targetPage = 'edukasi';
        }
        switchPage(targetPage);
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

    sessionStorage.setItem('huma_farm_active_page', pageId);

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
// ORDER ACCORDION TOGGLE
// ============================================================
function toggleOrderAccordion(headerEl) {
    if (!headerEl) return;
    const item = headerEl.closest('.order-accordion-item');
    if (!item) return;
    const isAlreadyActive = item.classList.contains('active');

    document.querySelectorAll('.order-accordion-item').forEach(el => {
        el.classList.remove('active');
    });

    if (!isAlreadyActive) {
        item.classList.add('active');
    }
}

// ============================================================
// ORDER FORM v3 - MULTI PACK + ECERAN SUPPORT PER EGG TYPE
// ============================================================

let orderQtyNegeriPack = 0;
let orderQtyNegeriEgg = 0;
let orderQtyKampungPack = 0;
let orderQtyKampungEgg = 0;

function openQuickUserOrderModal(preserveData = false) {
    const modal = document.getElementById('modal-user-order');
    if (!modal) return;

    if (!preserveData) {
        // Reset state
        orderQtyNegeriPack = 0;
        orderQtyNegeriEgg = 0;
        orderQtyKampungPack = 0;
        orderQtyKampungEgg = 0;
    }

    // Set UI inputs
    const np = document.getElementById('order-qty-negeri-pack');
    const ne = document.getElementById('order-qty-negeri-egg');
    const kp = document.getElementById('order-qty-kampung-pack');
    const ke = document.getElementById('order-qty-kampung-egg');
    if (np) np.value = orderQtyNegeriPack.toString();
    if (ne) ne.value = orderQtyNegeriEgg.toString();
    if (kp) kp.value = orderQtyKampungPack.toString();
    if (ke) ke.value = orderQtyKampungEgg.toString();

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
            if (!preserveData) buyerInput.value = '';
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
            if (!preserveData && (!buyerInput.value || buyerInput.value.trim() === '')) {
                if (currentUser && currentUser.name) {
                    buyerInput.value = currentUser.name;
                } else {
                    buyerInput.value = '';
                }
            }
        }
    }

    if (phoneInput && !preserveData) {
        if (currentUser && currentUser.phone) {
            phoneInput.value = currentUser.phone;
        } else {
            phoneInput.value = '';
        }
    }

    // Restore buyerName and buyerPhone if preserveData is true and pendingOrderData exists
    if (preserveData && pendingOrderData) {
        if (buyerInput && pendingOrderData.buyerName) buyerInput.value = pendingOrderData.buyerName;
        if (phoneInput && pendingOrderData.buyerPhone) phoneInput.value = pendingOrderData.buyerPhone;
    }

    // Show/hide custom transaction date for Admin
    const adminDateRow = document.getElementById('admin-order-date-row');
    const dateInput = document.getElementById('quick-order-date-input');
    if (adminDateRow) {
        if (currentRole === 'admin') {
            adminDateRow.style.display = 'block';
            if (dateInput && !preserveData) {
                const now = new Date();
                const tzoffset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
                dateInput.value = localISOTime;
            }
        } else {
            adminDateRow.style.display = 'none';
        }
    }

    // Show/hide reward box for Admin
    const rewardContainer = document.getElementById('admin-reward-container');
    if (rewardContainer) {
        if (currentRole === 'admin') {
            rewardContainer.style.display = 'block';
            if (!preserveData) {
                const rNegeri = document.getElementById('reward-type-negeri');
                if (rNegeri) {
                    rNegeri.checked = true;
                    rNegeri.dispatchEvent(new Event('change'));
                }
                const rQty = document.getElementById('quick-order-reward-qty');
                if (rQty) rQty.value = '0';
            }
        } else {
            rewardContainer.style.display = 'none';
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

    // Recalculate summary and button state if preserving data
    if (preserveData) {
        onOrderQtyInput();
    } else {
        const warn = document.getElementById('order-stock-warning');
        if (warn) warn.style.display = 'none';
        const priceSum = document.getElementById('order-price-summary');
        if (priceSum) priceSum.style.display = 'none';

        const btn = document.getElementById('order-submit-btn');
        if (btn) {
            btn.disabled = true;
            if (currentRole === 'admin') {
                btn.innerHTML = '📥 Input Pesanan';
            } else {
                btn.innerHTML = 'Lanjut ke Pembayaran ➔';
            }
            btn.classList.remove('btn-po');
            btn.classList.add('btn-ranch');
        }
    }

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
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = currentRole === 'admin' ? '📥 Input Pesanan' : 'Lanjut ke Pembayaran ➔';
            btn.classList.remove('btn-po');
            btn.classList.add('btn-ranch');
        }
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
        if (warnText) warnText.textContent = '⚠️ Stok kurang (' + msgs.join(', ') + '). Silakan ajukan Pre-Order.';
        if (btn) {
            btn.disabled = false;
            if (currentRole === 'admin') {
                btn.innerHTML = '📥 Input Pesanan';
                btn.classList.remove('btn-po');
                btn.classList.add('btn-ranch');
            } else {
                btn.innerHTML = '📋 Ajukan PO via WhatsApp';
                btn.classList.add('btn-po');
                btn.classList.remove('btn-ranch');
            }
        }
    } else {
        if (warn) warn.style.display = 'none';
        if (btn) {
            btn.disabled = false;
            if (currentRole === 'admin') {
                btn.innerHTML = '📥 Input Pesanan';
            } else {
                btn.innerHTML = 'Lanjut ke Pembayaran ➔';
            }
            btn.classList.remove('btn-po');
            btn.classList.add('btn-ranch');
        }
    }
}

function escapeJsString(str) {
    return (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function escapeHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ADMIN: Buyer name search with phone auto-populate from historical orders
function handleOrderBuyerSearch(query) {
    if (currentRole !== 'admin') return;
    const dd = document.getElementById('order-buyer-dropdown');
    if (!dd) return;
    if (!query || query.trim().length < 1) { dd.style.display = 'none'; return; }

    const matchesMap = new Map();
    const lowerQ = query.toLowerCase().trim();

    // Check orders from local storage (MURNI DARI RIWAYAT PESANAN)
    try {
        const localOrders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
        localOrders.forEach(o => {
            const name = (o.buyerName || o.buyer_name || o.name || '').trim();
            const phone = (o.buyerPhone || o.buyer_phone || o.phone || '').trim();
            if (name && name.toLowerCase() !== 'pengunjung' && name.toLowerCase() !== 'visitor') {
                const key = name.toLowerCase();
                if (!matchesMap.has(key)) {
                    matchesMap.set(key, { name: name, phone: phone });
                }
            }
        });
    } catch (e) {}

    const matchesList = Array.from(matchesMap.values()).filter(b => b.name.toLowerCase().includes(lowerQ));

    if (matchesList.length === 0) {
        dd.style.display = 'none';
        return;
    }

    let html = '';
    matchesList.slice(0, 6).forEach(m => {
        const phoneLabel = m.phone ? ` (${m.phone})` : '';
        html += `<div class="order-buyer-option" style="padding: 8px 10px; cursor: pointer; border-bottom: 1px dashed var(--border-color); font-size: 0.76rem; color: var(--text-main); background: var(--bg-card);"
                      onclick="selectOrderBuyerResult('${escapeJsString(m.name)}', '${escapeJsString(m.phone)}')">
                    <strong style="color: var(--text-main);">👤 ${escapeHtml(m.name)}</strong><span style="color: var(--ranch-amber); font-size: 0.7rem; margin-left: 4px;">${escapeHtml(phoneLabel)}</span>
                 </div>`;
    });

    dd.innerHTML = html;
    dd.style.display = 'block';
}

function selectOrderBuyerResult(name, phone) {
    const inp = document.getElementById('quick-order-buyer-input');
    const phoneInp = document.getElementById('quick-order-phone-input');
    const dd = document.getElementById('order-buyer-dropdown');

    if (inp) inp.value = name;
    if (phoneInp && phone) phoneInp.value = phone;
    if (dd) dd.style.display = 'none';
}

function selectOrderBuyer(name, phone) {
    selectOrderBuyerResult(name, phone);
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

function formatPhoneNumberForWa(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
}

function getAdminPhoneNumber() {
    const savedAdminPhone = localStorage.getItem('huma_farm_admin_phone');
    if (savedAdminPhone) {
        const formatted = formatPhoneNumberForWa(savedAdminPhone);
        if (formatted) return formatted;
    }
    const registeredUsers = JSON.parse(localStorage.getItem('huma_farm_registered_users') || '[]');
    const adminUser = registeredUsers.find(u => u && u.role === 'admin');
    if (adminUser && adminUser.phone) {
        const formatted = formatPhoneNumberForWa(adminUser.phone);
        if (formatted) return formatted;
    }
    return '6282299336676';
}

function getBaseOrderId(id) {
    if (!id) return '';
    // Strip leading '#' so '#ORD-55554' and 'ORD-55554' group together
    const cleanId = id.startsWith('#') ? id.substring(1) : id;
    const match = cleanId.match(/^(ORD-\d+)/i);
    if (match) {
        return match[1].toUpperCase();
    }
    const idx = cleanId.lastIndexOf('-');
    if (idx !== -1) {
        const suffix = cleanId.substring(idx);
        if (suffix === '-R' || suffix.match(/^-\d+$/) || suffix.match(/^-[A-Z]+$/)) {
            return cleanId.substring(0, idx);
        }
    }
    return cleanId;
}

async function handleQuickUserOrderStep1Submit(e) {
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
    const orderId = `ORD-${randomSuffix}`;

    // Admin direct submit handling
    if (currentRole === 'admin') {
        const rewardQty = parseInt(document.getElementById('quick-order-reward-qty').value) || 0;
        const rewardType = document.querySelector('input[name="reward_egg_type"]:checked').value;
        if (rewardQty > 0) {
            itemsToProcess.push({ category: rewardType, unit: 'egg', qty: rewardQty, isReward: true });
            const rewardName = rewardType === 'negeri' ? 'Telur Negeri' : 'Telur Kampung';
            orderDescArr.push(`[Bonus] ${rewardName}: ${rewardQty} Butir`);
        }

        showNotificationModal('Mengirim Pesanan...', 'Menyimpan pesanan ke database farm...', '☁️', 'info');

        try {
            let itemIndex = 1;
            for (const item of itemsToProcess) {
                let itemTotalPrice = 0;
                if (!item.isReward) {
                    const pricePerUnit = (item.category === 'negeri') 
                        ? (item.unit === 'pack' ? prices.negeriPack : prices.negeriEgg)
                        : (item.unit === 'pack' ? prices.kampungPack : prices.kampungEgg);
                    itemTotalPrice = item.qty * pricePerUnit;
                }

                const suffix = item.isReward ? '-R' : `-${itemIndex++}`;
                const uniqueItemId = `${orderId}${suffix}`;

                const postPayload = {
                    id: uniqueItemId,
                    buyer_name: buyerName,
                    buyer_phone: buyerPhone,
                    category: item.category,
                    unit: item.unit,
                    qty: item.qty,
                    total_price: itemTotalPrice,
                    payment_status: 'Menunggu Konfirmasi'
                };

                const customDateVal = document.getElementById('quick-order-date-input').value;
                if (customDateVal) {
                    postPayload.created_at = customDateVal;
                }

                await apiRequest('/orders', 'POST', postPayload);
            }

            await fetchCloudData();
            closeQuickUserOrderModal();
            closeSystemNotificationModal();

            pendingOrderData = {
                orderId,
                buyerName,
                buyerPhone,
                orderDescArr,
                grandTotal,
                itemsToProcess,
                isAdminCreated: true
            };

            openPaymentModal(orderId, buyerName, buyerPhone, orderDescArr, grandTotal, itemsToProcess);

        } catch (err) {
            closeSystemNotificationModal();
            console.error('API admin order submit error:', err);
            handleCrudError(err, 'Gagal Mengirim Pesanan', 'Gagal menghubungi server database. Silakan coba lagi.');
        }
        return;
    }

    pendingOrderData = {
        orderId,
        buyerName,
        buyerPhone,
        orderDescArr,
        grandTotal,
        itemsToProcess,
        isAdminCreated: false
    };

    closeQuickUserOrderModal();

    // Populate Modal Payment Instructions / Nota Pemesanan
    openPaymentModal(orderId, buyerName, buyerPhone, orderDescArr, grandTotal, itemsToProcess);
}

function openPaymentModal(orderId, buyerName, buyerPhone, orderDescArr, grandTotal, itemsToProcess) {
    const modalIdEl = document.getElementById('pay-modal-order-id');
    const modalNameEl = document.getElementById('pay-modal-buyer-name');
    const modalPhoneEl = document.getElementById('pay-modal-buyer-phone');
    const modalDescEl = document.getElementById('pay-modal-order-desc');
    const modalTotalEl = document.getElementById('pay-modal-total-amount');

    if (modalIdEl) modalIdEl.textContent = orderId.startsWith('#') ? orderId : '#' + orderId;
    if (modalNameEl) modalNameEl.textContent = buyerName;
    if (modalPhoneEl) modalPhoneEl.textContent = buyerPhone || '-';
    if (modalDescEl) modalDescEl.textContent = orderDescArr.join(' + ');
    if (modalTotalEl) modalTotalEl.textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');

    updateDynamicQrisInPaymentModal(grandTotal);

    const savedBankName = localStorage.getItem('huma_farm_bank_name') || 'BSI';
    const savedBankNumber = localStorage.getItem('huma_farm_bank_number') || '7367004597';
    const savedBankOwner = localStorage.getItem('huma_farm_bank_owner') || 'Mela Mufida';
    const bsiNumEl = document.getElementById('pay-bsi-number');
    const bsiOwnerEl = document.getElementById('pay-bsi-owner');
    const bsiLabelEl = document.getElementById('pay-bsi-bank-name');
    if (bsiNumEl) bsiNumEl.textContent = savedBankNumber;
    if (bsiOwnerEl) bsiOwnerEl.textContent = savedBankOwner;
    if (bsiLabelEl) bsiLabelEl.textContent = `🏦 TRANSFER ${savedBankName}`;

    selectPaymentMethod('bsi');

    const footerNormal = document.getElementById('pay-modal-footer-normal');
    const footerViewOnly = document.getElementById('pay-modal-footer-view-only');
    if (footerNormal) footerNormal.style.display = 'flex';
    if (footerViewOnly) footerViewOnly.style.display = 'none';

    const modalPay = document.getElementById('modal-payment-instructions');
    if (modalPay) modalPay.classList.add('active');
}



function openReceiptModalFromHistory(orderId) {
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const baseId = getBaseOrderId(orderId);
    
    // Find all items belonging to this base order ID
    const relatedOrders = orders.filter(item => getBaseOrderId(item.id) === baseId);
    
    if (!relatedOrders || relatedOrders.length === 0) {
        showNotificationModal('Nota Tidak Ditemukan', 'Data pesanan tidak ditemukan.', '⚠️', 'warning');
        return;
    }

    const firstItem = relatedOrders[0];
    const buyerName = firstItem.buyerName || 'Pembeli';
    const buyerPhone = firstItem.buyerPhone || '-';
    
    let grandTotal = 0;
    const orderDescArr = [];
    
    relatedOrders.forEach(item => {
        const itemTotal = parseFloat(item.totalPrice || 0);
        grandTotal += itemTotal;
        const categoryText = item.category === 'negeri' ? 'Telur Negeri' : 'Telur Kampung';
        const unitText = item.unit === 'pack' ? 'Pack' : 'Butir';
        if (item.isReward || itemTotal === 0 || (item.category && item.category.includes('bonus'))) {
            orderDescArr.push(`🎁 [Bonus] ${item.qty} ${unitText} ${categoryText}`);
        } else {
            orderDescArr.push(`${item.qty} ${unitText} ${categoryText}`);
        }
    });

    pendingOrderData = {
        orderId: baseId,
        buyerName,
        buyerPhone,
        orderDescArr,
        grandTotal,
        itemsToProcess: relatedOrders,
        isSavedToDb: true,
        isAdminCreated: true
    };

    openPaymentModal(baseId, buyerName, buyerPhone, orderDescArr, grandTotal, relatedOrders);

    // Switch footer to View-Only mode (Hide WA & Kembali buttons, Show '✖ Tutup Nota' button only)
    const footerNormal = document.getElementById('pay-modal-footer-normal');
    const footerViewOnly = document.getElementById('pay-modal-footer-view-only');
    if (footerNormal) footerNormal.style.display = 'none';
    if (footerViewOnly) footerViewOnly.style.display = 'block';
}

function calculateQrisCRC16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= (str.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.padStart(4, '0');
}

function parseQrisTLV(payloadStr) {
    let payload = payloadStr.trim();
    if (payload.includes('6304')) {
        payload = payload.substring(0, payload.lastIndexOf('6304'));
    }
    const tags = [];
    let idx = 0;
    while (idx < payload.length) {
        if (idx + 4 > payload.length) break;
        const tag = payload.substring(idx, idx + 2);
        const len = parseInt(payload.substring(idx + 2, idx + 4), 10);
        if (isNaN(len) || idx + 4 + len > payload.length) break;
        const val = payload.substring(idx + 4, idx + 4 + len);
        tags.push({ tag, len, val });
        idx += 4 + len;
    }
    return tags;
}

function generateDynamicQrisPayload(rawPayload, amount) {
    if (!rawPayload || typeof rawPayload !== 'string') return '';
    let payload = rawPayload.trim();

    if (payload.startsWith('http://') || payload.startsWith('https://') || payload.startsWith('data:image')) {
        return payload;
    }

    const amountNum = Math.round(Number(amount) || 0);
    if (amountNum <= 0) return payload;

    const amtValStr = amountNum + '.00';
    const tags = parseQrisTLV(payload);
    if (tags.length === 0) return payload;

    const newTags = [];
    let found54 = false;

    for (const item of tags) {
        if (item.tag === '01') {
            newTags.push({ tag: '01', len: 2, val: '12' });
        } else if (item.tag === '54') {
            newTags.push({ tag: '54', len: amtValStr.length, val: amtValStr });
            found54 = true;
        } else {
            newTags.push(item);
            if (item.tag === '53' && !found54) {
                newTags.push({ tag: '54', len: amtValStr.length, val: amtValStr });
                found54 = true;
            }
        }
    }

    if (!found54) {
        newTags.push({ tag: '54', len: amtValStr.length, val: amtValStr });
    }

    let reconstructed = '';
    for (const t of newTags) {
        const lenStr = t.len.toString().padStart(2, '0');
        reconstructed += t.tag + lenStr + t.val;
    }

    reconstructed += '6304';
    const crc = calculateQrisCRC16(reconstructed);
    return reconstructed + crc;
}

function updateDynamicQrisInPaymentModal(grandTotal) {
    const savedQrisImage = localStorage.getItem('huma_farm_qris_image') || '';
    const savedMerchant = localStorage.getItem('huma_farm_qris_merchant') || 'Huma Farm';
    const qrisImg = document.getElementById('qris-img-element');
    const merchantLabel = document.getElementById('pay-qris-merchant');

    if (merchantLabel) merchantLabel.textContent = `📱 SCAN QRIS (${savedMerchant.toUpperCase()})`;

    if (!qrisImg) return;

    // Step 1: Immediately show local fallback so QR area is never blank
    qrisImg.src = 'images/qris_huma_farm.png';
    qrisImg.style.opacity = '1';

    // Step 2: If a server-uploaded QRIS image exists, try to swap it in
    if (savedQrisImage && !savedQrisImage.startsWith('000201')) {
        const testImg = new Image();
        testImg.onload = function() {
            // Server image loaded successfully - use it
            qrisImg.src = savedQrisImage;
            qrisImg.style.opacity = '1';
        };
        testImg.onerror = function() {
            // Server image failed - keep the local fallback already shown
            console.warn('QRIS server image failed to load, using local fallback.');
        };
        // Timeout: if server doesn't respond in 2s, abort silently
        setTimeout(() => { testImg.src = ''; }, 2000);
        testImg.src = savedQrisImage;
    } else if (savedQrisImage && savedQrisImage.startsWith('000201')) {
        // It's a raw QRIS string - generate QR via API
        const apiSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' + encodeURIComponent(savedQrisImage);
        const testImg = new Image();
        testImg.onload = function() {
            qrisImg.src = apiSrc;
            qrisImg.style.opacity = '1';
        };
        testImg.onerror = function() {
            console.warn('QR API image failed, using local fallback.');
        };
        setTimeout(() => { testImg.src = ''; }, 2000);
        testImg.src = apiSrc;
    }
}


// Convert image URL to base64 via XHR (works for same-origin uploads without CORS issues)
function imageUrlToBase64(url) {
    return new Promise((resolve) => {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = function () {
                if (xhr.status === 200) {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(xhr.response);
                } else {
                    resolve(null);
                }
            };
            xhr.onerror = () => resolve(null);
            xhr.send();
        } catch (e) {
            resolve(null);
        }
    });
}

async function downloadQrisImage() {
    const modalBox = document.getElementById('modal-payment-card-capture-target') || document.querySelector('#modal-payment-instructions .modal-box');
    if (!modalBox) return;

    const qrisImg = document.getElementById('qris-img-element');

    showNotificationModal('Menyiapkan Nota...', 'Memproses gambar nota pemesanan...', '🖼️', 'info');

    const orderIdEl = document.getElementById('pay-modal-order-id');
    const cleanId = orderIdEl ? orderIdEl.textContent.trim().replace('#', '') : 'ORD';
    const fileName = `HumaFarm_NotaPemesanan_${cleanId}.png`;

    if (typeof html2canvas !== 'function') {
        fallbackCanvasDownload();
        return;
    }

    try {
        const SCALE = 2.5;

        // Run html2canvas with CORS enabled so external QR images load properly
        const canvas = await html2canvas(modalBox, {
            scale: SCALE,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#18181b',
            logging: false,
            imageTimeout: 5000
        });

        // Ensure QR code is drawn onto canvas if html2canvas missed it
        if (qrisImg && qrisImg.complete && qrisImg.naturalWidth > 0) {
            const qrRect = qrisImg.getBoundingClientRect();
            const modalRect = modalBox.getBoundingClientRect();
            const ctx = canvas.getContext('2d');
            const x = (qrRect.left - modalRect.left) * SCALE;
            const y = (qrRect.top - modalRect.top) * SCALE;
            const w = qrRect.width * SCALE;
            const h = qrRect.height * SCALE;

            try {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, w, h);
                ctx.drawImage(qrisImg, x, y, w, h);
            } catch (drawErr) {
                console.warn('Direct drawImage on qrisImg warning:', drawErr);
            }
        }

        canvas.toBlob(async (blob) => {
            if (!blob) {
                console.error('toBlob returned null, using fallback');
                fallbackCanvasDownload();
                return;
            }

            const imageFile = new File([blob], fileName, { type: 'image/png' });

            // OPSI C: WEB SHARE API UNTUK SMARTPHONE (ANDROID / IOS)
            let sharedSuccessfully = false;
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                try {
                    await navigator.share({
                        title: 'Nota Pemesanan Huma Farm',
                        text: `Nota Pemesanan ${cleanId} - Peternakan Huma Farm`,
                        files: [imageFile]
                    });
                    sharedSuccessfully = true;
                    showNotificationModal('Nota Berhasil Dibagikan!', 'Silakan simpan ke Galeri / WA.', '✅', 'success');
                    return;
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') {
                        // User cancelled share sheet silently
                        return;
                    }
                    console.warn('Web Share API failed, falling back to direct download:', shareErr);
                }
            }

            // FALLBACK LAPTOP / PC / BROWSER DENGAN TIP SCREENSHOT
            if (!sharedSuccessfully) {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                showNotificationModal(
                    'Nota Berhasil Diunduh!',
                    `${fileName} tersimpan.\n💡 Tips: Anda juga bisa screenshot layar langsung untuk hasil 100% instan!`,
                    '✅',
                    'success'
                );
            }
        }, 'image/png');

    } catch (err) {
        console.error('html2canvas error:', err);
        fallbackCanvasDownload();
    }
}

function fallbackCanvasDownload() {
    const qrisImg = document.getElementById('qris-img-element');
    const orderIdEl = document.getElementById('pay-modal-order-id');
    const buyerNameEl = document.getElementById('pay-modal-buyer-name');
    const buyerPhoneEl = document.getElementById('pay-modal-buyer-phone');
    const orderDescEl = document.getElementById('pay-modal-order-desc');
    const totalAmountEl = document.getElementById('pay-modal-total-amount');
    const merchantLabel = document.getElementById('pay-qris-merchant');

    const orderId = orderIdEl ? orderIdEl.textContent.trim() : '#ORD-0000';
    const buyerName = buyerNameEl ? buyerNameEl.textContent.trim() : '-';
    const buyerPhone = buyerPhoneEl ? buyerPhoneEl.textContent.trim() : '-';
    const orderDesc = orderDescEl ? orderDescEl.textContent.trim() : '-';
    const totalAmount = totalAmountEl ? totalAmountEl.textContent.trim() : 'Rp 0';
    const merchantName = merchantLabel ? merchantLabel.textContent.replace(/^📱\s*/, '').trim() : 'QRIS HUMA FARM';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 2;
    const cardWidth = 560;
    const cardHeight = 760;

    canvas.width = cardWidth * scale;
    canvas.height = cardHeight * scale;
    ctx.scale(scale, scale);

    // Background & Border
    const bgGradient = ctx.createLinearGradient(0, 0, 0, cardHeight);
    bgGradient.addColorStop(0, '#1c1917');
    bgGradient.addColorStop(1, '#0c0a09');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, cardWidth, cardHeight, 20);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header Title
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🥚 HUMA FARM - TELUR OMEGA', 24, 40);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    ctx.fillText('Nota Pemesanan & Metode Pembayaran', 24, 60);

    // Order ID Badge (positioned without overlapping title)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardWidth - 144, 24, 120, 30, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(orderId, cardWidth - 84, 44);

    // Divider Line
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 76);
    ctx.lineTo(cardWidth - 24, 76);
    ctx.stroke();

    // Order Details Box
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(24, 90, cardWidth - 48, 150, 12);
    ctx.fill();
    ctx.strokeStyle = '#3f3f46';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '13px sans-serif';

    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('Nama Pemesan:', 40, 116);
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(buyerName, 160, 116);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('No. WhatsApp:', 40, 140);
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(buyerPhone, 160, 140);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('Rincian Order:', 40, 164);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(orderDesc, 160, 164);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.beginPath();
    ctx.roundRect(32, 184, cardWidth - 64, 42, 8);
    ctx.fill();

    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('TOTAL TAGIHAN:', 44, 210);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(totalAmount, cardWidth - 44, 211);

    // BSI Transfer Account Box
    const bankName = localStorage.getItem('huma_farm_bank_name') || 'BANK BSI';
    const bankNumber = localStorage.getItem('huma_farm_bank_number') || '7367004597';
    const bankOwner = localStorage.getItem('huma_farm_bank_owner') || 'Mela Mufida';

    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(24, 252, cardWidth - 48, 66, 10);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`🏦 TRANSFER ${bankName}`, 40, 272);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(bankNumber, 40, 296);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`A.n. ${bankOwner}`, cardWidth - 40, 296);

    // QRIS Display Section
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`📱 ${merchantName}`, cardWidth / 2, 344);

    const qrBoxSize = 250;
    const qrBoxX = (cardWidth - qrBoxSize) / 2;
    const qrBoxY = 358;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 14);
    ctx.fill();
    ctx.strokeStyle = '#e4e4e7';
    ctx.stroke();

    const finishDownload = (qrImageObj) => {
        if (qrImageObj) {
            ctx.drawImage(qrImageObj, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);
        }

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan QRIS via Mobile Banking / E-Wallet (BCA, GoPay, OVO, DANA, dll)', cardWidth / 2, qrBoxY + qrBoxSize + 28);
        ctx.fillText('& masukkan nominal transfer sesuai Total Tagihan di atas.', cardWidth / 2, qrBoxY + qrBoxSize + 46);

        ctx.fillStyle = '#71717a';
        ctx.font = 'italic 11px sans-serif';
        ctx.fillText('Terima kasih telah berbelanja telur segar berkualitas di Huma Farm!', cardWidth / 2, cardHeight - 20);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const cleanId = orderId.replace('#', '');
            const fileName = `HumaFarm_NotaPemesanan_${cleanId}.png`;
            const imageFile = new File([blob], fileName, { type: 'image/png' });

            // OPSI C: WEB SHARE API UNTUK SMARTPHONE (ANDROID / IOS)
            let sharedSuccessfully = false;
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                try {
                    await navigator.share({
                        title: 'Nota Pemesanan Huma Farm',
                        text: `Nota Pemesanan ${cleanId} - Peternakan Huma Farm`,
                        files: [imageFile]
                    });
                    sharedSuccessfully = true;
                    showNotificationModal('Nota Berhasil Dibagikan!', 'Silakan simpan ke Galeri / WA.', '✅', 'success');
                    return;
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return;
                }
            }

            // FALLBACK LAPTOP / PC / BROWSER
            if (!sharedSuccessfully) {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                showNotificationModal(
                    'Nota Berhasil Diunduh!',
                    `${fileName} tersimpan.\n💡 Tips: Anda juga bisa screenshot layar langsung untuk hasil 100% instan!`,
                    '✅',
                    'success'
                );
            }
        }, 'image/png');
    };

    if (qrisImg && qrisImg.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => finishDownload(img);
        img.onerror = () => finishDownload(null);
        img.src = qrisImg.src;
    } else {
        finishDownload(null);
    }
}

function selectPaymentMethod(method) {
    const bsiBox = document.getElementById('bsi-payment-box');
    const qrisBox = document.getElementById('qris-payment-box');

    if (bsiBox) bsiBox.style.display = 'block';
    if (qrisBox) qrisBox.style.display = 'block';
    
    let grandTotal = pendingOrderData ? pendingOrderData.grandTotal : 0;
    updateDynamicQrisInPaymentModal(grandTotal);
}

function closePaymentInstructionsModal(returnToForm = false) {
    const modal = document.getElementById('modal-payment-instructions');
    if (modal) modal.classList.remove('active');

    if (returnToForm) {
        openQuickUserOrderModal(true);
    }
}

let _isOrderSubmitting = false;
async function executeOrderWithCountDown() {
    if (!pendingOrderData) return;
    if (_isOrderSubmitting) {
        console.warn('Order submission already in progress, ignoring duplicate call.');
        return;
    }
    _isOrderSubmitting = true;

    const { orderId, buyerName, buyerPhone, orderDescArr, grandTotal, itemsToProcess, isAdminCreated } = pendingOrderData;

    const savedBankName = localStorage.getItem('huma_farm_bank_name') || 'BSI';
    const savedBankNumber = localStorage.getItem('huma_farm_bank_number') || '7367004597';
    const savedBankOwner = localStorage.getItem('huma_farm_bank_owner') || 'Mela Mufida';
    const payMethodText = `🏦 ${savedBankName} (${savedBankNumber}) / 📱 QRIS`;

    try {
        if (!isAdminCreated && !pendingOrderData.isSavedToDb) {
            let itemIndex = 1;
            for (const item of itemsToProcess) {
                const prices = getTokoPrices();
                const pricePerUnit = (item.category === 'negeri') 
                    ? (item.unit === 'pack' ? prices.negeriPack : prices.negeriEgg)
                    : (item.unit === 'pack' ? prices.kampungPack : prices.kampungEgg);
                
                const subtotal = item.qty * pricePerUnit;
                const subId = itemsToProcess.length > 1 ? `${orderId}-${itemIndex}` : `${orderId}-1`;

                await apiRequest('/orders', 'POST', {
                    id: subId,
                    buyer_name: buyerName,
                    buyer_phone: buyerPhone || '',
                    category: item.category,
                    egg_category: item.category,
                    unit: item.unit,
                    package_type: item.unit,
                    qty: item.qty,
                    quantity: item.qty,
                    price_per_unit: pricePerUnit,
                    total_price: subtotal,
                    order_date: new Date().toISOString().split('T')[0],
                    payment_method: payMethodText,
                    payment_status: 'Menunggu Pembayaran'
                });
                itemIndex++;
            }
            pendingOrderData.isSavedToDb = true;
            await fetchCloudData();
        }

        closePaymentInstructionsModal(false);
        closeSystemNotificationModal();

        const orderDescStr = orderDescArr.join('\n');
        const em = {
            egg: String.fromCodePoint(0x1F95A),
            pin: String.fromCodePoint(0x1F424),
            user: String.fromCodePoint(0x1F464),
            phone: String.fromCodePoint(0x1F4F1),
            box: String.fromCodePoint(0x1F4E6),
            card: String.fromCodePoint(0x1F4B3)
        };

        const isAdminSending = currentRole === 'admin' && buyerPhone;
        const greetingHeader = isAdminSending 
            ? `Halo ${buyerName}! ${em.egg}\nBerikut pesanan kamu ya!`
            : `Halo Huma Farm! ${em.egg}\nAku mau pesan telurnya ya!`;
        const closingLine = isAdminSending
            ? `Mohon konfirmasi pesanan kamu ya! Terima kasih!`
            : `Mohon konfirmasi pesanan saya ya! Terima kasih!`;

        const waMessage = `${greetingHeader}

${em.pin} *Order ID*: #${orderId}
${em.user} *Pemesan*: ${buyerName}
${em.phone} *No. WA*: ${buyerPhone || '-'}

${em.box} *Rincian Pesanan*:
${orderDescStr}

${em.card} *Total Tagihan*: Rp ${grandTotal.toLocaleString('id-ID')}
${em.card} *Metode Pembayaran*: ${payMethodText}

${closingLine}`;
        const encodedMessage = encodeURIComponent(waMessage);
        let targetWaPhone = getAdminPhoneNumber();
        if (currentRole === 'admin' && buyerPhone) {
            const formattedBuyer = formatPhoneNumberForWa(buyerPhone);
            if (formattedBuyer) {
                targetWaPhone = formattedBuyer;
            }
        }
        const waUrl = `https://api.whatsapp.com/send/?phone=${targetWaPhone}&text=${encodedMessage}`;

        window.pendingWaUrl = waUrl;
        const btnForceWa = document.getElementById('btn-force-open-wa');
        if (btnForceWa) btnForceWa.href = waUrl;

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

    } catch (err) {
        _isOrderSubmitting = false;
        closeSystemNotificationModal();
        console.error('API checkout error:', err);
        handleCrudError(err, 'Gagal Mengirim Pesanan', 'Gagal menghubungi server database. Silakan coba lagi.');
    } finally {
        _isOrderSubmitting = false;
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

    // Render Dynamic Prices for Pack & Eceran (per Butir)
    const priceNegeriPackEl = document.getElementById('toko-price-negeri-pack');
    const priceNegeriEggEl = document.getElementById('toko-price-negeri-egg');
    const priceKampungPackEl = document.getElementById('toko-price-kampung-pack');
    const priceKampungEggEl = document.getElementById('toko-price-kampung-egg');

    if (priceNegeriPackEl) priceNegeriPackEl.textContent = `Rp ${(prices.negeriPack || 25000).toLocaleString('id-ID')}`;
    if (priceNegeriEggEl) priceNegeriEggEl.textContent = `Rp ${(prices.negeriEgg || 2500).toLocaleString('id-ID')}/btr`;

    if (priceKampungPackEl) priceKampungPackEl.textContent = `Rp ${(prices.kampungPack || 35000).toLocaleString('id-ID')}`;
    if (priceKampungEggEl) priceKampungEggEl.textContent = `Rp ${(prices.kampungEgg || 3500).toLocaleString('id-ID')}/btr`;

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
    if (eceranKampungEl) eceranKampungEl.textContent = `${eceranKampung} Butir`;
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
    if (currentRole === 'user' && currentUser) {
        orders = orders.filter(item => item.buyerName && item.buyerName.toLowerCase() === currentUser.name.toLowerCase());
    }

    const typeChecked = Array.from(document.querySelectorAll('#ms-menu-type input:checked')).map(i => i.value);
    const monthChecked = Array.from(document.querySelectorAll('.cb-month:checked')).map(i => i.value);
    const yearChecked = Array.from(document.querySelectorAll('.cb-year:checked')).map(i => i.value);

    let filteredOrders = orders.filter(item => {
        let matchType = true;
        let matchMonth = true;
        let matchYear = true;

        if (typeChecked.length > 0) {
            const isCompleted = item.status === 'completed';
            const isPO = item.status === 'po';
            const isPending = item.status === 'pending_confirm' || item.status === 'pending';
            const isLunas = item.paymentStatus === 'Lunas';
            const isUnpaid = item.paymentStatus === 'Belum Bayar' || item.paymentStatus === 'Menunggu Konfirmasi' || item.paymentStatus === 'Menunggu Pembayaran' || (item.paymentStatus && item.paymentStatus.toLowerCase().includes('menunggu'));

            matchType = (
                (typeChecked.includes('completed') && isCompleted) ||
                (typeChecked.includes('po') && isPO) ||
                (typeChecked.includes('pending') && isPending) ||
                (typeChecked.includes('lunas') && isLunas) ||
                (typeChecked.includes('unpaid') && isUnpaid)
            );
        }

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

    // Group orders by base ID
    const groups = {};
    const groupOrder = [];

    filteredOrders.forEach(item => {
        const baseId = getBaseOrderId(item.id);
        if (!groups[baseId]) {
            groups[baseId] = {
                id: baseId,
                buyerName: item.buyerName,
                buyerPhone: item.buyerPhone,
                createdAt: item.createdAt,
                status: item.status,
                paymentStatus: item.paymentStatus,
                poNumber: item.poNumber,
                shortageEggs: 0,
                items: [],
                totalPrice: 0
            };
            groupOrder.push(baseId);
        }

        // Deduplicate duplicate entries caused by double-submit (e.g. ORD-16332 vs ORD-16332-1)
        const isDuplicate = groups[baseId].items.some(existing => {
            const sameSpec = existing.category === item.category && 
                             existing.unit === item.unit && 
                             existing.qty === item.qty && 
                             Math.abs(existing.totalPrice - item.totalPrice) < 0.01;
            if (!sameSpec) return false;

            const id1 = String(existing.id);
            const id2 = String(item.id);
            const isBaseAndSub = (id1 === baseId && id2 === `${baseId}-1`) || (id2 === baseId && id1 === `${baseId}-1`);
            const sameCreated = existing.createdAt && item.createdAt && existing.createdAt === item.createdAt;
            return isBaseAndSub || sameCreated;
        });

        if (isDuplicate) return;

        groups[baseId].items.push(item);
        groups[baseId].totalPrice += parseFloat(item.totalPrice || 0);
        groups[baseId].shortageEggs += parseInt(item.shortageEggs || 0);

        if (item.status === 'po') {
            groups[baseId].status = 'po';
        }

        const oldStatus = groups[baseId].paymentStatus;
        const newStatus = item.paymentStatus;
        if (newStatus === 'Batal' || oldStatus === 'Batal') {
            groups[baseId].paymentStatus = 'Batal';
        } else if (newStatus === 'Menunggu Konfirmasi' || oldStatus === 'Menunggu Konfirmasi') {
            groups[baseId].paymentStatus = 'Menunggu Konfirmasi';
        } else if (newStatus === 'Belum Bayar' || oldStatus === 'Belum Bayar') {
            groups[baseId].paymentStatus = 'Belum Bayar';
        } else {
            groups[baseId].paymentStatus = 'Lunas';
        }
    });

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    groupOrder.forEach(baseId => {
        const group = groups[baseId];
        const isPO = group.status === 'po';
        const isPendingConfirm = group.status === 'pending_confirm';
        const displayName = currentRole === 'visitor' ? anonymizeBuyerName(group.buyerName) : (group.buyerName || 'Pembeli');

        // Single Status Badge next to buyer's name
        let statusBadge = `<span class="badge-status-completed">🟢 Lunas</span>`;
        if (isPendingConfirm || group.paymentStatus === 'Menunggu Konfirmasi') {
            statusBadge = `<span class="badge-status-pending">⏳ Menunggu Konfirmasi</span>`;
        } else if (group.paymentStatus === 'Belum Bayar') {
            statusBadge = `<span class="badge-status-unpaid">🔴 Belum Bayar</span>`;
        } else if (group.paymentStatus === 'Batal') {
            statusBadge = `<span class="badge-status-unpaid">❌ Batal</span>`;
        } else if (isPO) {
            statusBadge = `<span class="badge-status-pending">🏷️ PO #${group.poNumber || 1}</span>`;
        }

        let shortageWarning = '';
        if (isPO && group.shortageEggs > 0) {
            shortageWarning = `<div style="font-size: 0.72rem; color: var(--ranch-rose); font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                ⚠️ <span>Stok Kurang ${group.shortageEggs} Butir lagi untuk memenuhi PO ini!</span>
            </div>`;
        }

        const formattedDate = formatIndonesianDate(group.createdAt.split('T')[0]);

        let actionButtons = '';
        if (currentRole === 'admin') {
            actionButtons = `
                <div style="display: flex; gap: 5px; margin-top: 4px; justify-content: space-between; align-items: center;">
                    <button class="btn btn-outline" style="font-size: 0.68rem; padding: 3px 8px; min-height: 26px; color: var(--text-main);" onclick="openReceiptModalFromHistory('${group.id}')">🧾 Nota</button>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        ${group.paymentStatus !== 'Lunas' && group.paymentStatus !== 'Batal' ? `<button class="btn btn-ranch" style="font-size: 0.68rem; padding: 3px 9px; min-height: 26px;" onclick="confirmUserOrderPayment('${group.items[0].id}')">✓ Lunas</button>` : ''}
                        <button class="btn btn-outline" style="font-size: 0.68rem; padding: 3px 8px; min-height: 26px; color: var(--ranch-amber); border-color: var(--ranch-amber);" onclick="editUserOrderRecord('${group.items[0].id}')">✏️ Edit</button>
                        <button class="btn btn-rose" style="font-size: 0.68rem; padding: 3px 7px; min-height: 26px;" onclick="deleteUserOrderRecord('${group.items[0].id}')">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        } else if (currentRole === 'user' && group.paymentStatus !== 'Lunas' && group.paymentStatus !== 'Batal') {
            actionButtons = `
                <div style="display: flex; gap: 4px; margin-top: 4px; justify-content: flex-end;">
                    <button class="btn btn-outline" style="font-size: 0.68rem; padding: 2px 6px; min-height: 24px; color: var(--ranch-rose);" onclick="deleteUserOrderRecord('${group.items[0].id}')">❌ Batalkan</button>
                </div>
            `;
        }

        // Sort items so bonus items are ALWAYS at the end of the list
        group.items.sort((a, b) => {
            const aIsReward = (a.isReward || parseFloat(a.totalPrice) === 0 || (a.category && a.category.includes('bonus'))) ? 1 : 0;
            const bIsReward = (b.isReward || parseFloat(b.totalPrice) === 0 || (b.category && b.category.includes('bonus'))) ? 1 : 0;
            return aIsReward - bIsReward;
        });

        let itemsDetailsHTML = '';
        group.items.forEach(subItem => {
            const categoryText = subItem.category === 'negeri' ? 'Telur Negeri' : 'Telur Kampung';
            const unitText = subItem.unit === 'pack' ? 'Pack (isi 10)' : 'Butir';
            const isReward = subItem.isReward || parseFloat(subItem.totalPrice) === 0 || (subItem.category && subItem.category.includes('bonus'));
            
            const isNegeri = subItem.category === 'negeri';
            const eggIcon = isNegeri 
                ? `<svg width="12" height="15" viewBox="0 0 100 125" style="vertical-align: -2px; margin-right: 4px; display: inline-block;"><path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#B06530"/><ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.25" transform="rotate(-18 38 32)"/></svg>`
                : `<svg width="12" height="15" viewBox="0 0 100 125" style="vertical-align: -2px; margin-right: 4px; display: inline-block;"><path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="5"/><ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.75" transform="rotate(-18 38 32)"/></svg>`;

            if (isReward) {
                itemsDetailsHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 6px;">
                        <span style="font-size: 0.76rem; font-weight: 700; color: var(--ranch-amber);">🎁 [Bonus Pembelian] ${subItem.qty} ${unitText} ${categoryText}</span>
                        <strong style="color: var(--text-muted); font-size: 0.8rem;">Rp 0</strong>
                    </div>
                `;
            } else {
                itemsDetailsHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">${eggIcon}${subItem.qty} ${unitText} ${categoryText}</span>
                        <strong style="color: var(--ranch-amber); font-size: 0.82rem;">Rp ${parseFloat(subItem.totalPrice).toLocaleString('id-ID')}</strong>
                    </div>
                `;
            }
        });

        html += `
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
                <!-- ROW 1: ID + Timestamp + Admin Nota Button -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 0.65rem; background: var(--bg-card); border: 1px solid var(--border-color); padding: 2px 7px; border-radius: 5px; font-weight: 800; color: var(--ranch-amber);">${group.id.startsWith('#') ? group.id : '#' + group.id}</span>
                        ${currentRole === 'admin' ? `<button class="btn btn-outline" style="font-size: 0.62rem; padding: 1px 7px; min-height: 22px; color: var(--text-main);" onclick="openReceiptModalFromHistory('${group.id}')">🧾 Nota</button>` : ''}
                    </div>
                    <span style="font-size: 0.67rem; color: var(--text-muted);">📅 ${formattedDate}</span>
                </div>
 
                <!-- ROW 2: Buyer Name + Status Badge -->
                <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.78rem;">👤</span>
                    <strong style="font-size: 0.82rem; color: var(--text-main);">${displayName}</strong>
                    ${statusBadge}
                </div>
 
                <!-- ROW 3: Detail Box -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 7px; padding: 7px 10px; margin-bottom: 6px;">
                    ${itemsDetailsHTML}
                    ${shortageWarning}
                </div>
 
                <!-- ROW 4: Total Price -->
                <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 4px;">
                    <strong style="color: var(--ranch-amber); font-size: 0.9rem;">Total: Rp ${group.totalPrice.toLocaleString('id-ID')}</strong>
                </div>

                ${actionButtons}
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderPanenData() {
    const container = document.getElementById('panen-history-container');
    if (!container) return;

    // 1. Calculate and update ready stock display
    const stock = getCalculatedReadyStock();
    
    const totalNegeriEl = document.getElementById('stok-total-negeri');
    const packNegeriEl = document.getElementById('pack-negeri-val');
    const eceranNegeriEl = document.getElementById('eceran-negeri-val');
    
    const totalKampungEl = document.getElementById('stok-total-kampung');
    const packKampungEl = document.getElementById('pack-kampung-val');
    const eceranKampungEl = document.getElementById('eceran-kampung-val');

    if (totalNegeriEl) totalNegeriEl.textContent = `${stock.negeri} Butir`;
    if (packNegeriEl) packNegeriEl.textContent = `${Math.floor(stock.negeri / 10)} Pack`;
    if (eceranNegeriEl) eceranNegeriEl.textContent = `${stock.negeri % 10} Butir`;

    if (totalKampungEl) totalKampungEl.textContent = `${stock.kampung} Butir`;
    if (packKampungEl) packKampungEl.textContent = `${Math.floor(stock.kampung / 10)} Pack`;
    if (eceranKampungEl) eceranKampungEl.textContent = `${stock.kampung % 10} Butir`;

    // 2. Load and filter history records (combined manual panen + sales orders lunas)
    const panenHistory = JSON.parse(localStorage.getItem('huma_farm_panen_history') || '[]');
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');

    const combinedList = [];

    // Add manual harvests
    panenHistory.forEach(item => {
        combinedList.push({
            source: 'panen',
            id: item.id,
            date: item.date, // YYYY-MM-DD
            type: item.type, // 'add' or 'sub'
            negeri: item.negeri || 0,
            kampung: item.kampung || 0,
            reason: item.reason
        });
    });

    // Add lunas sales orders (separated into regular sales and reward outflows)
    orders.forEach(item => {
        if (item.paymentStatus === 'Lunas') {
            const isReward = parseFloat(item.totalPrice) === 0 && item.qty > 0;
            combinedList.push({
                source: 'order',
                id: item.id,
                date: item.createdAt ? item.createdAt.split('T')[0] : '', // YYYY-MM-DD
                type: isReward ? 'reward_outflow' : 'sale',
                negeri: item.category === 'negeri' ? (item.totalEggs || 0) : 0,
                kampung: item.category === 'kampung' ? (item.totalEggs || 0) : 0,
                buyerName: item.buyerName,
                isReward: isReward
            });
        }
    });

    // Sort by date (newest first)
    combinedList.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
        }
        return (b.id || '').localeCompare(a.id || '');
    });

    // Get filters
    const monthFilter = document.getElementById('filter-panen-month')?.value || 'all';
    const yearFilter = document.getElementById('filter-panen-year')?.value || 'all';

    let filteredHistory = combinedList.filter(item => {
        if (!item.date) return true;
        const [year, month] = item.date.split('-');
        
        const matchMonth = monthFilter === 'all' || month === monthFilter;
        const matchYear = yearFilter === 'all' || year === yearFilter;

        return matchMonth && matchYear;
    });

    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <div class="card-placeholder">
                <span class="placeholder-icon">📋</span>
                <p>Belum ada catatan transaksi untuk filter ini.</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    filteredHistory.forEach(item => {
        const formattedDate = formatIndonesianDate(item.date);
        
        let typeBadge = '';
        let actionColumn = '';
        let quantityBadges = '';
        let noteText = '';

        if (item.source === 'panen') {
            if (item.type === 'sub') {
                typeBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: rgba(244, 63, 94, 0.15); color: #f43f5e; font-size: 0.7rem; font-weight: 700;">➖ Pengurangan</span>`;
                
                if (item.negeri > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--ranch-amber); color: var(--ranch-amber); font-size: 0.74rem; font-weight: 700; margin-right: 6px;">🟤 Negeri: -${item.negeri} Butir</span>`;
                }
                if (item.kampung > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.1); border: 1px solid var(--ranch-green); color: var(--ranch-green); font-size: 0.74rem; font-weight: 700;">⚪ Kampung: -${item.kampung} Butir</span>`;
                }
                noteText = item.reason || 'Pengurangan konsumsi/sedekah';
            } else {
                typeBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.7rem; font-weight: 700;">➕ Panen Harian</span>`;
                
                if (item.negeri > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--ranch-amber); color: var(--ranch-amber); font-size: 0.74rem; font-weight: 700; margin-right: 6px;">🟤 Negeri: +${item.negeri} Butir</span>`;
                }
                if (item.kampung > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.1); border: 1px solid var(--ranch-green); color: var(--ranch-green); font-size: 0.74rem; font-weight: 700;">⚪ Kampung: +${item.kampung} Butir</span>`;
                }
                noteText = 'Panen dari kandang';
            }

            actionColumn = `
                <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn btn-outline" style="font-size: 0.65rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;" onclick="editPanenRecord('${item.id}')" title="Edit Catatan">✏️</button>
                    <button class="btn btn-rose" style="font-size: 0.65rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;" onclick="deletePanenRecord('${item.id}')" title="Hapus Catatan">🗑️</button>
                </div>
            `;
        } else if (item.source === 'order') {
            if (item.isReward) {
                typeBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: rgba(244, 63, 94, 0.15); color: #f43f5e; font-size: 0.7rem; font-weight: 700;">➖ Pengurangan</span>`;
                
                if (item.negeri > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--ranch-amber); color: var(--ranch-amber); font-size: 0.74rem; font-weight: 700; margin-right: 6px;">🟤 Negeri: -${item.negeri} Butir</span>`;
                }
                if (item.kampung > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.1); border: 1px solid var(--ranch-green); color: var(--ranch-green); font-size: 0.74rem; font-weight: 700;">⚪ Kampung: -${item.kampung} Butir</span>`;
                }
                
                noteText = `Reward pembelian ${item.buyerName || 'User'} - ${getBaseOrderId(item.id).startsWith('#') ? getBaseOrderId(item.id) : '#' + getBaseOrderId(item.id)}`;
                
                actionColumn = `
                    <span style="border: 1.5px solid var(--text-muted); color: var(--text-muted); background: rgba(255, 255, 255, 0.05); padding: 3px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 800; display: inline-flex; align-items: center; gap: 3px;">🎁 Reward</span>
                `;
            } else {
                typeBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-size: 0.7rem; font-weight: 700;">🛍️ Penjualan</span>`;
                
                if (item.negeri > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(245, 158, 11, 0.1); border: 1px solid var(--ranch-amber); color: var(--ranch-amber); font-size: 0.74rem; font-weight: 700; margin-right: 6px;">🟤 Negeri: -${item.negeri} Butir</span>`;
                }
                if (item.kampung > 0) {
                    quantityBadges += `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.1); border: 1px solid var(--ranch-green); color: var(--ranch-green); font-size: 0.74rem; font-weight: 700;">⚪ Kampung: -${item.kampung} Butir</span>`;
                }

                actionColumn = `
                    <span style="border: 1.5px solid #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); padding: 3px 8px; border-radius: 6px; font-size: 0.68rem; font-weight: 800; display: inline-flex; align-items: center; gap: 3px;">🛒 Lunas</span>
                `;
                noteText = `Pembelian oleh ${item.buyerName || 'User'} - ${getBaseOrderId(item.id).startsWith('#') ? getBaseOrderId(item.id) : '#' + getBaseOrderId(item.id)}`;
            }
        }

        html += `
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-bottom: 8px; box-shadow: var(--shadow-sm);">
                
                <!-- ROW 1: Date + Type Badge & Action/Status Column with Separator -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.82rem; color: var(--text-main); font-weight: 700;">📅 ${formattedDate}</span>
                        ${typeBadge}
                    </div>
                    ${actionColumn}
                </div>

                <!-- ROW 2: Quantities Badges -->
                <div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${quantityBadges}
                </div>

                <!-- ROW 3: Note / Description -->
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted);">
                    <span>📝</span>
                    <strong>Note:</strong>
                    <span>${noteText}</span>
                </div>

            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// CONFIRMATION & DELETION ACTIONS FOR ORDERS
async function confirmUserOrderPayment(orderId) {
    const baseId = getBaseOrderId(orderId);
    let orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const itemsToConfirm = orders.filter(o => getBaseOrderId(o.id) === baseId && o.paymentStatus !== 'Lunas');
    
    if (itemsToConfirm.length > 0) {
        showNotificationModal('Sedang Mengonfirmasi...', 'Mengonfirmasi status pembayaran...', '☁️', 'info');
        try {
            for (const item of itemsToConfirm) {
                await apiRequest(`/orders/${encodeURIComponent(item.id)}`, 'PUT', {
                    payment_status: 'Lunas'
                });
            }
            await fetchCloudData();
            closeSystemNotificationModal();
            showNotificationModal(
                'Pesanan Dikonfirmasi Lunas!',
                `Seluruh pesanan dalam grup ini telah dikonfirmasi Lunas & kas bertambah.`,
                '🟢',
                'success'
            );
        } catch (err) {
            closeSystemNotificationModal();
            console.error('API confirm order error:', err);
            handleCrudError(err, 'Gagal Sinkronisasi', 'Gagal memperbarui status ke server. Silakan coba lagi.');
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

function changeEditQty(key, delta) {
    const fieldMap = {
        'negeri_pack': 'edit-qty-negeri-pack',
        'negeri_egg': 'edit-qty-negeri-egg',
        'kampung_pack': 'edit-qty-kampung-pack',
        'kampung_egg': 'edit-qty-kampung-egg',
        'reward_egg': 'edit-qty-reward-egg'
    };
    const inputId = fieldMap[key];
    if (!inputId) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    let val = parseInt(input.value || '0') + delta;
    if (val < 0) val = 0;
    input.value = val;
}

function editUserOrderRecord(orderId) {
    if (currentRole !== 'admin') return;

    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const baseId = getBaseOrderId(orderId);
    
    // Find all item records matching this base order ID
    const matchingOrders = orders.filter(o => getBaseOrderId(o.id) === baseId);
    if (matchingOrders.length === 0) {
        showNotificationModal('Pesanan Tidak Ditemukan', 'Data pesanan ini tidak dapat ditemukan.', '⚠️', 'error');
        return;
    }

    const firstItem = matchingOrders[0];
    const modal = document.getElementById('modal-edit-order');
    if (!modal) return;

    document.getElementById('edit-order-id').value = baseId;
    document.getElementById('edit-order-id-label').textContent = baseId.startsWith('#') ? baseId : '#' + baseId;
    document.getElementById('edit-order-buyer-name').value = firstItem.buyerName || '';
    document.getElementById('edit-order-buyer-phone').value = firstItem.buyerPhone || '';
    document.getElementById('edit-order-payment-status').value = firstItem.paymentStatus || 'Menunggu Konfirmasi';
    
    const dateStr = firstItem.createdAt ? firstItem.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
    document.getElementById('edit-order-date').value = dateStr;

    // Reset all edit item quantities
    document.getElementById('edit-qty-negeri-pack').value = 0;
    document.getElementById('edit-qty-negeri-egg').value = 0;
    document.getElementById('edit-qty-kampung-pack').value = 0;
    document.getElementById('edit-qty-kampung-egg').value = 0;
    document.getElementById('edit-qty-reward-egg').value = 0;

    // Populate quantities from existing matching items
    matchingOrders.forEach(o => {
        const isReward = o.isReward || parseFloat(o.totalPrice || 0) === 0;
        if (isReward) {
            document.getElementById('edit-qty-reward-egg').value = o.qty || 0;
        } else if (o.category === 'negeri' && o.unit === 'pack') {
            document.getElementById('edit-qty-negeri-pack').value = o.qty || 0;
        } else if (o.category === 'negeri' && o.unit === 'egg') {
            document.getElementById('edit-qty-negeri-egg').value = o.qty || 0;
        } else if (o.category === 'kampung' && o.unit === 'pack') {
            document.getElementById('edit-qty-kampung-pack').value = o.qty || 0;
        } else if (o.category === 'kampung' && o.unit === 'egg') {
            document.getElementById('edit-qty-kampung-egg').value = o.qty || 0;
        }
    });

    modal.classList.add('active');
}

function closeEditOrderModal() {
    const modal = document.getElementById('modal-edit-order');
    if (modal) modal.classList.remove('active');
}

async function handleSaveEditOrderSubmit(e) {
    e.preventDefault();
    const baseId = document.getElementById('edit-order-id').value;
    const buyerName = document.getElementById('edit-order-buyer-name').value.trim();
    const buyerPhone = document.getElementById('edit-order-buyer-phone').value.trim();
    const paymentStatus = document.getElementById('edit-order-payment-status').value;
    const orderDate = document.getElementById('edit-order-date').value;

    if (!buyerName) {
        showNotificationModal('Nama Kosong', 'Silakan masukkan nama pemesan.', '⚠️', 'error');
        return;
    }

    const nPack = parseInt(document.getElementById('edit-qty-negeri-pack').value || '0');
    const nEgg  = parseInt(document.getElementById('edit-qty-negeri-egg').value || '0');
    const kPack = parseInt(document.getElementById('edit-qty-kampung-pack').value || '0');
    const kEgg  = parseInt(document.getElementById('edit-qty-kampung-egg').value || '0');
    const rEgg  = parseInt(document.getElementById('edit-qty-reward-egg').value || '0');

    if (nPack === 0 && nEgg === 0 && kPack === 0 && kEgg === 0 && rEgg === 0) {
        showNotificationModal('Jumlah Kosong', 'Silakan masukkan minimal 1 item pesanan atau bonus.', '⚠️', 'error');
        return;
    }

    const prices = getTokoPrices();
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const matchingOrders = orders.filter(o => getBaseOrderId(o.id) === baseId);

    showNotificationModal('Sedang Menyimpan...', 'Memperbarui data pesanan di server...', '☁️', 'info');
    try {
        // 1. Delete old subitems in DB
        for (const item of matchingOrders) {
            try {
                await apiRequest(`/orders/${encodeURIComponent(item.id)}`, 'DELETE');
            } catch (err) {
                console.warn('Delete old item failed:', item.id, err);
            }
        }

        // 2. Build array of new items to create with unique suffixes
        const newItemsToCreate = [];
        const ts = Date.now();

        if (nPack > 0) {
            newItemsToCreate.push({
                id: `${baseId}-N-PACK-${ts}`,
                category: 'negeri',
                unit: 'pack',
                qty: nPack,
                total_price: nPack * (prices.negeriPack || 27000)
            });
        }
        if (nEgg > 0) {
            newItemsToCreate.push({
                id: `${baseId}-N-EGG-${ts}`,
                category: 'negeri',
                unit: 'egg',
                qty: nEgg,
                total_price: nEgg * (prices.negeriEgg || 2900)
            });
        }
        if (kPack > 0) {
            newItemsToCreate.push({
                id: `${baseId}-K-PACK-${ts}`,
                category: 'kampung',
                unit: 'pack',
                qty: kPack,
                total_price: kPack * (prices.kampungPack || 33000)
            });
        }
        if (kEgg > 0) {
            newItemsToCreate.push({
                id: `${baseId}-K-EGG-${ts}`,
                category: 'kampung',
                unit: 'egg',
                qty: kEgg,
                total_price: kEgg * (prices.kampungEgg || 3500)
            });
        }
        if (rEgg > 0) {
            newItemsToCreate.push({
                id: `${baseId}-R-${ts}`,
                category: 'kampung',
                unit: 'egg',
                qty: rEgg,
                total_price: 0
            });
        }

        const formattedCreatedAt = orderDate ? orderDate + 'T12:00:00.000Z' : undefined;

        // 3. Create updated subitems in DB
        for (const payload of newItemsToCreate) {
            await apiRequest('/orders', 'POST', {
                id: payload.id,
                buyer_name: buyerName,
                buyer_phone: buyerPhone,
                category: payload.category,
                unit: payload.unit,
                qty: payload.qty,
                total_price: payload.total_price,
                payment_status: paymentStatus,
                created_at: formattedCreatedAt
            });
        }

        await fetchCloudData();
        closeEditOrderModal();
        showNotificationModal(
            'Pesanan Diperbarui!',
            `Pesanan <strong>${baseId.startsWith('#') ? baseId : '#' + baseId}</strong> a.n. ${buyerName} berhasil diperbarui.`,
            '✏️',
            'success'
        );
    } catch (err) {
        console.error('API edit order error:', err);
        handleCrudError(err, 'Gagal Menyimpan', 'Gagal memperbarui data pesanan di server.');
    }
}

async function executeDeleteOrderRecord() {
    if (!deletingOrderId) return;

    showNotificationModal('Sedang Menghapus...', 'Menyimpan perubahan di server...', '☁️', 'info');
    try {
        const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
        const itemsToDelete = orders.filter(o => getBaseOrderId(o.id) === getBaseOrderId(deletingOrderId));
        
        for (const item of itemsToDelete) {
            await apiRequest(`/orders/${encodeURIComponent(item.id)}`, 'DELETE');
        }
        
        await fetchCloudData();
        closeDeleteOrderConfirmModal();
        showNotificationModal(
            'Pesanan Dibatalkan / Dihapus',
            'Pesanan telah dihapus dari daftar riwayat toko.',
            '🗑️',
            'info'
        );
    } catch (err) {
        closeSystemNotificationModal();
        console.error('API delete order error:', err);
        handleCrudError(err, 'Gagal Menghapus', 'Gagal menghapus data dari server.');
    }
}

async function togglePaymentStatus(orderId) {
    let orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        const newPaymentStatus = orders[idx].paymentStatus === 'Lunas' ? 'Belum Bayar' : 'Lunas';
        showNotificationModal('Sedang Memperbarui...', 'Memperbarui status pembayaran di server...', '☁️', 'info');
        try {
            await apiRequest(`/orders/${encodeURIComponent(orderId)}`, 'PUT', {
                payment_status: newPaymentStatus
            });
            await fetchCloudData();
            showNotificationModal('Status Pembayaran Diperbarui!', 'Status pembayaran berhasil diperbarui.', '💰', 'success');
        } catch (err) {
            console.error('API toggle payment status error:', err);
            handleCrudError(err, 'Gagal Sinkronisasi', 'Gagal memperbarui status ke server.');
        }
    }
}

// ----------------------------------------------------
const AVATAR_BG_PALETTE = [
    { id: 'gold', name: 'Gold Amber', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { id: 'blue', name: 'Royal Blue', bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { id: 'green', name: 'Emerald Green', bg: 'linear-gradient(135deg, #10b981, #047857)' },
    { id: 'purple', name: 'Purple Orchid', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { id: 'rose', name: 'Rose Sunset', bg: 'linear-gradient(135deg, #f43f5e, #be123c)' },
    { id: 'dark', name: 'Obsidian Dark', bg: 'linear-gradient(135deg, #334155, #0f172a)' }
];
let selectedAvatarBg = 'linear-gradient(135deg, #f59e0b, #d97706)';

function loadSettingsPageData() {
    const setPhoneInput = document.getElementById('set-new-phone');
    const previewBox = document.getElementById('settings-avatar-preview');
    
    const profileAvatar = document.getElementById('settings-profile-avatar');
    const profileName = document.getElementById('settings-profile-name');
    const profileRole = document.getElementById('settings-profile-role');
    const profilePhone = document.getElementById('settings-profile-phone');

    if (currentRole === 'admin') {
        selectedProfileEmoji = localStorage.getItem('huma_farm_admin_avatar') || '👑';
        selectedAvatarBg = localStorage.getItem('huma_farm_admin_avatar_bg') || 'linear-gradient(135deg, #f59e0b, #d97706)';
        
        const adminPhone = localStorage.getItem('huma_farm_admin_phone') || (typeof cloudSettings !== 'undefined' && cloudSettings.admin_phone) || '081234567890';

        if (previewBox) {
            previewBox.textContent = selectedProfileEmoji;
            previewBox.style.background = selectedAvatarBg;
        }
        if (setPhoneInput) setPhoneInput.value = adminPhone;
        
        if (profileAvatar) {
            profileAvatar.textContent = selectedProfileEmoji;
            profileAvatar.style.background = selectedAvatarBg;
        }
        if (profileName) profileName.textContent = 'Bos Admin';
        if (profileRole) {
            profileRole.textContent = '👑 Admin';
            profileRole.style.color = 'var(--ranch-amber)';
        }
        if (profilePhone) profilePhone.textContent = '📱 WhatsApp: ' + adminPhone;
    } else if (currentUser) {
        selectedProfileEmoji = currentUser.avatar || '👤';
        selectedAvatarBg = currentUser.avatarBg || 'linear-gradient(135deg, #f59e0b, #d97706)';

        if (previewBox) {
            previewBox.textContent = selectedProfileEmoji;
            previewBox.style.background = selectedAvatarBg;
        }
        if (setPhoneInput) setPhoneInput.value = currentUser.phone || '';
        
        if (profileAvatar) {
            profileAvatar.textContent = selectedProfileEmoji;
            profileAvatar.style.background = selectedAvatarBg;
        }
        if (profileName) profileName.textContent = currentUser.name;
        if (profileRole) {
            profileRole.textContent = '👤 Pelanggan';
            profileRole.style.color = 'var(--ranch-green)';
        }
        if (profilePhone) profilePhone.textContent = '📱 WhatsApp: ' + (currentUser.phone || '-');
    }

    renderFarmEmojiPickerGrid(selectedProfileEmoji);
    renderAvatarBgColorPickerGrid(selectedAvatarBg);
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

function renderAvatarBgColorPickerGrid(activeBg) {
    const gridContainer = document.getElementById('farm-avatar-bg-color-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    AVATAR_BG_PALETTE.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.width = '32px';
        btn.style.height = '32px';
        btn.style.borderRadius = '50%';
        btn.style.background = c.bg;
        btn.style.border = c.bg === activeBg ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = c.bg === activeBg ? '0 0 8px rgba(245,158,11,0.8)' : 'none';
        btn.title = c.name;
        btn.onclick = () => selectAvatarBgColor(c.bg);
        gridContainer.appendChild(btn);
    });
}

function selectAvatarBgColor(bg) {
    selectedAvatarBg = bg;
    const previewBox = document.getElementById('settings-avatar-preview');
    if (previewBox) previewBox.style.background = bg;
    renderAvatarBgColorPickerGrid(bg);
}

async function handleUpdateAvatarSubmit(e) {
    e.preventDefault();

    if (currentRole === 'admin') {
        localStorage.setItem('huma_farm_admin_avatar', selectedProfileEmoji);
        localStorage.setItem('huma_farm_admin_avatar_bg', selectedAvatarBg);
        
        const topbarAvatar = document.getElementById('topbar-avatar-img');
        if (topbarAvatar) topbarAvatar.style.background = selectedAvatarBg;

        updateRoleVisibility();
        loadSettingsPageData();
        closeSettingsModal('modal-settings-avatar');
        showNotificationModal(
            'Logo & Warna Profil Diperbarui!',
            `Logo profil Bos Admin berhasil diperbarui ke <strong>${selectedProfileEmoji}</strong> dengan warna background pilihan.`,
            '🎨',
            'success'
        );
    } else if (currentUser) {
        showNotificationModal('Sedang Menyimpan...', 'Memperbarui avatar profil Anda...', '☁️', 'info');
        try {
            const res = await apiRequest('/settings/profile', 'POST', {
                id: currentUser.id,
                avatar: selectedProfileEmoji,
                avatar_bg: selectedAvatarBg
            });
            if (res.success) {
                currentUser.avatar = selectedProfileEmoji;
                currentUser.avatarBg = selectedAvatarBg;
                localStorage.setItem('huma_farm_current_user', JSON.stringify(currentUser));
                await fetchCloudData();
                
                updateRoleVisibility();
                loadSettingsPageData();
                closeSettingsModal('modal-settings-avatar');
                showNotificationModal(
                    'Logo & Warna Profil Diperbarui!',
                    `Logo profil akun Anda berhasil diperbarui ke <strong>${selectedProfileEmoji}</strong>.`,
                    '🎨',
                    'success'
                );
            }
        } catch (err) {
            console.error('API update avatar error:', err);
            handleCrudError(err, 'Gagal Memperbarui', 'Gagal menyimpan perubahan avatar profil ke server.');
        }
    }
}

let activeQrisInputMode = 'upload';

function updatePaymentSettingsSummaryCards() {
    const bankName = localStorage.getItem('huma_farm_bank_name') || 'BSI';
    const bankNumber = localStorage.getItem('huma_farm_bank_number') || '7367004597';
    const bankOwner = localStorage.getItem('huma_farm_bank_owner') || 'Mela Mufida';
    const qrisMerchant = localStorage.getItem('huma_farm_qris_merchant') || 'Huma Farm';
    const qrisImage = localStorage.getItem('huma_farm_qris_image') || 'images/qris_huma_farm.png';

    const cardBankTitle = document.getElementById('card-bank-title');
    const cardBankName = document.getElementById('card-bank-name');
    const cardBankNumber = document.getElementById('card-bank-number');
    const cardBankOwner = document.getElementById('card-bank-owner');
    const cardQrisMerchant = document.getElementById('card-qris-merchant');
    const cardQrisImg = document.getElementById('card-qris-img-preview');

    if (cardBankTitle) cardBankTitle.textContent = `Rekening ${bankName}`;
    if (cardBankName) cardBankName.textContent = bankName;
    if (cardBankNumber) cardBankNumber.textContent = bankNumber;
    if (cardBankOwner) cardBankOwner.textContent = bankOwner;
    if (cardQrisMerchant) cardQrisMerchant.textContent = qrisMerchant;
    if (cardQrisImg) cardQrisImg.src = qrisImage;

    // Also populate edit form inputs
    const inputBankName = document.getElementById('setting-bank-name');
    const inputBankNumber = document.getElementById('setting-bank-number');
    const inputBankOwner = document.getElementById('setting-bank-owner');
    const inputQrisMerchant = document.getElementById('setting-qris-merchant');
    const qrisPreviewSettings = document.getElementById('qris-preview-settings');

    if (inputBankName) inputBankName.value = bankName;
    if (inputBankNumber) inputBankNumber.value = bankNumber;
    if (inputBankOwner) inputBankOwner.value = bankOwner;
    if (inputQrisMerchant) inputQrisMerchant.value = qrisMerchant;
    if (qrisPreviewSettings) qrisPreviewSettings.src = qrisImage;
}

function toggleBankEditForm(show) {
    const summaryView = document.getElementById('payment-settings-summary-view');
    const bankBox = document.getElementById('payment-bank-edit-box');
    const qrisBox = document.getElementById('payment-qris-edit-box');

    if (show) {
        if (summaryView) summaryView.style.display = 'none';
        if (qrisBox) qrisBox.style.display = 'none';
        if (bankBox) bankBox.style.display = 'block';
    } else {
        if (bankBox) bankBox.style.display = 'none';
        if (qrisBox) qrisBox.style.display = 'none';
        if (summaryView) summaryView.style.display = 'flex';
    }
}

function toggleQrisEditForm(show) {
    const summaryView = document.getElementById('payment-settings-summary-view');
    const bankBox = document.getElementById('payment-bank-edit-box');
    const qrisBox = document.getElementById('payment-qris-edit-box');

    if (show) {
        if (summaryView) summaryView.style.display = 'none';
        if (bankBox) bankBox.style.display = 'none';
        if (qrisBox) qrisBox.style.display = 'block';
    } else {
        if (bankBox) bankBox.style.display = 'none';
        if (qrisBox) qrisBox.style.display = 'none';
        if (summaryView) summaryView.style.display = 'flex';
    }
}

function switchQrisInputTab(mode) {
    activeQrisInputMode = mode;
    const btnUpload = document.getElementById('qris-input-tab-upload');
    const btnString = document.getElementById('qris-input-tab-string');
    const boxUpload = document.getElementById('qris-box-tab-upload');
    const boxString = document.getElementById('qris-box-tab-string');

    if (mode === 'upload') {
        if (btnUpload) { btnUpload.className = 'btn btn-ranch'; }
        if (btnString) { btnString.className = 'btn btn-outline'; }
        if (boxUpload) boxUpload.style.display = 'block';
        if (boxString) boxString.style.display = 'none';
    } else {
        if (btnUpload) { btnUpload.className = 'btn btn-outline'; }
        if (btnString) { btnString.className = 'btn btn-ranch'; }
        if (boxUpload) boxUpload.style.display = 'none';
        if (boxString) boxString.style.display = 'block';
    }
}

function handleQrisCodeStringInput(val) {
    const previewEl = document.getElementById('qris-preview-settings');
    const cleaned = val.trim();
    if (cleaned && previewEl) {
        previewEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(cleaned);
    }
}

async function handleQrisFileSelect(input) {
    const statusEl = document.getElementById('upload-qris-status');
    const previewEl = document.getElementById('qris-preview-settings');
    
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (statusEl) { 
        statusEl.textContent = 'File Dipilih (Belum Disimpan)'; 
        statusEl.style.color = 'var(--ranch-amber)'; 
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (previewEl) previewEl.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function handleUpdateBankSubmit(e) {
    e.preventDefault();
    const bankName = document.getElementById('setting-bank-name').value.trim();
    const bankNumber = document.getElementById('setting-bank-number').value.trim();
    const bankOwner = document.getElementById('setting-bank-owner').value.trim();

    if (!bankName || !bankNumber || !bankOwner) {
        return showNotificationModal('Form Belum Lengkap', 'Semua kolom rekening bank wajib diisi!', '⚠️', 'error');
    }

    showNotificationModal('Sedang Menyimpan...', 'Menyimpan data rekening bank...', '☁️', 'info');

    try {
        await apiRequest('/settings/bank', 'POST', {
            bank_name: bankName,
            bank_number: bankNumber,
            bank_owner: bankOwner
        });

        localStorage.setItem('huma_farm_bank_name', bankName);
        localStorage.setItem('huma_farm_bank_number', bankNumber);
        localStorage.setItem('huma_farm_bank_owner', bankOwner);

        await fetchCloudData();
        updatePaymentSettingsSummaryCards();
        toggleBankEditForm(false);
        showNotificationModal('Data Bank Diperbarui!', `Rekening ${bankName} (${bankNumber} a.n ${bankOwner}) berhasil disimpan.`, '🏦', 'success');
    } catch (err) {
        console.error('API Bank submit error:', err);
        handleCrudError(err, 'Gagal Memperbarui', 'Gagal menyimpan data rekening bank.');
    }
}

async function handleUpdateQrisSubmit(e) {
    e.preventDefault();
    const merchantInput = document.getElementById('setting-qris-merchant');
    const merchantName = merchantInput ? merchantInput.value.trim() : 'Huma Farm';
    const fileInput = document.getElementById('setting-qris-file');
    const codeStringInput = document.getElementById('setting-qris-code-string');
    const previewEl = document.getElementById('qris-preview-settings');

    const formData = new FormData();
    formData.append('qris_merchant', merchantName);

    if (activeQrisInputMode === 'upload' && fileInput && fileInput.files.length > 0) {
        formData.append('qris_image', fileInput.files[0]);
    } else if (activeQrisInputMode === 'string' && codeStringInput && codeStringInput.value.trim()) {
        const generatedUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(codeStringInput.value.trim());
        formData.append('qris_url', generatedUrl);
    } else if (previewEl && previewEl.src) {
        formData.append('qris_url', previewEl.src);
    }

    showNotificationModal('Sedang Menyimpan...', 'Mengunggah QRIS ke server...', '☁️', 'info');

    try {
        const reqHeaders = {
            'Accept': 'application/json'
        };
        const token = adminToken || localStorage.getItem('huma_farm_admin_token');
        if (token) {
            reqHeaders['X-Admin-Token'] = token;
        }

        const response = await fetch('/api/settings/qris', {
            method: 'POST',
            headers: reqHeaders,
            body: formData
        });
        const res = await response.json();
        if (!response.ok) throw new Error(res.message || 'Gagal menyimpan QRIS.');

        localStorage.setItem('huma_farm_qris_merchant', merchantName);
        if (res.qris_image_url) {
            localStorage.setItem('huma_farm_qris_image', normalizeQrisImageUrl(res.qris_image_url));
        } else if (activeQrisInputMode === 'string' && codeStringInput && codeStringInput.value.trim()) {
            const generatedUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(codeStringInput.value.trim());
            localStorage.setItem('huma_farm_qris_image', generatedUrl);
        }

        await fetchCloudData();
        updatePaymentSettingsSummaryCards();
        toggleQrisEditForm(false);

        const statusEl = document.getElementById('upload-qris-status');
        if (statusEl) {
            statusEl.textContent = 'Tersimpan';
            statusEl.style.color = 'var(--ranch-green)';
        }

        showNotificationModal('QRIS Diperbarui!', `Gambar QRIS dan nama merchant (${merchantName}) berhasil disimpan.`, '📱', 'success');
    } catch(err) {
        console.error('API QRIS Submit Error:', err);
        handleCrudError(err, 'Gagal Memperbarui', 'Gagal menyimpan pengaturan QRIS ke server.');
    }
}

async function handleUpdatePhoneSubmit(e) {
    e.preventDefault();
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

    if (currentRole !== 'admin' && !currentUser) {
        return showNotificationModal('Tidak Login', 'Anda harus login terlebih dahulu untuk mengubah nomor WA.', '⚠️', 'error');
    }

    const submitBtn = e.target.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        const userId = (currentUser && currentUser.id) ? currentUser.id : 'admin_user_id';
        await apiRequest('/settings/profile', 'POST', {
            id: userId,
            role: currentRole,
            phone: newPhone,
            old_password: confirmPass
        });
        
        if (currentUser) {
            currentUser.phone = newPhone;
            localStorage.setItem('huma_farm_current_user', JSON.stringify(currentUser));
        }
        localStorage.setItem('huma_farm_admin_phone', newPhone);

        await fetchCloudData();

        document.getElementById('set-new-phone').value = '';
        document.getElementById('set-confirm-curr-pass').value = '';
        loadSettingsPageData();
        closeSettingsModal('modal-settings-phone');
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

    try {
        const userId = (currentUser && currentUser.id) ? currentUser.id : 'admin_user_id';
        await apiRequest('/settings/profile', 'POST', {
            id: userId,
            role: currentRole,
            old_password: oldPass,
            password: newPass
        });
        await fetchCloudData();
        clearFields();
        closeSettingsModal('modal-settings-password');
        showNotificationModal('Password Diperbarui!', 'Password akun Anda berhasil diperbarui di server.', '🔑', 'success');
    } catch (err) {
        console.error('API update password error:', err);
        showNotificationModal('Password Lama Salah', err.message || 'Password lama yang Anda masukkan salah!', '🔑', 'error');
    } finally {
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

function closeSuccessPanenModal() {
    const modal = document.getElementById('modal-success-panen');
    if (modal) modal.classList.remove('active');
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

    const negeriQty = parseInt(document.getElementById('input-panen-negeri').value, 10) || 0;
    const kampungQty = parseInt(document.getElementById('input-panen-kampung').value, 10) || 0;
    const dateVal = document.getElementById('input-panen-date').value;
    
    // Resolve the reason
    const reasonSelect = document.getElementById('input-panen-reason');
    const reasonCustomInput = document.getElementById('input-panen-reason-custom');
    let reasonVal = '';
    if (reasonSelect) {
        if (reasonSelect.value === 'custom' && reasonCustomInput) {
            reasonVal = reasonCustomInput.value.trim();
        } else {
            reasonVal = reasonSelect.value;
        }
    }

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
        ? 'Panen dari kandang' 
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
        
        // Populate and show custom success modal
        const isAdd = currentPanenMode === 'add';
        const sign = isAdd ? '+' : '-';
        
        const succIcon = document.getElementById('succ-modal-icon');
        const succTitle = document.getElementById('succ-modal-title');
        const succSubtitle = document.getElementById('succ-modal-subtitle');
        const succQtyNegeri = document.getElementById('succ-qty-negeri');
        const succQtyKampung = document.getElementById('succ-qty-kampung');
        const succDate = document.getElementById('succ-date-val');

        if (succIcon) succIcon.textContent = isAdd ? '🎉' : '➖';
        if (succTitle) succTitle.textContent = isAdd ? 'Hasil Panen Berhasil Diinput!' : 'Stok Telur Berhasil Dikurangi!';
        if (succSubtitle) succSubtitle.textContent = isAdd ? 'Catatan penambahan stok telur panen harian berhasil disimpan.' : 'Catatan pengurangan stok telur berhasil disimpan.';
        
        if (succQtyNegeri) {
            succQtyNegeri.textContent = `${sign}${negeriQty} Butir`;
            succQtyNegeri.style.color = isAdd ? 'var(--ranch-amber)' : 'var(--ranch-rose)';
        }
        if (succQtyKampung) {
            succQtyKampung.textContent = `${sign}${kampungQty} Butir`;
            succQtyKampung.style.color = isAdd ? 'var(--ranch-green)' : 'var(--ranch-rose)';
        }
        if (succDate) succDate.textContent = formatIndonesianDate(dateVal);

        closeSystemNotificationModal(); // Close loading notification modal automatically before showing success modal

        const succModal = document.getElementById('modal-success-panen');
        if (succModal) succModal.classList.add('active');
    } catch (err) {
        closeSystemNotificationModal(); // Close loading notification modal on error
        console.error('API panen submit error:', err);
        handleCrudError(err, 'Gagal Menyimpan', 'Gagal menyinkronkan data panen ke server.');
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
        handleCrudError(err, 'Gagal Menghapus', 'Gagal menghapus data dari server.');
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

function openSettingsModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        if (id === 'modal-settings-avatar') {
            loadSettingsPageData();
        } else if (id === 'modal-settings-payment') {
            updatePaymentSettingsSummaryCards();
            toggleBankEditForm(false);
            toggleQrisEditForm(false);
        }
    }
}

function closeSettingsModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function confirmLogoutAction() {
    closeLogoutConfirmModal();
    // Stop the periodic session checker
    stopAdminSessionChecker();
    currentRole = 'visitor';
    currentUser = null;
    // Clear admin token so session is fully invalidated
    adminToken = null;
    localStorage.removeItem('huma_farm_admin_token');
    localStorage.setItem('huma_farm_role', 'visitor');
    localStorage.removeItem('huma_farm_current_user');
    sessionStorage.removeItem('huma_farm_active_page');
    updateRoleVisibility();
    showCenterWelcome();
}

// ============================================================
// SESSION EXPIRED MODAL - Shown when admin token is invalid
// ============================================================

function showSessionExpiredModal() {
    // First perform the logout silently (switch to visitor mode)
    currentRole = 'visitor';
    currentUser = null;
    adminToken = null;
    localStorage.removeItem('huma_farm_admin_token');
    localStorage.setItem('huma_farm_role', 'visitor');
    localStorage.removeItem('huma_farm_current_user');
    sessionStorage.removeItem('huma_farm_active_page');
    updateRoleVisibility();
    navigateTo('dashboard');

    // Stop the session checker if running
    if (window._adminSessionCheckerInterval) {
        clearInterval(window._adminSessionCheckerInterval);
        window._adminSessionCheckerInterval = null;
    }

    // Show the session expired modal
    const modal = document.getElementById('modal-session-expired');
    if (modal) modal.classList.add('active');
}

function closeSessionExpiredModal() {
    const modal = document.getElementById('modal-session-expired');
    if (modal) modal.classList.remove('active');
}

// ============================================================
// ADMIN SESSION CHECKER - Ping server every 5 minutes to detect expired token
// ============================================================

function startAdminSessionChecker() {
    // Clear any existing checker first
    if (window._adminSessionCheckerInterval) {
        clearInterval(window._adminSessionCheckerInterval);
    }
    // Check every 5 minutes (300000ms)
    window._adminSessionCheckerInterval = setInterval(async () => {
        if (currentRole !== 'admin' || !adminToken) {
            clearInterval(window._adminSessionCheckerInterval);
            window._adminSessionCheckerInterval = null;
            return;
        }
        try {
            // Ping the auth check endpoint to verify token is still valid
            const resp = await fetch(`${API_BASE}/auth/check`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Admin-Token': adminToken
                }
            });
            if (resp.status === 401 || resp.status === 403) {
                showSessionExpiredModal();
            }
        } catch (e) {
            // Network error — ignore silently, don't log out
        }
    }, 5 * 60 * 1000);
}

function stopAdminSessionChecker() {
    if (window._adminSessionCheckerInterval) {
        clearInterval(window._adminSessionCheckerInterval);
        window._adminSessionCheckerInterval = null;
    }
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

                // Start periodic session validity checker
                startAdminSessionChecker();
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

let currentCashFlowType = 'expense'; // 'expense' | 'income'

function switchCashFlowTab(type) {
    currentCashFlowType = type || 'expense';

    const tabExpense = document.getElementById('tab-cashflow-expense');
    const tabIncome = document.getElementById('tab-cashflow-income');

    const modalTitle = document.getElementById('cashflow-modal-title');
    const modalSub = document.getElementById('cashflow-modal-subtitle');
    const catLabel = document.getElementById('cashflow-category-label');
    const catSelect = document.getElementById('expense-category');
    const amtLabel = document.getElementById('cashflow-amount-label');
    const submitBtn = document.getElementById('cashflow-submit-btn');

    if (currentCashFlowType === 'expense') {
        if (tabExpense) {
            tabExpense.className = 'btn btn-ranch';
            tabExpense.style.background = '';
        }
        if (tabIncome) {
            tabIncome.className = 'btn btn-outline';
        }

        if (modalTitle) modalTitle.textContent = '📤 Catat Pengeluaran Kas Usaha';
        if (modalSub) modalSub.textContent = 'Masukkan pengeluaran kas untuk operasional kandang, pakan, obat, dll.';
        if (catLabel) catLabel.textContent = '📌 Kategori Pengeluaran:';
        if (amtLabel) amtLabel.textContent = '💰 Jumlah Nominal Pengeluaran (Rp):';

        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Pembelian Pakan">🌾 Pembelian Pakan Ayam</option>
                <option value="Obat & Vitamin">💊 Obat, Nutrisi & Vitamin</option>
                <option value="Peralatan Kandang">🛠️ Peralatan & Perawatan Kandang</option>
                <option value="Gaji & Operasional">👷 Gaji & Biaya Operasional</option>
                <option value="custom">✏️ + Kategori Lainnya (Ketik Manual)...</option>
            `;
        }

        if (submitBtn) {
            submitBtn.innerHTML = '💸 Simpan Pengeluaran';
            submitBtn.style.background = 'linear-gradient(135deg, #be123c, #e11d48)';
            submitBtn.style.borderColor = 'rgba(225,29,72,0.4)';
        }
    } else {
        if (tabIncome) {
            tabIncome.className = 'btn btn-ranch';
            tabIncome.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (tabExpense) {
            tabExpense.className = 'btn btn-outline';
        }

        if (modalTitle) modalTitle.textContent = '📥 Catat Pemasukan Kas Usaha';
        if (modalSub) modalSub.textContent = 'Masukkan kas uang masuk non-toko, hasil penjualan afkir, modal, dll.';
        if (catLabel) catLabel.textContent = '📌 Kategori Pemasukan:';
        if (amtLabel) amtLabel.textContent = '💰 Jumlah Nominal Pemasukan (Rp):';

        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Penjualan Off-Grid">🥚 Penjualan Telur Non-Toko / Off-Grid</option>
                <option value="Penjualan Afkir">📦 Penjualan Ayam / Afkir</option>
                <option value="Injeksi Modal">💵 Modal / Injeksi Kas Tambahan</option>
                <option value="Subsidi / Lainnya">🎁 Hibah / Subsidi / Lainnya</option>
                <option value="custom">✏️ + Kategori Lainnya (Ketik Manual)...</option>
            `;
        }

        if (submitBtn) {
            submitBtn.innerHTML = '📥 Simpan Pemasukan';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            submitBtn.style.borderColor = 'rgba(16,185,129,0.4)';
        }
    }

    if (catSelect) handleCashFlowCategoryChange(catSelect);
}

function handleCashFlowCategoryChange(selectEl) {
    const customRow = document.getElementById('cashflow-custom-cat-row');
    const customInput = document.getElementById('expense-custom-category');
    if (!customRow) return;

    if (selectEl && selectEl.value === 'custom') {
        customRow.style.display = 'block';
        if (customInput) customInput.focus();
    } else {
        customRow.style.display = 'none';
        if (customInput) customInput.value = '';
    }
}

function updateDashboardData() {
    if (typeof renderKeuanganData === 'function') {
        renderKeuanganData();
    }
}

function renderKeuanganData() {
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');
    const expenses = JSON.parse(localStorage.getItem('huma_farm_expenses') || '[]');

    const knownIncomeCategories = ['Injeksi Modal', 'Penjualan Off-Grid', 'Penjualan Afkir', 'Subsidi / Lainnya', 'Pemasukan Kas'];

    // Calculate total income from completed/lunas orders AND cash flow income entries
    let totalIncome = 0;
    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            totalIncome += (o.totalPrice || 0);
        }
    });

    let totalExpense = 0;
    expenses.forEach(e => {
        const isInc = e.type === 'income' || (!e.type && knownIncomeCategories.includes(e.category));
        if (isInc) {
            totalIncome += (e.amount || 0);
        } else {
            totalExpense += (e.amount || 0);
        }
    });

    const netBalance = totalIncome - totalExpense;

    // Render Summary Cards
    const balEl = document.getElementById('wallet-total-balance');
    const incEl = document.getElementById('wallet-total-income');
    const expEl = document.getElementById('wallet-total-expense');

    if (balEl) balEl.textContent = 'Rp ' + netBalance.toLocaleString('id-ID');
    if (incEl) incEl.textContent = 'Rp ' + totalIncome.toLocaleString('id-ID');
    if (expEl) expEl.textContent = 'Rp ' + totalExpense.toLocaleString('id-ID');

    // Calculate Unique Customer Count from order history
    const customerSet = new Set();
    orders.forEach(o => {
        const name = (o.buyerName || '').trim().toLowerCase();
        const phone = formatPhoneNumberForWa(o.buyerPhone || o.phone || '');
        if (name && name !== 'pengunjung' && name !== 'visitor') {
            customerSet.add(`${name}|${phone}`);
        }
    });

    // Also update Dashboard KPI Cards if Admin
    const kpiInc = document.getElementById('kpi-income-val');
    const kpiExp = document.getElementById('kpi-expense-val');
    const kpiBal = document.getElementById('kpi-balance-val');
    const kpiCust = document.getElementById('kpi-customers-val');
    const kpiOrdersCount = document.getElementById('kpi-orders-count-val');
    const kpiExpensesCount = document.getElementById('kpi-expenses-count-val');

    if (kpiInc) kpiInc.textContent = 'Rp ' + totalIncome.toLocaleString('id-ID');
    if (kpiExp) kpiExp.textContent = 'Rp ' + totalExpense.toLocaleString('id-ID');
    if (kpiBal) kpiBal.textContent = 'Rp ' + netBalance.toLocaleString('id-ID');
    if (kpiCust) kpiCust.textContent = customerSet.size;

    // Calculate Egg Distribution Stats (Negeri vs Kampung)
    const panenHistory = JSON.parse(localStorage.getItem('huma_farm_panen_history') || '[]');
    let distNegeriPanen = 0, distNegeriJual = 0, distNegeriKonsumsi = 0, distNegeriSedekah = 0;
    let distKampungPanen = 0, distKampungJual = 0, distKampungKonsumsi = 0, distKampungSedekah = 0;

    panenHistory.forEach(item => {
        const neg = parseInt(item.negeri || 0);
        const kam = parseInt(item.kampung || 0);
        if (item.type === 'add') {
            distNegeriPanen += neg;
            distKampungPanen += kam;
        } else if (item.type === 'sub') {
            const reason = (item.reason || '').toLowerCase();
            if (reason.includes('sedekah') || reason.includes('zakat') || reason.includes('hadiah') || reason.includes('bonus')) {
                distNegeriSedekah += neg;
                distKampungSedekah += kam;
            } else {
                distNegeriKonsumsi += neg;
                distKampungKonsumsi += kam;
            }
        }
    });

    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            const eggs = parseInt(o.totalEggs || 0) || ((o.unit === 'pack' ? (o.qty * 10) : o.qty) || 0);
            const isReward = o.isReward || parseFloat(o.totalPrice || 0) === 0 || (o.category && o.category.includes('bonus'));
            
            if (o.category === 'negeri') {
                if (isReward) {
                    distNegeriSedekah += eggs;
                } else {
                    distNegeriJual += eggs;
                }
            } else if (o.category === 'kampung') {
                if (isReward) {
                    distKampungSedekah += eggs;
                } else {
                    distKampungJual += eggs;
                }
            }
        }
    });

    const elNPanen = document.getElementById('dist-negeri-panen');
    const elNJual = document.getElementById('dist-negeri-jual');
    const elNKonsumsi = document.getElementById('dist-negeri-konsumsi');
    const elNSedekah = document.getElementById('dist-negeri-sedekah');

    const elKPanen = document.getElementById('dist-kampung-panen');
    const elKJual = document.getElementById('dist-kampung-jual');
    const elKKonsumsi = document.getElementById('dist-kampung-konsumsi');
    const elKSedekah = document.getElementById('dist-kampung-sedekah');

    if (elNPanen) elNPanen.textContent = distNegeriPanen + ' Butir';
    if (elNJual) elNJual.textContent = distNegeriJual + ' Butir';
    if (elNKonsumsi) elNKonsumsi.textContent = distNegeriKonsumsi + ' Butir';
    if (elNSedekah) elNSedekah.textContent = distNegeriSedekah + ' Butir';

    if (elKPanen) elKPanen.textContent = distKampungPanen + ' Butir';
    if (elKJual) elKJual.textContent = distKampungJual + ' Butir';
    if (elKKonsumsi) elKKonsumsi.textContent = distKampungKonsumsi + ' Butir';
    if (elKSedekah) elKSedekah.textContent = distKampungSedekah + ' Butir';

    // Update Dashboard Stok Ready (Total Butir, Pack, Eceran)
    const activeStock = typeof getCalculatedReadyStock === 'function' ? getCalculatedReadyStock() : { negeri: 0, kampung: 0 };
    
    const dashStokNegeri = document.getElementById('dash-stok-negeri');
    const dashStokNegeriPack = document.getElementById('dash-stok-negeri-pack');
    const dashStokNegeriEceran = document.getElementById('dash-stok-negeri-eceran');

    const dashStokKampung = document.getElementById('dash-stok-kampung');
    const dashStokKampungPack = document.getElementById('dash-stok-kampung-pack');
    const dashStokKampungEceran = document.getElementById('dash-stok-kampung-eceran');

    if (dashStokNegeri) dashStokNegeri.textContent = activeStock.negeri + ' Butir';
    if (dashStokNegeriPack) dashStokNegeriPack.textContent = Math.floor(activeStock.negeri / 10) + ' Pack (Isi 10)';
    if (dashStokNegeriEceran) dashStokNegeriEceran.textContent = (activeStock.negeri % 10) + ' Butir Eceran';

    if (dashStokKampung) dashStokKampung.textContent = activeStock.kampung + ' Butir';
    if (dashStokKampungPack) dashStokKampungPack.textContent = Math.floor(activeStock.kampung / 10) + ' Pack (Isi 10)';
    if (dashStokKampungEceran) dashStokKampungEceran.textContent = (activeStock.kampung % 10) + ' Butir Eceran';

    // Update Sales Summary Box (Total Transaksi & Total Pelanggan berdasarkan riwayat)
    const uniqueOrdersSet = new Set();
    orders.forEach(o => {
        const baseId = typeof getBaseOrderId === 'function' ? getBaseOrderId(o.id) : o.id;
        if (baseId) uniqueOrdersSet.add(baseId);
    });

    const elTotalTrans = document.getElementById('dash-total-transactions-val');
    const elTotalCust = document.getElementById('dash-total-customers-val');

    if (elTotalTrans) elTotalTrans.textContent = uniqueOrdersSet.size + ' Transaksi';
    if (elTotalCust) elTotalCust.textContent = customerSet.size + ' Pelanggan';

    // Render EggFlow Charts (1 Bulan & 1 Tahun)
    renderDashboardCharts();

    // Render Egg Trooper Population Data
    renderEggTrooperData();

    // Render Transactions History (Combined Pemasukan & Pengeluaran)
    const container = document.getElementById('wallet-transaction-list');
    if (!container) return;

    let mutasiList = [];

    // Group Lunas store orders by base order ID (#ORD-xxxx) to avoid duplicate rows for multi-item/reward orders
    const storeOrderGroupMap = {};
    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            const baseId = getBaseOrderId(o.id);
            if (!storeOrderGroupMap[baseId]) {
                storeOrderGroupMap[baseId] = {
                    baseOrderId: baseId,
                    buyerName: o.buyerName || 'Pembeli',
                    totalAmount: 0,
                    itemSummaries: [],
                    date: o.createdAt ? o.createdAt.split('T')[0] : (o.date || new Date().toISOString().split('T')[0])
                };
            }

            storeOrderGroupMap[baseId].totalAmount += (o.totalPrice || 0);

            let label = `${o.qty} ${o.unit === 'pack' ? 'Pack' : 'Butir'} ${o.category === 'negeri' ? 'Telur Negeri' : 'Telur Kampung'}`;
            if (o.totalPrice === 0 || o.category === 'reward') {
                label = `🎁 ${o.qty} ${o.unit === 'pack' ? 'Pack' : 'Butir'} Telur Kampung (Bonus)`;
            }
            storeOrderGroupMap[baseId].itemSummaries.push(label);
        }
    });

    Object.values(storeOrderGroupMap).forEach(g => {
        mutasiList.push({
            id: `group_${g.baseOrderId}`,
            baseOrderId: g.baseOrderId,
            type: 'income',
            isStoreOrder: true,
            category: `Penjualan Toko (${g.buyerName})`,
            amount: g.totalAmount,
            note: g.itemSummaries.join(' + '),
            date: g.date
        });
    });

    expenses.forEach(e => {
        const isInc = e.type === 'income' || (!e.type && knownIncomeCategories.includes(e.category));
        mutasiList.push({
            id: e.id,
            type: isInc ? 'income' : 'expense',
            isManualCashFlow: true,
            category: e.category || (isInc ? 'Pemasukan Kas' : 'Pengeluaran Kas'),
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
        const canEditOrDelete = item.isManualCashFlow && currentRole === 'admin';

        const orderBadge = item.isStoreOrder && item.baseOrderId ? 
            `<span style="font-size: 0.65rem; background: var(--ranch-amber-light, rgba(245,158,11,0.15)); color: var(--ranch-amber, #f59e0b); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3); font-weight: 700;">📦 #${item.baseOrderId}</span>` : '';

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem; width: 32px; height: 32px; background: var(--bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); flex-shrink: 0;">${icon}</span>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <strong style="font-size: 0.8rem; color: var(--text-main);">${item.category}</strong>
                            ${orderBadge}
                        </div>
                        <span style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-top: 2px;">${item.note} • 📅 ${formatIndonesianDate(item.date)}</span>
                    </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                    <strong style="font-size: 0.88rem;" class="${colorClass}">${prefix}${item.amount.toLocaleString('id-ID')}</strong>
                    ${canEditOrDelete ? `
                        <div style="display: flex; gap: 4px; justify-content: flex-end; margin-top: 4px;">
                            <button class="btn btn-outline" style="font-size: 0.62rem; padding: 1px 6px; min-height: 20px;" onclick="openEditCashFlowModal('${item.id}')">✏️ Edit</button>
                            <button class="btn btn-rose" style="font-size: 0.62rem; padding: 1px 6px; min-height: 20px;" onclick="deleteExpenseRecord('${item.id}')">🗑️ Hapus</button>
                        </div>
                    ` : ''}
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
    const customInput = document.getElementById('expense-custom-category');
    if (amt) amt.value = '';
    if (note) note.value = '';
    if (customInput) customInput.value = '';
    if (dt) dt.value = new Date().toISOString().split('T')[0];

    switchCashFlowTab('expense');
    modal.classList.add('active');
}

function closeInputPengeluaranModal() {
    const modal = document.getElementById('modal-input-pengeluaran');
    if (modal) modal.classList.remove('active');
}

async function handleInputPengeluaranSubmit(e) {
    e.preventDefault();
    const catSelect = document.getElementById('expense-category');
    let category = catSelect ? catSelect.value : 'Lain-lain';

    if (category === 'custom') {
        const customInput = document.getElementById('expense-custom-category');
        const customVal = customInput ? customInput.value.trim() : '';
        if (!customVal) {
            showNotificationModal('Kategori Kosong', 'Silakan ketik nama kategori kustom Anda.', '✏️', 'error');
            return;
        }
        category = customVal;
    }

    const amount = parseInt(document.getElementById('expense-amount').value, 10) || 0;
    const note = document.getElementById('expense-note').value.trim();
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
    const type = currentCashFlowType || 'expense';

    if (amount <= 0) return;

    const actionText = type === 'income' ? 'pemasukan' : 'pengeluaran';
    showNotificationModal('Sedang Menyimpan...', `Mengunggah data ${actionText} ke server...`, '☁️', 'info');
    try {
        await apiRequest('/expenses', 'POST', {
            type,
            category,
            amount,
            note,
            date
        });
        await fetchCloudData();
        renderKeuanganData();
        updateDashboardData();
        closeInputPengeluaranModal();

        const successTitle = type === 'income' ? 'Pemasukan Disimpan!' : 'Pengeluaran Disimpan!';
        const successIcon = type === 'income' ? '📥' : '💸';
        showNotificationModal(
            successTitle,
            `Transaksi ${actionText} kas sebesar <strong>Rp ${amount.toLocaleString('id-ID')}</strong> (${category}) telah dicatat ke kas dompet.`,
            successIcon,
            'success'
        );
    } catch (err) {
        console.error('API insert expense/income error:', err);
        handleCrudError(err, 'Gagal Menyimpan', `Gagal menyinkronkan data ${actionText} ke server.`);
    }
}

// EDIT CASH FLOW ENGINE
let currentEditCashFlowType = 'expense';

function switchEditCashFlowTab(type, targetCategory = null) {
    currentEditCashFlowType = type || 'expense';

    const tabExpense = document.getElementById('tab-edit-cashflow-expense');
    const tabIncome = document.getElementById('tab-edit-cashflow-income');

    const modalTitle = document.getElementById('edit-cashflow-modal-title');
    const catLabel = document.getElementById('edit-cashflow-category-label');
    const catSelect = document.getElementById('edit-expense-category');
    const amtLabel = document.getElementById('edit-cashflow-amount-label');
    const submitBtn = document.getElementById('edit-cashflow-submit-btn');

    if (currentEditCashFlowType === 'expense') {
        if (tabExpense) {
            tabExpense.className = 'btn btn-ranch';
            tabExpense.style.background = '';
        }
        if (tabIncome) {
            tabIncome.className = 'btn btn-outline';
        }

        if (modalTitle) modalTitle.textContent = '✏️ Edit Catatan Pengeluaran';
        if (catLabel) catLabel.textContent = '📌 Kategori Pengeluaran:';
        if (amtLabel) amtLabel.textContent = '💰 Jumlah Nominal Pengeluaran (Rp):';

        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Pembelian Pakan">🌾 Pembelian Pakan Ayam</option>
                <option value="Obat & Vitamin">💊 Obat, Nutrisi & Vitamin</option>
                <option value="Peralatan Kandang">🛠️ Peralatan & Perawatan Kandang</option>
                <option value="Gaji & Operasional">👷 Gaji & Biaya Operasional</option>
                <option value="custom">✏️ + Kategori Lainnya (Ketik Manual)...</option>
            `;
        }

        if (submitBtn) {
            submitBtn.innerHTML = '💾 Simpan Perubahan';
            submitBtn.style.background = 'linear-gradient(135deg, #be123c, #e11d48)';
            submitBtn.style.borderColor = 'rgba(225,29,72,0.4)';
        }
    } else {
        if (tabIncome) {
            tabIncome.className = 'btn btn-ranch';
            tabIncome.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
        if (tabExpense) {
            tabExpense.className = 'btn btn-outline';
        }

        if (modalTitle) modalTitle.textContent = '✏️ Edit Catatan Pemasukan';
        if (catLabel) catLabel.textContent = '📌 Kategori Pemasukan:';
        if (amtLabel) amtLabel.textContent = '💰 Jumlah Nominal Pemasukan (Rp):';

        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Penjualan Off-Grid">🥚 Penjualan Telur Non-Toko / Off-Grid</option>
                <option value="Penjualan Afkir">📦 Penjualan Ayam / Afkir</option>
                <option value="Injeksi Modal">💵 Modal / Injeksi Kas Tambahan</option>
                <option value="Subsidi / Lainnya">🎁 Hibah / Subsidi / Lainnya</option>
                <option value="custom">✏️ + Kategori Lainnya (Ketik Manual)...</option>
            `;
        }

        if (submitBtn) {
            submitBtn.innerHTML = '💾 Simpan Perubahan';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            submitBtn.style.borderColor = 'rgba(16,185,129,0.4)';
        }
    }

    if (catSelect && targetCategory) {
        const templateOptions = Array.from(catSelect.options).map(o => o.value);
        const customRow = document.getElementById('edit-cashflow-custom-cat-row');
        const customInput = document.getElementById('edit-expense-custom-category');

        if (templateOptions.includes(targetCategory)) {
            catSelect.value = targetCategory;
            if (customRow) customRow.style.display = 'none';
            if (customInput) customInput.value = '';
        } else {
            catSelect.value = 'custom';
            if (customRow) customRow.style.display = 'block';
            if (customInput) customInput.value = targetCategory;
        }
    } else if (catSelect) {
        handleEditCashFlowCategoryChange(catSelect);
    }
}

function handleEditCashFlowCategoryChange(selectEl) {
    const customRow = document.getElementById('edit-cashflow-custom-cat-row');
    const customInput = document.getElementById('edit-expense-custom-category');
    if (!customRow) return;

    if (selectEl && selectEl.value === 'custom') {
        customRow.style.display = 'block';
        if (customInput) customInput.focus();
    } else {
        customRow.style.display = 'none';
        if (customInput) customInput.value = '';
    }
}

function openEditCashFlowModal(id) {
    const expenses = JSON.parse(localStorage.getItem('huma_farm_expenses') || '[]');
    const item = expenses.find(e => e.id === id);
    if (!item) {
        showNotificationModal('Tidak Ditemukan', 'Catatan cashflow tidak ditemukan!', '⚠️', 'error');
        return;
    }

    const modal = document.getElementById('modal-edit-cashflow');
    if (!modal) return;

    const knownIncomeCategories = ['Injeksi Modal', 'Penjualan Off-Grid', 'Penjualan Afkir', 'Subsidi / Lainnya', 'Pemasukan Kas'];
    const itemType = item.type || (knownIncomeCategories.includes(item.category) ? 'income' : 'expense');

    document.getElementById('edit-expense-id').value = item.id;
    document.getElementById('edit-expense-amount').value = item.amount || '';
    document.getElementById('edit-expense-note').value = item.note || '';
    document.getElementById('edit-expense-date').value = item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0];

    switchEditCashFlowTab(itemType, item.category);

    modal.classList.add('active');
}

function closeEditCashFlowModal() {
    const modal = document.getElementById('modal-edit-cashflow');
    if (modal) modal.classList.remove('active');
}

async function handleEditCashFlowSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-expense-id').value;
    const catSelect = document.getElementById('edit-expense-category');
    let category = catSelect ? catSelect.value : 'Lain-lain';

    if (category === 'custom') {
        const customInput = document.getElementById('edit-expense-custom-category');
        const customVal = customInput ? customInput.value.trim() : '';
        if (!customVal) {
            showNotificationModal('Kategori Kosong', 'Silakan ketik nama kategori kustom Anda.', '✏️', 'error');
            return;
        }
        category = customVal;
    }

    const amount = parseInt(document.getElementById('edit-expense-amount').value, 10) || 0;
    const note = document.getElementById('edit-expense-note').value.trim();
    const date = document.getElementById('edit-expense-date').value || new Date().toISOString().split('T')[0];
    const type = currentEditCashFlowType || 'expense';

    if (amount <= 0) return;

    showNotificationModal('Sedang Menyimpan...', 'Memperbarui catatan cash flow di server...', '☁️', 'info');
    try {
        await apiRequest(`/expenses/${id}`, 'PUT', {
            type,
            category,
            amount,
            note,
            date
        });
        await fetchCloudData();
        renderKeuanganData();
        updateDashboardData();
        closeEditCashFlowModal();

        showNotificationModal(
            'Catatan Diperbarui!',
            `Catatan cash flow <strong>${category}</strong> (Rp ${amount.toLocaleString('id-ID')}) berhasil diperbarui.`,
            '✏️',
            'success'
        );
    } catch (err) {
        console.error('API edit expense error:', err);
        handleCrudError(err, 'Gagal Menyimpan', 'Gagal memperbarui catatan cash flow di server.');
    }
}

async function deleteExpenseRecord(id) {
    showNotificationModal('Sedang Menghapus...', 'Menghapus catatan kas di server...', '☁️', 'info');
    try {
        await apiRequest(`/expenses/${id}`, 'DELETE');
        await fetchCloudData();
        renderKeuanganData();
        updateDashboardData();
        showNotificationModal(
            'Catatan Dihapus',
            'Catatan mutasi kas berhasil dihapus.',
            '🗑️',
            'info'
        );
    } catch (err) {
        console.error('API delete expense error:', err);
        handleCrudError(err, 'Gagal Menghapus', 'Gagal menghapus data dari server.');
    }
}

// ============================================================
// LEADERBOARD / RANKING PEMBELI ENGINE
// ============================================================

function renderLeaderboardData() {
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');

    // Group all completed / Lunas orders by buyer identity (name + phone)
    const buyerMap = {};
    let totalEggsSoldAll = 0;

    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            const rawName = (o.buyerName || 'Pembeli').trim();
            const phone = formatPhoneNumberForWa(o.buyerPhone || o.phone || '');
            const key = `${rawName.toLowerCase()}|${phone}`;

            if (!buyerMap[key]) {
                buyerMap[key] = {
                    name: rawName,
                    phone: phone,
                    totalSpend: 0,
                    totalPacks: 0,
                    totalEggs: 0,
                    orderCount: 0
                };
            }

            buyerMap[key].totalSpend += (o.totalPrice || 0);
            buyerMap[key].orderCount += 1;

            let eggsInRow = 0;
            if (o.unit === 'pack') {
                eggsInRow = (o.qty || 0) * 10;
                buyerMap[key].totalPacks += (o.qty || 0);
            } else {
                eggsInRow = (o.qty || 0);
            }
            buyerMap[key].totalEggs += eggsInRow;
            totalEggsSoldAll += eggsInRow;
        }
    });

    const leaderboard = Object.values(buyerMap).sort((a, b) => {
        if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
        return b.totalEggs - a.totalEggs;
    });

    // Update Header Summary Stats
    const totalBuyersEl = document.getElementById('lb-stat-total-buyers');
    const totalEggsEl = document.getElementById('lb-stat-total-eggs');
    const topBuyerEl = document.getElementById('lb-stat-top-buyer');

    if (totalBuyersEl) totalBuyersEl.textContent = leaderboard.length;
    if (totalEggsEl) totalEggsEl.textContent = totalEggsSoldAll.toLocaleString('id-ID') + ' Btr';
    if (topBuyerEl) topBuyerEl.textContent = leaderboard.length > 0 ? leaderboard[0].name : '-';

    const podiumContainer = document.getElementById('leaderboard-podium-container');
    const listContainer = document.getElementById('leaderboard-ranking-list');

    if (!listContainer) return;

    if (leaderboard.length === 0) {
        if (podiumContainer) podiumContainer.innerHTML = '';
        listContainer.innerHTML = `
            <div class="card-placeholder" style="margin-top: 6px; text-align: center; padding: 24px 16px;">
                <span class="placeholder-icon" style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🏆</span>
                <strong style="color: var(--text-main); font-size: 0.95rem; display: block; margin-bottom: 4px;">Belum Ada Data Peringkat</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">Selesaikan pesanan telur pertama Anda di Toko untuk masuk ke Papan Peringkat!</p>
                <button type="button" class="btn btn-ranch" style="font-size: 0.8rem; padding: 6px 16px;" onclick="navigateTo('toko')">🛒 Belanja Telur Sekarang</button>
            </div>
        `;
        return;
    }

    // Helper for buyer tier badge
    function getBuyerBadge(spend, eggs) {
        if (spend >= 500000 || eggs >= 150) {
            return { label: '👑 Sultan Telur', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
        } else if (spend >= 200000 || eggs >= 80) {
            return { label: '🥇 Juragan Telur', color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)' };
        } else if (spend >= 100000 || eggs >= 40) {
            return { label: '🥈 Pelanggan Setia', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)' };
        }
        return { label: '🥉 Sahabat Huma', color: '#b45309', bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.3)' };
    }

    // 1. RENDER TOP 3 PODIUM
    if (podiumContainer) {
        const top3 = leaderboard.slice(0, 3);
        // Order for podium display: [ #2 (Left), #1 (Center/Tall), #3 (Right) ]
        let displayOrder = [];
        if (top3.length === 1) displayOrder = [top3[0]];
        else if (top3.length === 2) displayOrder = [top3[1], top3[0]];
        else displayOrder = [top3[1], top3[0], top3[2]];

        podiumContainer.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: flex-end; gap: 8px; margin-top: 8px; margin-bottom: 4px;">
                ${displayOrder.map(b => {
                    const rankIdx = leaderboard.indexOf(b) + 1;
                    const isFirst = rankIdx === 1;
                    const isSecond = rankIdx === 2;
                    const isThird = rankIdx === 3;

                    const medalIcon = isFirst ? '🥇' : (isSecond ? '🥈' : '🥉');
                    const borderColor = isFirst ? '#f59e0b' : (isSecond ? '#94a3b8' : '#b45309');
                    const cardBg = isFirst ? 'linear-gradient(180deg, rgba(245,158,11,0.2) 0%, rgba(20,20,20,0.85) 100%)' : 'var(--bg-card-subtle)';
                    const cardHeight = isFirst ? '145px' : (isSecond ? '130px' : '120px');
                    const badge = getBuyerBadge(b.totalSpend, b.totalEggs);

                    return `
                        <div style="flex: 1; min-width: 90px; max-width: 120px; background: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: ${cardHeight}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative;">
                            <div>
                                <div style="font-size: 1.3rem; line-height: 1; margin-bottom: 2px;">${medalIcon}</div>
                                <strong style="font-size: 0.78rem; color: var(--text-main); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.name}</strong>
                                <span style="font-size: 0.62rem; color: ${borderColor}; font-weight: 700; display: block; margin-top: 1px;">${badge.label}</span>
                            </div>
                            <div style="border-top: 1px dashed ${borderColor}; padding-top: 4px; margin-top: 4px;">
                                <strong style="font-size: 0.75rem; color: var(--ranch-amber); display: block;">Rp ${b.totalSpend.toLocaleString('id-ID')}</strong>
                                <span style="font-size: 0.62rem; color: var(--text-muted);">${b.totalEggs} Btr (${b.orderCount}x)</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 2. RENDER FULL RANKED LIST
    listContainer.innerHTML = leaderboard.map((b, idx) => {
        const rankNum = idx + 1;
        const badge = getBuyerBadge(b.totalSpend, b.totalEggs);
        const rankColor = rankNum === 1 ? '#f59e0b' : (rankNum === 2 ? '#94a3b8' : (rankNum === 3 ? '#b45309' : 'var(--text-muted)'));
        const phoneFormatted = b.phone ? (b.phone.substring(0, 5) + '****' + b.phone.substring(b.phone.length - 2)) : '';

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 0.85rem; font-weight: 900; color: ${rankColor}; width: 26px; height: 26px; background: var(--bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid ${rankColor}; flex-shrink: 0;">#${rankNum}</span>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <strong style="font-size: 0.82rem; color: var(--text-main);">${b.name}</strong>
                            <span style="font-size: 0.62rem; background: ${badge.bg}; color: ${badge.color}; padding: 1px 6px; border-radius: 4px; border: 1px solid ${badge.border}; font-weight: 700;">${badge.label}</span>
                        </div>
                        <span style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-top: 2px;">📱 ${phoneFormatted || 'Pelanggan'} • 🛒 ${b.orderCount} Transaksi Pesanan</span>
                    </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                    <strong style="font-size: 0.85rem; color: var(--ranch-amber);">Rp ${b.totalSpend.toLocaleString('id-ID')}</strong>
                    <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">🥚 ${b.totalEggs} Butir</span>
                </div>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
   EGGFLOW CHARTS (1 BULAN & 1 TAHUN)
   ========================================================================== */
let eggFlowMonthlyChartInstance = null;
let eggFlowYearlyChartInstance = null;

function renderDashboardCharts() {
    const chartsSection = document.getElementById('dash-charts-section');
    if (!chartsSection) return;
    
    chartsSection.style.display = 'block';

    const panenHistory = JSON.parse(localStorage.getItem('huma_farm_panen_history') || '[]');
    const orders = JSON.parse(localStorage.getItem('huma_farm_orders') || '[]');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed (6 = July)
    const monthNamesIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    // Update Header Titles dynamically
    const elMonthlyTitle = document.getElementById('chart-monthly-title');
    const elYearlyTitle = document.getElementById('chart-yearly-title');
    if (elMonthlyTitle) elMonthlyTitle.textContent = `📈 EggFlow Bulanan (Bulan ${monthNamesIndo[currentMonth]} ${currentYear})`;
    if (elYearlyTitle) elYearlyTitle.textContent = `📊 EggFlow Tahunan (Tahun ${currentYear})`;

    // --- 1. EGGFLOW BULAN BERJALAN (1 s/d Hari Terakhir di Bulan Ini) ---
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyDays = [];
    const monthlyPanenMap = {};
    const monthlyJualMap = {};
    const monthlyKonsumsiMap = {};

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const isoDate = `${currentYear}-${monthStr}-${dayStr}`;
        
        monthlyDays.push(isoDate);
        monthlyPanenMap[isoDate] = 0;
        monthlyJualMap[isoDate] = 0;
        monthlyKonsumsiMap[isoDate] = 0;
    }

    panenHistory.forEach(item => {
        const itemDate = (item.date || '').split('T')[0];
        if (monthlyPanenMap[itemDate] !== undefined) {
            const totalEggs = (parseInt(item.negeri || 0) + parseInt(item.kampung || 0));
            if (item.type === 'add') {
                monthlyPanenMap[itemDate] += totalEggs;
            } else if (item.type === 'sub') {
                monthlyKonsumsiMap[itemDate] += totalEggs;
            }
        }
    });

    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            const oDate = (o.createdAt ? o.createdAt.split('T')[0] : (o.date || '')).split('T')[0];
            if (monthlyJualMap[oDate] !== undefined) {
                const eggs = parseInt(o.totalEggs || 0) || ((o.unit === 'pack' ? (o.qty * 10) : o.qty) || 0);
                const isReward = o.isReward || parseFloat(o.totalPrice || 0) === 0 || (o.category && o.category.includes('bonus'));
                if (isReward) {
                    monthlyKonsumsiMap[oDate] += eggs;
                } else {
                    monthlyJualMap[oDate] += eggs;
                }
            }
        }
    });

    const monthlyLabels = monthlyDays.map(dStr => {
        const p = dStr.split('-');
        return `${parseInt(p[2])}/${parseInt(p[1])}`;
    });
    const monthlyPanenData = monthlyDays.map(d => monthlyPanenMap[d] || 0);
    const monthlyJualData = monthlyDays.map(d => monthlyJualMap[d] || 0);
    const monthlyKonsumsiData = monthlyDays.map(d => monthlyKonsumsiMap[d] || 0);

    const ctxMonthly = document.getElementById('chartEggFlowMonthly');
    if (ctxMonthly && typeof Chart !== 'undefined') {
        if (eggFlowMonthlyChartInstance) {
            eggFlowMonthlyChartInstance.destroy();
        }
        eggFlowMonthlyChartInstance = new Chart(ctxMonthly, {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [
                    {
                        label: '🥚 Terpanen',
                        data: monthlyPanenData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#f59e0b',
                        pointHoverBorderWidth: 2
                    },
                    {
                        label: '📦 Terjual',
                        data: monthlyJualData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#10b981',
                        pointHoverBorderWidth: 2
                    },
                    {
                        label: '🍳 Terkonsumsi',
                        data: monthlyKonsumsiData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#ef4444',
                        pointHoverBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#cbd5e1',
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 10, weight: '700' },
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        borderWidth: 1,
                        padding: 10,
                        usePointStyle: true,
                        boxPadding: 4
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 9.5, weight: '600' },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 9
                        },
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 9.5 },
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.06)',
                            drawBorder: false
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // --- 2. EGGFLOW TAHUN BERJALAN (Januari s/d Desember di Tahun Ini) ---
    const yearlyMonths = [];
    const yearlyPanenMap = {};
    const yearlyJualMap = {};
    const yearlyKonsumsiMap = {};

    for (let m = 0; m < 12; m++) {
        const monthStr = String(m + 1).padStart(2, '0');
        const yearMonth = `${currentYear}-${monthStr}`;
        yearlyMonths.push(yearMonth);
        yearlyPanenMap[yearMonth] = 0;
        yearlyJualMap[yearMonth] = 0;
        yearlyKonsumsiMap[yearMonth] = 0;
    }

    panenHistory.forEach(item => {
        const itemDate = (item.date || '').split('T')[0];
        const ym = itemDate.substring(0, 7);
        if (yearlyPanenMap[ym] !== undefined) {
            const totalEggs = (parseInt(item.negeri || 0) + parseInt(item.kampung || 0));
            if (item.type === 'add') {
                yearlyPanenMap[ym] += totalEggs;
            } else if (item.type === 'sub') {
                yearlyKonsumsiMap[ym] += totalEggs;
            }
        }
    });

    orders.forEach(o => {
        if (o.paymentStatus === 'Lunas') {
            const oDate = (o.createdAt ? o.createdAt.split('T')[0] : (o.date || '')).split('T')[0];
            const ym = oDate.substring(0, 7);
            if (yearlyJualMap[ym] !== undefined) {
                const eggs = parseInt(o.totalEggs || 0) || ((o.unit === 'pack' ? (o.qty * 10) : o.qty) || 0);
                const isReward = o.isReward || parseFloat(o.totalPrice || 0) === 0 || (o.category && o.category.includes('bonus'));
                if (isReward) {
                    yearlyKonsumsiMap[ym] += eggs;
                } else {
                    yearlyJualMap[ym] += eggs;
                }
            }
        }
    });

    const yearlyLabels = yearlyMonths.map(ymStr => {
        const parts = ymStr.split('-');
        const mIdx = parseInt(parts[1]) - 1;
        return `${monthNamesShort[mIdx]} '${parts[0].substring(2)}`;
    });

    const yearlyPanenData = yearlyMonths.map(ym => yearlyPanenMap[ym] || 0);
    const yearlyJualData = yearlyMonths.map(ym => yearlyJualMap[ym] || 0);
    const yearlyKonsumsiData = yearlyMonths.map(ym => yearlyKonsumsiMap[ym] || 0);

    const ctxYearly = document.getElementById('chartEggFlowYearly');
    if (ctxYearly && typeof Chart !== 'undefined') {
        if (eggFlowYearlyChartInstance) {
            eggFlowYearlyChartInstance.destroy();
        }
        eggFlowYearlyChartInstance = new Chart(ctxYearly, {
            type: 'bar',
            data: {
                labels: yearlyLabels,
                datasets: [
                    {
                        label: '🥚 Terpanen',
                        data: yearlyPanenData,
                        backgroundColor: '#f59e0b',
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: '📦 Terjual',
                        data: yearlyJualData,
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: '🍳 Terkonsumsi',
                        data: yearlyKonsumsiData,
                        backgroundColor: '#ef4444',
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                categoryPercentage: 0.7,
                barPercentage: 0.85,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#cbd5e1',
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            font: { size: 10, weight: '700' },
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        borderWidth: 1,
                        padding: 10,
                        usePointStyle: true,
                        boxPadding: 4
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 9.5, weight: '600' },
                            maxRotation: 0
                        },
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 9.5 },
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.06)',
                            drawBorder: false
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

/* ==========================================================================
   EGG TROOPER (POPULASI AYAM) MANAGEMENT
   ========================================================================== */
function getEggTrooperData() {
    const raw = localStorage.getItem('huma_farm_egg_trooper_data');
    if (raw) {
        try { return JSON.parse(raw); } catch (e) {}
    }
    return {
        negeri: { betina: 0, jantan: 0 },
        kampung: { betina: 0, jantan: 0 }
    };
}

function renderEggTrooperData() {
    const data = getEggTrooperData();
    const btnEdit = document.getElementById('btn-edit-egg-trooper');
    
    if (btnEdit) {
        btnEdit.style.display = (currentRole === 'admin') ? 'inline-block' : 'none';
    }

    const nBetina = document.getElementById('dash-negeri-betina-val');
    const nJantan = document.getElementById('dash-negeri-jantan-val');
    const kBetina = document.getElementById('dash-kampung-betina-val');
    const kJantan = document.getElementById('dash-kampung-jantan-val');

    if (nBetina) nBetina.textContent = (data.negeri ? data.negeri.betina : 0) + ' Ekor';
    if (nJantan) nJantan.textContent = (data.negeri ? data.negeri.jantan : 0) + ' Ekor';
    if (kBetina) kBetina.textContent = (data.kampung ? data.kampung.betina : 0) + ' Ekor';
    if (kJantan) kJantan.textContent = (data.kampung ? data.kampung.jantan : 0) + ' Ekor';
}

function openEditEggTrooperModal() {
    const data = getEggTrooperData();

    const inNBetina = document.getElementById('input-negeri-betina');
    const inNJantan = document.getElementById('input-negeri-jantan');
    const inKBetina = document.getElementById('input-kampung-betina');
    const inKJantan = document.getElementById('input-kampung-jantan');

    if (inNBetina) inNBetina.value = (data.negeri && data.negeri.betina !== undefined) ? data.negeri.betina : 0;
    if (inNJantan) inNJantan.value = (data.negeri && data.negeri.jantan !== undefined) ? data.negeri.jantan : 0;
    if (inKBetina) inKBetina.value = (data.kampung && data.kampung.betina !== undefined) ? data.kampung.betina : 0;
    if (inKJantan) inKJantan.value = (data.kampung && data.kampung.jantan !== undefined) ? data.kampung.jantan : 0;

    const modal = document.getElementById('modal-edit-egg-trooper');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeEditEggTrooperModal() {
    const modal = document.getElementById('modal-edit-egg-trooper');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function saveEggTrooperData(e) {
    if (e) e.preventDefault();

    const inNBetina = document.getElementById('input-negeri-betina');
    const inNJantan = document.getElementById('input-negeri-jantan');
    const inKBetina = document.getElementById('input-kampung-betina');
    const inKJantan = document.getElementById('input-kampung-jantan');

    const newData = {
        negeri: {
            betina: parseInt(inNBetina ? inNBetina.value : 0) || 0,
            jantan: parseInt(inNJantan ? inNJantan.value : 0) || 0
        },
        kampung: {
            betina: parseInt(inKBetina ? inKBetina.value : 0) || 0,
            jantan: parseInt(inKJantan ? inKJantan.value : 0) || 0
        }
    };

    localStorage.setItem('huma_farm_egg_trooper_data', JSON.stringify(newData));
    renderEggTrooperData();
    closeEditEggTrooperModal();

    if (typeof showToast === 'function') {
        showToast('🐔 Populasi Egg Trooper berhasil diperbarui!', 'success');
    }
}

