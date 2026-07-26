<!-- 2-ROW CLEAN TOPBAR HEADER (FIXED AT TOP OF APP SHELL) -->
<header class="topbar-two-row">
    <!-- BARIS PRIMARY TOPBAR: LOGO USER & NAMA USER (KIRI) | KONTROL (KANAN) -->
    <div class="topbar-row-primary">
        <div class="topbar-left">
            <!-- LOGO USER & NAMA USER BADGE -->
            <div id="topbar-user-badge" class="topbar-user-badge" onclick="handleTopbarUserBadgeClick()" title="Lihat Akun / Pengaturan">
                <div class="user-avatar-img" id="topbar-avatar-img">👤</div>
                <span class="user-badge-name" id="topbar-user-name">Pengunjung</span>
            </div>
            <!-- LOGIN HINT hidden (moved to topbar right as icon) -->
            <div id="visitor-login-hint" style="display:none;"></div>
        </div>

        <!-- TOPBAR RIGHT CONTROLS -->
        <div class="topbar-controls">
            <!-- 1. Mode Terang / Gelap (Selalu tampil) -->
            <button class="btn-icon" id="theme-toggle-btn" title="Mode Terang/Gelap" onclick="toggleTheme()">
                <span id="theme-icon">☀️</span>
            </button>

            <!-- 2. Admin Login Button (icon-only, hidden when logged in) -->
            <button class="btn-icon" id="topbar-login-btn" title="Login Admin" onclick="openUnifiedAuthModal('login')" style="font-size: 1.05rem;">
                <span>🔑</span>
            </button>

            <!-- 3. Tombol Dompet / Keuangan (Khusus Admin) -->
            <button class="btn-icon" id="topbar-wallet-btn" title="Dompet & Keuangan" onclick="switchPage('keuangan')" style="display: none; border-color: rgba(245, 158, 11, 0.4);">
                <span>💳</span>
            </button>

            <!-- 4. Icon Logout (Tampil saat Mode Login) -->
            <button class="btn-icon" id="logout-btn" onclick="handleLogoutClick()" title="Logout / Keluar Akun" style="display: none; color: var(--ranch-rose); border-color: rgba(190, 18, 60, 0.3);">
                <span>🚪</span>
            </button>
        </div>
    </div>
</header>
