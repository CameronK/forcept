@inject('stages', 'App\Stage')

<li class="nav-item" style="border-left: 1px solid rgba(255,255,255,0.2);">
    <a href="{{ route('visits::create') }}" class="nav-link">&plus; New visit</a>
</li>

@foreach($stages->where('root', '!=', '1')->get() as $stage)
    @if(count($stage->fields) > 0)
        <li class="nav-item">
            <a href="{{ url('visits/stage/' . $stage->id . '-'. str_slug($stage->name)) }}" class="nav-link">{{ $stage->name }}</a>
        </li>
    @else
        <li class="nav-item">
            <a href="#" class="nav-link disabled">{{ $stage->name }} (disabled)</a>
        </li>
    @endif
@endforeach

<li class="nav-item" style="border-left: 1px solid rgba(255,255,255,0.2);">
    <a href="{{ route('patients::index') }}" class="nav-link">Patients &raquo;</a>
</li>
