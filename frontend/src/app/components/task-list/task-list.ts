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
import { Board, TaskStatus, TaskPriority, Sprint, TaskType, BoardMembership, BoardRole } from '../../models/board.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import {environment} from "../../../environments/environment";
import {User} from "../../models/user.model";

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownPipe],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, OnDestroy {
  public imageBaseUrl = environment.imageBaseUrl;

  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentBoard: Board | null = null;
  currentUsername = '';
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];
  priorities: TaskPriority[] = [];
  sprints: Sprint[] = [];
  taskTypes: TaskType[] = [];
  members: BoardMembership[] = [];
  loading = false;

  showTaskModal = false;
  isEditMode = false;
  selectedTask: Partial<Task> = {};
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
  searchTerm: string = '';
  selectedPriority: number | null = null;
  selectedSprint: number | null = null;
  filterAssignee: string = '';
  currentUser: User | null = null;
  roles: BoardRole[] = [];
  userPermissions: BoardRole | null = null;

  ngOnInit(): void {
    this.currentUsername = this.authService.getUsername() || "null";

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const boardId = +params['id'];
      const taskId = params['taskId'] ? +params['taskId'] : null;
      if (boardId) {
        this.loadBoardAndData(boardId, taskId);
      }
    });
  }

  getUserAvatar(avatarPath: string | null | undefined): string {
    if (!avatarPath) {
      return 'assets/default-avatar.png';
    }
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    const base = this.imageBaseUrl.replace(/\/$/, '');
    const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
    return `${base}${path}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBoardAndData(boardId: number, taskId: number | null): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.boardService.getBoard(boardId).pipe(
        take(1),
        switchMap(board => {
          this.currentBoard = board;
          this.boardService.selectBoard(board);
          return forkJoin({
            statuses: this.boardService.getStatuses(boardId).pipe(catchError(() => of([]))),
            priorities: this.boardService.getPriorities(boardId).pipe(catchError(() => of([]))),
            tasks: this.taskService.getTasks().pipe(catchError(() => of([]))),
            sprints: this.boardService.getSprints(boardId).pipe(catchError(() => of([]))),
            taskTypes: this.boardService.getTaskTypes(boardId).pipe(catchError(() => of([]))),
            members: this.boardService.getMemberships(boardId).pipe(catchError(() => of([]))),
            roles: this.boardService.getRoles(boardId),
            user: this.authService.currentUser$
          });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
    ).subscribe(res => {
      this.statuses = (res.statuses as TaskStatus[]).sort((a, b) => a.order - b.order);
      this.priorities = (res.priorities as TaskPriority[]).sort((a, b) => b.level - a.level);
      this.tasks = (res.tasks as Task[]).filter(t => t.board === boardId);
      this.sprints = res.sprints as Sprint[];
      this.taskTypes = res.taskTypes as TaskType[];
      this.members = res.members as BoardMembership[];
      this.roles = res.roles;
      this.currentUser = res.user;

      if (taskId) {
        const taskToOpen = this.tasks.find(t => t.id === taskId);
        if (taskToOpen) {
          this.openEditTask(taskToOpen);
        } else {
          this.taskService.getTask(taskId).subscribe(t => this.openEditTask(t));
        }
      }

      const myMembership = this.members.find(m => m.user === this.currentUser?.id);
      if (myMembership) {
          this.userPermissions = this.roles.find(r => r.id === myMembership.role) || null;
      }
    });
  }

  can(permission: keyof BoardRole): boolean {
    if (this.currentBoard?.owner === this.currentUser?.id?.toString()) {
        return true;
    }
    return this.userPermissions ? !!this.userPermissions[permission] : false;
  }

  private loadBoardData(boardId: number): void {
    this.loading = true;
    this.cdr.detectChanges();

    forkJoin({
      statuses: this.boardService.getStatuses(boardId).pipe(catchError(() => of([]))),
      priorities: this.boardService.getPriorities(boardId).pipe(catchError(() => of([]))),
      tasks: this.taskService.getTasks().pipe(catchError(() => of([]))),
      sprints: this.boardService.getSprints(boardId).pipe(catchError(() => of([]))),
      taskTypes: this.boardService.getTaskTypes(boardId).pipe(catchError(() => of([]))),
      members: this.boardService.getMemberships(boardId).pipe(catchError(() => of([])))
    }).pipe(
        take(1),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
    ).subscribe(res => {
      this.statuses = (res.statuses as TaskStatus[]).sort((a, b) => a.order - b.order);
      this.priorities = (res.priorities as TaskPriority[]).sort((a, b) => b.level - a.level);
      this.tasks = (res.tasks as Task[]).filter(t => t.board === boardId);
      this.sprints = res.sprints as Sprint[];
      this.taskTypes = res.taskTypes as TaskType[];
      this.members = res.members as BoardMembership[];
    });
  }

  getTasksByStatus(statusId: number): Task[] {
    return this.tasks.filter(t => t.status === statusId);
  }

  get allFilteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesPriority = this.selectedPriority ? task.priority === this.selectedPriority : true;
      const matchesSprint = this.selectedSprint ? task.sprint === this.selectedSprint : true;
      const matchesAssignee = this.filterAssignee ? task.assignee_username === this.filterAssignee : true;
      return matchesSearch && matchesPriority && matchesSprint && matchesAssignee;
    });
  }

  getFilteredTasks(statusId: number): Task[] {
    return this.allFilteredTasks.filter(task => task.status === statusId);
  }

  get currentGroups(): any[] {
    if (this.selectedGroupBy === 'priority') return this.priorities;
    if (this.selectedGroupBy === 'task_type') return this.taskTypes;
    return this.statuses;
  }

  getTasksForGroup(groupId: number): Task[] {
    const filtered = this.allFilteredTasks;
    if (this.selectedGroupBy === 'priority') {
      return filtered.filter(t => t.priority === groupId);
    }
    if (this.selectedGroupBy === 'task_type') {
      return filtered.filter(t => t.task_type === groupId);
    }
    return filtered.filter(t => t.status === groupId);
  }

  getPriorityName(id: number | null): string {
    return this.priorities.find(p => p.id === id)?.name || 'No Priority';
  }

  getTypeName(id: number | null): string {
    return this.taskTypes.find(t => t.id === id)?.name || 'No Type';
  }

  setViewMode(mode: 'groups' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedPriority = null;
    this.selectedSprint = null;
    this.filterAssignee = '';
    this.cdr.detectChanges();
  }

  getPriority(priorityId: number | null): TaskPriority | null {
    return this.priorities.find(p => p.id === priorityId) ?? null;
  }

  canDeleteComment(comment: Comment): boolean {
    if (comment.id === -1) return false;
    const isAuthor = comment.author_username === this.currentUsername;
    const isBoardOwner = this.currentBoard?.owner === this.currentUsername;
    return isAuthor || isBoardOwner;
  }

  openCreateTask(statusId: number): void {
    this.isEditMode = false;
    this.descMode = 'edit';
    this.selectedTask = {
      title: '',
      description: '',
      status: statusId,
      board: this.currentBoard?.id,
      priority: this.priorities.length > 0 ? this.priorities[this.priorities.length - 1].id : null,
      task_type: this.taskTypes.length > 0 ? this.taskTypes[0].id : null,
      sprint: null,
      assignee: null,
      is_completed: false,
      due_date: null
    };
    this.taskComments = [];
    this.commentError = '';
    this.newCommentText = '';
    this.showTaskModal = true;
    this.cdr.detectChanges();
  }

  openEditTask(task: Task): void {
    this.isEditMode = true;
    this.descMode = 'edit';
    this.commentMode = 'edit';
    this.selectedTask = { ...task };
    this.taskComments = [];
    this.commentError = '';
    this.newCommentText = '';
    this.loadComments(task.id);
    this.showTaskModal = true;
    this.router.navigate(['/boards', this.currentBoard?.id, 'tasks', task.id]);
    this.cdr.detectChanges();
  }

  private loadComments(taskId: number): void {
    this.commentLoading = true;
    this.cdr.detectChanges();
    this.taskService.getComments(taskId).pipe(take(1)).subscribe({
      next: (comments) => {
        this.taskComments = [...comments].reverse();
        this.commentLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.commentLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveTask(): void {
    if (!this.selectedTask.title?.trim() || !this.currentBoard) return;

    const payload: Partial<Task> = {
      ...this.selectedTask,
      title: this.selectedTask.title.trim(),
      description: this.selectedTask.description?.trim() || '',
      board: this.currentBoard.id,
      priority: this.selectedTask.priority || null,
      task_type: this.selectedTask.task_type || null,
      sprint: this.selectedTask.sprint || null,
      assignee: this.selectedTask.assignee || null,
      due_date: this.selectedTask.due_date || null
    };

    const request = (this.isEditMode && this.selectedTask.id)
        ? this.taskService.updateTask(this.selectedTask.id, payload)
        : this.taskService.createTask(payload);

    request.pipe(take(1)).subscribe({
      next: res => {
        if (this.isEditMode) {
          this.tasks = this.tasks.map(t => t.id === res.id ? res : t);
        } else {
          this.tasks = [...this.tasks, res];
        }
        this.closeTaskModal();
      },
      error: err => console.error('Save Task Error:', err)
    });
  }

  addComment(): void {
    const text = this.newCommentText.trim();
    if (!text || !this.selectedTask.id) return;

    this.commentError = '';
    const optimisticComment: Comment = {
      id: -1,
      task: this.selectedTask.id,
      author: 0,
      author_username: this.currentUsername,
      author_avatar: this.currentUsername,
      text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.taskComments = [...this.taskComments, optimisticComment];
    this.newCommentText = '';
    this.commentMode = 'edit';
    this.cdr.detectChanges();

    this.taskService.addComment({ task: this.selectedTask.id, text }).pipe(take(1)).subscribe({
      next: (comment) => {
        this.taskComments = this.taskComments.map(c => c.id === -1 ? comment : c);
        this.cdr.detectChanges();
      },
      error: () => {
        this.taskComments = this.taskComments.filter(c => c.id !== -1);
        this.newCommentText = text;
        this.commentError = 'Failed to post comment. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteComment(comment: Comment, event: MouseEvent): void {
    event.stopPropagation();
    this.taskComments = this.taskComments.filter(c => c.id !== comment.id);
    this.cdr.detectChanges();

    this.taskService.deleteComment(comment.id).pipe(take(1)).subscribe({
      error: () => {
        this.taskComments = [...this.taskComments, comment].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        this.commentError = 'Failed to delete comment.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleTaskStatus(task: Task, event: MouseEvent): void {
    event.stopPropagation();
    const newVal = !task.is_completed;
    this.taskService.updateTask(task.id, { is_completed: newVal }).pipe(take(1)).subscribe(res => {
      this.tasks = this.tasks.map(t => t.id === res.id ? res : t);
      this.cdr.detectChanges();
    });
  }

  deleteTask(taskId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm('Delete task?')) return;
    this.taskService.deleteTask(taskId).pipe(take(1)).subscribe(() => {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.closeTaskModal();
    });
  }

  openTaskModal(task: Task): void {
    this.selectedTask = { ...task };
    this.isEditMode = true;
    this.descMode = 'edit';
    this.commentMode = 'edit';
    this.showTaskModal = true;

    this.taskService.getComments(task.id).pipe(take(1)).subscribe(comments => {
      this.taskComments = comments;
      this.cdr.detectChanges();
    });

    this.cdr.detectChanges();
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = {};
    this.newCommentText = '';
    this.commentError = '';
    this.taskComments = [];
    this.descMode = 'edit';
    this.commentMode = 'edit';
    this.router.navigate(['/boards', this.currentBoard?.id]);
    this.cdr.detectChanges();
  }

  openAddGroup(): void {
    this.newGroupName = '';
    this.showAddGroupModal = true;
    this.cdr.detectChanges();
  }

  closeAddGroup(): void {
    this.showAddGroupModal = false;
    this.cdr.detectChanges();
  }

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

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  applyMarkdown(target: 'description' | 'comment', prefix: string, suffix: string) {
    const elementId = target === 'description' ? 'descTextarea' : 'commentTextarea';
    const textarea = document.getElementById(elementId) as HTMLTextAreaElement;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value || '';

    const before = text.substring(0, start);
    const selected = text.substring(start, end) || (prefix === '- [ ] ' ? 'task' : 'text');
    const after = text.substring(end);

    const result = before + prefix + selected + suffix + after;

    if (target === 'description') {
      this.selectedTask.description = result;
    } else {
      this.newCommentText = result;
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  }
}