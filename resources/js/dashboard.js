const STORAGE_KEY = 'personal-progress-dashboard';

const SELECTORS = {
    form: '#todo-form',
    input: '#new-task',
    list: '#task-list',
    empty: '#empty-state',
    stats: '#task-stats',
    progress: '#today-progress',
    meter: '#progress-meter',
    chart: '#progress-chart',
    weekday: '#date-weekday',
    rest: '#date-rest',
    streak: '#streak',
    week: '#week-strip',
    note: '#daily-note',
    clear: '#clear-completed',
    undoBar: '#undo-bar',
    undoButton: '#undo-delete',
    bubbleDone: '#bubble-done',
    bubbleLeft: '#bubble-left',
};

function pad(value) {
    return String(value).padStart(2, '0');
}

function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatWeekday(date = new Date()) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatMonthDayYear(date = new Date()) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function weekdayLabel(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultState() {
    return {
        version: 1,
        tasks: [],
        history: {},
        notes: {},
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return defaultState();
        }

        const parsed = JSON.parse(raw);
        const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        const history = parsed.history && typeof parsed.history === 'object' ? parsed.history : {};
        const notes = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};

        return {
            version: 1,
            tasks: tasks.map(normalizeTask).filter((task) => task.name.trim() !== ''),
            history,
            notes,
        };
    } catch {
        return defaultState();
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage may be unavailable in private browsing.
    }
}

function normalizeEntry(item) {
    return {
        id: String(item.id ?? createId()),
        name: String(item.name ?? ''),
        completed: Boolean(item.completed),
        createdAt: item.createdAt ?? new Date().toISOString(),
        completedAt: item.completedAt ?? null,
    };
}

function normalizeTask(item) {
    const task = normalizeEntry(item);
    const subtasks = Array.isArray(item.subtasks) ? item.subtasks : [];

    return {
        ...task,
        subtasks: subtasks.map(normalizeEntry).filter((subtask) => subtask.name.trim() !== ''),
    };
}

function flattenTasks(tasks) {
    return tasks.flatMap((task) => [task, ...task.subtasks]);
}

function taskCounts(tasks) {
    const items = flattenTasks(tasks);
    const total = items.length;
    const completed = items.filter((item) => item.completed).length;

    return {
        total,
        completed,
        remaining: total - completed,
    };
}

function progressPercent(tasks) {
    const { total, completed } = taskCounts(tasks);

    if (total === 0) {
        return 0;
    }

    return Math.round((completed / total) * 100);
}

function recordTodayProgress(state) {
    const { total, completed } = taskCounts(state.tasks);
    const today = localDateKey();

    state.history[today] = {
        percent: progressPercent(state.tasks),
        completed,
        total,
        updatedAt: new Date().toISOString(),
    };

    return state;
}

function lastSevenDays(history) {
    const days = [];
    const today = new Date();

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        date.setHours(0, 0, 0, 0);

        const key = localDateKey(date);
        const entry = history[key];
        const percent = typeof entry?.percent === 'number' ? entry.percent : 0;

        days.push({
            key,
            label: weekdayLabel(date),
            percent,
            fullDate: `${formatWeekday(date)}, ${formatMonthDayYear(date)}`,
        });
    }

    return days;
}

function renderDate(weekdayRoot, restRoot) {
    weekdayRoot.textContent = formatWeekday();
    restRoot.textContent = formatMonthDayYear();
}

function renderProgress(root, meter, percent) {
    root.textContent = String(percent);
    meter.style.width = `${percent}%`;
}

function renderStats(root, clearButton, bubbleDone, bubbleLeft, tasks) {
    const { total, completed, remaining } = taskCounts(tasks);

    bubbleDone.textContent = String(completed);
    bubbleLeft.textContent = String(remaining);

    if (total === 0) {
        root.hidden = true;
        root.textContent = '';
        clearButton.hidden = true;
        return;
    }

    root.hidden = false;
    root.textContent = remaining === 0
        ? 'All done for today'
        : `${completed} completed · ${remaining} remaining`;
    clearButton.hidden = completed === 0;
}

function completionStreak(history) {
    let streak = 0;
    const today = new Date();

    for (let offset = 0; offset < 400; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const entry = history[localDateKey(date)];
        const isComplete = Boolean(entry && entry.total > 0 && entry.percent === 100);

        if (isComplete) {
            streak += 1;
            continue;
        }

        if (offset === 0) {
            continue;
        }

        break;
    }

    return streak;
}

function renderStreak(root, history) {
    const streak = completionStreak(history);

    if (streak < 2) {
        root.hidden = true;
        root.textContent = '';
        return;
    }

    root.hidden = false;
    root.textContent = `${streak}-day streak`;
}

function renderWeekStrip(root, history) {
    const today = localDateKey();
    root.replaceChildren();

    lastSevenDays(history).forEach((day) => {
        const item = document.createElement('li');

        if (day.key === today) {
            item.className = 'is-today';
        }

        const label = document.createElement('span');
        label.className = 'day';
        label.textContent = day.label;

        const percent = document.createElement('strong');
        percent.className = 'pct';
        percent.textContent = `${day.percent}`;

        const bar = document.createElement('div');
        bar.className = 'bar';
        const fill = document.createElement('span');
        fill.style.width = `${day.percent}%`;
        bar.append(fill);

        item.append(label, percent, bar);
        item.title = `${day.fullDate}: ${day.percent}%`;
        root.append(item);
    });
}

function findEntry(state, id, parentId = null) {
    if (parentId) {
        const parent = state.tasks.find((task) => task.id === parentId);
        return parent?.subtasks.find((item) => item.id === id) ?? null;
    }

    return state.tasks.find((task) => task.id === id) ?? null;
}

function renameTask(state, id, parentId, name) {
    const trimmed = name.trim();
    const entry = findEntry(state, id, parentId);

    if (!entry || trimmed === '') {
        return false;
    }

    entry.name = trimmed;
    return true;
}

function clearCompleted(state) {
    state.tasks = state.tasks
        .map((task) => ({
            ...task,
            subtasks: task.subtasks.filter((subtask) => !subtask.completed),
        }))
        .filter((task) => !(task.completed && task.subtasks.length === 0));
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function smoothPath(points) {
    if (points.length === 0) {
        return '';
    }

    if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let index = 0; index < points.length - 1; index += 1) {
        const previous = points[index === 0 ? index : index - 1];
        const current = points[index];
        const next = points[index + 1];
        const after = points[index + 2] ?? next;
        const tension = 6;

        const control1 = {
            x: current.x + (next.x - previous.x) / tension,
            y: current.y + (next.y - previous.y) / tension,
        };
        const control2 = {
            x: next.x - (after.x - current.x) / tension,
            y: next.y - (after.y - current.y) / tension,
        };

        path += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${next.x} ${next.y}`;
    }

    return path;
}

function renderChart(container, history) {
    const days = lastSevenDays(history);
    const width = 640;
    const height = 248;
    const padding = { top: 18, right: 8, bottom: 32, left: 36 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxIndex = Math.max(days.length - 1, 1);
    const minY = padding.top;
    const maxY = padding.top + plotHeight;

    const xFor = (index) => padding.left + (index / maxIndex) * plotWidth;
    const yFor = (percent) => padding.top + plotHeight - (percent / 100) * plotHeight;

    const points = days.map((day, index) => ({
        x: xFor(index),
        y: clamp(yFor(day.percent), minY, maxY),
        label: day.label,
        percent: day.percent,
    }));

    const yTicks = [0, 50, 100];
    const grid = yTicks
        .map((tick) => {
            const y = yFor(tick);
            return `
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#f0b3bf" />
                <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#a05d6c" font-size="10" font-family="Nunito, sans-serif">${tick}</text>
            `;
        })
        .join('');

    const line = smoothPath(points);
    const area = `${line} L ${points[points.length - 1].x} ${yFor(0)} L ${points[0].x} ${yFor(0)} Z`;
    const dots = points
        .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3.5" fill="#9b1c32" stroke="#fff8ef" stroke-width="2" />`)
        .join('');
    const labels = points
        .map((point) => `<text x="${point.x}" y="${height - 6}" text-anchor="middle" fill="#a05d6c" font-size="11" font-family="Nunito, sans-serif">${point.label}</text>`)
        .join('');
    const description = days.map((day) => `${day.label}: ${day.percent}%`).join(', ');

    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc">
            <title id="chart-title">Task completion progress over the last seven days</title>
            <desc id="chart-desc">${description}</desc>
            <defs>
                <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#9b1c32" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="#9b1c32" stop-opacity="0" />
                </linearGradient>
            </defs>
            ${grid}
            <path d="${area}" fill="url(#chart-fill)" />
            <path d="${line}" fill="none" stroke="#9b1c32" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
            ${dots}
            ${labels}
        </svg>
    `;
}

function createTaskRow(task, options = {}) {
    const { parentId = null, isSubtask = false } = options;
    const item = document.createElement(isSubtask ? 'li' : 'div');
    item.className = `task-item${isSubtask ? ' is-subtask' : ' is-parent'}${task.completed ? ' is-completed' : ''}`;
    item.dataset.id = task.id;

    if (parentId) {
        item.dataset.parentId = parentId;
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.completed;
    checkbox.dataset.action = 'toggle';
    checkbox.setAttribute('aria-label', `Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`);

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'task-name';
    name.dataset.action = 'edit';
    name.textContent = task.name;
    name.setAttribute('aria-label', `Rename ${task.name}`);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'task-delete';
    remove.dataset.action = 'delete';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${task.name}`);

    item.append(checkbox, name, remove);

    return item;
}

function renderTasks(list, emptyState, tasks) {
    list.replaceChildren();

    if (tasks.length === 0) {
        emptyState.hidden = false;
        list.hidden = true;
        return;
    }

    emptyState.hidden = true;
    list.hidden = false;

    tasks.forEach((task) => {
        const group = document.createElement('li');
        group.className = 'task-group';
        group.append(createTaskRow(task));

        const nested = document.createElement('ul');
        nested.className = 'subtask-list';
        nested.setAttribute('aria-label', `Items in ${task.name}`);

        task.subtasks.forEach((subtask) => {
            nested.append(createTaskRow(subtask, { parentId: task.id, isSubtask: true }));
        });

        group.append(nested);

        const nestedForm = document.createElement('form');
        nestedForm.className = 'subtask-form';
        nestedForm.dataset.subtaskFor = task.id;

        const nestedLabel = document.createElement('label');
        nestedLabel.className = 'sr-only';
        nestedLabel.setAttribute('for', `subtask-${task.id}`);
        nestedLabel.textContent = `Add an item under ${task.name}`;

        const nestedInput = document.createElement('input');
        nestedInput.id = `subtask-${task.id}`;
        nestedInput.type = 'text';
        nestedInput.maxLength = 200;
        nestedInput.autocomplete = 'off';
        nestedInput.placeholder = 'Add';

        nestedForm.append(nestedLabel, nestedInput);
        group.append(nestedForm);
        list.append(group);
    });
}

function addTask(state, name) {
    const trimmed = name.trim();

    if (trimmed === '') {
        return null;
    }

    const task = {
        id: createId(),
        name: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        subtasks: [],
    };

    state.tasks.push(task);

    return task.id;
}

function addSubtask(state, parentId, name) {
    const trimmed = name.trim();
    const parent = state.tasks.find((task) => task.id === parentId);

    if (trimmed === '' || !parent) {
        return false;
    }

    parent.subtasks.push({
        id: createId(),
        name: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
    });

    return true;
}

function toggleEntry(entry) {
    entry.completed = !entry.completed;
    entry.completedAt = entry.completed ? new Date().toISOString() : null;
}

function toggleTask(state, id, parentId = null) {
    if (parentId) {
        const parent = state.tasks.find((task) => task.id === parentId);
        const subtask = parent?.subtasks.find((item) => item.id === id);

        if (subtask) {
            toggleEntry(subtask);
        }

        return;
    }

    const task = state.tasks.find((item) => item.id === id);

    if (task) {
        toggleEntry(task);
    }
}

function deleteTask(state, id, parentId = null) {
    if (parentId) {
        const parent = state.tasks.find((task) => task.id === parentId);

        if (!parent) {
            return null;
        }

        const index = parent.subtasks.findIndex((subtask) => subtask.id === id);

        if (index === -1) {
            return null;
        }

        const [subtask] = parent.subtasks.splice(index, 1);

        return {
            kind: 'subtask',
            parentId,
            index,
            entry: subtask,
        };
    }

    const index = state.tasks.findIndex((task) => task.id === id);

    if (index === -1) {
        return null;
    }

    const [task] = state.tasks.splice(index, 1);

    return {
        kind: 'task',
        index,
        entry: task,
    };
}

function restoreDeleted(state, snapshot) {
    if (!snapshot) {
        return;
    }

    if (snapshot.kind === 'subtask') {
        const parent = state.tasks.find((task) => task.id === snapshot.parentId);

        if (parent) {
            parent.subtasks.splice(snapshot.index, 0, snapshot.entry);
        }

        return;
    }

    state.tasks.splice(snapshot.index, 0, snapshot.entry);
}

export function initDashboard() {
    const form = document.querySelector(SELECTORS.form);
    const input = document.querySelector(SELECTORS.input);
    const list = document.querySelector(SELECTORS.list);
    const empty = document.querySelector(SELECTORS.empty);
    const stats = document.querySelector(SELECTORS.stats);
    const progress = document.querySelector(SELECTORS.progress);
    const meter = document.querySelector(SELECTORS.meter);
    const chart = document.querySelector(SELECTORS.chart);
    const weekday = document.querySelector(SELECTORS.weekday);
    const rest = document.querySelector(SELECTORS.rest);
    const streak = document.querySelector(SELECTORS.streak);
    const week = document.querySelector(SELECTORS.week);
    const note = document.querySelector(SELECTORS.note);
    const clearButton = document.querySelector(SELECTORS.clear);
    const undoBar = document.querySelector(SELECTORS.undoBar);
    const undoButton = document.querySelector(SELECTORS.undoButton);
    const bubbleDone = document.querySelector(SELECTORS.bubbleDone);
    const bubbleLeft = document.querySelector(SELECTORS.bubbleLeft);

    if (
        !form || !input || !list || !empty || !stats || !progress || !meter || !chart
        || !weekday || !rest || !streak || !week || !note || !clearButton || !undoBar || !undoButton
        || !bubbleDone || !bubbleLeft
    ) {
        return;
    }

    const state = recordTodayProgress(loadState());
    let renderedDate = localDateKey();
    let pendingFocusParentId = null;
    let undoSnapshot = null;
    let undoTimer = 0;

    function hideUndo() {
        undoSnapshot = null;
        undoBar.hidden = true;
        window.clearTimeout(undoTimer);
    }

    function showUndo() {
        undoBar.hidden = false;
        window.clearTimeout(undoTimer);
        undoTimer = window.setTimeout(() => {
            hideUndo();
        }, 6000);
    }

    function syncNote() {
        if (document.activeElement === note) {
            return;
        }

        note.value = state.notes[localDateKey()] ?? '';
    }

    function render() {
        const percent = progressPercent(state.tasks);

        renderDate(weekday, rest);
        renderProgress(progress, meter, percent);
        renderStreak(streak, state.history);
        renderStats(stats, clearButton, bubbleDone, bubbleLeft, state.tasks);
        renderTasks(list, empty, state.tasks);
        renderChart(chart, state.history);
        renderWeekStrip(week, state.history);
        syncNote();
        renderedDate = localDateKey();
    }

    function persistAndRender() {
        recordTodayProgress(state);
        saveState(state);
        const focusParentId = pendingFocusParentId;
        pendingFocusParentId = null;
        render();

        if (!focusParentId) {
            return;
        }

        const nestedInput = list.querySelector(`[data-subtask-for="${CSS.escape(focusParentId)}"] input`);
        nestedInput?.focus();
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const createdId = addTask(state, input.value);

        if (!createdId) {
            input.focus();
            return;
        }

        input.value = '';
        pendingFocusParentId = createdId;
        persistAndRender();
    });

    list.addEventListener('submit', (event) => {
        const nestedForm = event.target;

        if (!(nestedForm instanceof HTMLFormElement) || !nestedForm.dataset.subtaskFor) {
            return;
        }

        event.preventDefault();

        const nestedInput = nestedForm.querySelector('input');
        const parentId = nestedForm.dataset.subtaskFor;

        if (!nestedInput || !addSubtask(state, parentId, nestedInput.value)) {
            nestedInput?.focus();
            return;
        }

        nestedInput.value = '';
        pendingFocusParentId = parentId;
        persistAndRender();
    });

    list.addEventListener('change', (event) => {
        const target = event.target;

        if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'toggle') {
            return;
        }

        const item = target.closest('[data-id]');

        if (!item) {
            return;
        }

        toggleTask(state, item.dataset.id, item.dataset.parentId ?? null);
        persistAndRender();
    });

    function startRename(nameButton) {
        const item = nameButton.closest('[data-id]');

        if (!item || item.querySelector('.task-edit')) {
            return;
        }

        const original = nameButton.textContent ?? '';
        const field = document.createElement('input');
        field.className = 'task-edit';
        field.value = original;
        field.maxLength = 200;
        field.setAttribute('aria-label', 'Rename task');

        let closed = false;

        const finish = (shouldSave) => {
            if (closed) {
                return;
            }

            closed = true;
            const nextName = shouldSave ? field.value : original;

            if (shouldSave) {
                renameTask(state, item.dataset.id, item.dataset.parentId ?? null, nextName);
                persistAndRender();
                return;
            }

            field.replaceWith(nameButton);
        };

        field.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                field.blur();
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                finish(false);
            }
        });

        field.addEventListener('blur', () => finish(true));
        nameButton.replaceWith(field);
        field.focus();
        field.select();
    }

    list.addEventListener('click', (event) => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.dataset.action === 'edit') {
            startRename(target);
            return;
        }

        if (target.dataset.action !== 'delete') {
            return;
        }

        const item = target.closest('[data-id]');

        if (!item) {
            return;
        }

        const snapshot = deleteTask(state, item.dataset.id, item.dataset.parentId ?? null);

        if (!snapshot) {
            return;
        }

        undoSnapshot = snapshot;
        persistAndRender();
        showUndo();
    });

    clearButton.addEventListener('click', () => {
        clearCompleted(state);
        hideUndo();
        persistAndRender();
    });

    undoButton.addEventListener('click', () => {
        restoreDeleted(state, undoSnapshot);
        hideUndo();
        persistAndRender();
    });

    note.addEventListener('input', () => {
        state.notes[localDateKey()] = note.value;
        saveState(state);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }

        const active = document.activeElement;

        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
            return;
        }

        event.preventDefault();
        input.focus();
    });

    persistAndRender();

    window.setInterval(() => {
        if (localDateKey() !== renderedDate) {
            persistAndRender();
        }
    }, 60_000);
}
