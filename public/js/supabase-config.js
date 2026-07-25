/* ======================================================
   SUPABASE-CONFIG.JS - DATABASE & DEMO STORAGE ENGINE
   ====================================================== */

const EGG_STORAGE_KEY = 'egg_app_data_v1';

// Initial Demo State if LocalStorage is empty
const defaultDemoData = {
    settings: {
        supabaseUrl: '',
        supabaseKey: '',
        useSupabase: false,
        harga: {
            kampung: { butir: 3500, pack: 33000 },
            negeri: { butir: 2800, pack: 26000 }
        }
    },
    buyerLevels: [
        { name: 'Bronze Buyer', minEggs: 0, rewardEggs: 0, color: 'bronze' },
        { name: 'Silver Buyer', minEggs: 50, rewardEggs: 1, color: 'silver' },
        { name: 'Gold Buyer', minEggs: 150, rewardEggs: 2, color: 'gold' },
        { name: 'Platinum VIP', minEggs: 300, rewardEggs: 3, color: 'platinum' }
    ],
    // Log panen dan konsumsi: array of { id, date, category ('kampung'|'negeri'), type ('harvest'|'self_consumption'|'damaged'), quantity, notes }
    harvestLogs: [
        { id: 'h1', date: '2026-07-20', category: 'kampung', type: 'harvest', quantity: 120, notes: 'Panen Pagi Kampung' },
        { id: 'h2', date: '2026-07-20', category: 'negeri', type: 'harvest', quantity: 180, notes: 'Panen Pagi Negeri' },
        { id: 'h3', date: '2026-07-21', category: 'kampung', type: 'self_consumption', quantity: 4, notes: 'Dimakan sendiri' },
        { id: 'h4', date: '2026-07-22', category: 'kampung', type: 'harvest', quantity: 50, notes: 'Panen Tambahan Kampung' },
        { id: 'h5', date: '2026-07-23', category: 'negeri', type: 'harvest', quantity: 60, notes: 'Panen Tambahan Negeri' }
    ],
    // Buyers: array of { id, name, phone, totalBought, totalRewards, createdAt }
    buyers: [
        { id: 'b1', name: 'Budi Santoso', phone: '08123456789', totalBought: 160, totalRewards: 3, createdAt: '2026-07-01' },
        { id: 'b2', name: 'Siti Aminah', phone: '08987654321', totalBought: 60, totalRewards: 1, createdAt: '2026-07-05' },
        { id: 'b3', name: 'Dewi Lestari', phone: '08551234432', totalBought: 25, totalRewards: 0, createdAt: '2026-07-10' }
    ],
    // Transactions: array of { id, invoiceNo, buyerName, date, totalAmount, details: [{ category, unitType, qty, price, bonusEggs, totalEggsDeducted, subtotal }] }
    transactions: [
        {
            id: 't1',
            invoiceNo: 'INV-20260721-001',
            buyerName: 'Budi Santoso',
            date: '2026-07-21 10:15',
            totalAmount: 165000,
            details: [
                { category: 'kampung', unitType: 'pack', qty: 5, price: 33000, bonusEggs: 2, totalEggsDeducted: 52, subtotal: 165000 }
            ]
        }
    ],
    // Pre-Orders (PO): array of { id, poNumber, queueNo, buyerName, buyerPhone, category, unitType, qty, status ('pending'|'processed'|'cancelled'), createdAt }
    preOrders: [
        { id: 'po1', poNumber: 'PO-001', queueNo: 1, buyerName: 'Pak Ahmad', buyerPhone: '0811223344', category: 'kampung', unitType: 'pack', qty: 3, status: 'pending', createdAt: '2026-07-24 09:00' },
        { id: 'po2', poNumber: 'PO-002', queueNo: 2, buyerName: 'Bu Ratna', buyerPhone: '0877889900', category: 'negeri', unitType: 'egg', qty: 25, status: 'pending', createdAt: '2026-07-24 11:30' }
    ],
    adminSession: false
};

class DataEngine {
    constructor() {
        this.loadLocal();
    }

    loadLocal() {
        const stored = localStorage.getItem(EGG_STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
            } catch (e) {
                this.data = defaultDemoData;
            }
        } else {
            this.data = defaultDemoData;
            this.saveLocal();
        }
    }

    saveLocal() {
        localStorage.setItem(EGG_STORAGE_KEY, JSON.stringify(this.data));
    }

    // Reset data ke default demo
    resetDemoData() {
        this.data = JSON.parse(JSON.stringify(defaultDemoData));
        this.saveLocal();
    }

    /* ---- CALCULATION HELPERS ---- */
    // Hitung Sisa Stok Telur (Butir) Per Kategori
    // Total Telur = (Total Panen - Total Konsumsi - Total Terjual - Total Bonus)
    calculateStock(category) {
        // Panen & Konsumsi
        const harvestEggs = this.data.harvestLogs
            .filter(l => l.category === category)
            .reduce((acc, curr) => acc + curr.quantity, 0);

        // Terjual & Bonus dari Transaksi
        let soldAndBonusEggs = 0;
        this.data.transactions.forEach(tx => {
            tx.details.forEach(dt => {
                if (dt.category === category) {
                    soldAndBonusEggs += dt.totalEggsDeducted;
                }
            });
        });

        const netEggs = Math.max(0, harvestEggs - soldAndBonusEggs);
        const packs = Math.floor(netEggs / 10);
        const remainingEggs = netEggs % 10;

        return {
            totalEggs: netEggs,
            packsReady: packs,
            remainingEggs: remainingEggs,
            harvestTotal: harvestEggs,
            soldTotal: soldAndBonusEggs
        };
    }

    // Mendapatkan statistik global publik
    getPublicStats() {
        const kampungStock = this.calculateStock('kampung');
        const negeriStock = this.calculateStock('negeri');

        let totalSoldEggs = 0;
        let totalSoldPacks = 0;

        this.data.transactions.forEach(tx => {
            tx.details.forEach(dt => {
                const eggs = dt.unitType === 'pack' ? dt.qty * 10 : dt.qty;
                totalSoldEggs += eggs;
                if (dt.unitType === 'pack') totalSoldPacks += dt.qty;
            });
        });

        return {
            totalHarvested: kampungStock.harvestTotal + negeriStock.harvestTotal,
            totalSoldEggs: totalSoldEggs,
            totalSoldPacks: totalSoldPacks,
            totalUniqueBuyers: this.data.buyers.length,
            kampung: kampungStock,
            negeri: negeriStock
        };
    }

    // Hitung Level Buyer berdasarkan total butir yang dibeli
    getBuyerLevel(totalBought) {
        const levels = [...this.data.buyerLevels].sort((a, b) => b.minEggs - a.minEggs);
        for (let lvl of levels) {
            if (totalBought >= lvl.minEggs) {
                return lvl;
            }
        }
        return this.data.buyerLevels[0];
    }
}

const db = new DataEngine();
