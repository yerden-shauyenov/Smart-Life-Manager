import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BoardService } from '../../services/board.service';
import { ConfirmService } from '../../services/confirm.service';
import { TaskStatus, TaskPriority, TaskType, BoardRole, BoardMembership } from '../../models/board.model';

@Component({
  selector: 'app-board-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './board-settings.html'
})
export class BoardSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private confirmService = inject(ConfirmService);
  private cdr = inject(ChangeDetectorRef);

  boardId!: number;
  board: any;

  statuses: TaskStatus[] = [];
  priorities: TaskPriority[] = [];
  types: TaskType[] = [];
  roles: BoardRole[] = [];
  memberships: BoardMembership[] = [];

  editingId: string | null = null;
  editBuffer: any = {};

  editData = { name: '', description: '' };
  inviteEmail = '';
  inviteRole = 'member';

  newStatus: Partial<TaskStatus> = { name: '', order: 0 };
  newPriority: Partial<TaskPriority> = { name: '', color_hex: '#808080', level: 0 };
  newType: Partial<TaskType> = { name: '', icon_name: '' };
  newRole: Partial<BoardRole> = {
    name: '',
    can_manage_board: false,
    can_manage_members: false,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: false
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.boardId = Number(id);
      this.loadData();
    }

    this.route.paramMap.subscribe(params => {
      const newId = Number(params.get('id'));
      if (newId && newId !== this.boardId) {
        this.boardId = newId;
        this.loadData();
      }
    });
  }

  loadData(): void {
    forkJoin({
      board: this.boardService.getBoard(this.boardId),
      statuses: this.boardService.getStatuses(this.boardId),
      priorities: this.boardService.getPriorities(this.boardId),
      types: this.boardService.getTaskTypes(this.boardId),
      roles: this.boardService.getRoles(this.boardId),
      memberships: this.boardService.getMemberships(this.boardId)
    }).subscribe({
      next: (res) => {
        this.board = res.board;
        this.editData.name = res.board.title;
        this.editData.description = res.board.description;
        this.statuses = res.statuses;
        this.priorities = res.priorities;
        this.types = res.types;
        this.roles = res.roles;
        this.memberships = res.memberships;

        if (this.roles.length > 0 && (!this.inviteRole || this.inviteRole === 'member')) {
          const defaultRole = this.roles.find(r => r.name === 'Developer') || this.roles[0];
          this.inviteRole = defaultRole.name;
        }

        this.cdr.detectChanges();
      }
    });
  }

  updateBoard(): void {
    if (!this.editData.name.trim()) return;
    this.boardService.updateBoard(this.boardId, this.editData).subscribe(() => {
      this.loadData();
    });
  }

  inviteMember(): void {
    if (!this.inviteEmail.trim()) return;
    this.boardService.inviteMember(this.boardId, this.inviteEmail, this.inviteRole).subscribe(() => {
      this.inviteEmail = '';
      this.loadData();
    });
  }

  removeMember(userId: number): void {
    this.confirmService.requestConfirm('Are you sure you want to remove this member from the board?', () => {
      this.boardService.removeMember(this.boardId, userId).subscribe(() => {
        this.loadData();
      });
    });
  }

  transferOwnership(userId: number): void {
    this.confirmService.requestConfirm('Are you sure you want to transfer ownership to this user? They will need to accept the transfer.', () => {
      this.boardService.transferOwnership(this.boardId, userId).subscribe(() => {
        this.loadData();
      });
    });
  }

  leaveBoard(): void {
    this.confirmService.requestConfirm('Are you absolutely sure you want to leave this board?', () => {
      this.boardService.leaveBoard(this.boardId).subscribe(() => {
        this.router.navigate(['/']);
      });
    });
  }

  deleteBoard(): void {
    this.confirmService.requestConfirm('Warning! This will permanently delete the board and all its tasks. Continue?', () => {
      this.boardService.deleteBoard(this.boardId).subscribe(() => {
        this.router.navigate(['/']);
      });
    });
  }

  startEdit(type: string, item: any): void {
    this.editingId = `${type}-${item.id}`;
    this.editBuffer = { ...item };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  deleteItem(type: string, id: number): void {
    const actions: Record<string, () => any> = {
      status: () => this.boardService.deleteStatus(id),
      priority: () => this.boardService.deletePriority(id),
      type: () => this.boardService.deleteTaskType(id),
      role: () => this.boardService.deleteRole(id),
      membership: () => this.boardService.deleteMembership(id)
    };

    if (actions[type]) {
      actions[type]().subscribe(() => this.loadData());
    }
  }

  saveEdit(type: string): void {
    const id = this.editBuffer.id;
    const actions: Record<string, () => any> = {
      status: () => this.boardService.updateStatus(id, this.editBuffer),
      priority: () => this.boardService.updatePriority(id, this.editBuffer),
      type: () => this.boardService.updateTaskType(id, this.editBuffer),
      role: () => this.boardService.updateRole(id, this.editBuffer)
    };

    if (actions[type]) {
      actions[type]().subscribe(() => {
        this.editingId = null;
        this.loadData();
      });
    }
  }

  addStatus(): void {
    if (!this.newStatus.name) return;
    this.boardService.createStatus({ ...this.newStatus, board: this.boardId }).subscribe(() => {
      this.newStatus = { name: '', order: 0 };
      this.loadData();
    });
  }

  addPriority(): void {
    if (!this.newPriority.name) return;
    this.boardService.createPriority({ ...this.newPriority, board: this.boardId }).subscribe(() => {
      this.newPriority = { name: '', color_hex: '#808080', level: 0 };
      this.loadData();
    });
  }

  addType(): void {
    if (!this.newType.name) return;
    this.boardService.createTaskType({ ...this.newType, board: this.boardId }).subscribe(() => {
      this.newType = { name: '', icon_name: '' };
      this.loadData();
    });
  }

  addRole(): void {
    if (!this.newRole.name) return;
    this.boardService.createRole({ ...this.newRole, board: this.boardId }).subscribe(() => {
      this.newRole = {
        name: '',
        can_manage_board: false,
        can_manage_members: false,
        can_create_tasks: true,
        can_edit_tasks: true,
        can_delete_tasks: false
      };
      this.loadData();
    });
  }

  assignRole(membership: any, roleId: number): void {
    this.boardService.updateMembership(membership.id, { role: roleId }).subscribe(() => {
      this.loadData();
    });
  }
}