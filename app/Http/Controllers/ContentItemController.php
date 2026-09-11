<?php

namespace App\Http\Controllers;

use App\Models\ContentItem;
use Illuminate\Http\Request;

class ContentItemController extends Controller
{
    public function index() { return response()->json(['items' => ContentItem::orderBy('created_at', 'desc')->get()]); }
    public function store(Request $request) { $item = ContentItem::create($request->all()); return response()->json(['item' => $item], 201); }
    public function update(Request $request, $id) { $item = ContentItem::findOrFail($id); $item->update($request->all()); return response()->json(['item' => $item]); }
    public function destroy($id) { ContentItem::findOrFail($id)->delete(); return response()->noContent(); }
}
