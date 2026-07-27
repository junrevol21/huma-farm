<!-- DASHBOARD SECTION -->
<section id="dashboard" class="page-section">
    <div class="page-header">
        <div>
            <h1 class="page-title">📊 Dashboard Huma Farm</h1>
            <p class="page-subtitle" id="dashboard-subtitle">Statistik panen, penjualan, dan stok telur.</p>
        </div>
    </div>

    <!-- FINANCIAL KPI ROW (ADMIN ONLY) - Dompet Saldo Box (Vertical Layout) -->
    <div id="dash-financial-cards-row" style="display:none; margin-bottom: 10px;">
        <!-- BOX DOMPET SALDO: Ringkasan Saldo & Arus Kas (Vertikal: Saldo -> Pendapatan -> Pengeluaran) -->
        <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 9px 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.74rem; font-weight: 800; color: var(--ranch-amber); display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 5px; margin-bottom: 1px;">
                <span>👛 Dompet Saldo & Keuangan</span>
                <span style="font-size: 0.58rem; background: rgba(245,158,11,0.15); color: var(--ranch-amber); padding: 1px 6px; border-radius: 4px; font-weight: 700;">Realtime</span>
            </div>
            
            <!-- 1. Saldo -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                    <span>💳</span> Saldo
                </span>
                <strong style="font-size: 0.95rem; color: var(--ranch-amber); font-weight: 800;" id="kpi-balance-val">Rp 0</strong>
            </div>

            <!-- 2. Pendapatan (Di bawah Saldo) -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                    <span>💰</span> Pendapatan
                </span>
                <strong style="font-size: 0.95rem; color: var(--ranch-green); font-weight: 800;" id="kpi-income-val">Rp 0</strong>
            </div>

            <!-- 3. Pengeluaran (Di bawah Pendapatan) -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                    <span>💸</span> Pengeluaran
                </span>
                <strong style="font-size: 0.95rem; color: var(--ranch-rose); font-weight: 800;" id="kpi-expense-val">Rp 0</strong>
            </div>
        </div>
    </div>

    <!-- STOK READY SEKARANG (2 GROUP BOXES WITH VERTICAL DETAILED STOK) -->
    <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;" id="dash-stok-ready-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.82rem; font-weight: 700;">🥚 Stok Ready Sekarang</span>
            <span style="font-size: 0.65rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-amber);">Realtime</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <!-- GRUP 1: TELUR NEGERI STOK -->
            <div style="background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align: left;">
                <span style="font-size: 0.72rem; color: #b06530; font-weight: 800; display: block; margin-bottom: 2px;">🟤 Telur Negeri</span>
                <strong style="font-size: 1.05rem; color: var(--ranch-amber); font-weight: 800; display: block; margin-bottom: 2px;" id="dash-stok-negeri">0 Butir</strong>
                
                <div style="font-size: 0.68rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 3px; margin-top: 3px;">
                    📦 <strong id="dash-stok-negeri-pack" style="color: var(--text-main);">0 Pack</strong>
                </div>
                <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;">
                    🥚 <strong id="dash-stok-negeri-eceran" style="color: var(--text-main);">0 Butir Eceran</strong>
                </div>
            </div>

            <!-- GRUP 2: TELUR KAMPUNG STOK -->
            <div style="background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align: left;">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 800; display: block; margin-bottom: 2px;">⚪ Telur Kampung</span>
                <strong style="font-size: 1.05rem; color: var(--ranch-green); font-weight: 800; display: block; margin-bottom: 2px;" id="dash-stok-kampung">0 Butir</strong>
                
                <div style="font-size: 0.68rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 3px; margin-top: 3px;">
                    📦 <strong id="dash-stok-kampung-pack" style="color: var(--text-main);">0 Pack</strong>
                </div>
                <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;">
                    🥚 <strong id="dash-stok-kampung-eceran" style="color: var(--text-main);">0 Butir Eceran</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- BOX DISTRIBUSI TELUR (NEGERI vs KAMPUNG) -->
    <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;" id="dash-egg-distribution-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.82rem; font-weight: 700;">📊 Distribusi & Alokasi Telur</span>
            <span style="font-size: 0.65rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-amber);">Ringkasan</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <!-- GRUP 1: TELUR NEGERI -->
            <div style="background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 0.72rem; color: #b06530; font-weight: 800; border-bottom: 1px dashed var(--border-color); padding-bottom: 3px; margin-bottom: 2px; display: block;">🟤 Telur Negeri</span>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">🥚 Terpanen:</span>
                    <strong style="color: var(--text-main);" id="dist-negeri-panen">0 Butir</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">📦 Terjual:</span>
                    <strong style="color: var(--ranch-green);" id="dist-negeri-jual">0 Butir</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">🍳 Terkonsumsi:</span>
                    <strong style="color: var(--ranch-amber);" id="dist-negeri-konsumsi">0 Butir</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">🎁 Sedekah/Bonus:</span>
                    <strong style="color: var(--ranch-amber);" id="dist-negeri-sedekah">0 Butir</strong>
                </div>
            </div>

            <!-- GRUP 2: TELUR KAMPUNG -->
            <div style="background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 800; border-bottom: 1px dashed var(--border-color); padding-bottom: 3px; margin-bottom: 2px; display: block;">⚪ Telur Kampung</span>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">🥚 Terpanen:</span>
                    <strong style="color: var(--text-main);" id="dist-kampung-panen">0 Butir</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">📦 Terjual:</span>
                    <strong style="color: var(--ranch-green);" id="dist-kampung-jual">0 Butir</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">🍳 Terkonsumsi:</span>
                    <strong style="color: var(--ranch-amber);" id="dist-kampung-konsumsi">0 Butir</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem;">
                    <span style="color: var(--text-muted);">🎁 Sedekah/Bonus:</span>
                    <strong style="color: var(--ranch-amber);" id="dist-kampung-sedekah">0 Butir</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- BOX EGG TROOPER (POPULASI AYAM NEGERI & KAMPUNG / PETELUR) -->
    <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;" id="dash-egg-trooper-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 0.82rem; font-weight: 700;">🐔 Egg Trooper</span>
                <span style="font-size: 0.65rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-amber);">Populasi Ayam</span>
            </div>
            <!-- Gear Edit Button (Admin Only) -->
            <button id="btn-edit-egg-trooper" class="btn btn-sm btn-outline" style="display: none; padding: 2px 8px; font-size: 0.72rem; border-radius: 6px; border: 1px solid var(--border-color);" onclick="openEditEggTrooperModal()">
                ⚙️ Edit
            </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <!-- GRUP 1: AYAM NEGERI -->
            <div style="background: var(--bg-card-subtle); padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border-color); text-align: left;">
                <span style="font-size: 0.72rem; color: #b06530; font-weight: 800; border-bottom: 1px dashed var(--border-color); padding-bottom: 3px; margin-bottom: 3px; display: block;">🟤 Ayam Negeri</span>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-top: 4px;">
                    <span style="color: var(--text-muted);">♀️ Betina:</span>
                    <strong style="color: var(--ranch-amber); font-weight: 800;" id="dash-negeri-betina-val">0 Ekor</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-top: 2px;">
                    <span style="color: var(--text-muted);">♂️ Jantan:</span>
                    <strong style="color: var(--text-main); font-weight: 800;" id="dash-negeri-jantan-val">0 Ekor</strong>
                </div>
            </div>

            <!-- GRUP 2: AYAM KAMPUNG / PETELUR -->
            <div style="background: var(--bg-card-subtle); padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border-color); text-align: left;">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 800; border-bottom: 1px dashed var(--border-color); padding-bottom: 3px; margin-bottom: 3px; display: block;">⚪ Ayam Kampung</span>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-top: 4px;">
                    <span style="color: var(--text-muted);">♀️ Betina:</span>
                    <strong style="color: var(--ranch-green); font-weight: 800;" id="dash-kampung-betina-val">0 Ekor</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-top: 2px;">
                    <span style="color: var(--text-muted);">♂️ Jantan:</span>
                    <strong style="color: var(--text-main); font-weight: 800;" id="dash-kampung-jantan-val">0 Ekor</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- BOX TERKAIT PENJUALAN & PELANGGAN (BERDASARKAN RIWAYAT) -->
    <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;" id="dash-sales-summary-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.82rem; font-weight: 700;">🛍️ Ringkasan Penjualan & Pelanggan</span>
            <span style="font-size: 0.65rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-amber);">Riwayat</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <!-- GRUP 1: JUMLAH TRANSAKSI -->
            <div style="background: var(--bg-card-subtle); padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border-color); text-align: left;">
                <span style="font-size: 0.72rem; color: var(--ranch-amber); font-weight: 800; display: block; margin-bottom: 2px;">🧾 Total Transaksi</span>
                <strong style="font-size: 1.05rem; color: var(--text-main); font-weight: 800; display: block; margin-bottom: 2px;" id="dash-total-transactions-val">0 Transaksi</strong>
                <span style="font-size: 0.66rem; color: var(--text-muted); display: block;">Riwayat Pesanan Masuk</span>
            </div>

            <!-- GRUP 2: JUMLAH PELANGGAN -->
            <div style="background: var(--bg-card-subtle); padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border-color); text-align: left;">
                <span style="font-size: 0.72rem; color: var(--ranch-green); font-weight: 800; display: block; margin-bottom: 2px;">👥 Total Pelanggan</span>
                <strong style="font-size: 1.05rem; color: var(--ranch-green); font-weight: 800; display: block; margin-bottom: 2px;" id="dash-total-customers-val">0 Pelanggan</strong>
                <span style="font-size: 0.66rem; color: var(--text-muted); display: block;">Pembeli Unik (Riwayat)</span>
            </div>
        </div>
    </div>

    <!-- CHARTS EGGFLOW (BULAN BERJALAN & TAHUN BERJALAN) -->
    <div id="dash-charts-section" style="display: none;">
        <!-- CHART 1: EGGFLOW BULAN BERJALAN -->
        <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 0.82rem; font-weight: 700;" id="chart-monthly-title">📈 EggFlow Bulanan (Bulan Ini)</span>
                <span style="font-size: 0.62rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-amber);">Terpanen | Terjual | Terkonsumsi</span>
            </div>
            <div class="chart-wrapper" style="position: relative; height: 220px; width: 100%;">
                <canvas id="chartEggFlowMonthly"></canvas>
            </div>
        </div>

        <!-- CHART 2: EGGFLOW TAHUN BERJALAN -->
        <div class="ranch-card" style="margin-bottom: 10px; padding: 10px 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 0.82rem; font-weight: 700;" id="chart-yearly-title">📊 EggFlow Tahunan (Tahun Ini)</span>
                <span style="font-size: 0.62rem; background: var(--bg-card-subtle); padding: 2px 7px; border-radius: 8px; font-weight: 700; color: var(--ranch-green);">Terpanen | Terjual | Terkonsumsi</span>
            </div>
            <div class="chart-wrapper" style="position: relative; height: 220px; width: 100%;">
                <canvas id="chartEggFlowYearly"></canvas>
            </div>
        </div>
    </div>
</section>

<!-- MODAL EDIT EGG TROOPER (ADMIN ONLY) -->
<div id="modal-edit-egg-trooper" class="modal-overlay">
    <div class="modal-content" style="max-width: 360px; width: 90%; padding: 16px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <h3 style="font-size: 0.92rem; margin: 0; font-weight: 800;">⚙️ Edit Egg Trooper (Populasi Ayam)</h3>
            <button onclick="closeEditEggTrooperModal()" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <form id="form-edit-egg-trooper" onsubmit="saveEggTrooperData(event)">
            <!-- Ayam Negeri -->
            <div style="margin-bottom: 10px; background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                <strong style="font-size: 0.76rem; color: #b06530; display: block; margin-bottom: 6px;">🟤 Ayam Negeri</strong>
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-bottom: 2px;">♀️ Betina (Ekor)</label>
                        <input type="number" id="input-negeri-betina" min="0" value="0" class="input-field" style="width: 100%; padding: 5px 8px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main);" required />
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-bottom: 2px;">♂️ Jantan (Ekor)</label>
                        <input type="number" id="input-negeri-jantan" min="0" value="0" class="input-field" style="width: 100%; padding: 5px 8px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main);" required />
                    </div>
                </div>
            </div>

            <!-- Ayam Kampung -->
            <div style="margin-bottom: 14px; background: var(--bg-card-subtle); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                <strong style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-bottom: 6px;">⚪ Ayam Kampung</strong>
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-bottom: 2px;">♀️ Betina (Ekor)</label>
                        <input type="number" id="input-kampung-betina" min="0" value="0" class="input-field" style="width: 100%; padding: 5px 8px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main);" required />
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.68rem; color: var(--text-muted); display: block; margin-bottom: 2px;">♂️ Jantan (Ekor)</label>
                        <input type="number" id="input-kampung-jantan" min="0" value="0" class="input-field" style="width: 100%; padding: 5px 8px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main);" required />
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="closeEditEggTrooperModal()" style="padding: 5px 12px; font-size: 0.75rem; border-radius: 6px;">Batal</button>
                <button type="submit" class="btn btn-primary btn-sm" style="padding: 5px 12px; font-size: 0.75rem; border-radius: 6px; background: var(--ranch-amber); color: #000; font-weight: 700; border: none;">💾 Simpan</button>
            </div>
        </form>
    </div>
</div>
