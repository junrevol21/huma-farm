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
