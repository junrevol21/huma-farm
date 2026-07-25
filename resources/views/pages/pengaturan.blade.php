<!-- HALAMAN: PENGATURAN (AKSES DARI GEAR TOPBAR) -->
<section id="pengaturan" class="page-section">
    <div class="page-header">
        <div>
            <h1 class="page-title">⚙️ Halaman Pengaturan Akun</h1>
            <p class="page-subtitle">Ubah logo profil, perbarui nomor WhatsApp, dan ganti password akun Anda.</p>
        </div>
    </div>

    <div class="grid-2">
        <!-- 1. UBAH LOGO PROFIL (EMOJI KEYBOARD GRID PICKER) -->
        <div class="ranch-card">
            <h3>🎨 Ubah Logo Profil</h3>
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
                <div class="emoji-keyboard-wrapper">
                    <div class="emoji-keyboard-title">
                        <span>🌾 Pilihan Icon Peternakan & Alam:</span>
                        <span style="font-size: 0.7rem; color: var(--ranch-amber);">Klik Icon</span>
                    </div>
                    <div class="emoji-grid-container" id="farm-emoji-picker-grid">
                        <!-- DILENGKAPI VIA JS AUTOMATICALLY -->
                    </div>
                </div>

                <button type="submit" class="btn btn-ranch" style="width: 100%;">💾 Simpan Logo Profil Baru</button>
            </form>
        </div>

        <!-- 2. UPDATE NOMOR WA (DENGAN VERIFIKASI PASSWORD EXISTING) -->
        <div class="ranch-card">
            <h3>📱 Update Nomor WhatsApp</h3>
            <form onsubmit="handleUpdatePhoneSubmit(event)" style="margin-top: 10px;">
                <div style="margin-bottom: 8px;">
                    <label class="form-label">Nomor WA Baru:</label>
                    <input type="tel" id="set-new-phone" class="form-input" placeholder="08xxxxxxxxxx" required>
                </div>
                <div style="margin-bottom: 14px;">
                    <label class="form-label">Konfirmasi Password Anda Sekarang:</label>
                    <input type="password" id="set-confirm-curr-pass" class="form-input" placeholder="Password existing..." required>
                </div>
                <button type="submit" class="btn btn-ranch" style="width: 100%;">📱 Perbarui Nomor WA</button>
            </form>
        </div>

        <!-- 3. RUBAH PASSWORD -->
        <div class="ranch-card">
            <h3>🔐 Rubah Password Akun</h3>
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
                <button type="submit" class="btn btn-outline" style="width: 100%;">🔒 Simpan Password Baru</button>
            </form>
        </div>

        <!-- 4. PENGATURAN PEMBAYARAN ADMIN -->
        <div class="ranch-card" data-role="admin" id="admin-payment-setting-card" style="display: none; grid-column: 1 / -1;">
            <h3 style="margin-bottom: 12px;">💳 Pengaturan Metode Pembayaran</h3>

            <!-- BANK SETTINGS -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <p style="font-size: 0.78rem; font-weight: 700; color: var(--ranch-amber); margin-bottom: 10px;">🏦 Pengaturan Rekening Bank</p>
                <form onsubmit="handleUpdateBankSubmit(event)">
                    <div style="margin-bottom: 8px;">
                        <label class="form-label">Nama Bank:</label>
                        <input type="text" id="setting-bank-name" class="form-input" placeholder="Contoh: BSI, BCA, Mandiri...">
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label class="form-label">Nomor Rekening:</label>
                        <input type="text" id="setting-bank-number" class="form-input" placeholder="Contoh: 7367004597">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label class="form-label">Atas Nama:</label>
                        <input type="text" id="setting-bank-owner" class="form-input" placeholder="Nama pemilik rekening">
                    </div>
                    <button type="submit" class="btn btn-ranch" style="width: 100%;">🏦 Simpan Data Bank</button>
                </form>
            </div>

            <!-- QRIS SETTINGS -->
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                <p style="font-size: 0.78rem; font-weight: 700; color: var(--ranch-amber); margin-bottom: 10px;">📱 Pengaturan QRIS</p>
                <form onsubmit="handleUpdateQrisSubmit(event)">
                    <div style="margin-bottom: 8px;">
                        <label class="form-label">Nama Merchant QRIS:</label>
                        <input type="text" id="setting-qris-merchant" class="form-input" placeholder="Contoh: Huma Farm">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label class="form-label">URL Gambar QR Code:</label>
                        <input type="text" id="setting-qris-url" class="form-input" placeholder="images/qris_huma_farm.png">
                    </div>
                    <div style="margin-bottom: 12px; background: var(--bg-card); padding: 8px; border-radius: 6px; border: 1px dashed var(--border-color);">
                        <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                            <span>📤 Pilih Gambar QRIS (Galeri/File):</span>
                            <span id="upload-qris-status" style="font-size:0.65rem; color:var(--text-muted);">Siap</span>
                        </label>
                        <input type="file" id="setting-qris-file" accept="image/*" class="form-input" style="font-size:0.72rem; padding:4px;" onchange="handleQrisFileSelect(this)">
                    </div>
                    <!-- QRIS Preview -->
                    <div style="text-align: center; margin-bottom: 10px;">
                        <img id="qris-preview-settings" src="images/qris_huma_farm.png" alt="Preview QRIS" style="max-width: 120px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <p style="font-size: 0.67rem; color: var(--text-muted); margin-top: 3px;">Preview QR Code saat ini</p>
                    </div>
                    <button type="submit" class="btn btn-ranch" style="width: 100%;">📱 Simpan Pengaturan QRIS</button>
                </form>
            </div>
        </div>
    </div>
</section>
