<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    /**
     * Get paginated expense records.
     * Query params: ?page=1&per_page=50&month=YYYY-MM
     */
    public function index()
    {
        $perPage = min((int) request('per_page', 50), 200);
        $query   = Expense::orderBy('date', 'desc')
                          ->orderBy('created_at', 'desc');

        // Optional: filter by month (YYYY-MM)
        if ($month = request('month')) {
            $query->whereRaw("TO_CHAR(date, 'YYYY-MM') = ?", [$month]);
        }

        $expenses = $query->paginate($perPage);

        return response()->json([
            'success'      => true,
            'data'         => $expenses->items(),
            'current_page' => $expenses->currentPage(),
            'last_page'    => $expenses->lastPage(),
            'total'        => $expenses->total(),
            'per_page'     => $expenses->perPage(),
        ]);
    }

    /**
     * Store a new expense record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'note' => 'nullable|string',
            'date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input data pengeluaran salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = $request->input('category');
        $amount = (float) $request->input('amount');
        $note = $request->input('note');
        $date = $request->input('date');

        // Generate custom Expense ID: exp_ + millisecond timestamp
        $expId = 'exp_' . round(microtime(true) * 1000);

        $expense = Expense::create([
            'id' => $expId,
            'category' => $category,
            'amount' => $amount,
            'note' => $note,
            'date' => $date
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Catatan pengeluaran berhasil disimpan.',
            'data' => $expense
        ]);
    }

    /**
     * Delete an expense record.
     */
    public function destroy($id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Catatan pengeluaran tidak ditemukan!'
            ], 404);
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Catatan pengeluaran berhasil dihapus.'
        ]);
    }
}
