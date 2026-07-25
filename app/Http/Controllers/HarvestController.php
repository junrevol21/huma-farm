<?php

namespace App\Http\Controllers;

use App\Models\Harvest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HarvestController extends Controller
{
    /**
     * Get paginated harvest records.
     * Query params: ?page=1&per_page=50
     */
    public function index()
    {
        $perPage = min((int) request('per_page', 50), 200);
        $history = Harvest::orderBy('date', 'desc')
                          ->orderBy('created_at', 'desc')
                          ->paginate($perPage);

        return response()->json([
            'success'      => true,
            'data'         => $history->items(),
            'current_page' => $history->currentPage(),
            'last_page'    => $history->lastPage(),
            'total'        => $history->total(),
            'per_page'     => $history->perPage(),
        ]);
    }

    /**
     * Store a new harvest record or update an existing one.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|string',
            'type' => 'required|string|in:add,sub',
            'negeri' => 'required|integer|min:0',
            'kampung' => 'required|integer|min:0',
            'date' => 'required|date',
            'reason' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input data panen/pengurangan salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $id = $request->input('id');
        $type = $request->input('type');
        $negeri = (int) $request->input('negeri');
        $kampung = (int) $request->input('kampung');
        $date = $request->input('date');
        $reason = $request->input('reason');

        if ($id) {
            // Update existing record
            $record = Harvest::find($id);
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Catatan tidak ditemukan!'
                ], 404);
            }

            $record->update([
                'type' => $type,
                'negeri' => $negeri,
                'kampung' => $kampung,
                'date' => $date,
                'reason' => $reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catatan berhasil diperbarui.',
                'data' => $record
            ]);
        } else {
            // Insert new record
            $newId = 'p_' . round(microtime(true) * 1000);
            $record = Harvest::create([
                'id' => $newId,
                'type' => $type,
                'negeri' => $negeri,
                'kampung' => $kampung,
                'date' => $date,
                'reason' => $reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catatan panen/pengurangan berhasil disimpan.',
                'data' => $record
            ]);
        }
    }

    /**
     * Delete a harvest record.
     */
    public function destroy($id)
    {
        $record = Harvest::find($id);
        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Catatan tidak ditemukan!'
            ], 404);
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Catatan berhasil dihapus.'
        ]);
    }
}
