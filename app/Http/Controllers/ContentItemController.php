<?php

namespace App\Http\Controllers;

use App\Models\ContentItem;
use Illuminate\Http\Request;

class ContentItemController extends Controller
{
    public function index()
    {
        return response()->json(['items' => ContentItem::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        if ($request->has('contentType')) {
            $data['content_type'] = $request->contentType;
            unset($data['contentType']);
        }
        $item = ContentItem::create($data);

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = ContentItem::findOrFail($id);
        $data = $request->all();
        if ($request->has('contentType')) {
            $data['content_type'] = $request->contentType;
            unset($data['contentType']);
        }
        $item->update($data);

        return response()->json(['item' => $item]);
    }

    public function destroy($id)
    {
        ContentItem::findOrFail($id)->delete();

        return response()->noContent();
    }
}
