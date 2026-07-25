<!-- MODAL PENGATURAN HARGA TELUR TOKO -->
<div id="modal-toko-pricing" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 4px; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span>⚙️ Pengaturan Harga Telur</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 14px;">Atur harga jual 1 Pack (isi 10) dan Eceran untuk Telur Negeri & Kampung.</p>

        <form onsubmit="handleSaveTokoPricingSubmit(event)">
            <!-- BARIS 1: TELUR NEGERI -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                <strong style="font-size: 0.84rem; color: #b06530; display: block; margin-bottom: 6px;">🥚 Harga Telur Negeri (Cokelat)</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <label class="form-label">1 Pack (isi 10):</label>
                        <input type="number" id="price-negeri-pack" class="form-input" min="0" required>
                    </div>
                    <div>
                        <label class="form-label">Eceran (1 Butir):</label>
                        <input type="number" id="price-negeri-egg" class="form-input" min="0" required>
                    </div>
                </div>
            </div>

            <!-- BARIS 2: TELUR KAMPUNG -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 14px;">
                <strong style="font-size: 0.84rem; color: var(--ranch-green); display: block; margin-bottom: 6px;">🥚 Harga Telur Kampung (Putih)</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <label class="form-label">1 Pack (isi 10):</label>
                        <input type="number" id="price-kampung-pack" class="form-input" min="0" required>
                    </div>
                    <div>
                        <label class="form-label">Eceran (1 Butir):</label>
                        <input type="number" id="price-kampung-egg" class="form-input" min="0" required>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeTokoPricingModal()">Batal</button>
                <button type="submit" class="btn btn-ranch">💾 Simpan Harga Baru</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL INPUT PENGELUARAN KAS (KHUSUS ADMIN) -->
<div id="modal-input-pengeluaran" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 4px; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span>📤 Catat Pengeluaran Kas Usaha</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 14px;">Masukkan pengeluaran kas untuk operasional kandang, pakan, obat, dll.</p>

        <form onsubmit="handleInputPengeluaranSubmit(event)" autocomplete="off">
            <div style="margin-bottom: 10px;">
                <label class="form-label">📌 Kategori / Peruntukan Pengeluaran:</label>
                <select id="expense-category" class="form-input" required>
                    <option value="Pembelian Pakan">🌾 Pembelian Pakan Ayam</option>
                    <option value="Obat & Vitamin">💊 Obat, Nutrisi & Vitamin</option>
                    <option value="Peralatan Kandang">🛠️ Peralatan & Perawatan Kandang</option>
                    <option value="Gaji & Operasional">👷 Gaji & Biaya Operasional</option>
                    <option value="Lain-lain">✏️ Pengeluaran Lainnya</option>
                </select>
            </div>

            <div style="margin-bottom: 10px;">
                <label class="form-label">💰 Jumlah Nominal Pengeluaran (Rp):</label>
                <input type="number" id="expense-amount" class="form-input" min="1" placeholder="Contoh: 150000" required>
            </div>

            <div style="margin-bottom: 10px;">
                <label class="form-label">📝 Catatan Keterangan (Opsional):</label>
                <input type="text" id="expense-note" class="form-input" placeholder="Misal: Beli pakan jagung 50kg...">
            </div>

            <div style="margin-bottom: 16px;">
                <label class="form-label">📅 Tanggal Pengeluaran:</label>
                <input type="date" id="expense-date" class="form-input" required>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeInputPengeluaranModal()">Batal</button>
                <button type="submit" class="btn btn-ranch" style="background: linear-gradient(135deg, #be123c, #e11d48); border-color: rgba(225,29,72,0.4);">
                    💸 Simpan Pengeluaran
                </button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL USER ORDER (STEP 1: RINCIAN ITEM & NAMA PEMESAN) -->
<div id="modal-user-order" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 2px; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span>🛒 Form Pesan / Beli Telur</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.73rem; margin-bottom: 10px;">Pilih jumlah telur dan isi data pemesan.</p>

        <form onsubmit="handleQuickUserOrderStep1Submit(event)">

            <!-- INFORMASI PEMESAN -->
            <div id="order-buyer-row" style="margin-bottom: 8px;">
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">👤 Nama Pemesan / Pembeli:</label>
                <div style="position: relative;">
                    <input type="text" id="quick-order-buyer-input"
                        class="form-input"
                        placeholder="Masukkan nama Anda..."
                        autocomplete="off"
                        oninput="handleOrderBuyerSearch(this.value)"
                        style="font-weight: 600; padding: 6px 10px; font-size: 0.8rem;" required>
                    <div id="order-buyer-dropdown" class="order-buyer-dropdown" style="display:none;"></div>
                </div>
            </div>

            <div id="order-phone-row" style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">📱 No. WhatsApp (Untuk Konfirmasi):</label>
                <input type="tel" id="quick-order-phone-input"
                    class="form-input"
                    placeholder="Contoh: 082299336676"
                    autocomplete="off" style="padding: 6px 10px; font-size: 0.8rem;" required>
            </div>

            <!-- CARD TELUR AYAM NEGERI (PACK & ECERAN STEPPERS) -->
            <div class="panen-box-row" style="flex-direction: column; gap: 6px; align-items: stretch; padding: 8px 10px; margin-bottom: 8px;">
                <div class="panen-box-title" style="margin-bottom: 0; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="egg-icon-badge" style="width: 26px; height: 26px;">
                            <svg width="20" height="24" viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <radialGradient id="bEggOrderModal" cx="35%" cy="30%" r="70%">
                                        <stop offset="0%" stop-color="#F3C39D"/>
                                        <stop offset="50%" stop-color="#B06530"/>
                                        <stop offset="100%" stop-color="#5E2D0B"/>
                                    </radialGradient>
                                </defs>
                                <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#B06530"/>
                                <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="url(#bEggOrderModal)"/>
                            </svg>
                        </span>
                        <div>
                            <strong style="display: block; font-size: 0.8rem; color: var(--text-main);">Telur Negeri</strong>
                        </div>
                    </div>
                    <!-- RINGKAS 2 BARIS STOK READY -->
                    <div style="font-size: 0.62rem; color: var(--text-muted); text-align: right; line-height: 1.25;">
                        <div>📦 Ready: <strong id="modal-stock-pack-negeri" style="color: #b06530;">0 Pack</strong></div>
                        <div>🥚 Ready: <strong id="modal-stock-egg-negeri" style="color: #b06530;">0 Butir</strong></div>
                    </div>
                </div>

                <!-- DUAL SUB-ROWS: PACK & ECERAN STEPPERS -->
                <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-card); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                            <span>📦</span> Pack <small style="font-weight: normal; color: var(--text-muted);">(Isi 10)</small>
                        </span>
                        <div class="stepper-control" style="height: 28px;">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('negeri_pack', -1)">-</button>
                            <input type="number" id="order-qty-negeri-pack" class="stepper-input" style="width: 32px; font-size: 0.8rem;" min="0" value="0" oninput="onOrderQtyInput('negeri_pack', this.value)">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('negeri_pack', 1)">+</button>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 4px;">
                        <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                            <span>🥚</span> Eceran <small style="font-weight: normal; color: var(--text-muted);">(Butir)</small>
                        </span>
                        <div class="stepper-control" style="height: 28px;">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('negeri_egg', -1)">-</button>
                            <input type="number" id="order-qty-negeri-egg" class="stepper-input" style="width: 32px; font-size: 0.8rem;" min="0" value="0" oninput="onOrderQtyInput('negeri_egg', this.value)">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('negeri_egg', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CARD TELUR AYAM KAMPUNG (PACK & ECERAN STEPPERS) -->
            <div class="panen-box-row" style="flex-direction: column; gap: 6px; align-items: stretch; padding: 8px 10px; margin-bottom: 8px;">
                <div class="panen-box-title" style="margin-bottom: 0; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="egg-icon-badge" style="width: 26px; height: 26px;">
                            <svg width="20" height="24" viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <radialGradient id="wEggOrderModal" cx="35%" cy="30%" r="70%">
                                        <stop offset="0%" stop-color="#FFFFFF"/>
                                        <stop offset="60%" stop-color="#F1F5F9"/>
                                        <stop offset="100%" stop-color="#CBD5E1"/>
                                    </radialGradient>
                                </defs>
                                <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4"/>
                                <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="url(#wEggOrderModal)" stroke="#94A3B8" stroke-width="4"/>
                            </svg>
                        </span>
                        <div>
                            <strong style="display: block; font-size: 0.8rem; color: var(--text-main);">Telur Kampung</strong>
                        </div>
                    </div>
                    <!-- RINGKAS 2 BARIS STOK READY -->
                    <div style="font-size: 0.62rem; color: var(--text-muted); text-align: right; line-height: 1.25;">
                        <div>📦 Ready: <strong id="modal-stock-pack-kampung" style="color: var(--ranch-green);">0 Pack</strong></div>
                        <div>🥚 Ready: <strong id="modal-stock-egg-kampung" style="color: var(--ranch-green);">0 Butir</strong></div>
                    </div>
                </div>

                <!-- DUAL SUB-ROWS: PACK & ECERAN STEPPERS -->
                <div style="display: flex; flex-direction: column; gap: 4px; background: var(--bg-card); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                            <span>📦</span> Pack <small style="font-weight: normal; color: var(--text-muted);">(Isi 10)</small>
                        </span>
                        <div class="stepper-control" style="height: 28px;">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('kampung_pack', -1)">-</button>
                            <input type="number" id="order-qty-kampung-pack" class="stepper-input" style="width: 32px; font-size: 0.8rem;" min="0" value="0" oninput="onOrderQtyInput('kampung_pack', this.value)">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('kampung_pack', 1)">+</button>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 4px;">
                        <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                            <span>🥚</span> Eceran <small style="font-weight: normal; color: var(--text-muted);">(Butir)</small>
                        </span>
                        <div class="stepper-control" style="height: 28px;">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('kampung_egg', -1)">-</button>
                            <input type="number" id="order-qty-kampung-egg" class="stepper-input" style="width: 32px; font-size: 0.8rem;" min="0" value="0" oninput="onOrderQtyInput('kampung_egg', this.value)">
                            <button type="button" class="btn-stepper" style="width: 26px; height: 26px;" onclick="changeOrderQty('kampung_egg', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STOCK STATUS NOTIF (shown when stock insufficient) -->
            <div id="order-stock-warning" class="order-stock-warning" style="display:none; padding: 6px 10px; font-size: 0.72rem; margin-bottom: 8px;">
                <span>⚠️</span>
                <div id="order-stock-warning-text">Stok kurang — silakan ajukan Pre-Order.</div>
            </div>

            <!-- PRICE SUMMARY -->
            <div id="order-price-summary" style="display:none; background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 7px 10px; margin-bottom: 10px; font-size: 0.74rem;">
                <div id="order-price-details-container" style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 3px;"></div>
                <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-color); padding-top: 4px;">
                    <span style="font-weight: 800; color: var(--text-main);">Subtotal Tagihan</span>
                    <span id="order-price-total" style="font-weight: 800; color: var(--ranch-amber); font-size: 0.84rem;"></span>
                </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                <button type="button" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.76rem;" onclick="closeQuickUserOrderModal()">Batal</button>
                <button type="submit" id="order-submit-btn" class="btn btn-ranch" style="padding: 6px 14px; font-size: 0.78rem;" disabled>
                    Lanjut ke Pembayaran ➔
                </button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL EDIT RIWAYAT PESANAN (UNTUK ADMIN & USER) -->
<div id="modal-edit-order" class="modal-overlay">
    <div class="modal-box" style="max-width: 360px; max-height: 95dvh; display:flex; flex-direction:column; overflow:hidden; padding: 16px; gap: 8px;">
        <h2 style="margin: 0; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 6px; flex-shrink: 0;">
            <span>✏️ Edit Pesanan / Pre-Order</span>
        </h2>
        <input type="hidden" id="edit-order-id-hidden">

        <form onsubmit="handleSaveEditOrderSubmit(event)" style="flex:1; overflow-y:auto; min-height:0; display:flex; flex-direction:column; gap:10px; padding-right:2px;">
            <!-- INFORMASI PEMESAN -->
            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">👤 Nama Pembeli:</label>
                <input type="text" id="edit-order-buyer" class="form-input" style="font-weight:600; padding:6px; font-size:0.78rem;" required>
            </div>

            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">📱 No. WhatsApp:</label>
                <input type="tel" id="edit-order-phone" class="form-input" style="padding:6px; font-size:0.78rem;" required>
            </div>

            <!-- JUMLAH PEMBELIAN -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; display:flex; flex-direction:column; gap:8px;">
                <span style="font-size:0.72rem; font-weight:700; color:var(--text-main); display:block;">📦 Jumlah Produk:</span>
                
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span id="edit-order-product-label" style="font-size:0.74rem; font-weight:700; color:var(--text-main);">Telur Negeri</span>
                    <div class="stepper-control" style="height:26px;">
                        <button type="button" class="btn-stepper" style="width:24px; height:24px;" onclick="changeEditOrderQty(-1)">-</button>
                        <input type="number" id="edit-order-qty" class="stepper-input" style="width:36px; font-size:0.78rem;" min="1" required>
                        <button type="button" class="btn-stepper" style="width:24px; height:24px;" onclick="changeEditOrderQty(1)">+</button>
                    </div>
                </div>
            </div>

            <!-- TIMESTAMP / TANGGAL TRANSAKSI -->
            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">📅 Tanggal & Waktu Order:</label>
                <input type="datetime-local" id="edit-order-timestamp" class="form-input" style="padding:6px; font-size:0.78rem;" required>
                <span id="edit-timestamp-hint" style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 2px;"></span>
            </div>

            <!-- STATUS PEMBAYARAN (KHUSUS ADMIN) -->
            <div id="edit-order-status-row">
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">💳 Status Pembayaran:</label>
                <select id="edit-order-payment-status" class="form-input" style="padding:6px; font-size:0.78rem; font-weight:700;">
                    <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                </select>
            </div>

            <!-- ACTION BUTTONS -->
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; flex-shrink: 0;">
                <button type="button" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.76rem;" onclick="closeEditOrderModal()">Batal</button>
                <button type="submit" class="btn btn-ranch" style="padding: 6px 14px; font-size: 0.78rem;">💾 Simpan Perubahan</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL STEP 2: PILIH METODE PEMBAYARAN & REKENING/QRIS -->
<div id="modal-payment-instructions" class="modal-overlay">
    <div class="modal-box" style="text-align: center; max-width: 360px; max-height: 95dvh; display: flex; flex-direction: column; padding: 12px; gap: 8px; overflow: hidden; font-size: 0.74rem;">
        
        <!-- Header (Fixed) -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; flex-shrink: 0;">
            <h2 style="font-size: 0.88rem; font-weight: 800; color: var(--text-main); margin: 0;">💳 Pembayaran & Order</h2>
            <span style="font-size: 0.65rem; background: var(--bg-card-subtle); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 5px; font-weight: 700; color: var(--ranch-amber);" id="pay-modal-order-id">#ORD-000</span>
        </div>

        <!-- Scrollable / Auto-adjusting Content Area -->
        <div style="flex: 1; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding-right: 2px;">
            
            <!-- Rincian Tagihan -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 8px; text-align: left; font-size: 0.7rem; flex-shrink: 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="color: var(--text-muted);">Nama Pemesan:</span>
                    <strong style="color: var(--text-main);" id="pay-modal-buyer-name">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="color: var(--text-muted);">No. WhatsApp:</span>
                    <strong style="color: var(--text-main);" id="pay-modal-buyer-phone">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span style="color: var(--text-muted);">Rincian Order:</span>
                    <strong style="color: var(--text-main); font-size: 0.68rem;" id="pay-modal-order-desc">-</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 4px; margin-top: 4px; background: rgba(245,158,11,0.06); margin-left: -8px; margin-right: -8px; padding-left: 8px; padding-right: 8px;">
                    <span style="font-weight: 800; color: var(--text-main); font-size: 0.7rem;">TOTAL BAYAR:</span>
                    <strong style="color: var(--ranch-amber); font-size: 0.95rem;" id="pay-modal-total-amount">Rp 0</strong>
                </div>
            </div>

            <!-- Selector Tab Metode Pembayaran -->
            <div style="flex-shrink: 0;">
                <div class="payment-methods-grid" style="gap: 4px;">
                    <label class="payment-method-item selected" id="label-pay-bsi" onclick="selectPaymentMethod('bsi')" style="padding: 6px; min-height: unset; height: 38px;">
                        <input type="radio" name="pay_choice" value="bsi" checked style="accent-color: var(--ranch-amber); margin: 0 4px 0 0;">
                        <div style="display:inline-block; text-align: left; vertical-align: middle;">
                            <strong style="font-size: 0.72rem; color: var(--text-main); line-height: 1.1;">🏦 BSI</strong>
                            <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">Transfer</span>
                        </div>
                    </label>
                    <label class="payment-method-item" id="label-pay-qris" onclick="selectPaymentMethod('qris')" style="padding: 6px; min-height: unset; height: 38px;">
                        <input type="radio" name="pay_choice" value="qris" style="accent-color: var(--ranch-amber); margin: 0 4px 0 0;">
                        <div style="display:inline-block; text-align: left; vertical-align: middle;">
                            <strong style="font-size: 0.72rem; color: var(--text-main); line-height: 1.1;">📱 QRIS</strong>
                            <span style="font-size: 0.58rem; color: var(--text-muted); display: block;">Scan Code</span>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Box Rekening BSI -->
            <div id="bsi-payment-box" class="bsi-account-box" style="display: block; padding: 8px; border-radius: 6px; flex-shrink: 0; background: var(--bg-card-subtle);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                    <span style="font-size: 0.68rem; font-weight: 800; color: #10b981;" id="pay-bsi-bank-name">🏦 BANK BSI</span>
                    <span style="font-size: 0.58rem; background: #10b981; color: #fff; padding: 1px 4px; border-radius: 3px; font-weight: 700;">BSI</span>
                </div>
                <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); letter-spacing: 0.5px; margin-bottom: 1px;" id="pay-bsi-number">7367004597</div>
                <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 6px;">A.n. <strong style="color: var(--text-main);" id="pay-bsi-owner">Mela Mufida</strong></div>
                <button type="button" class="btn btn-ranch" style="font-size: 0.68rem; width: 100%; padding: 4px; min-height: 26px;" onclick="copyBSIAccountNumber()">📋 Salin Rekening</button>
            </div>

            <!-- Box QRIS Code -->
            <div id="qris-payment-box" class="qris-display-box" style="display: none; padding: 6px; border-radius: 6px; background: var(--bg-card-subtle);">
                <div style="font-size: 0.72rem; font-weight: 800; color: #111827; margin-bottom: 2px;" id="pay-qris-merchant">📱 QRIS HUMA FARM</div>
                <div style="background: #fff; padding: 4px; border-radius: 6px; display: inline-block; border: 1px solid #e5e7eb; margin-bottom: 2px;">
                    <img id="qris-img-element" src="images/qris_huma_farm.png" alt="QRIS Huma Farm" style="max-height: 120px; max-width: 120px; width: auto; height: auto; display: block; object-fit: contain;">
                </div>
                <span style="font-size: 0.6rem; color: #4b5563; display: block; line-height: 1.2;">Scan QRIS via E-Wallet atau Mobile Banking Anda.</span>
            </div>

        </div>

        <!-- Footer Action Buttons (Fixed at Bottom) -->
        <div style="display: flex; gap: 6px; margin-top: 4px; flex-shrink: 0;">
            <button type="button" class="btn btn-outline" style="flex: 1; font-size: 0.72rem; padding: 6px; min-height: 30px;" onclick="closePaymentInstructionsModal()">Kembali</button>
            <button type="button" class="btn btn-ranch" style="flex: 1.4; font-size: 0.72rem; padding: 6px; min-height: 30px;" onclick="executeOrderWithCountDown()">💬 Pesan via WA ➔</button>
        </div>
    </div>
</div>

<!-- MODAL COUNTDOWN REDIRECT 5 DETIK KE WA ADMIN -->
<div id="modal-wa-redirect-countdown" class="modal-overlay">
    <div class="modal-box" style="text-align: center; max-width: 340px; padding: 22px 18px;">
        <div style="width: 56px; height: 56px; background: rgba(245, 158, 11, 0.15); border: 2px solid var(--ranch-amber); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            <span style="font-size: 1.8rem; font-weight: 900; color: var(--ranch-amber);" id="wa-countdown-num">5</span>
        </div>
        <h2 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">Mengarahkan ke WhatsApp...</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; margin-bottom: 14px;">
            Dalam <strong id="wa-countdown-num-text" style="color: var(--ranch-amber);">5 detik</strong> Anda akan otomatis diarahkan ke WA Admin Huma Farm.<br><br>
            📸 <strong>PENTING:</strong> Setelah bayar, kirimkan <strong>screenshot bukti bayar</strong> di WA untuk pengubahan status lunas. Terima kasih!
        </p>

        <button type="button" class="btn btn-ranch" style="width: 100%; font-size: 0.78rem; padding: 8px;" onclick="forceOpenWhatsAppNow()">💬 Langsung Buka WA Sekarang</button>
    </div>
</div>
