<!-- MOBILE BOXED BOTTOM NAVIGATION BAR (FIXED AT BOTTOM OF MOBILE APP SHELL) -->
<nav class="mobile-bottom-nav">
    <div class="mobile-boxed-nav-wrapper">
        
        <!-- ADMIN MOBILE BOTTOM NAV: Dashboard -> Panenku -> [ACTION: Panen] -> Toko -> Leaderboard -->
        <button class="mobile-nav-item" data-page="dashboard" data-role="admin">
            <span class="mobile-nav-icon">📊</span>
            <span>Dashboard</span>
        </button>
        <button class="mobile-nav-item active" data-page="panenku" data-role="admin">
            <span class="mobile-nav-icon">🧺</span>
            <span>Panenku</span>
        </button>

        <!-- USER MOBILE BOTTOM NAV: Edukasi -> Toko -> [ACTION: Beli] -> Dashboard -> Leaderboard -->
        <button class="mobile-nav-item" data-page="edukasi" data-role="user">
            <span class="mobile-nav-icon">💡</span>
            <span>Edukasi</span>
        </button>
        <button class="mobile-nav-item active" data-page="toko" data-role="user">
            <span class="mobile-nav-icon">🛒</span>
            <span>Toko</span>
        </button>

        <!-- VISITOR MOBILE BOTTOM NAV: Edukasi (DEFAULT) -> Toko -> [ACTION: Beli] -> Dashboard -> Leaderboard -->
        <button class="mobile-nav-item active" data-page="edukasi" data-role="visitor">
            <span class="mobile-nav-icon">💡</span>
            <span>Edukasi</span>
        </button>
        <button class="mobile-nav-item" data-page="toko" data-role="visitor">
            <span class="mobile-nav-icon">🛒</span>
            <span>Toko</span>
        </button>

        <!-- TAB CENTER ACTION: BOXED HIGHLIGHTED BUTTON (DYNAMIC DENGAN ROLE & HALAMAN TOKO: BUTTON BELI) -->
        <button class="mobile-nav-center-boxed-action" id="fab-center-action" onclick="handleCenterFabClick()" title="Aksi Utama">
            <span id="center-action-icon" class="center-action-icon">🛒</span>
            <span id="center-action-label" class="center-action-label">Beli</span>
        </button>

        <!-- ADMIN SISI KANAN: Toko -> Leaderboard -->
        <button class="mobile-nav-item" data-page="toko" data-role="admin">
            <span class="mobile-nav-icon">🛒</span>
            <span>Toko</span>
        </button>
        <button class="mobile-nav-item" data-page="leaderboard" data-role="admin">
            <span class="mobile-nav-icon">🏆</span>
            <span>Ranking</span>
        </button>

        <!-- USER SISI KANAN: Dashboard -> Leaderboard -->
        <button class="mobile-nav-item" data-page="dashboard" data-role="user">
            <span class="mobile-nav-icon">📊</span>
            <span>Dashboard</span>
        </button>
        <button class="mobile-nav-item" data-page="leaderboard" data-role="user">
            <span class="mobile-nav-icon">🏆</span>
            <span>Ranking</span>
        </button>

        <!-- VISITOR SISI KANAN: Dashboard -> Leaderboard -->
        <button class="mobile-nav-item" data-page="dashboard" data-role="visitor">
            <span class="mobile-nav-icon">📊</span>
            <span>Dashboard</span>
        </button>
        <button class="mobile-nav-item" data-page="leaderboard" data-role="visitor">
            <span class="mobile-nav-icon">🏆</span>
            <span>Ranking</span>
        </button>

    </div>
</nav>
