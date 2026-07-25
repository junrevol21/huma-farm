<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>@yield('title', 'Huma Farm - Peternakan Telur Omega')</title>
    <meta name="description" content="Aplikasi pencatatan panen, toko online, leaderboard pembeli, dan edukasi nutrisi Huma Farm.">
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <!-- CHART.JS CDN FOR DASHBOARD ANALYTICS -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

    <!-- MOBILE APP SHELL FRAME CONTAINER (CENTERED ON DESKTOP) -->
    <div id="app-shell-container">

        <!-- CENTER SCREEN WELCOME POPUP OVERLAY -->
        <div id="center-welcome-overlay" class="center-welcome-overlay" onclick="closeCenterWelcome()">
            <div class="center-welcome-box" onclick="event.stopPropagation()">
                <span style="font-size: 3rem; display: block; margin-bottom: 8px;">🥚</span>
                <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--ranch-wood); margin-bottom: 4px;" id="welcome-title">Selamat datang di Huma Farm!</h2>
                <p style="font-size: 0.95rem; font-weight: 600; color: var(--ranch-amber); margin-bottom: 18px;" id="welcome-subtitle">Ayo makan telur sehat!</p>
                <button class="btn btn-ranch" style="width: 100%; min-height: 40px;" onclick="closeCenterWelcome()">Siap! 🚀</button>
            </div>
        </div>

        <!-- TOPBAR HEADER -->
        @include('components.topbar')

        <!-- BANNERS -->
        @include('components.banners')

        <!-- MAIN CONTAINER -->
        <main class="main-container">
            @yield('content')
        </main>

        <!-- BOTTOM NAV -->
        @include('components.bottom-nav')

        <!-- MODALS -->
        @include('modals.panen-modal')
        @include('modals.toko-modals')
        @include('modals.auth-modals')
        @include('modals.system-modals')

    </div>

    <!-- SCRIPTS -->
    <script src="{{ asset('js/app.js') }}"></script>
    @stack('scripts')
</body>
</html>
