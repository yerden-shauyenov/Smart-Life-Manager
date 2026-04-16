import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { Task, Subtask } from '../../models/task.model';
import { Board, TaskStatus } from '../../models/board.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private router = inject(Router);

  currentBoard: Board | null = null;
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];

  // --- Add Group Modal ---
  showAddGroupModal = false;
  newGroupName = '';

  // --- Add Task Modal ---
  showAddTaskModal = false;
  addTaskForStatusId: number | null = null;
  newTask = { title: '', priority: 'medium', start_date: '', due_date: '' };

  // --- Board Settings Modal ---
  showSettingsModal = false;
  settingsTab: 'general' | 'members' = 'general';
  editBoardTitle = '';
  editBoardDescription = '';
  editBoardPublic = true;
  inviteUsername = '';
  inviteError = '';
  inviteSuccess = '';

  // --- Invite Modal (standalone) ---
  showInviteModal = false;

  ngOnInit(): void {
    this.boardService.selectedBoard$.subscribe(board => {
      if (board) {
        this.currentBoard = board;
        this.loadBoardData(board.id);
      } else {
        this.boardService.getBoards().subscribe(boards => {
          if (boards.length > 0) {
            this.currentBoard = boards[0];
            this.boardService.selectBoard(boards[0]);
            this.loadBoardData(boards[0].id);
          } else {
            this.router.navigate(['/dashboard']);
          }
        });
      }
    });
  }

  private loadBoardData(boardId: number): void {
    this.boardService.getStatuses(boardId).subscribe(data => {
      this.statuses = data.sort((a, b) => a.order - b.order);
    });
    this.taskService.getTasks().subscribe(data => {
      this.tasks = data.filter(t => t.board === boardId);
    });
  }

  getTasksByStatus(statusId: number): Task[] {
    return this.tasks.filter(t => t.status === statusId);
  }

  getProgress(statusId: number): number {
    const group = this.getTasksByStatus(statusId);
    if (!group.length) return 0;
    const done = group.filter(t => t.is_completed).length;
    return Math.round((done / group.length) * 100);
  }

  // --- Group actions ---
  openAddGroup(): void { this.newGroupName = ''; this.showAddGroupModal = true; }
  closeAddGroup(): void { this.showAddGroupModal = false; }

  createGroup(): void {
    if (!this.newGroupName.trim() || !this.currentBoard) return;
    const order = this.statuses.length + 1;
    this.boardService.createStatus({ board: this.currentBoard.id, name: this.newGroupName.trim(), order }).subscribe(s => {
      this.statuses.push(s);
      this.closeAddGroup();
    });
  }

  deleteGroup(statusId: number): void {
    if (!confirm('Delete this group and all its tasks?')) return;
    this.boardService.deleteStatus(statusId).subscribe(() => {
      this.statuses = this.statuses.filter(s => s.id !== statusId);
      this.tasks = this.tasks.filter(t => t.status !== statusId);
    });
  }

  // --- Task actions ---
  openAddTask(statusId: number): void {
    this.addTaskForStatusId = statusId;
    this.newTask = { title: '', priority: 'medium', start_date: '', due_date: '' };
    this.showAddTaskModal = true;
  }
  closeAddTask(): void { this.showAddTaskModal = false; }

  createTask(): void {
    if (!this.newTask.title.trim() || !this.currentBoard || !this.addTaskForStatusId) return;
    const payload: Partial<Task> = {
      title: this.newTask.title.trim(),
      board: this.currentBoard.id,
      status: this.addTaskForStatusId,
      start_date: this.newTask.start_date || null,
      due_date: this.newTask.due_date || null,
      is_completed: false,
      subtasks: []
    };
    this.taskService.createTask(payload).subscribe(task => {
      task.subtasks = [];
      this.tasks.push(task);
      this.closeAddTask();
    });
  }

  toggleTask(task: Task): void {
    const updated = !task.is_completed;
    this.taskService.updateTask(task.id, { is_completed: updated }).subscribe(() => {
      task.is_completed = updated;
    });
  }

  deleteTask(taskId: number): void {
    this.taskService.deleteTask(taskId).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
    });
  }

  // --- Subtask actions ---
  addSubtask(task: Task, title: string): void {
    if (!title.trim()) return;
    this.taskService.createSubtask({ task: task.id, title: title.trim() }).subscribe(sub => {
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push(sub);
    });
  }

  toggleSubtask(sub: Subtask): void {
    this.taskService.updateSubtask(sub.id, { is_completed: !sub.is_completed }).subscribe(() => {
      sub.is_completed = !sub.is_completed;
    });
  }

  deleteSubtask(task: Task, subId: number): void {
    this.taskService.deleteSubtask(subId).subscribe(() => {
      if (task.subtasks) task.subtasks = task.subtasks.filter(s => s.id !== subId);
    });
  }

  // --- Board Settings ---
  openSettings(): void {
    if (!this.currentBoard) return;
    this.editBoardTitle = this.currentBoard.title;
    this.editBoardDescription = this.currentBoard.description;
    this.editBoardPublic = this.currentBoard.is_public;
    this.inviteUsername = '';
    this.inviteError = '';
    this.inviteSuccess = '';
    this.settingsTab = 'general';
    this.showSettingsModal = true;
  }
  closeSettings(): void { this.showSettingsModal = false; }

  saveSettings(): void {
    if (!this.currentBoard) return;
    this.boardService.updateBoard(this.currentBoard.id, {
      title: this.editBoardTitle,
      description: this.editBoardDescription,
      is_public: this.editBoardPublic
    }).subscribe(updated => {
      this.currentBoard = updated;
      this.boardService.selectBoard(updated);
      this.closeSettings();
    });
  }

  deleteBoard(): void {
    if (!this.currentBoard) return;
    if (!confirm(`Delete "${this.currentBoard.title}"? This cannot be undone.`)) return;
    this.boardService.deleteBoard(this.currentBoard.id).subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  inviteMember(): void {
    if (!this.inviteUsername.trim() || !this.currentBoard) return;
    this.inviteError = '';
    this.inviteSuccess = '';
    this.boardService.addMember(this.currentBoard.id, this.inviteUsername.trim()).subscribe({
      next: () => { this.inviteSuccess = `✅ ${this.inviteUsername} added!`; this.inviteUsername = ''; },
      error: () => { this.inviteError = '❌ User not found or already a member.'; }
    });
  }

  goToDashboard(): void { this.router.navigate(['/dashboard']); }

  priorityColor(p: string | undefined): string {
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    return '#3b82f6';
  }
}