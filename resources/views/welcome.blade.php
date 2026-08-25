<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Personal task and progress dashboard">

        <title>Progress</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=fraunces:400,500,600,700|nunito:400,600,700" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="dashboard-page">
        <div class="scallop-bar" aria-hidden="true"></div>

        <div class="page-shell">
            <header class="masthead">
                <p class="kicker">A little daily tracker</p>
                <h1>Progress</h1>
            </header>

            <main class="dashboard-grid">
                <section class="area-chart" aria-labelledby="chart-heading">
                    <h2 id="chart-heading">Progress Line Chart</h2>

                    <div class="hero">
                        <p class="hero-stat" aria-live="polite">
                            <span id="today-progress">0</span><span class="hero-unit">%</span>
                        </p>
                        <div class="hero-meta">
                            <p class="hero-copy">Today's Progress</p>
                            <p id="streak" class="hero-streak" hidden></p>
                        </div>
                    </div>

                    <div class="meter" aria-hidden="true">
                        <span id="progress-meter"></span>
                    </div>

                    <div class="stat-bubbles">
                        <p class="bubble bubble-pink">
                            <strong id="bubble-done">0</strong>
                            <span>Done</span>
                        </p>
                        <p class="bubble bubble-mint">
                            <strong id="bubble-left">0</strong>
                            <span>Left</span>
                        </p>
                    </div>

                    <div id="progress-chart" class="chart-frame"></div>
                    <ul id="week-strip" class="week-strip" aria-label="This week's progress"></ul>
                </section>

                <section class="area-todo" aria-labelledby="todo-heading">
                    <h2 id="todo-heading">Todo List</h2>

                    <div class="todo-card">
                        <div class="notebook-holes" aria-hidden="true">
                            <span></span><span></span><span></span><span></span>
                            <span></span><span></span><span></span>
                        </div>

                        <p id="empty-state" class="empty-state">No tasks yet. Add a title, then indent the steps under it.</p>
                        <ul id="task-list" class="task-list" aria-label="Tasks"></ul>

                        <div class="todo-footer">
                            <p id="task-stats" class="task-stats" aria-live="polite" hidden></p>
                            <button type="button" id="clear-completed" class="text-button" hidden>Clear done</button>
                        </div>

                        <p id="undo-bar" class="undo-bar" hidden>
                            <span>Removed.</span>
                            <button type="button" id="undo-delete" class="text-button">Undo</button>
                        </p>

                        <form id="todo-form" class="todo-form">
                            <label for="new-task" class="sr-only">Enter a new task</label>
                            <input
                                id="new-task"
                                name="task"
                                type="text"
                                maxlength="200"
                                placeholder="Enter a new task..."
                                autocomplete="off"
                                aria-describedby="todo-hint"
                            >
                            <button type="submit">Add</button>
                        </form>
                        <p id="todo-hint" class="sr-only">Add a task title, then press Enter to add indented items under it. Click a name to rename it. Press / to focus the add field.</p>
                    </div>
                </section>

                <section class="area-date" aria-labelledby="date-heading">
                    <h2 id="date-heading">Date Today</h2>
                    <div class="note-card">
                        <span class="tape" aria-hidden="true"></span>
                        <div id="current-date" class="date-block">
                            <p id="date-weekday" class="date-weekday"></p>
                            <p id="date-rest" class="date-rest"></p>
                        </div>
                        <label for="daily-note" class="note-label">Today's note</label>
                        <textarea
                            id="daily-note"
                            class="daily-note"
                            rows="4"
                            maxlength="800"
                            placeholder="What matters today?"
                        ></textarea>
                    </div>
                </section>
            </main>
        </div>
    </body>
</html>
