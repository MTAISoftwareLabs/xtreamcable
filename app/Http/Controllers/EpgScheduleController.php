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
        $data = [
            'channel_name' => $request->input('channel_name', $request->input('channelName')),
            'program_name' => $request->input('program_name', $request->input('programName')),
            'starts_at' => $request->input('starts_at', $request->input('startsAt')),
            'ends_at' => $request->input('ends_at', $request->input('endsAt')),
            'status' => $request->input('status', 'active'),
        ];
        $item = EpgSchedule::create($data);

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = EpgSchedule::findOrFail($id);
        $data = array_filter([
            'channel_name' => $request->input('channel_name', $request->input('channelName')),
            'program_name' => $request->input('program_name', $request->input('programName')),
            'starts_at' => $request->input('starts_at', $request->input('startsAt')),
            'ends_at' => $request->input('ends_at', $request->input('endsAt')),
            'status' => $request->status,
        ], fn ($val) => ! is_null($val));
        $item->update($data);

        return response()->json(['item' => $item]);
    }

    public function destroy($id)
    {
        EpgSchedule::findOrFail($id)->delete();

        return response()->noContent();
    }
}
