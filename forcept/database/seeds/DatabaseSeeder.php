<?php

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Model::unguard();

        // $this->call(UserTableSeeder::run);

        DB::table('users')->insert([
            'username'=> 'admin',
            'password' => bcrypt('1234'),
            'admin' => true
        ]);


        DB::table('stages')->insert([
            'type' => 'basic',
            'name' => 'Check-in',
            'root' => true,
            'fields' => json_encode([
                "first_name" => [
                    "type" => "text",
                    "name" => "First name",
                    "mutable" => false,
                    "settings" => null,
                ],
                "last_name" => [
                    "type" => "text",
                    "name" => "Last name",
                    "mutable" => false,
                    "settings" => null,
                ],
                "photo" => [
                    "type" => "file",
                    "name" => "Photo",
                    "mutable" => false,
                    "settings" => [
                        "accept" => [
                            "image/*"
                        ]
                    ]
                ],
                "priority" => [
                    "type" => "select",
                    "name" => "Priority",
                    "mutable" => false,
                    "settings" => [
                        "options" => [
                            "Normal",
                            "High",
                            "Urgent"
                        ],
                        "allowCustomData" => false
                    ]
                ],
            ])
        ]);

        Model::reguard();
    }
}
