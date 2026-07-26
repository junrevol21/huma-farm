<!-- UNIVERSAL SYSTEM NOTIFICATION MODAL (digunakan oleh showNotificationModal() di app.js) -->
<div id="modal-system-notification" class="modal-overlay">
    <div class="modal-box" style="max-width: 340px; text-align: center;">
        <div id="sys-notif-icon-box" style="width: 56px; height: 56px; background: rgba(217, 119, 6, 0.15); border: 2px solid var(--ranch-amber); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.8rem;">
            🎉
        </div>
        <h2 id="sys-notif-title" style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">Notifikasi</h2>
        <p id="sys-notif-message" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 18px; line-height: 1.5;"></p>
        <button type="button" id="sys-notif-btn" class="btn btn-ranch" style="width: 100%; min-height: 40px;" onclick="closeSystemNotificationModal()">OK 👍</button>
    </div>
</div>

<!-- MODAL CONFIRM DELETE ORDER RECORD -->
<div id="modal-delete-order-confirm" class="modal-overlay">
    <div class="modal-box" style="text-align: center;">
        <div style="width: 52px; height: 52px; background: rgba(190, 18, 60, 0.15); border: 2px solid var(--ranch-rose); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.6rem;">
            🗑️
        </div>
        <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">Hapus Pesanan Ini?</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">Pesanan akan dihapus permanen dari riwayat toko dan stok telur akan dikembalikan.</p>

        <div style="display: flex; gap: 8px; justify-content: center;">
            <button type="button" class="btn btn-outline" style="flex: 1;" onclick="closeDeleteOrderConfirmModal()">Batal</button>
            <button type="button" class="btn btn-rose" style="flex: 1;" onclick="executeDeleteOrderRecord()">Ya, Hapus</button>
        </div>
    </div>
</div>

<!-- MODAL SUKSES OPERASI PANEN -->
<div id="modal-success-panen" class="modal-overlay">
    <div class="modal-box" style="text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(16, 185, 129, 0.15); border: 2px solid var(--ranch-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.8rem;" id="succ-modal-icon">
            🎉
        </div>
        <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;" id="succ-modal-title">Hasil Panen Berhasil Diinput!</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;" id="succ-modal-subtitle">Catatan stok telur panen hari ini telah berhasil disimpan.</p>

        <div style="background: var(--bg-card-subtle); border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="egg-icon-badge" style="width: 28px; height: 28px;">
                        <svg width="16" height="20" viewBox="0 0 100 125">
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#B06530"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.25" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <strong style="font-size: 0.82rem; color: var(--text-main);">Telur Negeri</strong>
                </div>
                <span style="font-size: 0.9rem; font-weight: 800; color: var(--ranch-amber);" id="succ-qty-negeri">0 Butir</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="egg-icon-badge" style="width: 28px; height: 28px;">
                        <svg width="16" height="20" viewBox="0 0 100 125">
                            <path d="M 50,5 C 22,5 5,45 5,75 C 5,102 25,120 50,120 C 75,120 95,102 95,75 C 95,45 78,5 50,5 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4"/>
                            <ellipse cx="38" cy="32" rx="14" ry="22" fill="#FFFFFF" opacity="0.75" transform="rotate(-18 38 32)"/>
                        </svg>
                    </span>
                    <strong style="font-size: 0.82rem; color: var(--text-main);">Telur Kampung</strong>
                </div>
                <span style="font-size: 0.9rem; font-weight: 800; color: var(--ranch-green);" id="succ-qty-kampung">0 Butir</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.78rem; color: var(--text-muted);">📅 Tanggal Catatan:</span>
                <strong style="font-size: 0.82rem; color: var(--text-main);" id="succ-date-val">-</strong>
            </div>
        </div>

        <button type="button" class="btn btn-ranch" style="width: 100%; min-height: 40px;" onclick="closeSuccessPanenModal()">Mantap! 👍</button>
    </div>
</div>

<!-- MODAL CONFIRM LOGOUT -->
<div id="modal-logout-confirm" class="modal-overlay">
    <div class="modal-box" style="text-align: center;">
        <div style="width: 52px; height: 52px; background: rgba(190, 18, 60, 0.15); border: 2px solid var(--ranch-rose); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.6rem;">
            🚪
        </div>
        <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">Keluar dari Akun?</h2>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px;">Apakah Anda yakin ingin keluar dari sesi akun ini?</p>

        <div style="display: flex; gap: 8px; justify-content: center;">
            <button type="button" class="btn btn-outline" style="flex: 1;" onclick="closeLogoutConfirmModal()">Batal</button>
            <button type="button" class="btn btn-rose" style="flex: 1;" onclick="confirmLogoutAction()">Keluar</button>
        </div>
    </div>
</div>

<!-- MODAL SETTINGS AVATAR -->
<div id="modal-settings-avatar" class="modal-overlay">
    <div class="modal-box" style="max-width: 360px;">
        <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; margin-bottom: 14px; text-align: center;">
            <h2 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">🎨 Ubah Logo Profil</h2>
        </div>
        <form onsubmit="handleUpdateAvatarSubmit(event)" style="margin-top: 10px;">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
                <div id="settings-avatar-preview" style="width: 62px; height: 62px; border-radius: 50%; background: linear-gradient(135deg, var(--ranch-gold), var(--ranch-amber)); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.1rem; font-weight: 800; border: 2.5px solid var(--border-color); box-shadow: 0 4px 10px rgba(0,0,0,0.15); overflow: hidden; flex-shrink: 0;">
                    👤
                </div>
                <div>
                    <strong style="font-size: 0.9rem; color: var(--text-main); display: block;" id="preview-logo-label">Logo Profil Aktif</strong>
                    <span style="font-size: 0.76rem; color: var(--text-muted);">Pilih icon favorit Anda di keyboard emoji bawah.</span>
                </div>
            </div>

            <!-- EMOJI KEYBOARD GRID CONTAINER (THEME PETERNAKAN) -->
            <div class="emoji-keyboard-wrapper" style="margin-bottom: 12px;">
                <div class="emoji-keyboard-title">
                    <span>🌾 Pilihan Icon Peternakan & Alam:</span>
                    <span style="font-size: 0.7rem; color: var(--ranch-amber);">Klik Icon</span>
                </div>
                <div class="emoji-grid-container" id="farm-emoji-picker-grid">
                    <!-- DILENGKAPI VIA JS AUTOMATICALLY -->
                </div>
            </div>

            <!-- PILIHAN WARNA BACKGROUND AVATAR -->
            <div style="margin-bottom: 14px; background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px;">
                <label class="form-label" style="font-size: 0.76rem; color: var(--text-main); display: block; margin-bottom: 6px; text-align: center;">🎨 Pilih Warna Background Avatar:</label>
                <div id="farm-avatar-bg-color-grid" style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
                    <!-- JS populate color buttons -->
                </div>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeSettingsModal('modal-settings-avatar')">Batal</button>
                <button type="submit" class="btn btn-ranch">💾 Simpan Logo</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL SETTINGS PHONE -->
<div id="modal-settings-phone" class="modal-overlay">
    <div class="modal-box" style="max-width: 340px;">
        <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; margin-bottom: 14px; text-align: center;">
            <h2 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">📱 Update Nomor WhatsApp</h2>
        </div>
        <form onsubmit="handleUpdatePhoneSubmit(event)" style="margin-top: 10px;">
            <div style="margin-bottom: 12px;">
                <label class="form-label">Nomor WA Baru:</label>
                <input type="tel" id="set-new-phone" class="form-input" placeholder="08xxxxxxxxxx" required>
            </div>
            <div style="margin-bottom: 14px;">
                <label class="form-label">Konfirmasi Password Anda Sekarang:</label>
                <input type="password" id="set-confirm-curr-pass" class="form-input" placeholder="Password existing..." required>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeSettingsModal('modal-settings-phone')">Batal</button>
                <button type="submit" class="btn btn-ranch">💾 Perbarui</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL SETTINGS PASSWORD -->
<div id="modal-settings-password" class="modal-overlay">
    <div class="modal-box" style="max-width: 340px;">
        <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; margin-bottom: 14px; text-align: center;">
            <h2 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">🔐 Rubah Password Akun</h2>
        </div>
        <form onsubmit="handleChangePasswordSubmit(event)" style="margin-top: 10px;">
            <div style="margin-bottom: 8px;">
                <label class="form-label">Password Lama:</label>
                <input type="password" id="chg-old-pass" class="form-input" placeholder="Password lama saat ini..." required>
            </div>
            <div style="margin-bottom: 8px;">
                <label class="form-label">Password Baru:</label>
                <input type="password" id="chg-new-pass" class="form-input" placeholder="Password baru..." required>
            </div>
            <div style="margin-bottom: 14px;">
                <label class="form-label">Konfirmasi Password Baru:</label>
                <input type="password" id="chg-confirm-pass" class="form-input" placeholder="Ulangi password baru..." required>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeSettingsModal('modal-settings-password')">Batal</button>
                <button type="submit" class="btn btn-ranch">💾 Simpan</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL SETTINGS PAYMENT (CARDS VIEW WITH EDIT TOGGLES & QR GENERATOR) -->
<div id="modal-settings-payment" class="modal-overlay">
    <div class="modal-box" style="max-width: 420px; max-height: 90vh; overflow-y: auto;">
        <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; margin-bottom: 14px; text-align: center;">
            <h2 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">💳 Pengaturan Metode Pembayaran</h2>
            <span style="font-size: 0.72rem; color: var(--text-muted);">Kelola data rekening bank & QRIS merchant yang tampil saat transaksi.</span>
        </div>
        
        <!-- SUMMARY CARDS VIEW (DEFAULT VIEW) -->
        <div id="payment-settings-summary-view" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px;">
            <!-- CARD 1: REKENING BANK TERSIMPAN -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 1.1rem;">🏦</span>
                        <strong style="font-size: 0.85rem; color: var(--ranch-amber);" id="card-bank-title">Rekening Bank</strong>
                    </div>
                    <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="toggleBankEditForm(true)">✏️ Edit Bank</button>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-main); background: var(--bg-card); border-radius: 6px; padding: 8px 10px; border: 1px dashed var(--border-color);">
                    <div><span style="color: var(--text-muted);">Bank:</span> <strong id="card-bank-name">BSI</strong></div>
                    <div><span style="color: var(--text-muted);">No. Rek:</span> <strong id="card-bank-number" style="letter-spacing: 0.5px;">7367004597</strong></div>
                    <div><span style="color: var(--text-muted);">A.n:</span> <strong id="card-bank-owner">Mela Mufida</strong></div>
                </div>
            </div>

            <!-- CARD 2: QRIS MERCHANT TERSIMPAN -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 1.1rem;">📱</span>
                        <strong style="font-size: 0.85rem; color: var(--ranch-amber);">QRIS Merchant</strong>
                    </div>
                    <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="toggleQrisEditForm(true)">✏️ Edit QRIS</button>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--text-main); background: var(--bg-card); border-radius: 6px; padding: 8px 10px; border: 1px dashed var(--border-color);">
                    <img id="card-qris-img-preview" src="images/qris_huma_farm.png" alt="QRIS Preview" style="width: 54px; height: 54px; object-fit: contain; border-radius: 6px; background: white; border: 1px solid var(--border-color); flex-shrink: 0;">
                    <div>
                        <div><span style="color: var(--text-muted);">Merchant:</span> <strong id="card-qris-merchant">Huma Farm</strong></div>
                        <span style="font-size: 0.68rem; color: var(--ranch-green); font-weight: 700;">✅ QRIS Siap Digunakan</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- EDIT FORM: BANK REKENING -->
        <div id="payment-bank-edit-box" style="display: none; background: var(--bg-card-subtle); border: 1px solid var(--ranch-amber); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom: 6px;">
                <strong style="font-size: 0.85rem; color: var(--ranch-amber);">🏦 Form Edit Rekening Bank</strong>
                <button type="button" class="btn btn-outline" style="font-size: 0.68rem; padding: 2px 6px;" onclick="toggleBankEditForm(false)">❌ Batal</button>
            </div>
            <form onsubmit="handleUpdateBankSubmit(event)">
                <div style="margin-bottom: 8px;">
                    <label class="form-label">Nama Bank:</label>
                    <input type="text" id="setting-bank-name" class="form-input" placeholder="Contoh: BSI, BCA, Mandiri..." required>
                </div>
                <div style="margin-bottom: 8px;">
                    <label class="form-label">Nomor Rekening:</label>
                    <input type="text" id="setting-bank-number" class="form-input" placeholder="Contoh: 7367004597" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label class="form-label">Atas Nama Pemilik:</label>
                    <input type="text" id="setting-bank-owner" class="form-input" placeholder="Contoh: Mela Mufida" required>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-outline" style="flex: 1;" onclick="toggleBankEditForm(false)">Kembali</button>
                    <button type="submit" class="btn btn-ranch" style="flex: 1.5;">💾 Simpan Bank</button>
                </div>
            </form>
        </div>

        <!-- EDIT FORM: QRIS MERCHANT -->
        <div id="payment-qris-edit-box" style="display: none; background: var(--bg-card-subtle); border: 1px solid var(--ranch-amber); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom: 6px;">
                <strong style="font-size: 0.85rem; color: var(--ranch-amber);">📱 Form Edit QRIS Merchant</strong>
                <button type="button" class="btn btn-outline" style="font-size: 0.68rem; padding: 2px 6px;" onclick="toggleQrisEditForm(false)">❌ Batal</button>
            </div>
            <form onsubmit="handleUpdateQrisSubmit(event)">
                <div style="margin-bottom: 10px;">
                    <label class="form-label">Nama Merchant QRIS:</label>
                    <input type="text" id="setting-qris-merchant" class="form-input" placeholder="Contoh: Huma Farm" required>
                </div>

                <!-- TIPE METHOD INPUT QRIS (UPLOAD FILE VS KODE QR GENERATOR) -->
                <div style="margin-bottom: 10px;">
                    <label class="form-label" style="font-size: 0.74rem; color: var(--text-muted); display: block; margin-bottom: 4px;">Pilih Cara Update QR Code:</label>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" id="qris-input-tab-upload" class="btn btn-ranch" style="flex: 1; font-size: 0.72rem; padding: 5px;" onclick="switchQrisInputTab('upload')">📤 Upload Gambar</button>
                        <button type="button" id="qris-input-tab-string" class="btn btn-outline" style="flex: 1; font-size: 0.72rem; padding: 5px;" onclick="switchQrisInputTab('string')">⚡ Auto Generate QR</button>
                    </div>
                </div>

                <!-- SECTION 1: UPLOAD GAMBAR QRIS FILE -->
                <div id="qris-box-tab-upload" style="margin-bottom: 12px; background: var(--bg-card); padding: 10px; border-radius: 8px; border: 1px dashed var(--border-color);">
                    <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                        <span>📤 Pilih File Gambar QRIS (Galeri/HP):</span>
                        <span id="upload-qris-status" style="font-size:0.65rem; color:var(--text-muted);">Siap</span>
                    </label>
                    <input type="file" id="setting-qris-file" accept="image/*" class="form-input" style="font-size:0.75rem; padding:6px; cursor: pointer;" onchange="handleQrisFileSelect(this)">
                </div>

                <!-- SECTION 2: AUTO GENERATE KODE STRING QRIS -->
                <div id="qris-box-tab-string" style="display: none; margin-bottom: 12px; background: var(--bg-card); padding: 10px; border-radius: 8px; border: 1px dashed var(--border-color);">
                    <label class="form-label">⚡ Masukkan Text / Payload Scan QRIS:</label>
                    <textarea id="setting-qris-code-string" class="form-input" style="font-size: 0.72rem; height: 55px; resize: none;" placeholder="Paste teks / payload hasil scan QRIS di sini (misal: 000201010211...)" oninput="handleQrisCodeStringInput(this.value)"></textarea>
                    <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-top: 3px;">Sistem akan membuatkan QR Code vektor jernih secara otomatis!</span>
                </div>

                <!-- PREVIEW BOX -->
                <div style="text-align: center; margin-bottom: 12px; background: var(--bg-card); padding: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <img id="qris-preview-settings" src="images/qris_huma_farm.png" alt="Preview QRIS" style="max-width: 130px; height: 130px; object-fit: contain; border-radius: 8px; background: white; padding: 4px; border: 1px solid var(--border-color);">
                    <p style="font-size: 0.67rem; color: var(--text-muted); margin-top: 4px;">Preview Tampilan QR Code Aktif</p>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-outline" style="flex: 1;" onclick="toggleQrisEditForm(false)">Kembali</button>
                    <button type="submit" class="btn btn-ranch" style="flex: 1.5;">📱 Simpan QRIS</button>
                </div>
            </form>
        </div>

        <div style="display: flex; justify-content: flex-end;">
            <button type="button" class="btn btn-outline" style="width: 100%;" onclick="closeSettingsModal('modal-settings-payment')">Tutup Modal</button>
        </div>
    </div>
</div>

<!-- ====================================================== -->
<!-- MODAL SESI BERAKHIR (SESSION EXPIRED) -->
<!-- ====================================================== -->
<div id="modal-session-expired" class="modal-overlay" style="z-index: 9999;">
    <div class="modal-box" style="max-width: 340px; text-align: center;">
        <div style="width: 64px; height: 64px; background: rgba(190, 18, 60, 0.12); border: 2px solid var(--ranch-rose); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 2rem;">
            ⏰
        </div>
        <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">Sesi Admin Berakhir</h2>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px; line-height: 1.55;">
            Sesi login admin Anda telah berakhir atau tidak valid.
        </p>
        <p style="font-size: 0.78rem; color: var(--ranch-amber); font-weight: 600; margin-bottom: 20px;">
            Anda telah dialihkan ke mode pengunjung.
        </p>
        <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-outline" style="flex: 1;" onclick="closeSessionExpiredModal()">
                Tutup
            </button>
            <button type="button" class="btn btn-ranch" style="flex: 1;" onclick="closeSessionExpiredModal(); openUnifiedAuthModal('login');">
                🔑 Login Kembali
            </button>
        </div>
    </div>
</div>

