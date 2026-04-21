import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, take, catchError, finalize, switchMap } from 'rxjs/operators';

import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';

import { Task, Comment } from '../../models/task.model';
import { Board, TaskStatus, TaskPriority, Sprint, TaskType, BoardMembership } from '../../models/board.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownPipe],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  currentBoard: Board | null = null;
  currentUsername: string | null = '';

  statuses: TaskStatus[] = [];
  tasks: Task[] = [];
  priorities: TaskPriority[] = [];
  sprints: Sprint[] = [];
  taskTypes: TaskType[] = [];
  members: BoardMembership[] = [];

  loading = false;

  showTaskModal = false;
  isEditMode = false;
  selectedTask: any = {};
  taskComments: Comment[] = [];
  newCommentText = '';
  commentLoading = false;
  commentError = '';

  descMode: 'edit' | 'preview' = 'edit';
  commentMode: 'edit' | 'preview' = 'edit';

  selectedGroupBy: 'status' | 'priority' | 'task_type' = 'status';

  showAddGroupModal = false;
  newGroupName = '';

  viewMode: 'groups' | 'list' = 'groups';
  searchTerm = '';
  selectedPriority: number | null = null;
  selectedSprint: number | null = null;
  filterAssignee = '';

  ngOnInit(): void {
    this.currentUsername = this.authService.getUsername() ?? '';

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const boardId = +params['id'];
      const taskId = params['taskId'] ? +params['taskId'] : null;

      if (!this.currentBoard || this.currentBoard.id !== boardId) {
        this.loadBoard(boardId, taskId);
      }
      else if (taskId && !this.showTaskModal) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
          this.openEditTask(task);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getId(field: any): number | null {
    if (field === null || field === undefined) return null;
    return typeof field === 'object' ? field.id : field;
  }

  private loadBoard(boardId: number, taskId: number | null): void {
    this.loading = true;

    this.boardService.getBoard(boardId).pipe(
        take(1),
        switchMap(board => {
          this.currentBoard = board;
          if (this.boardService.selectBoard) this.boardService.selectBoard(board);

          return forkJoin({
            statuses: this.boardService.getStatuses(boardId).pipe(catchError(() => of([]))),
            priorities: this.boardService.getPriorities(boardId).pipe(catchError(() => of([]))),
            tasks: this.taskService.getTasks().pipe(catchError(() => of([]))),
            sprints: this.boardService.getSprints(boardId).pipe(catchError(() => of([]))),
            taskTypes: this.boardService.getTaskTypes(boardId).pipe(catchError(() => of([]))),
            members: this.boardService.getMemberships(boardId).pipe(catchError(() => of([])))
          });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
    ).subscribe(res => {
      this.statuses = (res.statuses as TaskStatus[]).sort((a, b) => (a.order || 0) - (b.order || 0));
      this.priorities = (res.priorities as TaskPriority[]).sort((a, b) => (b.level || 0) - (a.level || 0));
      this.sprints = res.sprints as Sprint[];
      this.taskTypes = res.taskTypes as TaskType[];
      this.members = res.members as BoardMembership[];

      this.tasks = (res.tasks as Task[]).filter(t => this.getId(t.board) === this.currentBoard?.id);

      if (taskId) {
        const taskToOpen = this.tasks.find(t => t.id === taskId);
        if (taskToOpen) this.openEditTask(taskToOpen);
      }
    });
  }

  get allFilteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const matchesSearch =
          task.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesPriority = this.selectedPriority
          ? this.getId(task.priority) === this.selectedPriority
          : true;

      const matchesSprint = this.selectedSprint
          ? this.getId(task.sprint) === this.selectedSprint
          : true;

      const matchesAssignee = this.filterAssignee
          ? task.assignee_username === this.filterAssignee
          : true;

      return matchesSearch && matchesPriority && matchesSprint && matchesAssignee;
    });
  }

  get currentGroups(): any[] {
    if (this.selectedGroupBy === 'priority') return this.priorities;
    if (this.selectedGroupBy === 'task_type') return this.taskTypes;
    return this.statuses;
  }

  getTasksForGroup(groupId: number): Task[] {
    const filtered = this.allFilteredTasks;
    if (this.selectedGroupBy === 'priority') {
      return filtered.filter(t => this.getId(t.priority) === groupId);
    }
    if (this.selectedGroupBy === 'task_type') {
      return filtered.filter(t => this.getId(t.task_type) === groupId);
    }
    return filtered.filter(t => this.getId(t.status) === groupId);
  }

  openCreateTask(statusId: number): void {
    this.isEditMode = false;
    this.selectedTask = {
      title: '',
      description: '',
      status: statusId,
      board: this.currentBoard?.id,
      priority: this.priorities.length > 0 ? this.priorities[this.priorities.length - 1].id : null,
      is_completed: false
    };
    this.taskComments = [];
    this.showTaskModal = true;
  }

  openEditTask(task: Task): void {
    this.isEditMode = true;
    this.selectedTask = { ...task };
    this.loadComments(task.id);
    this.showTaskModal = true;
  }

  openTaskModal(task: Task): void {
    this.openEditTask(task);
  }

  isSaving = false;

  saveTask(): void {
    if (!this.selectedTask.title?.trim() || this.isSaving) return;

    this.isSaving = true;

    const payload = {
      ...this.selectedTask,
      status: this.getId(this.selectedTask.status),
      priority: this.getId(this.selectedTask.priority),
      sprint: this.getId(this.selectedTask.sprint),
      task_type: this.getId(this.selectedTask.task_type),
      assignee: this.getId(this.selectedTask.assignee),
      board: this.currentBoard?.id
    };

    const req = this.isEditMode
        ? this.taskService.updateTask(this.selectedTask.id, payload)
        : this.taskService.createTask(payload);

    req.pipe(
        take(1),
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
    ).subscribe({
      next: res => {
        if (this.isEditMode) {
          this.tasks = this.tasks.map(t => t.id === res.id ? res : t);
        } else {
          this.tasks = [...this.tasks, res];
        }
        this.closeTaskModal();
      },
      error: err => {
        console.error('Save Task Error:', err);
      }
    });
  }

  deleteTask(id: number, e: MouseEvent): void {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    this.taskService.deleteTask(id).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.closeTaskModal();
    });
  }

  getTaskTypeIcon(typeId: any): string {
    const id = this.getId(typeId);
    if (!id) return 'fa-solid fa-tag';
    const type = this.taskTypes.find(t => t.id === id);
    return type?.icon_name || 'fa-solid fa-tag';
  }

  private loadComments(taskId: number): void {
    this.commentLoading = true;
    this.taskService.getComments(taskId).subscribe({
      next: (comments) => {
        this.taskComments = comments;
        this.commentLoading = false;
      },
      error: () => this.commentLoading = false
    });
  }

  addComment(): void {
    if (!this.newCommentText.trim()) return;

    this.taskService.addComment({
      task: this.selectedTask.id,
      text: this.newCommentText
    }).subscribe(c => {
      this.taskComments = [...this.taskComments, c];
      this.newCommentText = '';
    });
  }

  deleteComment(comment: Comment, e: MouseEvent): void {
    e.stopPropagation();
    this.taskService.deleteComment(comment.id).subscribe(() => {
      this.taskComments = this.taskComments.filter(c => c.id !== comment.id);
    });
  }

  canDeleteComment(comment: Comment): boolean {
    if (!comment || comment.id === -1) return false;
    const isAuthor = comment.author_username === this.currentUsername;
    return isAuthor;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = {};
  }

  setViewMode(mode: 'groups' | 'list') {
    this.viewMode = mode;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedPriority = null;
    this.selectedSprint = null;
    this.filterAssignee = '';
  }

  getPriority(id: any): TaskPriority | null {
    const pid = this.getId(id);
    return this.priorities.find(p => p.id === pid) || null;
  }

  getUserAvatar(url: string | null): string {
    return url || 'assets/default-avatar.png';
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  createGroup(): void {
    if (!this.newGroupName.trim()) return;
    this.boardService.createStatus({
      board: this.currentBoard?.id,
      name: this.newGroupName,
      order: this.statuses.length + 1
    }).subscribe(s => {
      this.statuses = [...this.statuses, s];
      this.closeAddGroup();
    });
  }

  openAddGroup() {
    this.newGroupName = '';
    this.showAddGroupModal = true;
  }

  closeAddGroup() {
    this.showAddGroupModal = false;
  }

  applyMarkdown(field: string, prefix: string, suffix: string) {
    const area = document.getElementById('descTextarea') as HTMLTextAreaElement;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = area.value;
    const selected = text.substring(start, end);
    this.selectedTask.description = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
  }
}