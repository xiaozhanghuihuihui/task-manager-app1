// script.js

// 获取DOM元素
const taskTitleInput = document.getElementById('task-title');
const taskDescriptionInput = document.getElementById('task-description');
const taskDueDateInput = document.getElementById('task-due-date');
const taskPrioritySelect = document.getElementById('task-priority');
const addTaskBtn = document.getElementById('add-task-btn');
const taskListDiv = document.getElementById('task-list');

// 获取模态框相关DOM元素
const editTaskModal = document.getElementById('edit-task-modal');
const closeButton = document.querySelector('.close-button');
const editTaskIdInput = document.getElementById('edit-task-id');
const editTaskTitleInput = document.getElementById('edit-task-title');
const editTaskDescriptionInput = document.getElementById('edit-task-description');
const editTaskDueDateInput = document.getElementById('edit-task-due-date');
const editTaskPrioritySelect = document.getElementById('edit-task-priority');
const saveEditedTaskBtn = document.getElementById('save-edited-task-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// 获取筛选和排序相关的DOM元素
const filterStatusSelect = document.getElementById('filter-status');
const filterPrioritySelect = document.getElementById('filter-priority');
const sortBySelect = document.getElementById('sort-by');


// 存储任务的数组
// 尝试从 localStorage 获取任务数据，如果不存在则初始化为空数组
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// 辅助函数：保存任务到 localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 渲染任务列表的函数 (重大修改)
function renderTasks() {
    taskListDiv.innerHTML = ''; // 清空现有列表

    // 1. 获取当前的筛选和排序条件
    const currentFilterStatus = filterStatusSelect.value;
    const currentFilterPriority = filterPrioritySelect.value;
    const currentSortBy = sortBySelect.value;

    // 2. 筛选任务
    let filteredTasks = tasks.filter(task => {
        const matchesStatus =
            currentFilterStatus === 'all' ||
            (currentFilterStatus === 'pending' && !task.completed) ||
            (currentFilterStatus === 'completed' && task.completed);

        const matchesPriority =
            currentFilterPriority === 'all' ||
            task.priority === currentFilterPriority;

        return matchesStatus && matchesPriority;
    });

    // 3. 排序任务
    filteredTasks.sort((a, b) => {
        switch (currentSortBy) {
            case 'addedDate_desc': // 最新添加的在前 (默认)
                return b.id - a.id;
            case 'addedDate_asc': // 最旧添加的在前
                return a.id - b.id;
            case 'dueDate_asc': // 截止日期最早的在前
                // 处理空日期：将空日期视为最晚，或根据需求排序
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1; // a无日期，排在后面
                if (!b.dueDate) return -1; // b无日期，排在前面
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'dueDate_desc': // 截止日期最晚的在前
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return -1; // a无日期，排在前面
                if (!b.dueDate) return 1; // b无日期，排在前面
                return new Date(b.dueDate) - new Date(a.dueDate);
            case 'priority_desc': // 优先级高到低
                const priorityOrderDesc = { '高': 3, '中': 2, '低': 1 };
                return priorityOrderDesc[b.priority] - priorityOrderDesc[a.priority];
            case 'priority_asc': // 优先级低到高
                const priorityOrderAsc = { '高': 1, '中': 2, '低': 3 };
                return priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority];
            default:
                return 0;
        }
    });

    if (filteredTasks.length === 0) {
        taskListDiv.innerHTML = '<p>没有找到符合条件的任务。</p>'; // 根据筛选结果显示不同提示
        return;
    }

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        taskItem.dataset.id = task.id; // 将任务ID存储在DOM元素上，方便后续操作

        taskItem.innerHTML = `
            <div class="task-details">
                <h3>${task.title}</h3>
                <p>${task.description || '无描述'}</p>
                <p>截止日期: ${task.dueDate || '无'}</p>
                <p>优先级: ${task.priority}</p>
            </div>
            <div class="task-actions">
                <button class="complete-btn" data-id="${task.id}">
                    ${task.completed ? '未完成' : '完成'}
                </button>
                <button class="edit-btn" data-id="${task.id}">编辑</button>
                <button class="delete-btn" data-id="${task.id}">删除</button>
            </div>
        `;
        taskListDiv.appendChild(taskItem);
    });
}

// 添加任务功能
addTaskBtn.addEventListener('click', () => {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const dueDate = taskDueDateInput.value;
    const priority = taskPrioritySelect.value;

    if (!title) {
        alert('任务标题不能为空！');
        return;
    }

    const newTask = {
        id: Date.now(), // 简单地使用时间戳作为唯一ID
        title,
        description,
        dueDate,
        priority,
        completed: false // 新任务默认为未完成
    };

    tasks.unshift(newTask); // 将新任务添加到数组开头
    saveTasks(); // 每次添加任务后保存
    renderTasks(); // 重新渲染列表

    // 清空表单
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskDueDateInput.value = '';
    taskPrioritySelect.value = '中';
});

// 处理任务操作（完成、编辑、删除）- 使用事件委托
taskListDiv.addEventListener('click', (event) => {
    const target = event.target;
    const taskId = parseInt(target.dataset.id); // 获取任务ID

    if (target.classList.contains('complete-btn')) {
        // 标记任务完成或未完成
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed; // 切换完成状态
            saveTasks(); // 每次完成/未完成任务后保存
            renderTasks(); // 重新渲染
        }
    } else if (target.classList.contains('edit-btn')) {
        // 显示模态框并填充数据
        const taskToEdit = tasks.find(task => task.id === taskId);
        if (taskToEdit) {
            editTaskIdInput.value = taskToEdit.id; // 存储当前编辑任务的ID
            editTaskTitleInput.value = taskToEdit.title;
            editTaskDescriptionInput.value = taskToEdit.description;
            editTaskDueDateInput.value = taskToEdit.dueDate;
            editTaskPrioritySelect.value = taskToEdit.priority;
            editTaskModal.style.display = 'flex'; // 显示模态框 (CSS display: flex for centering)
        }
    } else if (target.classList.contains('delete-btn')) {
        // 删除任务
        if (confirm('确定要删除这个任务吗？')) {
            tasks = tasks.filter(task => task.id !== taskId); // 过滤掉要删除的任务
            saveTasks(); // 每次删除任务后保存
            renderTasks(); // 重新渲染
        }
    }
});

// 模态框的关闭逻辑
closeButton.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
});

cancelEditBtn.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
});

// 点击模态框外部关闭模态框
window.addEventListener('click', (event) => {
    if (event.target === editTaskModal) {
        editTaskModal.style.display = 'none';
    }
});

// 保存编辑后的任务
saveEditedTaskBtn.addEventListener('click', () => {
    const taskId = parseInt(editTaskIdInput.value);
    const newTitle = editTaskTitleInput.value.trim();
    const newDescription = editTaskDescriptionInput.value.trim();
    const newDueDate = editTaskDueDateInput.value;
    const newPriority = editTaskPrioritySelect.value;

    if (!newTitle) {
        alert('任务标题不能为空！');
        return;
    }

    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].title = newTitle;
        tasks[taskIndex].description = newDescription;
        tasks[taskIndex].dueDate = newDueDate;
        tasks[taskIndex].priority = newPriority;
        saveTasks(); // 保存更改
        renderTasks(); // 重新渲染列表
        editTaskModal.style.display = 'none'; // 隐藏模态框
    }
});

// 监听筛选和排序条件的变化，并重新渲染任务列表
filterStatusSelect.addEventListener('change', renderTasks);
filterPrioritySelect.addEventListener('change', renderTasks);
sortBySelect.addEventListener('change', renderTasks);

// 页面加载完成后立即渲染任务列表
document.addEventListener('DOMContentLoaded', renderTasks);