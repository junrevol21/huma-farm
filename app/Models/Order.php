<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'orders';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'po_number',
        'buyer_name',
        'buyer_phone',
        'category',
        'unit',
        'qty',
        'total_eggs',
        'total_price',
        'status',
        'shortage_eggs',
        'payment_status',
        'created_at'
    ];
}
