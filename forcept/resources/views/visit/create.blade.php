@extends("templates/main")

@inject('stages', 'App\Stage')

@section("page-title", "New visit - Forcept")

@section("content")

<!--| visit/new container |-->
<div class="container-fluid" id="page-content">
    
</div>

@endsection
                     
@section("scripts")
<script type="text/javascript" src="{{ asset('assets/js/visit.js') }}"></script>
<script type="text/javascript">

<?php
    $patientFields = $stages->where('root', '=', true)->first()->rawFields;
?>
var NewVisit = ReactDOM.render(
    React.createElement(Visit, {
        "containerTitle" : "Create a new visit",
        "_token": "{{ csrf_token() }}",
        "controlsType": "new-visit",
        "fields": <?php echo $patientFields ?>, 
        "patientFields": <?php echo $patientFields ?>,
    }),
    document.getElementById('page-content')
);
    
</script>
@endsection