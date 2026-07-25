<!-- DASHBOARD SECTION -->
<section id="dashboard" class="page-section">
    <div class="page-header">
        <div>
            <h1 class="page-title">📊 Dashboard Huma Farm</h1>
            <p class="page-subtitle" id="dashboard-subtitle">Statistik panen, penjualan, dan stok telur.</p>
        </div>
    </div>

    <!-- FINANCIAL KPI ROW (ADMIN ONLY) - 3 cards in single row -->
    <div id="dash-financial-cards-row" style="display:none; margin-bottom: 10px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div class="kpi-card kpi-green" style="min-width: 0;">
                <span class="kpi-icon">💰</span>
                <div class="kpi-info">
                    <span class="kpi-label">Pendapatan</span>
                    <strong class="kpi-val" id="kpi-income-val">Rp 0</strong>
                </div>
            </div>
            <div class="kpi-card kpi-red" style="min-width: 0;">
                <span class="kpi-icon">💸</span>
                <div class="kpi-info">
                    <span class="kpi-label">Pengeluaran</span>
                    <strong class="kpi-val" id="kpi-expense-val">Rp 0</strong>
                </div>
            </div>
            <div class="kpi-card kpi-amber" style="min-width: 0;">
                <span class="kpi-icon">💳</span>
                <div class="kpi-info">
                    <span class="kpi-label">Saldo</span>
                    <strong class="kpi-val" id="kpi-balance-val">Rp 0</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- OPERATIONAL KPI - 2x2 GRID, constrained width -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
        <div class="kpi-card" style="min-width: 0;">
            <span class="kpi-icon">🥚</span>
            <div class="kpi-info">
                <span class="kpi-label">Total Panen</span>
                <strong class="kpi-val" id="kpi-harvest-val">0 Butir</strong>
                <span class="kpi-sub" id="kpi-harvest-sub">Negeri & Kampung</span>
            </div>
        </div>
        <div class="kpi-card" style="min-width: 0;">
            <span class="kpi-icon">📦</span>
            <div class="kpi-info">
                <span class="kpi-label">Total Terjual</span>
                <strong class="kpi-val" id="kpi-sold-val">0 Butir</strong>
                <span class="kpi-sub" id="kpi-sold-sub">0 Pack + 0 Ecer</span>
            </div>
        </div>
        <div class="kpi-card" style="min-width: 0;">
            <span class="kpi-icon">🎁</span>
            <div class="kpi-info">
                <span class="kpi-label">Sedekah/Konsumsi</span>
                <strong class="kpi-val" id="kpi-sedekah-val">0 Butir</strong>
                <span class="kpi-sub">Internal</span>
            </div>
        </div>
        <div class="kpi-card" style="min-width: 0;">
            <span class="kpi-icon">👥</span>
            <div class="kpi-info">
                <span class="kpi-label">Pelanggan</span>
                <strong class="kpi-val" id="kpi-customers-val">0</strong>
                <span class="kpi-sub">Pembeli Terdaftar</span>
            </div>
        </div>
    </div>

    <!-- STOK READY COMPACT -->
    <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.82rem; font-weight: 700;">🥚 Stok Ready Sekarang</span>
            <span style="font-size: 0.65rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-amber);">Realtime</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div style="background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 7px; text-align: center; border: 1px solid var(--border-color);">
                <span style="font-size: 0.67rem; color: #b06530; font-weight: 700; display: block;">🟤 Telur Negeri</span>
                <strong style="font-size: 1.05rem; color: var(--ranch-amber);" id="dash-stok-negeri">0 Butir</strong>
            </div>
            <div style="background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 7px; text-align: center; border: 1px solid var(--border-color);">
                <span style="font-size: 0.67rem; color: var(--text-muted); font-weight: 700; display: block;">⚪ Telur Kampung</span>
                <strong style="font-size: 1.05rem; color: var(--ranch-green);" id="dash-stok-kampung">0 Butir</strong>
            </div>
        </div>
    </div>

    <!-- CHARTS (ADMIN ONLY) -->
    <div id="dash-charts-section" style="display: none;">
        <div class="ranch-card" style="margin-bottom: 10px;">
            <h3 style="font-size: 0.84rem; margin-bottom: 8px;">📈 Panen vs Keluar — 7 Hari Terakhir</h3>
            <div class="chart-wrapper">
                <canvas id="chartWeeklyHarvestSales"></canvas>
            </div>
        </div>
        <div class="ranch-card" style="margin-bottom: 10px;">
            <h3 style="font-size: 0.84rem; margin-bottom: 8px;">📊 Produksi Bulanan (Negeri vs Kampung)</h3>
            <div class="chart-wrapper">
                <canvas id="chartMonthlyProduction"></canvas>
            </div>
        </div>
        <div class="ranch-card" style="margin-bottom: 10px;">
            <h3 style="font-size: 0.84rem; margin-bottom: 8px;">🍩 Distribusi Alokasi Telur</h3>
            <div class="chart-wrapper" style="max-height: 220px; display: flex; justify-content: center;">
                <canvas id="chartAllocationDistribution"></canvas>
            </div>
        </div>
    </div>
</section>
