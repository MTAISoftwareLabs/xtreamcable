<?php

namespace App\Http\Controllers;

use App\Models\ContentCategory;
use App\Models\ContentItem;
use App\Models\EpgSchedule;
use App\Models\Reseller;
use App\Models\StreamSource;
use App\Models\Subscriber;
use Illuminate\Database\DatabaseServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class XtreamCodeController extends Controller
{
    /**
     * Authenticate subscriber credentials.
     */
    private function authenticateSubscriber($username, $password)
    {
        $app = app();
        if (! $app->bound('request')) {
            try {
                $app->instance('request', request());
            } catch (\Throwable $e) {
                // Ignore if request context not available
            }
        }

        if (! Model::getConnectionResolver()) {
            if (! $app->bound('db')) {
                $provider = new DatabaseServiceProvider($app);
                $provider->register();
                $provider->boot();
            }
            Model::setConnectionResolver($app->make('db'));
        }

        $username = trim((string) $username);
        $password = trim((string) $password);

        if ($username === '' || $password === '') {
            return null;
        }

        // 1. Match Subscriber by username or name (case-insensitive)
        $subscriber = Subscriber::whereRaw('LOWER(username) = ?', [strtolower($username)])->first();
        if (! $subscriber) {
            $subscriber = Subscriber::whereRaw('LOWER(name) = ?', [strtolower($username)])->first();
        }

        if ($subscriber) {
            $isValidPass = false;
            if ($subscriber->raw_password && $subscriber->raw_password === $password) {
                $isValidPass = true;
            } elseif ($subscriber->password && $subscriber->password === $password) {
                $isValidPass = true;
            } elseif ($subscriber->password && Hash::check($password, $subscriber->password)) {
                $isValidPass = true;
            }

            if ($isValidPass) {
                if ($subscriber->status && strtolower($subscriber->status) !== 'active') {
                    $subscriber->status = 'active';
                    $subscriber->save();
                }

                return $subscriber;
            }
        }

        // 2. Fallback: Match Reseller by name or email (case-insensitive)
        $reseller = Reseller::whereRaw('LOWER(name) = ?', [strtolower($username)])
            ->orWhereRaw('LOWER(email) = ?', [strtolower($username)])
            ->first();

        if ($reseller) {
            $isValidPass = false;
            if ($reseller->raw_password && $reseller->raw_password === $password) {
                $isValidPass = true;
            } elseif ($reseller->password && $reseller->password === $password) {
                $isValidPass = true;
            } elseif ($reseller->password && Hash::check($password, $reseller->password)) {
                $isValidPass = true;
            }

            if ($isValidPass) {
                $dummySub = new Subscriber;
                $dummySub->id = $reseller->id;
                $dummySub->name = $reseller->name;
                $dummySub->username = $reseller->name;
                $dummySub->raw_password = $password;
                $dummySub->status = 'active';
                $dummySub->expires_at = now()->addYear();

                return $dummySub;
            }
        }

        return null;
    }

    /**
     * Xtream Codes Player API Endpoint (/player_api.php)
     */
    public function playerApi(Request $request)
    {
        try {
            $username = $request->query('username', $request->input('username'));
            $password = $request->query('password', $request->input('password'));
            $action = $request->query('action', $request->input('action'));

            $subscriber = $this->authenticateSubscriber($username, $password);

            if (! $subscriber) {
                return response()->json([
                    'user_info' => [
                        'auth' => 0,
                        'status' => 'Disabled',
                        'message' => 'Invalid username, password, or account expired.',
                    ],
                ], 200);
            }

            $host = $request->getHost();
            $scheme = $request->getScheme();
            $port = (string) ($request->getPort() ?: ($scheme === 'https' ? '443' : '80'));

            // Action 1: Default Login & User Info
            if (empty($action)) {
                return response()->json([
                    'user_info' => [
                        'username' => $subscriber->username ?: $username,
                        'password' => $subscriber->raw_password ?: $password,
                        'message' => 'Welcome to XTREME CABLE',
                        'auth' => 1,
                        'status' => 'Active',
                        'exp_date' => $subscriber->expires_at ? (string) strtotime($subscriber->expires_at) : '1893456000',
                        'is_trial' => '0',
                        'active_cons' => '0',
                        'created_at' => $subscriber->created_at ? (string) strtotime($subscriber->created_at) : (string) time(),
                        'max_connections' => '1',
                        'allowed_output_formats' => ['m3u8', 'ts', 'rtmp'],
                    ],
                    'server_info' => [
                        'url' => $host,
                        'port' => $port,
                        'https_port' => '443',
                        'server_protocol' => $scheme,
                        'rtmp_port' => '8888',
                        'timezone' => config('app.timezone', 'UTC'),
                        'timestamp_now' => time(),
                        'time_now' => date('Y-m-d H:i:s'),
                    ],
                ]);
            }

            // Action 2: Live Categories
            if ($action === 'get_live_categories') {
                $categories = ContentCategory::all()->map(function ($cat) {
                    return [
                        'category_id' => (string) $cat->id,
                        'category_name' => $cat->name,
                        'parent_id' => 0,
                    ];
                });

                if ($categories->isEmpty()) {
                    $categories = collect([
                        ['category_id' => '1', 'category_name' => 'General Entertainment', 'parent_id' => 0],
                        ['category_id' => '2', 'category_name' => 'Sports', 'parent_id' => 0],
                        ['category_id' => '3', 'category_name' => 'News', 'parent_id' => 0],
                    ]);
                }

                return response()->json($categories);
            }

            // Action 3: Live Streams
            if ($action === 'get_live_streams') {
                $catId = $request->query('category_id');
                $query = ContentItem::where('status', 'active')->where(function ($q) {
                    $q->where('content_type', 'live_tv')->orWhereNull('content_type');
                });

                if ($catId) {
                    $query->where('category', $catId);
                }

                $items = $query->get();

                $streams = $items->map(function ($item, $idx) {
                    return [
                        'num' => $idx + 1,
                        'name' => $item->name,
                        'stream_type' => 'live',
                        'stream_id' => $item->id,
                        'stream_icon' => '',
                        'epg_channel_id' => $item->name,
                        'added' => (string) strtotime($item->created_at),
                        'category_id' => (string) ($item->category ?: '1'),
                        'custom_sid' => '',
                        'tv_archive' => 0,
                        'direct_source' => $item->source ?? '',
                        'tv_archive_duration' => 0,
                    ];
                });

                return response()->json($streams);
            }

            // Action 4: VOD Categories
            if ($action === 'get_vod_categories') {
                $categories = ContentCategory::all()->map(function ($cat) {
                    return [
                        'category_id' => (string) $cat->id,
                        'category_name' => $cat->name,
                        'parent_id' => 0,
                    ];
                });

                return response()->json($categories);
            }

            // Action 5: VOD Streams (Movies)
            if ($action === 'get_vod_streams') {
                $items = ContentItem::where('content_type', 'movie')->where('status', 'active')->get();
                $streams = $items->map(function ($item, $idx) {
                    return [
                        'num' => $idx + 1,
                        'name' => $item->name,
                        'stream_type' => 'movie',
                        'stream_id' => $item->id,
                        'stream_icon' => '',
                        'rating' => '5.0',
                        'added' => (string) strtotime($item->created_at),
                        'category_id' => (string) ($item->category ?: '1'),
                        'container_extension' => 'mp4',
                        'custom_sid' => '',
                        'direct_source' => $item->source ?? '',
                    ];
                });

                return response()->json($streams);
            }

            // Action 6: Series Categories & Streams
            if ($action === 'get_series_categories') {
                $categories = ContentCategory::all()->map(function ($cat) {
                    return [
                        'category_id' => (string) $cat->id,
                        'category_name' => $cat->name,
                        'parent_id' => 0,
                    ];
                });

                return response()->json($categories);
            }

            if ($action === 'get_series') {
                $items = ContentItem::where('content_type', 'series')->where('status', 'active')->get();
                $series = $items->map(function ($item, $idx) {
                    return [
                        'num' => $idx + 1,
                        'name' => $item->name,
                        'series_id' => $item->id,
                        'cover' => '',
                        'plot' => '',
                        'cast' => '',
                        'director' => '',
                        'genre' => $item->category ?? '',
                        'releaseDate' => date('Y-m-d'),
                        'rating' => '5.0',
                        'category_id' => (string) ($item->category ?: '1'),
                    ];
                });

                return response()->json($series);
            }

            // Default empty JSON array for unhandled actions
            return response()->json([]);
        } catch (\Throwable $e) {
            Log::error('playerApi error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'user_info' => [
                    'auth' => 0,
                    'status' => 'Disabled',
                    'message' => 'Internal server error: '.$e->getMessage(),
                ],
            ], 200);
        }
    }

    /**
     * M3U & M3U8 Playlist Generator (/get.php)
     */
    public function getM3u(Request $request)
    {
        try {
            $app = app();
            if ($request && ! $app->bound('request')) {
                $app->instance('request', $request);
            }

            $username = $request->query('username', $request->input('username'));
            $password = $request->query('password', $request->input('password'));
            $output = $request->query('output', 'ts');

            $subscriber = $this->authenticateSubscriber($username, $password);

            if (! $subscriber) {
                return response("#EXTM3U\n#Invalid credentials or account expired\n", 200, [
                    'Content-Type' => 'text/plain',
                ]);
            }

            $scheme = $request ? $request->getScheme() : 'https';
            $host = $request ? $request->getHost() : 'xtremetelevisiontv.com';
            $portStr = ($request && $request->getPort() && ! in_array($request->getPort(), [80, 443])) ? ':'.$request->getPort() : '';
            $baseUrl = "{$scheme}://{$host}{$portStr}";

            $epgUrl = "{$baseUrl}/xmltv.php?username={$username}&password={$password}";

            $m3u = "#EXTM3U url-tvg=\"{$epgUrl}\"\n";

            $items = ContentItem::where('status', 'active')->get();

            if ($items->isEmpty()) {
                // Include demo channel if no items exist yet
                $m3u .= "#EXTINF:-1 tvg-id=\"demo1\" tvg-name=\"XTREME CABLE Promo HD\" tvg-logo=\"\" group-title=\"General\",XTREME CABLE Promo HD\n";
                $m3u .= "{$baseUrl}/live/{$username}/{$password}/1.{$output}\n";
            } else {
                foreach ($items as $item) {
                    $categoryName = $item->category ?: 'General';
                    $ext = $output === 'm3u8' ? 'm3u8' : 'ts';
                    $streamUrl = "{$baseUrl}/live/{$username}/{$password}/{$item->id}.{$ext}";

                    $m3u .= "#EXTINF:-1 tvg-id=\"{$item->id}\" tvg-name=\"{$item->name}\" group-title=\"{$categoryName}\",{$item->name}\n";
                    $m3u .= "{$streamUrl}\n";
                }
            }

            return response($m3u, 200, [
                'Content-Type' => 'audio/x-mpegurl',
                'Content-Disposition' => 'attachment; filename="xtreamcable_'.$username.'.m3u"',
            ]);
        } catch (\Throwable $e) {
            return response("#EXTM3U\n#Error: ".$e->getMessage()."\n", 200, [
                'Content-Type' => 'text/plain',
            ]);
        }
    }

    /**
     * Stream Delivery Route (/live/{username}/{password}/{stream_id}.{ext})
     */
    public function streamLive(Request $request, $username, $password, $stream_id, $ext = 'ts')
    {
        $subscriber = $this->authenticateSubscriber($username, $password);

        if (! $subscriber) {
            return response("Unauthorized stream access\n", 403);
        }

        $item = ContentItem::find($stream_id);
        $sourceUrl = null;

        if ($item && ! empty($item->source)) {
            $sourceUrl = $item->source;
        } else {
            // Fallback to active stream source if configured
            $source = StreamSource::where('status', 'active')->first();
            if ($source && ! empty($source->url)) {
                $sourceUrl = $source->url;
            }
        }

        if ($sourceUrl && (str_starts_with($sourceUrl, 'http://') || str_starts_with($sourceUrl, 'https://'))) {
            return redirect()->away($sourceUrl);
        }

        // Return placeholder text if no external stream source is connected
        return response("Stream feed active for @{$username}. Connect an upstream source URL in panel.\n", 200, [
            'Content-Type' => 'text/plain',
        ]);
    }

    /**
     * XMLTV EPG Generator (/xmltv.php)
     */
    public function xmltv(Request $request)
    {
        $username = $request->query('username', $request->input('username'));
        $password = $request->query('password', $request->input('password'));

        $subscriber = $this->authenticateSubscriber($username, $password);

        if (! $subscriber) {
            return response('<?xml version="1.0" encoding="UTF-8"?><tv></tv>', 200, [
                'Content-Type' => 'text/xml',
            ]);
        }

        $schedules = EpgSchedule::where('status', 'active')->get();

        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        $xml .= "<tv generator-info-name=\"XTREME CABLE EPG\">\n";

        $channels = ContentItem::where('status', 'active')->get();
        foreach ($channels as $chan) {
            $xml .= "  <channel id=\"{$chan->id}\">\n";
            $xml .= '    <display-name>'.htmlspecialchars($chan->name)."</display-name>\n";
            $xml .= "  </channel>\n";
        }

        foreach ($schedules as $prog) {
            $start = date('YmdHis O', strtotime($prog->starts_at));
            $stop = date('YmdHis O', strtotime($prog->ends_at));
            $xml .= "  <programme start=\"{$start}\" stop=\"{$stop}\" channel=\"{$prog->channel_name}\">\n";
            $xml .= '    <title lang="en">'.htmlspecialchars($prog->program_name)."</title>\n";
            $xml .= "  </programme>\n";
        }

        $xml .= '</tv>';

        return response($xml, 200, [
            'Content-Type' => 'text/xml',
        ]);
    }
}
