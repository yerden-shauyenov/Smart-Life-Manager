import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, take, catchError, finalize, switchMap } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { Task, Comment } from '../../models/task.model';
import { Board, TaskStatus, TaskPriority, Sprint, TaskType, BoardMembership } from '../../models/board.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentBoard: Board | null = null;
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

  showAddGroupModal = false;
  newGroupName = '';

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const boardId = +params['id'];
      const taskId = params['taskId'] ? +params['taskId'] : null;

      if (boardId) {
        this.loadBoardAndData(boardId, taskId);
      }
    });
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
            types: this.boardService.getTaskTypes(boardId).pipe(catchError(() => of([]))),
            members: this.boardService.getMemberships(boardId).pipe(catchError(() => of([])))
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
      this.taskTypes = res.types as TaskType[];
      this.members = res.members as BoardMembership[];

      if (taskId) {
        const taskToOpen = this.tasks.find(t => t.id === taskId);
        if (taskToOpen) {
          this.openEditTask(taskToOpen);
        } else {
          this.taskService.getTask(taskId).subscribe(t => this.openEditTask(t));
        }
      }
    });
  }

  private loadBoardData(boardId: number): void {
    this.loading = true;
    this.cdr.detectChanges();

    forkJoin({
      statuses: this.boardService.getStatuses(boardId).pipe(catchError(() => of([]))),
      priorities: this.boardService.getPriorities(boardId).pipe(catchError(() => of([]))),
      tasks: this.taskService.getTasks().pipe(catchError(() => of([]))),
      sprints: this.boardService.getSprints(boardId).pipe(catchError(() => of([]))),
      types: this.boardService.getTaskTypes(boardId).pipe(catchError(() => of([]))),
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
      this.taskTypes = res.types as TaskType[];
      this.members = res.members as BoardMembership[];
    });
  }

  getTasksByStatus(statusId: number): Task[] {
    return this.tasks.filter(t => t.status === statusId);
  }

  getPriority(priorityId: number | null): TaskPriority | null {
    return this.priorities.find(p => p.id === priorityId) ?? null;
  }

  openCreateTask(statusId: number): void {
    this.isEditMode = false;
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
    this.showTaskModal = true;
    this.cdr.detectChanges();
  }

  openEditTask(task: Task): void {
    this.isEditMode = true;
    this.selectedTask = { ...task };
    this.taskComments = [];
    this.loadComments(task.id);
    this.showTaskModal = true;
    this.router.navigate(['/boards', this.currentBoard?.id, 'tasks', task.id]);
    this.cdr.detectChanges();
  }

  private loadComments(taskId: number): void {
    this.taskService.getComments(taskId).pipe(take(1)).subscribe(c => {
      this.taskComments = c;
      this.cdr.detectChanges();
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
    if (!this.newCommentText.trim() || !this.selectedTask.id) return;
    this.taskService.addComment({
      task: this.selectedTask.id,
      text: this.newCommentText.trim()
    }).pipe(take(1)).subscribe(comment => {
      this.taskComments = [comment, ...this.taskComments];
      this.newCommentText = '';
      this.cdr.detectChanges();
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

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = {};
    this.newCommentText = '';
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
}