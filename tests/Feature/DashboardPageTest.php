<?php

test('the dashboard page displays the main sections', function () {
    $response = $this->get('/');

    $response->assertSuccessful();
    $response->assertSee('Progress', false);
    $response->assertSee('Progress Line Chart');
    $response->assertSee('Todo List');
    $response->assertSee('Date Today');
    $response->assertSee("Today's Progress", false);
    $response->assertSee('No tasks yet. Add a title, then indent the steps under it.');
    $response->assertSee('Enter a new task...');
    $response->assertSee('Add');
    $response->assertSee("Today's note", false);
    $response->assertSee('What matters today?');
    $response->assertSee('Clear done');
});

test('the dashboard page includes accessible todo controls', function () {
    $response = $this->get('/');

    $response->assertSuccessful();
    $response->assertSee('id="todo-form"', false);
    $response->assertSee('id="new-task"', false);
    $response->assertSee('id="progress-chart"', false);
    $response->assertSee('id="current-date"', false);
    $response->assertSee('id="daily-note"', false);
    $response->assertSee('id="week-strip"', false);
    $response->assertSee('id="bubble-done"', false);
    $response->assertSee('for="new-task"', false);
});
