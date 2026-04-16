import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, take } from 'rxjs/operators';
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

  // --- Add Group ---
  showAddGroupModal = false;
  newGroupName = '';

  // --- Rename Group ---
  editingGroupId: number | null = null;
  editingGroupName = '';
  openGroupMenuId: number | null = null;

  // --- Add Task ---
  showAddTaskModal = false;
  addTaskForStatusId: number | null = null;
  newTask = { title: '', priority: null as number | null, start_date: '', due_date: '' };

  // --- Rename Task ---
  editingTaskId: number | null = null;
  editingTaskTitle = '';
  openTaskMenuId: number | null = null;

  // --- Board Settings ---
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
      takeUntil(this.destroy$),
      distinctUntilChanged((a, b) => a?.id === b?.id)
    ).subscribe(board => {
      if (board) {
        this.currentBoard = board;
        this.statuses = [];
        this.tasks = [];
        this.priorities = [];
        this.loadBoardData(board.id);
      } else {
        this.boardService.getBoards().pipe(take(1)).subscribe(boards => {
          if (boards.length > 0) this.boardService.selectBoard(boards[0]);
          else this.router.navigate(['/dashboard']);
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBoardData(boardId: number): void {
    this.boardService.getStatuses(boardId).pipe(take(1)).subscribe(data => {
      this.statuses = data.sort((a, b) => a.order - b.order);
    });
    this.boardService.getPriorities(boardId).pipe(take(1)).subscribe(data => {
      this.priorities = data.sort((a, b) => b.level - a.level);
    });
    this.taskService.getTasks().pipe(take(1)).subscribe(data => {
      this.tasks = data.filter(t => t.board === boardId);
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

  openAddGroup(): void { this.newGroupName = ''; this.showAddGroupModal = true; }
  closeAddGroup(): void { this.showAddGroupModal = false; }

  createGroup(): void {
    if (!this.newGroupName.trim() || !this.currentBoard) return;
    this.boardService.createStatus({
      board: this.currentBoard.id,
      name: this.newGroupName.trim(),
      order: this.statuses.length + 1
    }).pipe(take(1)).subscribe(s => {
      this.statuses = [...this.statuses, s];
      this.closeAddGroup();
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
    this.boardService.updateStatus(status.id, { name: this.editingGroupName.trim() })
      .pipe(take(1)).subscribe(updated => {
        const i = this.statuses.findIndex(s => s.id === updated.id);
        if (i !== -1) this.statuses[i] = updated;
        this.editingGroupId = null;
      });
  }

  deleteGroup(statusId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openGroupMenuId = null;
    if (!confirm('Delete this group and all its tasks?')) return;
    this.boardService.deleteStatus(statusId).pipe(take(1)).subscribe(() => {
      this.statuses = this.statuses.filter(s => s.id !== statusId);
      this.tasks = this.tasks.filter(t => t.status !== statusId);
    });
  }

  // ── Task actions ──────────────────────────────

  openAddTask(statusId: number): void {
    this.addTaskForStatusId = statusId;
    this.newTask = {
      title: '',
      priority: this.priorities.length > 0 ? this.priorities[this.priorities.length - 1].id : null,
      start_date: '',
      due_date: ''
    };
    this.showAddTaskModal = true;
  }
  closeAddTask(): void { this.showAddTaskModal = false; }

  createTask(): void {
    if (!this.newTask.title.trim() || !this.currentBoard || !this.addTaskForStatusId) return;
    const payload: Partial<Task> = {
      title: this.newTask.title.trim(),
      board: this.currentBoard.id,
      status: this.addTaskForStatusId,
      priority: this.newTask.priority,
      start_date: this.newTask.start_date || null,
      due_date: this.newTask.due_date || null,
      is_completed: false
    };
    this.taskService.createTask(payload).pipe(take(1)).subscribe(task => {
      this.tasks = [...this.tasks, task];
      this.closeAddTask();
    });
  }

  toggleTask(task: Task): void {
    const val = !task.is_completed;
    this.taskService.updateTask(task.id, { is_completed: val }).pipe(take(1)).subscribe(() => {
      task.is_completed = val;
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
    this.taskService.updateTask(task.id, { title: this.editingTaskTitle.trim() })
      .pipe(take(1)).subscribe(updated => {
        const i = this.tasks.findIndex(t => t.id === updated.id);
        if (i !== -1) this.tasks[i] = { ...this.tasks[i], title: updated.title };
        this.editingTaskId = null;
      });
  }

  deleteTask(taskId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openTaskMenuId = null;
    this.taskService.deleteTask(taskId).pipe(take(1)).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
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
    this.boardService.updateBoard(this.currentBoard.id, {
      title: this.editBoardTitle,
      description: this.editBoardDescription,
      is_public: this.editBoardPublic
    }).pipe(take(1)).subscribe(updated => {
      this.currentBoard = updated;
      this.boardService.selectBoard(updated);
      this.closeSettings();
    });
  }

  deleteBoard(): void {
    if (!this.currentBoard || !confirm(`Delete "${this.currentBoard.title}"? This cannot be undone.`)) return;
    this.boardService.deleteBoard(this.currentBoard.id).pipe(take(1)).subscribe(() => {
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