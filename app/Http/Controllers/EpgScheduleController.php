<?php

namespace App\Http\Controllers;

use App\Models\EpgSchedule;
use Illuminate\Http\Request;

class EpgScheduleController extends Controller
{
    public function index()
    {
        return response()->json(['items' => EpgSchedule::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $item = EpgSchedule::create($request->all());

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = EpgSchedule::findOrFail($id);
        $item->update($request->all());

        return response()->json(['item' => $item]);
    }

    public function destroy($id)
    {
        EpgSchedule::findOrFail($id)->delete();

        return response()->noContent();
    }
}
