import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';
import { Sprint, Board, BoardRole, BoardMembership } from '../../models/board.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backlog.html'
})
export class BacklogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  boardId!: number;
  board: Board | null = null;
  sprints: any[] = [];
  backlogTasks: any[] = [];

  currentUser: any = null;
  userPermissions: any = null;
  roles: BoardRole[] = [];
  memberships: BoardMembership[] = [];

  showCreateSprint = false;
  newSprint: Partial<Sprint> = { name: '', goal: '', start_date: '', end_date: '' };

  editingSprintId: number | null = null;
  editSprintBuffer: Partial<Sprint> = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.boardId = Number(params.get('id'));
      this.loadData();
    });
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
  }

  loadData(): void {
    forkJoin({
      board: this.boardService.getBoard(this.boardId),
      sprints: this.boardService.getSprints(this.boardId),
      tasks: this.boardService.getTasks(this.boardId, 'none'),
      roles: this.boardService.getRoles(this.boardId),
      memberships: this.boardService.getMemberships(this.boardId)
    }).subscribe({
      next: (res) => {
        this.board = res.board;
        this.backlogTasks = res.tasks;
        this.roles = res.roles;
        this.memberships = res.memberships;

        const myMembership = this.memberships.find(m => m.user === this.currentUser?.id);
        if (myMembership) {
          this.userPermissions = this.roles.find(r => r.id === myMembership.role);
        }

        this.sprints = res.sprints.map((s: any) => ({ ...s, tasks: [] }));

        let loadedSprints = 0;
        if (this.sprints.length === 0) {
          this.cdr.detectChanges();
        } else {
          this.sprints.forEach(sprint => {
            this.boardService.getTasks(this.boardId, sprint.id).subscribe(tasks => {
              sprint.tasks = tasks;
              loadedSprints++;
              if (loadedSprints === this.sprints.length) {
                this.cdr.detectChanges();
              }
            });
          });
        }
      }
    });
  }

  get canManageSprints(): boolean {
    if (this.board?.owner === this.currentUser?.username?.toString() || this.board?.owner === this.currentUser?.id?.toString()) {
      return true;
    }
    return this.userPermissions ? (!!this.userPermissions.can_manage_sprints || !!this.userPermissions.can_manage_board) : false;
  }

  createSprint(): void {
    if (!this.newSprint.name) return;

    const payload: any = { ...this.newSprint, board: this.boardId };
    if (!payload.start_date) payload.start_date = null;
    if (!payload.end_date) payload.end_date = null;

    this.boardService.createSprint(payload).subscribe(() => {
      this.newSprint = { name: '', goal: '', start_date: '', end_date: '' };
      this.showCreateSprint = false;
      this.loadData();
    });
  }

  startEditSprint(sprint: Sprint): void {
    this.editingSprintId = sprint.id;
    this.editSprintBuffer = {
      name: sprint.name,
      goal: sprint.goal,
      start_date: sprint.start_date ? sprint.start_date.substring(0, 16) : '',
      end_date: sprint.end_date ? sprint.end_date.substring(0, 16) : ''
    };
  }

  cancelEditSprint(): void {
    this.editingSprintId = null;
    this.editSprintBuffer = {};
  }

  saveSprint(sprintId: number): void {
    const payload: any = { ...this.editSprintBuffer };
    if (!payload.start_date) payload.start_date = null;
    if (!payload.end_date) payload.end_date = null;

    this.boardService.updateSprint(sprintId, payload).subscribe(() => {
      this.editingSprintId = null;
      this.loadData();
    });
  }

  startSprint(sprint: Sprint): void {
    this.boardService.startSprint(sprint.id).subscribe(() => {
      this.loadData();
    });
  }

  pauseSprint(sprint: Sprint): void {
    this.boardService.pauseSprint(sprint.id).subscribe(() => {
      this.loadData();
    });
  }

  completeSprint(sprint: Sprint): void {
    this.boardService.completeSprint(sprint.id).subscribe(() => {
      this.loadData();
    });
  }

  moveTask(taskId: number, sprintId: string | null): void {
    const payload = { sprint: sprintId ? Number(sprintId) : null };
    this.boardService.updateTask(taskId, payload).subscribe(() => {
      this.loadData();
    });
  }
}