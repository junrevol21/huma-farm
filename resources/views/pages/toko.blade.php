<!-- HALAMAN: TOKO -->
<section id="toko" class="page-section">
    <!-- FIXED HEADER TOKO DENGAN BUTTON PENGATURAN HARGA (KHUSUS ADMIN) -->
    <div class="page-header">
        <div>
            <h1 class="page-title">🛒 Toko Huma Farm</h1>
            <p class="page-subtitle">Katalog produk telur siap jual, keranjang order, dan antrean Pre-Order (PO).</p>
        </div>
        <!-- BUTTON PENGATURAN HARGA TELUR (HANYA MUNCUL DI AKUN ADMIN) -->
        <button class="btn btn-outline" id="btn-toko-pricing" data-role="admin" style="font-size: 0.74rem; padding: 4px 10px; display: none;" onclick="openTokoPricingModal()" title="Pengaturan Harga Telur (Pack & Eceran)">
            ⚙️ Atur Harga
        </button>
    </div>

    <!-- FIXED EGG CARDS GRID (TOKO STOK READY & PRICE LISTING) -->
    <div class="toko-egg-grid">
        
        <!-- BOX TELUR NEGERI -->
        <div class="ranch-card" style="padding: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="egg-icon-badge" style="width: 24px; height: 24px;">
                        <svg width="14" height="18" viewBox="0 0 100 125">
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#B06530"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.25" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <strong style="font-size: 0.76rem; color: var(--text-main);">Telur Negeri</strong>
                </div>
                <span style="font-size: 0.62rem; background: var(--bg-card-subtle); padding: 1px 4px; border-radius: 4px; font-weight: 700; color: #b06530;" id="toko-price-negeri-badge">Rp 25.000/Pack</span>
            </div>

            <!-- TOTAL STOK TERSEDIA -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px; text-align: center; margin-bottom: 4px;">
                <strong style="display: block; font-size: 1.1rem; color: var(--ranch-amber); margin-bottom: 0px;" id="toko-stok-negeri">0 Butir</strong>
                <span style="font-size: 0.65rem; color: var(--text-muted);">Total Stok Ready</span>
            </div>

            <!-- INFO SUB-PACK & ECERAN -->
            <div style="display: flex; flex-direction: column; gap: 1px; background: var(--bg-main); padding: 4px 6px; border-radius: 6px; border: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">📦 Pack (isi 10):</span>
                    <strong style="color: var(--text-main);" id="toko-pack-negeri-val">0 Pack</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">🥚 Eceran Ready:</span>
                    <strong style="color: var(--ranch-amber);" id="toko-eceran-negeri-val">0 Butir</strong>
                </div>
            </div>
        </div>

        <!-- BOX TELUR KAMPUNG -->
        <div class="ranch-card" style="padding: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="egg-icon-badge" style="width: 24px; height: 24px;">
                        <svg width="14" height="18" viewBox="0 0 100 125">
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.75" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <strong style="font-size: 0.76rem; color: var(--text-main);">Telur Kampung</strong>
                </div>
                <span style="font-size: 0.62rem; background: var(--bg-card-subtle); padding: 1px 4px; border-radius: 4px; font-weight: 700; color: var(--text-muted);" id="toko-price-kampung-badge">Rp 35.000/Pack</span>
            </div>

            <!-- TOTAL STOK TERSEDIA -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px; text-align: center; margin-bottom: 4px;">
                <strong style="display: block; font-size: 1.1rem; color: var(--ranch-green); margin-bottom: 0px;" id="toko-stok-kampung">0 Butir</strong>
                <span style="font-size: 0.65rem; color: var(--text-muted);">Total Stok Ready</span>
            </div>

            <!-- INFO SUB-PACK & ECERAN -->
            <div style="display: flex; flex-direction: column; gap: 1px; background: var(--bg-main); padding: 4px 6px; border-radius: 6px; border: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">📦 Pack (isi 10):</span>
                    <strong style="color: var(--text-main);" id="toko-pack-kampung-val">0 Pack</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">🥚 Eceran Ready:</span>
                    <strong style="color: var(--ranch-green);" id="toko-eceran-kampung-val">0 Butir</strong>
                </div>
            </div>
        </div>

    </div>

    <!-- BOX RIWAYAT PEMBELIAN & ANTREAN PO (MENTOK BOTTOM BAR, INNER SCROLLABLE) -->
    <div class="toko-history-box">
        <!-- HEADER BOX RIWAYAT TOKO DENGAN RESPONSIVE MULTI-SELECT FILTER BAR -->
        <div class="toko-history-header">
            <h3 style="font-size: 0.88rem; font-weight: 800; color: var(--text-main);">📑 Riwayat Pesanan & Antrean Pre-Order (PO)</h3>
            
            <!-- RESPONSIVE MULTI-SELECT FILTER BAR -->
            <div class="toko-filter-bar">
                
                <!-- MULTI-SELECT 1: JENIS PESANAN -->
                <div class="multi-select-wrapper" id="ms-wrapper-type">
                    <button type="button" class="multi-select-btn" onclick="toggleMultiSelectDropdown('type', event)">
                        <span id="ms-label-type">📋 Jenis: Semua</span>
                        <span class="dropdown-arrow">▾</span>
                    </button>
                    <div class="multi-select-menu" id="ms-menu-type" onclick="event.stopPropagation()">
                        <label class="ms-option"><input type="checkbox" value="completed" checked onchange="handleTokoFilterChange()"> 🛍️ Pembelian Langsung</label>
                        <label class="ms-option"><input type="checkbox" value="po" checked onchange="handleTokoFilterChange()"> 🏷️ Pre-Order (PO)</label>
                        <label class="ms-option"><input type="checkbox" value="lunas" checked onchange="handleTokoFilterChange()"> 🟢 Status Lunas</label>
                        <label class="ms-option"><input type="checkbox" value="unpaid" checked onchange="handleTokoFilterChange()"> 🔴 Belum Bayar</label>
                    </div>
                </div>

                <!-- MULTI-SELECT 2: BULAN -->
                <div class="multi-select-wrapper" id="ms-wrapper-month">
                    <button type="button" class="multi-select-btn" onclick="toggleMultiSelectDropdown('month', event)">
                        <span id="ms-label-month">🗓️ Bulan: Semua</span>
                        <span class="dropdown-arrow">▾</span>
                    </button>
                    <div class="multi-select-menu" id="ms-menu-month" onclick="event.stopPropagation()">
                        <label class="ms-option"><input type="checkbox" id="cb-all-months" value="all" checked onchange="toggleSelectAllMonths(this)"> <strong>Semua Bulan</strong></label>
                        <hr style="border: 0; border-top: 1px dashed var(--border-color); margin: 3px 0;">
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="01" checked onchange="handleTokoFilterChange()"> Januari</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="02" checked onchange="handleTokoFilterChange()"> Februari</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="03" checked onchange="handleTokoFilterChange()"> Maret</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="04" checked onchange="handleTokoFilterChange()"> April</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="05" checked onchange="handleTokoFilterChange()"> Mei</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="06" checked onchange="handleTokoFilterChange()"> Juni</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="07" checked onchange="handleTokoFilterChange()"> Juli</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="08" checked onchange="handleTokoFilterChange()"> Agustus</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="09" checked onchange="handleTokoFilterChange()"> September</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="10" checked onchange="handleTokoFilterChange()"> Oktober</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="11" checked onchange="handleTokoFilterChange()"> November</label>
                        <label class="ms-option"><input type="checkbox" class="cb-month" value="12" checked onchange="handleTokoFilterChange()"> Desember</label>
                    </div>
                </div>

                <!-- MULTI-SELECT 3: TAHUN -->
                <div class="multi-select-wrapper" id="ms-wrapper-year">
                    <button type="button" class="multi-select-btn" onclick="toggleMultiSelectDropdown('year', event)">
                        <span id="ms-label-year">📅 Tahun: Semua</span>
                        <span class="dropdown-arrow">▾</span>
                    </button>
                    <div class="multi-select-menu" id="ms-menu-year" onclick="event.stopPropagation()">
                        <label class="ms-option"><input type="checkbox" class="cb-year" value="2026" checked onchange="handleTokoFilterChange()"> 2026</label>
                        <label class="ms-option"><input type="checkbox" class="cb-year" value="2025" checked onchange="handleTokoFilterChange()"> 2025</label>
                        <label class="ms-option"><input type="checkbox" class="cb-year" value="2024" checked onchange="handleTokoFilterChange()"> 2024</label>
                    </div>
                </div>

            </div>
        </div>

        <!-- SCROLLABLE LIST ORDER & PO CARDS -->
        <div id="toko-history-container" class="toko-history-scroll-list">
            <div class="card-placeholder">
                <span class="placeholder-icon">🛍️</span>
                <p>Belum ada riwayat pesanan atau Pre-Order. Klik 🛒 <strong>Beli</strong> di navigasi bawah untuk memesan.</p>
            </div>
        </div>
    </div>

</section>
