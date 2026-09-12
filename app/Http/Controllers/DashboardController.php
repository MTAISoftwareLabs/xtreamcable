<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\BillingInvoice;
use App\Models\ConsoleIntegration;
use App\Models\ConsoleSetting;
use App\Models\ContentCategory;
use App\Models\ContentItem;
use App\Models\CreditTransaction;
use App\Models\EpgSchedule;
use App\Models\Package;
use App\Models\Reseller;
use App\Models\Server;
use App\Models\StreamSource;
use App\Models\Subscriber;
use App\Models\SupportRequest;
use App\Models\UserGroup;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function health()
    {
        return response()->json([
            'status' => 'operational',
            'checkedAt' => now(),
        ]);
    }

    public function bootstrap()
    {
        $settings = ConsoleSetting::first() ?? [
            'id' => 1, 'consoleName' => 'XTREAM CABLE', 'timezone' => 'Asia/Karachi',
            'operationalAlerts' => true, 'sessionTimeoutMinutes' => 720,
            'emailNotifications' => true, 'incidentAlerts' => true,
        ];

        $users = Subscriber::leftJoin('packages', 'packages.id', '=', 'subscribers.package_id')
            ->leftJoin('user_groups', 'user_groups.id', '=', 'subscribers.group_id')
            ->select('subscribers.*', 'packages.name as packageName', 'user_groups.name as groupName')
            ->orderBy('subscribers.created_at', 'desc')->get();

        $groups = UserGroup::orderBy('created_at', 'desc')->get();
        $packages = Package::orderBy('created_at', 'desc')->get();
        $resellers = Reseller::orderBy('created_at', 'desc')->get();
        $content = ContentItem::orderBy('created_at', 'desc')->get();
        $servers = Server::orderBy('created_at', 'desc')->get();
        $sources = StreamSource::orderBy('created_at', 'desc')->get();
        $categories = ContentCategory::orderBy('created_at', 'desc')->get();
        $epg = EpgSchedule::orderBy('starts_at', 'asc')->get();

        $transactions = CreditTransaction::leftJoin('resellers', 'resellers.id', '=', 'credit_transactions.reseller_id')
            ->select('credit_transactions.*', 'resellers.name as resellerName')
            ->orderBy('credit_transactions.created_at', 'desc')->limit(100)->get();

        $activity = ActivityLog::orderBy('created_at', 'desc')->limit(50)->get();
        $integrations = ConsoleIntegration::orderBy('id', 'asc')->get();
        $invoices = BillingInvoice::orderBy('issued_at', 'desc')->get();
        $supportRequests = SupportRequest::orderBy('created_at', 'desc')->limit(10)->get();

        $activeSubscribers = Subscriber::where('status', 'active')->count();
        $liveChannels = ContentItem::where('content_type', 'live_tv')->where('status', 'active')->count();
        $resellerAccounts = Reseller::where('status', 'active')->count();
        $operationalServers = Server::where('status', 'operational')->count();
        $totalServers = Server::count();
        $activeSources = StreamSource::where('status', 'active')->count();

        $issued = CreditTransaction::where('direction', 'issued')->sum('amount');
        $used = CreditTransaction::whereIn('direction', ['transferred', 'used'])->sum('amount');
        $balance = $issued - $used;

        // Simplify activity trend for now
        $activityTrend = [];

        return response()->json([
            'settings' => $settings,
            'users' => $users,
            'groups' => $groups,
            'packages' => $packages,
            'resellers' => $resellers,
            'content' => $content,
            'servers' => $servers,
            'sources' => $sources,
            'categories' => $categories,
            'epg' => $epg,
            'transactions' => $transactions,
            'activity' => $activity,
            'integrations' => $integrations,
            'invoices' => $invoices,
            'supportRequests' => $supportRequests,
            'activityTrend' => $activityTrend,
            'summary' => [
                'activeSubscribers' => $activeSubscribers,
                'liveChannels' => $liveChannels,
                'resellerAccounts' => $resellerAccounts,
                'operationalServers' => $operationalServers,
                'totalServers' => $totalServers,
                'activeSources' => $activeSources,
                'healthPercent' => $totalServers > 0 ? round(($operationalServers / $totalServers) * 100) : 0,
                'availableCredits' => $balance,
            ],
        ]);
    }

    public function activity(Request $request)
    {
        $query = ActivityLog::query();

        $scope = in_array($request->scope, ['user', 'reseller', 'stream', 'all']) ? $request->scope : 'all';
        if ($scope === 'user') {
            $query->where(fn ($q) => $q->where('entity_type', 'user')->orWhere('event_type', 'like', 'user.%'));
        }
        if ($scope === 'reseller') {
            $query->where(fn ($q) => $q->whereIn('entity_type', ['reseller', 'credits'])->orWhere('event_type', 'like', 'reseller.%')->orWhere('event_type', 'like', 'credits.%'));
        }
        if ($scope === 'stream') {
            $query->where(fn ($q) => $q->whereIn('entity_type', ['source', 'server'])->orWhere('event_type', 'like', '%stream%')->orWhere('event_type', 'like', '%source%')->orWhere('event_type', 'like', '%server%'));
        }

        if ($request->q) {
            $q = $request->q;
            $query->where(fn ($b) => $b->where('message', 'like', "%{$q}%")->orWhere('event_type', 'like', "%{$q}%")->orWhere('entity_type', 'like', "%{$q}%"));
        }

        if ($request->eventType) {
            $query->where('event_type', $request->eventType);
        }
        if ($request->from) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->where('created_at', '<', date('Y-m-d', strtotime($request->to.' + 1 day')));
        }

        $pageSize = min(50, max(5, (int) $request->input('pageSize', 10)));
        $paginator = $query->orderBy('created_at', 'desc')->paginate($pageSize);

        return response()->json([
            'items' => $paginator->items(),
            'total' => $paginator->total(),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'hasMore' => $paginator->hasMorePages(),
        ]);
    }

    public function settings()
    {
        return response()->json(['settings' => ConsoleSetting::first()]);
    }
}
