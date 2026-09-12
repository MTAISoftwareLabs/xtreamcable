<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Server;
use Illuminate\Http\Request;

class ServerController extends Controller
{
    public function index()
    {
        return response()->json(['items' => Server::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required', 'host' => 'required']);
        $server = Server::create($request->all());
        ActivityLog::create(['event_type' => 'server.created', 'message' => "Server {$server->name} was added.", 'entity_type' => 'server', 'entity_id' => $server->id]);

        return response()->json(['item' => $server], 201);
    }

    public function update(Request $request, $id)
    {
        $server = Server::findOrFail($id);
        $server->update($request->all());
        ActivityLog::create(['event_type' => 'server.updated', 'message' => "Server {$server->name} was updated.", 'entity_type' => 'server', 'entity_id' => $server->id]);

        return response()->json(['item' => $server]);
    }

    public function destroy($id)
    {
        $server = Server::findOrFail($id);
        $server->delete();
        ActivityLog::create(['event_type' => 'server.deleted', 'message' => "Server {$server->name} was removed.", 'entity_type' => 'server', 'entity_id' => $id]);

        return response()->noContent();
    }
}
