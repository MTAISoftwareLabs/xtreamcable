<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'player_api.php',
            'player_api',
            'get.php',
            'get',
            'xmltv.php',
            'xmltv',
            'live/*',
        ]);
        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*') || $request->is('player_api*') || $request->is('get*') || $request->is('xmltv*') || $request->is('live/*') || $request->expectsJson() ? null : '/'
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->is('player_api*') || $request->is('get*') || $request->is('xmltv*') || $request->is('live/*') || $request->expectsJson(),
        );
    })->create();
