<?php

namespace App\Http\Controllers\Console;

use Illuminate\Http\Request;
use App\Stage;

use App\Http\Requests;
use App\Http\Requests\CreateStageRequest;
use App\Http\Requests\UpdateStageRequest;
use App\Http\Controllers\Controller;

use Illuminate\Database\Schema\Blueprint;
use Schema;

class FlowController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
        return view('console/flow/index');
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
        return view('console/flow/create');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(CreateStageRequest $request)
    {
        //
        $stage = new Stage;
            $stage->name = $request->name;
            $stage->type = $request->type;
            $stage->fields = "{}";

            // Save stage model
            if($stage->save()) {

                // Create schema
                Schema::create($stage->tableName, function(Blueprint $table) {
                    $table->increments('id');
                });

                return redirect()->route('console::flow::index')->with('alert', [ 'type' => 'success', 'message' => 'Stage created. Choose "Edit" below to get started.' ]);
                
            } else return redirect()->route('console::flow::index')->with('alert', [ 'type' => 'failure', 'message' => 'An error occurred, and the stage model could not be created.' ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
        return view('console/flow/edit', ['stage' => Stage::where('id', $id)->first()]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateStageRequest $request, $id)
    {
        $stage = Stage::where('id', $id);

        // Check if this stage exists
        if($stage->count() > 0) {

            // Get stage.
            $stage = $stage->first();

            $prior = $stage->fields;

            // Check if we're changing the stage's name...
            if($stage->name !== $request->name) {
                // Check if this new name is unique.
                if(Stage::where('name', '=', $request->name)->count() > 0) {

                    // Already exists!
                    return response()->json([
                        "status" => "failure",
                        "message" => "This name is already taken by another stage. Please choose a different name."
                    ], 422);

                } else {
                    $stage->name = $request->name;
                }
            }

            // Continue with updating other fields
            $stage->fields = $request->fields;

            // Attempt to save stage record
            if($stage->save()) {

                return response()->json([
                    "status" => "success",
                    "message" => "Changes saved."
                ]);

            } else {
                return response()->json([
                    "status" => "failure",
                    "message" => "Failed to save stage."
                ], 422);
            } 


        } else {
            return response()->json([
                "status" => "failure",
                "message" => "Stage with ID " . $id . " does not exist in the database."
            ], 422);
        }

    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
        $stage = Stage::where('id', $id);

        // If the stage exists
        if($stage->count() > 0) {
            // IF this stage isn't the root stage
            $stage = $stage->first();
            if($stage->root !== true) {

                Schema::dropIfExists($stage->tableName);

                // If the delete succeeds
                if($stage->delete()) {
                    return redirect()->route('console::flow::index')->with('alert', [ 'type' => 'success', 'message' => 'Stage deleted.' ]);
                } else return redirect()->route('console::flow::index')->with('alert', [ 'type' => 'failure', 'message' => 'An error occurred during deletion.'  ]);
            } else return redirect()->route('console::flow::index')->with('alert', [ 'type' => 'failure', 'message' => 'This is the root stage, and cannot be deleted.' ]);     
        } else return redirect()->route('console::flow::index')->with('alert', [ 'type' => 'failure', 'message' => 'Stage with ID ' . $id . 'does not exist.' ]);
    
    }
}
