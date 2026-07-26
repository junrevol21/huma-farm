<?php

namespace App\Http\Controllers;

use App\Models\Harvest;
use App\Models\Order;
use App\Models\Price;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * Get paginated orders.
     * Query params: ?page=1&per_page=50&month=YYYY-MM&status=completed
     */
    public function index()
    {
        $perPage = min((int) request('per_page', 50), 200);
        $query   = Order::orderBy('created_at', 'desc');

        // Optional: filter by month (YYYY-MM)
        if ($month = request('month')) {
            $query->whereRaw("TO_CHAR(created_at, 'YYYY-MM') = ?", [$month]);
        }

        // Optional: filter by status
        if ($status = request('status')) {
            $query->where('status', $status);
        }

        // Optional: filter by payment_status
        if ($payStatus = request('payment_status')) {
            $query->where('payment_status', $payStatus);
        }

        $orders = $query->paginate($perPage);

        return response()->json([
            'success'      => true,
            'data'         => $orders->items(),
            'current_page' => $orders->currentPage(),
            'last_page'    => $orders->lastPage(),
            'total'        => $orders->total(),
            'per_page'     => $orders->perPage(),
        ]);
    }

    private function getReadyStock()
    {
        // 1. Calculate Negeri Stock
        $negeriPanen = Harvest::where('type', 'add')->sum('negeri');
        $negeriSub = Harvest::where('type', 'sub')->sum('negeri');
        $negeriSold = Order::where('status', '!=', 'po')
                           ->where('payment_status', '!=', 'Batal')
                           ->where('category', 'negeri')
                           ->sum('total_eggs');

        $stockNegeri = $negeriPanen - $negeriSub - $negeriSold;
        if ($stockNegeri < 0) $stockNegeri = 0;

        // 2. Calculate Kampung Stock
        $kampungPanen = Harvest::where('type', 'add')->sum('kampung');
        $kampungSub = Harvest::where('type', 'sub')->sum('kampung');
        $kampungSold = Order::where('status', '!=', 'po')
                            ->where('payment_status', '!=', 'Batal')
                            ->where('category', 'kampung')
                            ->sum('total_eggs');

        $stockKampung = $kampungPanen - $kampungSub - $kampungSold;
        if ($stockKampung < 0) $stockKampung = 0;

        return [
            'negeri' => (int) $stockNegeri,
            'kampung' => (int) $stockKampung
        ];
    }

    /**
     * Store a new checkout order.
     */
    public function store(Request $request)
    {
        // Auto-map aliases from frontend if present
        if (!$request->has('category') && $request->has('egg_category')) {
            $request->merge(['category' => $request->input('egg_category')]);
        }
        if (!$request->has('unit') && $request->has('package_type')) {
            $request->merge(['unit' => $request->input('package_type')]);
        }
        if (!$request->has('qty') && $request->has('quantity')) {
            $request->merge(['qty' => $request->input('quantity')]);
        }
        if (!$request->has('payment_status') && $request->has('status')) {
            $request->merge(['payment_status' => $request->input('status')]);
        }

        $validator = Validator::make($request->all(), [
            'id' => 'nullable|string|max:100',
            'buyer_name' => 'required|string|max:100',
            'buyer_phone' => 'nullable|string|max:30',
            'category' => 'required|string|in:negeri,kampung',
            'unit' => 'required|string|in:pack,egg',
            'qty' => 'required|integer|min:1',
            'total_price' => 'required|numeric|min:0',
            'payment_status' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input data pesanan salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $buyerName = trim($request->input('buyer_name'));
        $buyerPhone = trim($request->input('buyer_phone'));
        $category = $request->input('category');
        $unit = $request->input('unit');
        $qty = (int) $request->input('qty');
        $totalPrice = $request->input('total_price');
        $paymentStatus = $request->input('payment_status', 'Menunggu Konfirmasi');

        // Calculate total eggs: 1 pack = 10 eggs, 1 egg = 1 egg
        $totalEggs = ($unit === 'pack') ? $qty * 10 : $qty;

        // Verify stock
        $stock = $this->getReadyStock();
        $readyStock = $stock[$category];

        $status = 'pending_confirm';
        $shortageEggs = 0;
        $poNumber = null;

        if ($totalEggs > $readyStock) {
            // Insufficient stock -> Set as Pre-Order (PO)
            $status = 'po';
            $shortageEggs = $totalEggs - $readyStock;

            // Generate PO Number
            $maxPo = Order::where('status', 'po')->max('po_number');
            $poNumber = $maxPo ? $maxPo + 1 : 1;
        } else {
            // Sufficient stock
            if ($paymentStatus === 'Lunas') {
                $status = 'completed';
            }
        }

        // Use request parameter id if provided, otherwise generate
        $orderId = $request->input('id');
        if (!$orderId) {
            $orderId = 'ORD-' . round(microtime(true) * 1000) . '-' . rand(10, 99);
        }

        $createdAt = $request->input('created_at');
        $orderData = [
            'id' => $orderId,
            'po_number' => $poNumber,
            'buyer_name' => $buyerName,
            'buyer_phone' => $buyerPhone,
            'category' => $category,
            'unit' => $unit,
            'qty' => $qty,
            'total_eggs' => $totalEggs,
            'total_price' => $totalPrice,
            'status' => $status,
            'shortage_eggs' => $shortageEggs,
            'payment_status' => $paymentStatus
        ];
        if ($createdAt) {
            $orderData['created_at'] = \Illuminate\Support\Carbon::parse($createdAt);
            $orderData['updated_at'] = \Illuminate\Support\Carbon::parse($createdAt);
        }
        $order = Order::updateOrCreate(['id' => $orderId], $orderData);

        return response()->json([
            'success' => true,
            'message' => ($status === 'po') ? 'Pesanan dimasukkan sebagai Pre-Order.' : 'Pesanan berhasil disimpan.',
            'data' => $order
        ]);
    }

    /**
     * Update an order (edit or confirm payment).
     */
    public function update(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan!'
            ], 404);
        }

        // Validate payload
        $validator = Validator::make($request->all(), [
            'buyer_name' => 'nullable|string|max:100',
            'buyer_phone' => 'nullable|string|max:30',
            'qty' => 'nullable|integer|min:1',
            'payment_status' => 'nullable|string',
            'created_at' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Data input salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->has('buyer_name')) {
            $order->buyer_name = trim($request->input('buyer_name'));
        }
        if ($request->has('buyer_phone')) {
            $order->buyer_phone = trim($request->input('buyer_phone'));
        }

        // If payment status is changing
        if ($request->has('payment_status')) {
            $newPaymentStatus = $request->input('payment_status');
            $order->payment_status = $newPaymentStatus;

            // If confirmed as paid, set order status as completed (unless it is PO)
            if ($newPaymentStatus === 'Lunas' && $order->status !== 'po') {
                $order->status = 'completed';
            } elseif ($newPaymentStatus === 'Batal') {
                $order->status = 'completed'; // or keep cancelled, but we count it out of stock
            }
        }

        if ($request->has('created_at') && $request->input('created_at')) {
            $order->created_at = $request->input('created_at');
        }

        // If quantity is edited
        if ($request->has('qty')) {
            $newQty = (int) $request->input('qty');
            $oldTotalEggs = $order->total_eggs;
            $newTotalEggs = ($order->unit === 'pack') ? $newQty * 10 : $newQty;

            // Calculate new price
            $prices = Price::find(1);
            $priceField = $order->category . '_' . $order->unit;
            $pricePerUnit = $prices ? $prices->$priceField : ($order->category === 'negeri' ? ($order->unit === 'pack' ? 25000 : 2500) : ($order->unit === 'pack' ? 35000 : 3500));
            $newTotalPrice = $newQty * $pricePerUnit;

            // Calculate stock without this order's previous allocation
            $stock = $this->getReadyStock();
            $currentCategoryStock = $stock[$order->category];

            // If the order was not PO previously, it was already subtracted, so add it back to test
            if ($order->status !== 'po' && $order->payment_status !== 'Batal') {
                $currentCategoryStock += $oldTotalEggs;
            }

            $order->qty = $newQty;
            $order->total_eggs = $newTotalEggs;
            $order->total_price = $newTotalPrice;

            // Re-evaluate stock status
            if ($newTotalEggs > $currentCategoryStock) {
                $order->status = 'po';
                $order->shortage_eggs = $newTotalEggs - $currentCategoryStock;
                if (!$order->po_number) {
                    $maxPo = Order::where('status', 'po')->max('po_number');
                    $order->po_number = $maxPo ? $maxPo + 1 : 1;
                }
            } else {
                $order->status = ($order->payment_status === 'Lunas') ? 'completed' : 'pending_confirm';
                $order->shortage_eggs = 0;
                $order->po_number = null;
            }
        }

        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil diperbarui.',
            'data' => $order
        ]);
    }

    /**
     * Delete an order.
     */
    public function destroy($id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan!'
            ], 404);
        }

        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dihapus/dibatalkan.'
        ]);
    }
}
