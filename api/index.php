<?php

$viewPath = '/tmp/views';

if (! is_dir($viewPath)) {
    mkdir($viewPath, 0755, true);
}

require __DIR__.'/../public/index.php';
