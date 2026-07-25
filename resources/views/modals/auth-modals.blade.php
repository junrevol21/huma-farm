<!-- MODAL UNIFIED AUTH -->
<div id="modal-unified-auth" class="modal-overlay">
    <div class="modal-box" style="max-width: 340px;">
        <!-- Header Title -->
        <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 8px; margin-bottom: 14px; text-align: center;">
            <h2 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">🔑 Login Admin Huma Farm</h2>
        </div>
        
        <!-- Tab headers removed as register is no longer available -->
        <div id="auth-tab-buttons" style="display: none; gap: 4px; background: var(--bg-card-subtle); padding: 3px; border-radius: 6px; margin-bottom: 14px;">
            <button type="button" id="tab-btn-login" class="btn btn-ranch" style="flex: 1; font-size: 0.78rem;" onclick="switchUnifiedAuthTab('login')">Login</button>
            <button type="button" id="tab-btn-register" class="btn btn-outline" style="flex: 1; font-size: 0.78rem;" onclick="switchUnifiedAuthTab('register')">Daftar Akun Baru</button>
        </div>

        <!-- FORM LOGIN TUNGGAL -->
        <form id="form-unified-login" class="tab-form-container" onsubmit="handleUnifiedLoginSubmit(event)" autocomplete="off">
            <div style="margin-bottom: 12px;">
                <label class="form-label">Username / Nama:</label>
                <input type="text" id="login-identifier" class="form-input" placeholder="Masukkan Username..." autocomplete="off" required>
            </div>
            <div style="margin-bottom: 12px;">
                <label class="form-label">Password:</label>
                <input type="password" id="login-pass" class="form-input" placeholder="Masukkan password Anda..." autocomplete="new-password" required>
            </div>

            <div style="text-align: right; margin-bottom: 14px; display: none;">
                <a href="#" style="font-size: 0.75rem; color: var(--ranch-amber); text-decoration: none; font-weight: 600;" onclick="openForgotPasswordModal(); return false;">❓ Lupa Password?</a>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px;">
                <button type="button" class="btn btn-outline" onclick="closeUnifiedAuthModal()">Batal</button>
                <button type="submit" class="btn btn-ranch" style="padding-left: 18px; padding-right: 18px;">Login Masuk</button>
            </div>
        </form>

        <!-- FORM REGISTER USER (HIDDEN AND RETIRED) -->
        <form id="form-unified-register" class="tab-form-container" onsubmit="handleUserRegisterSubmit(event)" style="display: none;" autocomplete="off">
        </form>
    </div>
</div>

<!-- MODAL LUPA PASSWORD -->
<div id="modal-forgot-password" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 6px; font-size: 1.05rem; color: var(--text-main);">❓ Lupa Password Akun Pembeli</h2>
        <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 14px;">Masukkan Nama Panggil dan No. WhatsApp terdaftar Anda untuk verifikasi.</p>
        <form onsubmit="handleVerifyPhoneSubmit(event)" autocomplete="off">
            <div style="margin-bottom: 8px;">
                <label class="form-label">Nama Panggil Terdaftar:</label>
                <input type="text" id="forgot-name" class="form-input" placeholder="Contoh: Budi" autocomplete="off" required>
            </div>
            <div style="margin-bottom: 14px;">
                <label class="form-label">No. WhatsApp Terdaftar:</label>
                <input type="tel" id="forgot-phone" class="form-input" placeholder="08xxxxxxxxxx" autocomplete="off" required>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeForgotPasswordModal()">Batal</button>
                <button type="submit" class="btn btn-ranch">Verifikasi Akun</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL RESET PASSWORD -->
<div id="modal-reset-password" class="modal-overlay">
    <div class="modal-box">
        <h2 style="margin-bottom: 6px; font-size: 1.05rem; color: var(--text-main);">🔑 Reset Password Baru</h2>
        <p style="color: var(--text-muted); font-size: 0.78rem; margin-bottom: 14px;">Buat password baru untuk akun Pembeli Anda.</p>
        <form onsubmit="handleResetPasswordSubmit(event)" autocomplete="off">
            <div style="margin-bottom: 8px;">
                <label class="form-label">Password Baru:</label>
                <input type="password" id="reset-new-pass" class="form-input" placeholder="Password baru..." autocomplete="new-password" required>
            </div>
            <div style="margin-bottom: 14px;">
                <label class="form-label">Konfirmasi Password Baru:</label>
                <input type="password" id="reset-confirm-pass" class="form-input" placeholder="Ulangi password baru..." autocomplete="new-password" required>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeResetPasswordModal()">Batal</button>
                <button type="submit" class="btn btn-ranch">Simpan Password Baru</button>
            </div>
        </form>
    </div>
</div>
