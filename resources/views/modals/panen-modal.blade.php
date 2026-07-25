<!-- MODAL INPUT PANEN / PENGURANGAN TELUR (KHUSUS ADMIN) -->
<div id="modal-input-panen" class="modal-overlay">
    <div class="modal-box">
        
        <!-- 2 TAB CHOOSER BUTTONS -->
        <div style="display: flex; gap: 4px; background: var(--bg-card-subtle); padding: 3px; border-radius: 8px; margin-bottom: 14px;">
            <button type="button" id="tab-panen-add" class="btn btn-ranch" style="flex: 1; font-size: 0.76rem;" onclick="switchPanenInputTab('add')">➕ Input Panen</button>
            <button type="button" id="tab-panen-sub" class="btn btn-outline" style="flex: 1; font-size: 0.76rem;" onclick="switchPanenInputTab('sub')">➖ Kurangi Telur</button>
        </div>

        <h2 id="modal-panen-title" style="margin-bottom: 4px; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span>🧺 Input Hasil Panen Telur</span>
        </h2>
        <p id="modal-panen-subtitle" style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 14px;">Masukkan jumlah butir panen hari ini untuk menambah stok.</p>

        <form onsubmit="handleInputPanenSubmit(event)">
            <!-- BARIS 1: TELUR AYAM NEGERI -->
            <div class="panen-box-row">
                <div class="panen-box-title">
                    <span class="egg-icon-badge">
                        <svg width="24" height="28" viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <radialGradient id="bEggModal" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stop-color="#F3C39D"/>
                                    <stop offset="50%" stop-color="#B06530"/>
                                    <stop offset="100%" stop-color="#5E2D0B"/>
                                </radialGradient>
                            </defs>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#B06530"/>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="url(#bEggModal)"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.25" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <div>
                        <strong style="display: block; font-size: 0.82rem; color: var(--text-main);">Telur Negeri</strong>
                        <span style="font-size: 0.68rem; color: #b06530; font-weight: 700;">Warna Cokelat</span>
                    </div>
                </div>
                <div class="stepper-control">
                    <button type="button" class="btn-stepper" onclick="changePanenQty('negeri', -1)">-</button>
                    <input type="number" id="input-panen-negeri" class="stepper-input" min="0" value="0" required>
                    <button type="button" class="btn-stepper" onclick="changePanenQty('negeri', 1)">+</button>
                </div>
            </div>

            <!-- BARIS 2: TELUR AYAM KAMPUNG -->
            <div class="panen-box-row">
                <div class="panen-box-title">
                    <span class="egg-icon-badge">
                        <svg width="24" height="28" viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <radialGradient id="wEggModal" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stop-color="#FFFFFF"/>
                                    <stop offset="60%" stop-color="#F1F5F9"/>
                                    <stop offset="100%" stop-color="#CBD5E1"/>
                                </radialGradient>
                            </defs>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4"/>
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="url(#wEggModal)" stroke="#94A3B8" stroke-width="4"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.75" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <div>
                        <strong style="display: block; font-size: 0.82rem; color: var(--text-main);">Telur Kampung</strong>
                        <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700;">Warna Putih</span>
                    </div>
                </div>
                <div class="stepper-control">
                    <button type="button" class="btn-stepper" onclick="changePanenQty('kampung', -1)">-</button>
                    <input type="number" id="input-panen-kampung" class="stepper-input" min="0" value="0" required>
                    <button type="button" class="btn-stepper" onclick="changePanenQty('kampung', 1)">+</button>
                </div>
            </div>

            <!-- KETERANGAN / ALASAN PENGURANGAN -->
            <div id="row-reason-container" style="display: none; margin-bottom: 12px;">
                <label class="form-label">📌 Alasan / Peruntukan Pengurangan:</label>
                <select id="input-panen-reason" class="form-input" onchange="toggleCustomReasonInput()" style="margin-bottom: 6px;">
                    <option value="Dimakan Sendiri">🍽️ Dimakan Sendiri (Konsumsi Pribadi)</option>
                    <option value="Sedekah / Hadiah">🎁 Sedekah / Hadiah untuk Orang</option>
                    <option value="Telur Pecah / Rusak">💔 Telur Pecah / Rusak</option>
                    <option value="custom">✏️ Tulis Alasan Custom Sendiri...</option>
                </select>
                <input type="text" id="input-panen-reason-custom" class="form-input" placeholder="Tuliskan alasan pengurangan (misal: Acara syukuran, dll)..." style="display: none;">
            </div>

            <!-- TIMESTAMP TANGGAL -->
            <div style="margin-bottom: 16px;">
                <label class="form-label">📅 Tanggal Catatan:</label>
                <input type="date" id="input-panen-date" class="form-input" onclick="if(this.showPicker) this.showPicker();" required>
            </div>

            <!-- BUTTON BATAL & SUBMIT -->
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeInputPanenModal()">Batal</button>
                <button type="submit" id="btn-panen-submit" class="btn btn-ranch">Simpan Catatan</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL CONFIRM DELETE PANEN RECORD -->
<div id="modal-delete-confirm" class="modal-overlay">
    <div class="modal-box" style="text-align: center;">
        <div style="width: 52px; height: 52px; background: rgba(190, 18, 60, 0.15); border: 2px solid var(--ranch-rose); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.6rem;">
            🗑️
        </div>
        <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">Hapus Catatan Ini?</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">Catatan ini akan dihapus permanen dan jumlah stok akan dihitung kembali.</p>

        <div style="display: flex; gap: 8px; justify-content: center;">
            <button type="button" class="btn btn-outline" style="flex: 1;" onclick="closeDeleteConfirmModal()">Batal</button>
            <button type="button" class="btn btn-rose" style="flex: 1;" onclick="executeDeletePanenRecord()">Ya, Hapus</button>
        </div>
    </div>
</div>
