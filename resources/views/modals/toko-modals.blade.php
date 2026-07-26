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

<!-- MODAL INPUT CASH FLOW / MUTASI KAS (KHUSUS ADMIN) -->
<div id="modal-input-pengeluaran" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 4px; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span id="cashflow-modal-title">💳 Catat Cash Flow Kas Usaha</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 12px;" id="cashflow-modal-subtitle">Pilih jenis transaksi kas (Pengeluaran atau Pemasukan) dan isi rinciannya.</p>

        <!-- TAB NAVIGATION (PENGELUARAN VS PEMASUKAN) -->
        <div style="display: flex; gap: 6px; background: var(--bg-card-subtle); padding: 4px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-color);">
            <button type="button" id="tab-cashflow-expense" class="btn btn-ranch" style="flex: 1; font-size: 0.8rem; padding: 6px;" onclick="switchCashFlowTab('expense')">
                📤 Pengeluaran (Expense)
            </button>
            <button type="button" id="tab-cashflow-income" class="btn btn-outline" style="flex: 1; font-size: 0.8rem; padding: 6px;" onclick="switchCashFlowTab('income')">
                📥 Pemasukan (Income)
            </button>
        </div>

        <form onsubmit="handleInputPengeluaranSubmit(event)" autocomplete="off">
            <!-- KATEGORI SELECT -->
            <div style="margin-bottom: 10px;">
                <label class="form-label" id="cashflow-category-label">📌 Kategori Pengeluaran:</label>
                <select id="expense-category" class="form-input" onchange="handleCashFlowCategoryChange(this)" required>
                    <!-- Populated dynamically by switchCashFlowTab() -->
                </select>

                <!-- INPUT KETIK MANUAL JIKA PILIH KATEGORI KUSTOM -->
                <div id="cashflow-custom-cat-row" style="display: none; margin-top: 6px;">
                    <input type="text" id="expense-custom-category" class="form-input" placeholder="📌 Ketik Nama Kategori Kustom Baru...">
                </div>
            </div>

            <!-- NOMINAL -->
            <div style="margin-bottom: 10px;">
                <label class="form-label" id="cashflow-amount-label">💰 Jumlah Nominal Pengeluaran (Rp):</label>
                <input type="number" id="expense-amount" class="form-input" min="1" placeholder="Contoh: 150000" required>
            </div>

            <!-- CATATAN -->
            <div style="margin-bottom: 10px;">
                <label class="form-label">📝 Catatan Keterangan (Opsional):</label>
                <input type="text" id="expense-note" class="form-input" placeholder="Misal: Beli pakan jagung 50kg...">
            </div>

            <!-- TANGGAL -->
            <div style="margin-bottom: 16px;">
                <label class="form-label" id="cashflow-date-label">📅 Tanggal Transaksi:</label>
                <input type="date" id="expense-date" class="form-input" style="cursor: pointer;" onclick="if('showPicker' in this) this.showPicker()" required>
            </div>

            <!-- BUTTON ACTIONS -->
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeInputPengeluaranModal()">Batal</button>
                <button type="submit" id="cashflow-submit-btn" class="btn btn-ranch" style="background: linear-gradient(135deg, #be123c, #e11d48); border-color: rgba(225,29,72,0.4);">
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
            <span>🛒 Form Pesan Telur</span>
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

            <!-- TANGGAL TRANSAKSI CUSTOM (ADMIN ONLY) -->
            <div id="admin-order-date-row" style="display: none; margin-bottom: 10px;">
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">📅 Tanggal Transaksi:</label>
                <input type="datetime-local" id="quick-order-date-input"
                    class="form-input"
                    style="padding: 6px 10px; font-size: 0.8rem;">
            </div>

            <!-- ACCORDION INPUT MODULE -->
            <style>
                .order-accordion-item {
                    border: 1px solid var(--border-color);
                    background: var(--bg-card-subtle);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    overflow: hidden;
                    transition: all 0.2s ease-in-out;
                }
                .order-accordion-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: var(--bg-card-subtle);
                    cursor: pointer;
                    user-select: none;
                }
                .order-accordion-header:hover {
                    background: rgba(255, 255, 255, 0.03);
                }
                .order-accordion-body {
                    display: none;
                    padding: 10px 12px;
                    border-top: 1px solid var(--border-color);
                    background: var(--bg-card);
                }
                .order-accordion-item.active .order-accordion-body {
                    display: block;
                }
                .order-accordion-arrow {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    transition: transform 0.2s;
                }
                .order-accordion-item.active .order-accordion-arrow {
                    transform: rotate(180deg);
                }
                .order-summary-pill {
                    font-size: 0.68rem;
                    background: var(--bg-card);
                    border: 1px solid transparent;
                    padding: 0;
                    margin-right: 0;
                    border-radius: 12px;
                    color: var(--ranch-amber);
                    font-weight: 700;
                    opacity: 0;
                    transform: scale(0.3);
                    max-width: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    display: inline-block;
                    vertical-align: middle;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .order-summary-pill.visible {
                    opacity: 1;
                    transform: scale(1);
                    max-width: 140px;
                    padding: 2px 8px;
                    margin-right: 6px;
                    border-color: var(--border-color);
                }
            </style>

            <!-- CARD TELUR AYAM NEGERI (ACCORDION) -->
            <div class="order-accordion-item" id="accordion-negeri">
                <div class="order-accordion-header" onclick="toggleOrderAccordion(this)">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.95rem;">🟤</span>
                        <strong style="font-size: 0.8rem; color: var(--text-main);">Telur Negeri</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span id="summary-negeri" class="order-summary-pill"></span>
                        <span class="order-accordion-arrow">▼</span>
                    </div>
                </div>
                <div class="order-accordion-body">
                    <div style="display: flex; justify-content: space-between; font-size: 0.62rem; color: var(--text-muted); margin-bottom: 6px;">
                        <div>📦 Ready: <strong id="modal-stock-pack-negeri" style="color: #b06530;">0 Pack</strong></div>
                        <div>🥚 Ready: <strong id="modal-stock-egg-negeri" style="color: #b06530;">0 Butir</strong></div>
                    </div>
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
            </div>

            <!-- CARD TELUR AYAM KAMPUNG (ACCORDION) -->
            <div class="order-accordion-item" id="accordion-kampung">
                <div class="order-accordion-header" onclick="toggleOrderAccordion(this)">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.95rem;">⚪</span>
                        <strong style="font-size: 0.8rem; color: var(--text-main);">Telur Kampung</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span id="summary-kampung" class="order-summary-pill"></span>
                        <span class="order-accordion-arrow">▼</span>
                    </div>
                </div>
                <div class="order-accordion-body">
                    <div style="display: flex; justify-content: space-between; font-size: 0.62rem; color: var(--text-muted); margin-bottom: 6px;">
                        <div>📦 Ready: <strong id="modal-stock-pack-kampung" style="color: var(--ranch-green);">0 Pack</strong></div>
                        <div>🥚 Ready: <strong id="modal-stock-egg-kampung" style="color: var(--ranch-green);">0 Butir</strong></div>
                    </div>
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
            </div>

            <!-- REWARD BOX (ADMIN ONLY, ACCORDION) -->
            <div class="order-accordion-item" id="admin-reward-container" style="display: none;">
                <div class="order-accordion-header" onclick="toggleOrderAccordion(this)">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.95rem;">🎁</span>
                        <strong style="font-size: 0.8rem; color: var(--ranch-amber);">Bonus Pembelian</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span id="summary-reward" class="order-summary-pill"></span>
                        <span class="order-accordion-arrow">▼</span>
                    </div>
                </div>
                <div class="order-accordion-body" style="background: var(--bg-card-subtle); padding: 8px 12px;">
                    <style>
                        .reward-label {
                            flex: 1;
                            text-align: center;
                            line-height: 24px;
                            height: 24px;
                            font-size: 0.65rem;
                            font-weight: 700;
                            color: var(--text-muted);
                            cursor: pointer;
                            border-radius: 12px;
                            transition: all 0.2s ease-in-out;
                        }
                        #reward-type-negeri:checked ~ label[for="reward-type-negeri"] {
                            background: var(--ranch-amber) !important;
                            color: #1c1815 !important;
                        }
                        #reward-type-kampung:checked ~ label[for="reward-type-kampung"] {
                            background: var(--ranch-green) !important;
                            color: #1c1815 !important;
                        }
                    </style>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <!-- Kiri: Radio Toggle Jenis Telur -->
                        <div class="reward-type-toggle" style="display: flex; background: var(--bg-card); border-radius: 15px; padding: 2px; border: 1px solid var(--border-color); width: 140px; height: 28px; align-items: center; justify-content: space-between;">
                            <input type="radio" name="reward_egg_type" id="reward-type-negeri" value="negeri" checked style="display: none;" onchange="onOrderQtyInput()">
                            <input type="radio" name="reward_egg_type" id="reward-type-kampung" value="kampung" style="display: none;" onchange="onOrderQtyInput()">
                            
                            <label for="reward-type-negeri" class="reward-label">Negeri</label>
                            <label for="reward-type-kampung" class="reward-label">Kampung</label>
                        </div>
                        
                        <!-- Kanan: Input Jumlah Butir -->
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <input type="number" id="quick-order-reward-qty" class="form-input" min="0" value="0" placeholder="0" 
                                style="padding: 4px 8px; font-size: 0.76rem; width: 60px; height: 28px; text-align: center;" oninput="onOrderQtyInput()">
                            <span style="font-size: 0.72rem; color: var(--text-muted);">Butir</span>
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



<!-- MODAL STEP 2: NOTA PEMESANAN & PEMBAYARAN -->
<div id="modal-payment-instructions" class="modal-overlay">
    <div class="modal-box" id="modal-payment-card-capture-target" style="text-align: center; max-width: 360px; max-height: 95dvh; display: flex; flex-direction: column; padding: 12px; gap: 8px; overflow: hidden; font-size: 0.74rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;">
        
        <!-- Header (Fixed) -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; flex-shrink: 0;">
            <h2 style="font-size: 0.88rem; font-weight: 800; color: var(--text-main); margin: 0;">🧾 Nota Pemesanan</h2>
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

            <!-- Combined Payment Methods Section (Bank Transfer & QRIS Code displayed together) -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
                
                <!-- Box Rekening BSI Transfer -->
                <div id="bsi-payment-box" class="bsi-account-box" style="display: block; padding: 8px; border-radius: 8px; background: var(--bg-card-subtle); text-align: left;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                        <span style="font-size: 0.72rem; font-weight: 800; color: #10b981;" id="pay-bsi-bank-name">🏦 TRANSFER BANK BSI</span>
                        <span style="font-size: 0.58rem; background: #10b981; color: #fff; padding: 1px 5px; border-radius: 3px; font-weight: 700;">BSI</span>
                    </div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); letter-spacing: 0.5px; margin-bottom: 1px;" id="pay-bsi-number">7367004597</div>
                    <div style="font-size: 0.68rem; color: var(--text-muted); margin-bottom: 6px;">A.n. <strong style="color: var(--text-main);" id="pay-bsi-owner">Mela Mufida</strong></div>
                    <button type="button" class="btn btn-ranch" style="font-size: 0.68rem; width: 100%; padding: 4px; min-height: 26px;" onclick="copyBSIAccountNumber()">📋 Salin Rekening BSI</button>
                </div>

                <!-- Box QRIS Code -->
                <div id="qris-payment-box" class="qris-display-box" style="display: block; padding: 8px; border-radius: 8px; background: var(--bg-card-subtle); text-align: center;">
                    <div style="font-size: 0.76rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;" id="pay-qris-merchant">📱 SCAN QRIS (ALL E-WALLET & BANK)</div>

                    <div style="background: #fff; padding: 6px; border-radius: 8px; display: inline-block; border: 1px solid #e5e7eb; margin-bottom: 6px; min-width: 140px; min-height: 140px;">
                        <img id="qris-img-element" src="images/qris_huma_farm.png" alt="QRIS Huma Farm" onerror="this.onerror=null; this.src='images/qris_huma_farm.png';" style="width: 140px; height: 140px; display: block; object-fit: contain; margin: 0 auto;">
                    </div>
                    
                    <span style="font-size: 0.65rem; color: var(--text-muted); display: block; line-height: 1.35; margin-bottom: 6px;">Scan QRIS via Mobile Banking / E-Wallet Anda (BCA, GoPay, OVO, Dana, dll) & masukkan nominal transfer.</span>
                    
                    <!-- BUTTON DOWNLOAD GAMBAR NOTA PEMESANAN PERSIS WEB -->
                    <button type="button" class="btn btn-outline" style="font-size: 0.68rem; width: 100%; padding: 4px 8px; min-height: 28px;" onclick="downloadQrisImage()">🖼️ Download Nota Pemesanan</button>
                </div>

            </div>

        </div>

        <!-- Footer Action Buttons (Fixed at Bottom) -->
        <div style="display: flex; gap: 6px; margin-top: 4px; flex-shrink: 0;">
            <button type="button" class="btn btn-outline" style="flex: 1; font-size: 0.72rem; padding: 6px; min-height: 30px;" onclick="closePaymentInstructionsModal(true)">Kembali</button>
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

        <a id="btn-force-open-wa" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-ranch" style="width: 100%; font-size: 0.78rem; padding: 8px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="forceOpenWhatsAppNow()">💬 Langsung Buka WA Sekarang</a>
    </div>
</div>

<!-- MODAL EDIT ORDER RECORD (KHUSUS ADMIN) -->
<div id="modal-edit-order" class="modal-overlay">
    <div class="modal-box" style="max-width: 380px; max-height: 92dvh; display:flex; flex-direction:column; padding:16px; overflow:hidden;">
        <h2 style="margin-bottom: 2px; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 6px; flex-shrink: 0;">
            <span>✏️ Edit Detail Pesanan</span>
        </h2>
        
        <form onsubmit="handleSaveEditOrderSubmit(event)" autocomplete="off" style="flex:1; overflow-y:auto; padding-right:2px; display:flex; flex-direction:column; gap:10px; margin-top:8px;">
            <input type="hidden" id="edit-order-id">

            <!-- ID ORDER BADGE DISPLAY -->
            <div style="background: var(--bg-card-subtle); padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.72rem; color: var(--text-muted);">Order ID:</span>
                <strong style="font-size: 0.82rem; color: var(--ranch-amber);" id="edit-order-id-label">#ORD-0000</strong>
            </div>

            <!-- NAMA PEMESAN -->
            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">👤 Nama Pemesan / Pembeli:</label>
                <input type="text" id="edit-order-buyer-name" class="form-input" style="padding: 6px 10px; font-size: 0.8rem;" required>
            </div>

            <!-- NO. WA -->
            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">📱 No. WhatsApp:</label>
                <input type="tel" id="edit-order-buyer-phone" class="form-input" style="padding: 6px 10px; font-size: 0.8rem;">
            </div>

            <!-- QTY PRODUCT ITEMS (EDIT QUANTITIES) -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <label class="form-label" style="font-size: 0.74rem; font-weight: 700; margin-bottom: 0;">🛒 Rincian Jumlah Pesanan:</label>
                
                <!-- TELUR NEGERI PACK & ECERAN -->
                <div style="background: var(--bg-card); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">🟤 Telur Negeri</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 0.72rem; color: var(--text-muted);">📦 Pack (Isi 10):</span>
                        <div class="stepper-control" style="height: 26px;">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('negeri_pack', -1)">-</button>
                            <input type="number" id="edit-qty-negeri-pack" class="stepper-input" style="width: 34px; font-size: 0.8rem;" min="0" value="0">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('negeri_pack', 1)">+</button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.72rem; color: var(--text-muted);">🥚 Eceran (Butir):</span>
                        <div class="stepper-control" style="height: 26px;">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('negeri_egg', -1)">-</button>
                            <input type="number" id="edit-qty-negeri-egg" class="stepper-input" style="width: 34px; font-size: 0.8rem;" min="0" value="0">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('negeri_egg', 1)">+</button>
                        </div>
                    </div>
                </div>

                <!-- TELUR KAMPUNG PACK & ECERAN -->
                <div style="background: var(--bg-card); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">⚪ Telur Kampung</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 0.72rem; color: var(--text-muted);">📦 Pack (Isi 10):</span>
                        <div class="stepper-control" style="height: 26px;">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('kampung_pack', -1)">-</button>
                            <input type="number" id="edit-qty-kampung-pack" class="stepper-input" style="width: 34px; font-size: 0.8rem;" min="0" value="0">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('kampung_pack', 1)">+</button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.72rem; color: var(--text-muted);">🥚 Eceran (Butir):</span>
                        <div class="stepper-control" style="height: 26px;">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('kampung_egg', -1)">-</button>
                            <input type="number" id="edit-qty-kampung-egg" class="stepper-input" style="width: 34px; font-size: 0.8rem;" min="0" value="0">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('kampung_egg', 1)">+</button>
                        </div>
                    </div>
                </div>

                <!-- BONUS / REWARD TELUR KAMPUNG -->
                <div style="background: var(--bg-card); padding: 8px; border-radius: 6px; border: 1px dashed var(--ranch-amber);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.72rem; font-weight: 700; color: var(--ranch-amber);">🎁 Bonus Telur Kampung (Gratis):</span>
                        <div class="stepper-control" style="height: 26px;">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('reward_egg', -1)">-</button>
                            <input type="number" id="edit-qty-reward-egg" class="stepper-input" style="width: 34px; font-size: 0.8rem;" min="0" value="0">
                            <button type="button" class="btn-stepper" style="width: 24px; height: 24px;" onclick="changeEditQty('reward_egg', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STATUS PEMBAYARAN -->
            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">💳 Status Pembayaran:</label>
                <select id="edit-order-payment-status" class="form-input" style="padding: 6px 10px; font-size: 0.8rem;" required>
                    <option value="Menunggu Konfirmasi">🟡 Menunggu Konfirmasi Admin</option>
                    <option value="Lunas">🟢 Lunas</option>
                    <option value="Belum Bayar">🔴 Belum Bayar</option>
                    <option value="Batal">❌ Batal</option>
                </select>
            </div>

            <!-- TANGGAL TRANSAKSI -->
            <div>
                <label class="form-label" style="font-size: 0.72rem; margin-bottom: 2px;">📅 Tanggal Transaksi:</label>
                <input type="date" id="edit-order-date" class="form-input" style="padding: 6px 10px; font-size: 0.8rem;" required>
            </div>

            <!-- ACTION BUTTONS -->
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; flex-shrink: 0;">
                <button type="button" class="btn btn-outline" onclick="closeEditOrderModal()">Batal</button>
                <button type="submit" class="btn btn-ranch" style="font-size: 0.78rem; padding: 6px 14px;">
                    💾 Simpan Perubahan
                </button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL EDIT CASH FLOW / MUTASI KAS (KHUSUS ADMIN) -->
<div id="modal-edit-cashflow" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 4px; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span id="edit-cashflow-modal-title">✏️ Edit Catatan Cash Flow</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 12px;">Ubah rincian kategori, nominal, tanggal, atau catatan transaksi kas usaha.</p>

        <!-- TAB NAVIGATION (PENGELUARAN VS PEMASUKAN) -->
        <div style="display: flex; gap: 6px; background: var(--bg-card-subtle); padding: 4px; border-radius: 8px; margin-bottom: 14px; border: 1px solid var(--border-color);">
            <button type="button" id="tab-edit-cashflow-expense" class="btn btn-ranch" style="flex: 1; font-size: 0.8rem; padding: 6px;" onclick="switchEditCashFlowTab('expense')">
                📤 Pengeluaran (Expense)
            </button>
            <button type="button" id="tab-edit-cashflow-income" class="btn btn-outline" style="flex: 1; font-size: 0.8rem; padding: 6px;" onclick="switchEditCashFlowTab('income')">
                📥 Pemasukan (Income)
            </button>
        </div>

        <form onsubmit="handleEditCashFlowSubmit(event)" autocomplete="off">
            <input type="hidden" id="edit-expense-id">

            <!-- KATEGORI SELECT -->
            <div style="margin-bottom: 10px;">
                <label class="form-label" id="edit-cashflow-category-label">📌 Kategori Pengeluaran:</label>
                <select id="edit-expense-category" class="form-input" onchange="handleEditCashFlowCategoryChange(this)" required>
                    <!-- Populated dynamically by switchEditCashFlowTab() -->
                </select>

                <!-- INPUT KETIK MANUAL JIKA PILIH KATEGORI KUSTOM -->
                <div id="edit-cashflow-custom-cat-row" style="display: none; margin-top: 6px;">
                    <input type="text" id="edit-expense-custom-category" class="form-input" placeholder="📌 Ketik Nama Kategori Kustom Baru...">
                </div>
            </div>

            <!-- NOMINAL -->
            <div style="margin-bottom: 10px;">
                <label class="form-label" id="edit-cashflow-amount-label">💰 Jumlah Nominal Pengeluaran (Rp):</label>
                <input type="number" id="edit-expense-amount" class="form-input" min="1" placeholder="Contoh: 150000" required>
            </div>

            <!-- CATATAN / KETERANGAN FULL EDIT -->
            <div style="margin-bottom: 10px;">
                <label class="form-label">📝 Catatan Keterangan (Opsional):</label>
                <input type="text" id="edit-expense-note" class="form-input" placeholder="Misal: Beli pakan jagung 50kg...">
            </div>

            <!-- TANGGAL TRANSAKSI EDITABLE -->
            <div style="margin-bottom: 16px;">
                <label class="form-label">📅 Tanggal Transaksi:</label>
                <input type="date" id="edit-expense-date" class="form-input" style="cursor: pointer;" onclick="if('showPicker' in this) this.showPicker()" required>
            </div>

            <!-- BUTTON ACTIONS -->
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeEditCashFlowModal()">Batal</button>
                <button type="submit" id="edit-cashflow-submit-btn" class="btn btn-ranch">
                    💾 Simpan Perubahan
                </button>
            </div>
        </form>
    </div>
</div>
