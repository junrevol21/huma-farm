<!-- STICKY AUTH NOTICE BANNER (VISITOR: WA CTA | USER/ADMIN: INFO STATUS) -->
<div id="auth-sticky-banner" class="auth-sticky-banner" style="display:none;">
    <span id="auth-banner-text">🔒 <strong>Form Pembelian Terkunci:</strong> Login untuk memesan.</span>
    <button class="auth-banner-btn" id="auth-banner-btn" onclick="openUnifiedAuthModal('login')">🔑 Login</button>
</div>

<!-- VISITOR WA QUICK CTA BANNER (HANYA TAMPIL UNTUK VISITOR) -->
<div id="visitor-wa-banner" class="visitor-wa-banner" style="display:none;">
    <div class="visitor-banner-info">🌿 <strong>Huma Farm</strong> — Telur Omega Segar Langsung dari Peternakan!</div>
    <div class="visitor-banner-actions">
        <button onclick="openQuickUserOrderModal(); return false;" class="wa-banner-btn" style="flex: 1;">💬 Pesan via WhatsApp</button>
    </div>
</div>
