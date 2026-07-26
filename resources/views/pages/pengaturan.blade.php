<!-- HALAMAN: PENGATURAN (AKSES DARI GEAR TOPBAR) -->
<section id="pengaturan" class="page-section">
    <div class="page-header">
        <div>
            <h1 class="page-title">⚙️ Halaman Pengaturan Akun</h1>
            <p class="page-subtitle">Pilih pengaturan di bawah untuk melakukan perubahan profil dan akun Anda.</p>
        </div>
    </div>

    <!-- PROFILE INFO CARD -->
    <div class="ranch-card" style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px; padding: 16px;">
        <div id="settings-profile-avatar" style="width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, var(--ranch-gold), var(--ranch-amber)); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 800; border: 2.5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0;">
            👤
        </div>
        <div>
            <h2 id="settings-profile-name" style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Pengguna</h2>
            <span id="settings-profile-role" style="font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; font-weight: 700; background: var(--bg-card-subtle); border: 1px solid var(--border-color); color: var(--ranch-amber);">Role</span>
            <p id="settings-profile-phone" style="font-size: 0.78rem; color: var(--text-muted); margin: 6px 0 0 0;">📱 WhatsApp: -</p>
        </div>
    </div>

    <!-- SETTINGS BUTTONS MENU -->
    <div style="display: flex; flex-direction: column; gap: 10px;">
        <!-- Button Ubah Logo Profil -->
        <button type="button" class="btn btn-outline" onclick="openSettingsModal('modal-settings-avatar')" style="display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 14px 18px; width: 100%; border-radius: var(--radius-md); background: var(--bg-card); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2rem;">🎨</span>
                <div>
                    <strong style="display: block; font-size: 0.88rem; color: var(--text-main);">Ubah Logo Profil</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">Pilih icon emoji karakter profil Anda</span>
                </div>
            </div>
            <span style="font-size: 0.9rem; color: var(--text-muted);">➔</span>
        </button>

        <!-- Button Ubah Nomor WA -->
        <button type="button" class="btn btn-outline" onclick="openSettingsModal('modal-settings-phone')" style="display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 14px 18px; width: 100%; border-radius: var(--radius-md); background: var(--bg-card); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2rem;">📱</span>
                <div>
                    <strong style="display: block; font-size: 0.88rem; color: var(--text-main);">Ubah Nomor WhatsApp</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">Perbarui nomor WhatsApp aktif untuk pemesanan</span>
                </div>
            </div>
            <span style="font-size: 0.9rem; color: var(--text-muted);">➔</span>
        </button>

        <!-- Button Ubah Password -->
        <button type="button" class="btn btn-outline" onclick="openSettingsModal('modal-settings-password')" style="display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 14px 18px; width: 100%; border-radius: var(--radius-md); background: var(--bg-card); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2rem;">🔐</span>
                <div>
                    <strong style="display: block; font-size: 0.88rem; color: var(--text-main);">Ubah Password Akun</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">Perbarui kata sandi keamanan akun Anda</span>
                </div>
            </div>
            <span style="font-size: 0.9rem; color: var(--text-muted);">➔</span>
        </button>

        <!-- Button Pengaturan Metode Pembayaran (Admin Only) -->
        <button type="button" class="btn btn-outline" id="admin-payment-setting-card" data-role="admin" onclick="openSettingsModal('modal-settings-payment')" style="display: none; align-items: center; justify-content: space-between; text-align: left; padding: 14px 18px; width: 100%; border-radius: var(--radius-md); background: var(--bg-card); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2rem;">💳</span>
                <div>
                    <strong style="display: block; font-size: 0.88rem; color: var(--text-main);">Pengaturan Metode Pembayaran</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">Kelola rekening transfer bank dan QRIS merchant</span>
                </div>
            </div>
            <span style="font-size: 0.9rem; color: var(--text-muted);">➔</span>
        </button>
    </div>
</section>
