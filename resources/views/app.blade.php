@extends('layouts.app')

@section('title', 'Huma Farm - Peternakan Telur Omega')

@section('content')
    @include('pages.dashboard')
    @include('pages.keuangan')
    @include('pages.edukasi')
    @include('pages.panenku')
    @include('pages.toko')
    @include('pages.leaderboard')
    @include('pages.pengaturan')
@endsection
