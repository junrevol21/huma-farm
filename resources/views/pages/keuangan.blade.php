<!-- HALAMAN: DOMPET & KEUANGAN (KHUSUS ADMIN) -->
<section id="keuangan" class="page-section">
    <div class="page-header">
        <div>
            <h1 class="page-title">💳 Dompet & Keuangan Huma Farm</h1>
            <p class="page-subtitle">Kelola kas uang masuk hasil penjualan telur dan catat biaya operasional peternakan.</p>
        </div>
        <button class="btn btn-ranch" style="font-size: 0.76rem; padding: 6px 12px;" onclick="openInputPengeluaranModal()">
            ➕ Catat Cash Flow
        </button>
    </div>

    <!-- WALLET BALANCE SUMMARY CARD -->
    <div class="wallet-summary-card" style="margin-bottom: 14px;">
        <div class="wallet-balance-row">
            <div>
                <span class="wallet-label">SALDO KAS SAAT INI</span>
                <h2 class="wallet-amount" id="wallet-total-balance">Rp 0</h2>
            </div>
            <span class="wallet-badge">💼 Dompet Usaha</span>
        </div>
        <div class="wallet-stats-grid">
            <div class="wallet-stat-item">
                <span class="w-stat-icon">📥</span>
                <div>
                    <span class="w-stat-title">Total Pemasukan</span>
                    <strong class="w-stat-val text-green" id="wallet-total-income">Rp 0</strong>
                </div>
            </div>
            <div class="wallet-stat-item">
                <span class="w-stat-icon">📤</span>
                <div>
                    <span class="w-stat-title">Total Pengeluaran</span>
                    <strong class="w-stat-val text-rose" id="wallet-total-expense">Rp 0</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- RIWAYAT TRANSAKSI KEUANGAN -->
    <div class="ranch-card">
        <h3 style="font-size: 0.9rem; margin-bottom: 10px;">📋 Riwayat Mutasi Kas & Transaksi</h3>
        <div id="wallet-transaction-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Transaksi dirender via JS -->
        </div>
    </div>
</section>
