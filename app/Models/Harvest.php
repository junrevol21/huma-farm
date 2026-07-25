<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Harvest extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'panen_history';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'type',
        'negeri',
        'kampung',
        'date',
        'reason'
    ];
}
