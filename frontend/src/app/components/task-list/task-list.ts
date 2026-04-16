import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { Task } from '../../models/task.model';
import { Board, TaskStatus, TaskPriority } from '../../models/board.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentBoard: Board | null = null;
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];
  priorities: TaskPriority[] = [];
  loading = false;

  showAddGroupModal = false;
  newGroupName = '';
  savingGroup = false;

  editingGroupId: number | null = null;
  editingGroupName = '';
  openGroupMenuId: number | null = null;

  showAddTaskModal = false;
  addTaskForStatusId: number | null = null;
  newTask = { title: '', priority: null as number | null, start_date: '', due_date: '' };
  savingTask = false;

  editingTaskId: number | null = null;
  editingTaskTitle = '';
  openTaskMenuId: number | null = null;

  showSettingsModal = false;
  settingsTab: 'general' | 'members' = 'general';
  editBoardTitle = '';
  editBoardDescription = '';
  editBoardPublic = true;
  inviteUsername = '';
  inviteError = '';
  inviteSuccess = '';

  ngOnInit(): void {
    this.boardService.selectedBoard$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(board => {
      this.currentBoard = board;
      this.statuses = [];
      this.tasks = [];
      this.priorities = [];
      this.loadBoardData(board.id);
    });

    if (this.boardService.currentBoard) {
      this.currentBoard = this.boardService.currentBoard;
      this.loadBoardData(this.currentBoard.id);
    } else {
      this.boardService.getBoards().pipe(take(1)).subscribe(boards => {
        if (boards.length > 0) this.boardService.selectBoard(boards[0]);
        else this.router.navigate(['/dashboard']);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBoardData(boardId: number): void {
    this.loading = true;
    this.boardService.getStatuses(boardId).pipe(take(1)).subscribe(data => {
      this.statuses = [...data.sort((a, b) => a.order - b.order)];
      this.loading = false;
    });
    this.boardService.getPriorities(boardId).pipe(take(1)).subscribe(data => {
      this.priorities = [...data.sort((a, b) => b.level - a.level)];
    });
    this.taskService.getTasks().pipe(take(1)).subscribe(data => {
      this.tasks = [...data.filter(t => t.board === boardId)];
    });
  }

  getTasksByStatus(statusId: number): Task[] {
    return this.tasks.filter(t => t.status === statusId);
  }

  getProgress(statusId: number): number {
    const group = this.getTasksByStatus(statusId);
    if (!group.length) return 0;
    return Math.round(group.filter(t => t.is_completed).length / group.length * 100);
  }

  getPriority(priorityId: number | null): TaskPriority | null {
    if (!priorityId) return null;
    return this.priorities.find(p => p.id === priorityId) ?? null;
  }

  // ── Group actions ──────────────────────────────

  openAddGroup(): void { this.newGroupName = ''; this.savingGroup = false; this.showAddGroupModal = true; }
  closeAddGroup(): void { this.showAddGroupModal = false; this.savingGroup = false; }

  createGroup(): void {
    if (!this.newGroupName.trim() || !this.currentBoard || this.savingGroup) return;
    this.savingGroup = true;
    this.boardService.createStatus({
      board: this.currentBoard.id,
      name: this.newGroupName.trim(),
      order: this.statuses.length + 1
    }).pipe(take(1)).subscribe({
      next: s => {
        this.statuses = [...this.statuses, s];
        this.closeAddGroup();
      },
      error: () => { this.savingGroup = false; }
    });
  }

  toggleGroupMenu(statusId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openGroupMenuId = this.openGroupMenuId === statusId ? null : statusId;
  }

  startRenameGroup(status: TaskStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.openGroupMenuId = null;
    this.editingGroupId = status.id;
    this.editingGroupName = status.name;
  }

  saveRenameGroup(status: TaskStatus): void {
    if (!this.editingGroupName.trim()) { this.editingGroupId = null; return; }
    const optimisticName = this.editingGroupName.trim();
    const prevName = status.name;
    // Optimistic update
    this.statuses = this.statuses.map(s =>
      s.id === status.id ? { ...s, name: optimisticName } : s
    );
    this.editingGroupId = null;
    this.boardService.updateStatus(status.id, { name: optimisticName })
      .pipe(take(1)).subscribe({
        error: () => {
          // Revert on failure
          this.statuses = this.statuses.map(s =>
            s.id === status.id ? { ...s, name: prevName } : s
          );
        }
      });
  }

  deleteGroup(statusId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openGroupMenuId = null;
    if (!confirm('Delete this group and all its tasks?')) return;
    // Optimistic update
    const prevStatuses = [...this.statuses];
    const prevTasks = [...this.tasks];
    this.statuses = this.statuses.filter(s => s.id !== statusId);
    this.tasks = this.tasks.filter(t => t.status !== statusId);
    this.boardService.deleteStatus(statusId).pipe(take(1)).subscribe({
      error: () => {
        this.statuses = prevStatuses;
        this.tasks = prevTasks;
      }
    });
  }

  // ── Task actions ──────────────────────────────

  openAddTask(statusId: number): void {
    this.addTaskForStatusId = statusId;
    this.savingTask = false;
    this.newTask = {
      title: '',
      priority: this.priorities.length > 0 ? this.priorities[this.priorities.length - 1].id : null,
      start_date: '',
      due_date: ''
    };
    this.showAddTaskModal = true;
  }

  closeAddTask(): void { this.showAddTaskModal = false; this.savingTask = false; }

  createTask(): void {
    if (!this.newTask.title.trim() || !this.currentBoard || !this.addTaskForStatusId || this.savingTask) return;
    this.savingTask = true;
    const payload: Partial<Task> = {
      title: this.newTask.title.trim(),
      board: this.currentBoard.id,
      status: this.addTaskForStatusId,
      priority: this.newTask.priority,
      start_date: this.newTask.start_date || null,
      due_date: this.newTask.due_date || null,
      is_completed: false
    };
    this.taskService.createTask(payload).pipe(take(1)).subscribe({
      next: task => {
        this.tasks = [...this.tasks, task];
        this.closeAddTask();
      },
      error: () => { this.savingTask = false; }
    });
  }

  toggleTask(task: Task): void {
    const val = !task.is_completed;
    // Optimistic update — instant UI response
    this.tasks = this.tasks.map(t =>
      t.id === task.id ? { ...t, is_completed: val } : t
    );
    this.taskService.updateTask(task.id, { is_completed: val }).pipe(take(1)).subscribe({
      error: () => {
        // Revert on failure
        this.tasks = this.tasks.map(t =>
          t.id === task.id ? { ...t, is_completed: !val } : t
        );
      }
    });
  }

  toggleTaskMenu(taskId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openTaskMenuId = this.openTaskMenuId === taskId ? null : taskId;
  }

  startRenameTask(task: Task, event: MouseEvent): void {
    event.stopPropagation();
    this.openTaskMenuId = null;
    this.editingTaskId = task.id;
    this.editingTaskTitle = task.title;
  }

  saveRenameTask(task: Task): void {
    if (!this.editingTaskTitle.trim()) { this.editingTaskId = null; return; }
    const optimisticTitle = this.editingTaskTitle.trim();
    const prevTitle = task.title;
    // Optimistic update
    this.tasks = this.tasks.map(t =>
      t.id === task.id ? { ...t, title: optimisticTitle } : t
    );
    this.editingTaskId = null;
    this.taskService.updateTask(task.id, { title: optimisticTitle }).pipe(take(1)).subscribe({
      error: () => {
        this.tasks = this.tasks.map(t =>
          t.id === task.id ? { ...t, title: prevTitle } : t
        );
      }
    });
  }

  deleteTask(taskId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openTaskMenuId = null;
    // Optimistic update
    const prevTasks = [...this.tasks];
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.taskService.deleteTask(taskId).pipe(take(1)).subscribe({
      error: () => { this.tasks = prevTasks; }
    });
  }

  // ── Board settings ──────────────────────────────

  openSettings(tab: 'general' | 'members' = 'general'): void {
    if (!this.currentBoard) return;
    this.editBoardTitle = this.currentBoard.title;
    this.editBoardDescription = this.currentBoard.description;
    this.editBoardPublic = this.currentBoard.is_public;
    this.inviteUsername = '';
    this.inviteError = '';
    this.inviteSuccess = '';
    this.settingsTab = tab;
    this.showSettingsModal = true;
  }

  closeSettings(): void { this.showSettingsModal = false; }

  saveSettings(): void {
    if (!this.currentBoard) return;
    const optimistic = {
      ...this.currentBoard,
      title: this.editBoardTitle,
      description: this.editBoardDescription,
      is_public: this.editBoardPublic
    };
    const prev = { ...this.currentBoard };
    this.currentBoard = optimistic;
    this.boardService.currentBoard = optimistic;
    this.closeSettings();
    this.boardService.updateBoard(optimistic.id, {
      title: this.editBoardTitle,
      description: this.editBoardDescription,
      is_public: this.editBoardPublic
    }).pipe(take(1)).subscribe({
      error: () => {
        this.currentBoard = prev;
        this.boardService.currentBoard = prev;
      }
    });
  }

  deleteBoard(): void {
    if (!this.currentBoard || !confirm(`Delete "${this.currentBoard.title}"? This cannot be undone.`)) return;
    this.boardService.deleteBoard(this.currentBoard.id).pipe(take(1)).subscribe(() => {
      this.boardService.currentBoard = null;
      this.router.navigate(['/dashboard']);
    });
  }

  inviteMember(): void {
    if (!this.inviteUsername.trim() || !this.currentBoard) return;
    this.inviteError = '';
    this.inviteSuccess = '';
    this.boardService.addMember(this.currentBoard.id, this.inviteUsername.trim())
      .pipe(take(1)).subscribe({
        next: () => { this.inviteSuccess = `✅ ${this.inviteUsername} added!`; this.inviteUsername = ''; },
        error: () => { this.inviteError = '❌ User not found or already a member.'; }
      });
  }

  goToDashboard(): void { this.router.navigate(['/dashboard']); }

  closeAllMenus(): void {
    this.openGroupMenuId = null;
    this.openTaskMenuId = null;
  }
}