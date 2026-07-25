<!-- HALAMAN: PANENKU (KHUSUS ADMIN) -->
<section id="panenku" class="page-section">
    <!-- FIXED HEADER PANENKU -->
    <div class="page-header">
        <div>
            <h1 class="page-title">🧺 Halaman Panenku</h1>
            <p class="page-subtitle">Pencatatan panen telur harian (Kampung & Negeri) dan pengurangan konsumsi sendiri.</p>
        </div>
    </div>

    <!-- FIXED EGG CARDS GRID (BERDAMPINGAN KANAN-KIRI STAY FIXED) -->
    <div class="panenku-egg-grid">
        
        <!-- BOX STOK TELUR NEGERI (COKELAT) -->
        <div class="ranch-card" style="padding: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="egg-icon-badge" style="width: 24px; height: 24px;">
                        <svg width="14" height="18" viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <radialGradient id="bEggCard" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stop-color="#F3C39D"/>
                                    <stop offset="50%" stop-color="#B06530"/>
                                    <stop offset="100%" stop-color="#5E2D0B"/>
                                </radialGradient>
                            </defs>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#B06530"/>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="url(#bEggCard)"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.25" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <strong style="font-size: 0.76rem; color: var(--text-main);">Telur Negeri</strong>
                </div>
                <span style="font-size: 0.62rem; background: var(--bg-card-subtle); padding: 1px 4px; border-radius: 4px; font-weight: 700; color: #b06530;">Cokelat</span>
            </div>

            <!-- TOTAL STOK TERSEDIA -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px; text-align: center; margin-bottom: 4px;">
                <strong style="display: block; font-size: 1.1rem; color: var(--ranch-amber); margin-bottom: 0px;" id="stok-total-negeri">0 Butir</strong>
                <span style="font-size: 0.65rem; color: var(--text-muted);">Total Stok Ready</span>
            </div>

            <!-- INFO SUB-PACK & ECERAN -->
            <div style="display: flex; flex-direction: column; gap: 1px; background: var(--bg-main); padding: 4px 6px; border-radius: 6px; border: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">📦 Pack (isi 10):</span>
                    <strong style="color: var(--text-main);" id="pack-negeri-val">0 Pack</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">🥚 Eceran Ready:</span>
                    <strong style="color: var(--ranch-amber);" id="eceran-negeri-val">0 Butir</strong>
                </div>
            </div>
        </div>

        <!-- BOX STOK TELUR KAMPUNG (PUTIH) -->
        <div class="ranch-card" style="padding: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="egg-icon-badge" style="width: 24px; height: 24px;">
                        <svg width="14" height="18" viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <radialGradient id="wEggCard" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stop-color="#FFFFFF"/>
                                    <stop offset="60%" stop-color="#F1F5F9"/>
                                    <stop offset="100%" stop-color="#CBD5E1"/>
                                </radialGradient>
                            </defs>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4"/>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="url(#wEggCard)" stroke="#94A3B8" stroke-width="4"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.75" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <strong style="font-size: 0.76rem; color: var(--text-main);">Telur Kampung</strong>
                </div>
                <span style="font-size: 0.62rem; background: var(--bg-card-subtle); padding: 1px 4px; border-radius: 4px; font-weight: 700; color: var(--text-muted);">Putih</span>
            </div>

            <!-- TOTAL STOK TERSEDIA -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px; text-align: center; margin-bottom: 4px;">
                <strong style="display: block; font-size: 1.1rem; color: var(--ranch-green); margin-bottom: 0px;" id="stok-total-kampung">0 Butir</strong>
                <span style="font-size: 0.65rem; color: var(--text-muted);">Total Stok Ready</span>
            </div>

            <!-- INFO SUB-PACK & ECERAN -->
            <div style="display: flex; flex-direction: column; gap: 1px; background: var(--bg-main); padding: 4px 6px; border-radius: 6px; border: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">📦 Pack (isi 10):</span>
                    <strong style="color: var(--text-main);" id="pack-kampung-val">0 Pack</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.68rem;">
                    <span style="color: var(--text-muted);">🥚 Eceran Ready:</span>
                    <strong style="color: var(--ranch-green);" id="eceran-kampung-val">0 Butir</strong>
                </div>
            </div>
        </div>

    </div>

    <!-- BOX RIWAYAT PANEN (STRETCHES DOWN TO BOTTOM BAR, SCROLLS ONLY INSIDE CARD CONTAINER) -->
    <div class="panenku-history-box">
        <!-- HEADER BOX: TITLE & FILTER BULAN/TAHUN -->
        <div class="panenku-history-header">
            <h3 style="font-size: 0.88rem; font-weight: 800; color: var(--text-main);">📜 Riwayat Panen & Pengurangan</h3>
            
            <!-- FILTER BULAN & TAHUN -->
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
                <div style="flex: 1;">
                    <select id="filter-panen-month" class="form-input" style="padding: 3px 6px; font-size: 0.74rem;" onchange="renderPanenData()">
                        <option value="all">🗓️ Semua Bulan</option>
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                    </select>
                </div>
                <div style="flex: 1;">
                    <select id="filter-panen-year" class="form-input" style="padding: 3px 6px; font-size: 0.74rem;" onchange="renderPanenData()">
                        <option value="all">📅 Semua Tahun</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- SCROLLABLE HISTORY LIST CONTAINER -->
        <div id="panen-history-container" class="panenku-history-scroll-list">
            <div class="card-placeholder">
                <span class="placeholder-icon">📋</span>
                <p>Belum ada catatan panen terdaftar. Klik tombol ➕ di navigasi bawah untuk menambah panen.</p>
            </div>
        </div>
    </div>
</section>
