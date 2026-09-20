<?php

namespace Database\Factories;

use App\Models\Reseller;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reseller>
 */
class ResellerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'raw_password' => 'password',
            'capacity' => 100,
            'credits' => 500,
            'status' => 'active',
        ];
    }
}
