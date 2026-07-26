<!-- HALAMAN: LEADERBOARD / RANKING PEMBELI (SEMUA ROLE) -->
<section id="leaderboard" class="page-section">
    <div class="page-header" style="margin-bottom: 14px;">
        <div>
            <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
                <span>🏆 Leaderboard Pembeli Setia</span>
            </h1>
            <p class="page-subtitle">Papan peringkat pelanggan teratas Huma Farm berdasarkan total akumulasi pembelian telur lunas.</p>
        </div>
    </div>

    <!-- STATS SUMMARY HEADER BANNER -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px;">
        <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; text-align: center;">
            <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">👥 Total Pembeli</span>
            <strong style="font-size: 1.1rem; color: var(--ranch-amber);" id="lb-stat-total-buyers">0</strong>
        </div>
        <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; text-align: center;">
            <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">🥚 Telur Terjual</span>
            <strong style="font-size: 1.1rem; color: var(--ranch-amber);" id="lb-stat-total-eggs">0 Btr</strong>
        </div>
        <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; text-align: center;">
            <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">👑 Top Sultan</span>
            <strong style="font-size: 0.85rem; color: #eab308; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;" id="lb-stat-top-buyer">-</strong>
        </div>
    </div>

    <!-- PODIUM TOP 3 CHAMPIONS CONTAINER -->
    <div id="leaderboard-podium-container" style="margin-bottom: 16px;">
        <!-- Dynamically rendered by renderLeaderboardData() -->
    </div>

    <!-- LEADERBOARD RANKING LIST TABLE/CARDS -->
    <div class="ranch-card" style="padding: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
            <h3 style="font-size: 0.92rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <span>🥇 Peringkat Pelanggan</span>
            </h3>
            <span style="font-size: 0.68rem; background: var(--ranch-amber-light, rgba(245,158,11,0.15)); color: var(--ranch-amber); padding: 3px 8px; border-radius: 10px; font-weight: 700;">🔄 Realtime Update</span>
        </div>

        <div id="leaderboard-ranking-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Ranking items dirender via JS -->
        </div>
    </div>
</section>
