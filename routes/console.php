<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('promo:process-expired-winners')->daily();
