import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BoardService } from '../../services/board.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { TaskStatus, TaskPriority, TaskType, BoardRole, BoardMembership } from '../../models/board.model';
import { environment } from "../../../environments/environment";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-board-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  templateUrl: './board-settings.html'
})
export class BoardSettingsComponent implements OnInit {
  public imageBaseUrl = environment.imageBaseUrl;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  currentUser: any = null;
  userPermissions: any = null;
  boardId!: number;
  board: any;
  loading = true;

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
  newType: Partial<TaskType> = { name: '', icon_name: 'fa-solid fa-tag' };
  newRole: Partial<BoardRole> = {
    name: '',
    can_manage_board: false,
    can_manage_members: false,
    can_manage_sprints: false,
    can_create_tasks: true,
    can_edit_tasks: true,
    can_delete_tasks: false
  };

  readonly availableIcons = [
    { id: 'fa-solid fa-bug', name: 'Bug' },
    { id: 'fa-solid fa-list-check', name: 'Task' },
    { id: 'fa-solid fa-book-open', name: 'Story' },
    { id: 'fa-solid fa-bolt', name: 'Epic' },
    { id: 'fa-solid fa-tag', name: 'Tag' },
    { id: 'fa-solid fa-star', name: 'Feature' },
    { id: 'fa-solid fa-triangle-exclamation', name: 'Warning' },
    { id: 'fa-solid fa-bookmark', name: 'Bookmark' },
    { id: 'fa-solid fa-code', name: 'Code' },
    { id: 'fa-solid fa-palette', name: 'Design' }
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.boardId = +params['id'];
      this.loadData();
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      board: this.boardService.getBoard(this.boardId),
      statuses: this.boardService.getStatuses(this.boardId),
      priorities: this.boardService.getPriorities(this.boardId),
      types: this.boardService.getTaskTypes(this.boardId),
      roles: this.boardService.getRoles(this.boardId),
      memberships: this.boardService.getMemberships(this.boardId)
    }).pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
    ).subscribe({
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

        const invitable = this.invitableRoles;
        if (invitable.length > 0 && !invitable.some(r => r.name === this.inviteRole)) {
          this.inviteRole = invitable[0].name;
        }

        const myMembership = this.memberships.find(m => m.user === this.currentUser?.id);
        if (myMembership) {
          this.userPermissions = this.roles.find(r => r.id === myMembership.role);
        }
      }
    });
  }

  can(permission: keyof BoardRole): boolean {
    if (this.board?.owner === this.currentUser?.id?.toString()) {
      return true;
    }
    return this.userPermissions ? !!this.userPermissions[permission] : false;
  }

  updateBoard(): void {
    if (!this.editData.name.trim()) return;
    this.boardService.updateBoard(this.boardId, this.editData).subscribe({
      next: () => {
        this.toastService.show('Board settings updated', 'success');
        this.loadData();
      },
      error: () => this.toastService.show('Error updating board', 'error')
    });
  }

  get invitableRoles(): BoardRole[] {
    const perms: (keyof BoardRole)[] = ['can_manage_board', 'can_manage_members', 'can_manage_sprints', 'can_create_tasks', 'can_edit_tasks', 'can_delete_tasks'];
    return this.roles.filter(role =>
        perms.every(p => !role[p] || this.can(p))
    );
  }

  inviteMember(): void {
    if (!this.inviteEmail.trim()) return;
    const email = this.inviteEmail.trim().toLowerCase();

    if (this.currentUser?.email?.toLowerCase() === email) {
      this.toastService.show('You cannot invite yourself', 'error');
      return;
    }

    const alreadyMember = this.memberships.some(m => m.user_email?.toLowerCase() === email);
    if (alreadyMember) {
      this.toastService.show('This user is already a member', 'error');
      return;
    }

    this.boardService.inviteMember(this.boardId, this.inviteEmail, this.inviteRole).subscribe({
      next: () => {
        this.toastService.show('Invitation sent', 'success');
        this.inviteEmail = '';
        this.loadData();
      },
      error: () => this.toastService.show('Failed to send invitation', 'error')
    });
  }

  removeMember(userId: number): void {
    this.confirmService.requestConfirm('Are you sure you want to remove this member?', () => {
      this.boardService.removeMember(this.boardId, userId).subscribe({
        next: () => {
          this.toastService.show('Member removed', 'success');
          this.loadData();
        },
        error: () => this.toastService.show('Error removing member', 'error')
      });
    });
  }

  transferOwnership(userId: number): void {
    this.confirmService.requestConfirm('Transfer ownership to this user?', () => {
      this.boardService.transferOwnership(this.boardId, userId).subscribe({
        next: () => {
          this.toastService.show('Ownership transfer initiated', 'success');
          this.loadData();
        },
        error: () => this.toastService.show('Error transferring ownership', 'error')
      });
    });
  }

  leaveBoard(): void {
    this.confirmService.requestConfirm('Are you sure you want to leave this board?', () => {
      this.boardService.leaveBoard(this.boardId).subscribe({
        next: () => {
          this.toastService.show('You left the board', 'success');
          this.router.navigate(['/']);
        },
        error: () => this.toastService.show('Error leaving board', 'error')
      });
    });
  }

  deleteBoard(): void {
    this.confirmService.requestConfirm('Permanently delete the board?', () => {
      this.boardService.deleteBoard(this.boardId).subscribe({
        next: () => {
          this.toastService.show('Board deleted', 'success');
          this.router.navigate(['/']);
        },
        error: () => this.toastService.show('Error deleting board', 'error')
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
      actions[type]().subscribe({
        next: () => {
          this.toastService.show('Deleted successfully', 'success');
          this.loadData();
        },
        error: () => {
          this.toastService.show('Error deleting item', 'error');
        }
      });
    }
  }

  saveEdit(type: string): void {
    const id = this.editBuffer.id;
    const payload = { ...this.editBuffer };
    this.editingId = null;

    const actions: Record<string, () => any> = {
      status: () => this.boardService.updateStatus(id, payload),
      priority: () => this.boardService.updatePriority(id, payload),
      type: () => this.boardService.updateTaskType(id, payload),
      role: () => this.boardService.updateRole(id, payload)
    };

    if (actions[type]) {
      actions[type]().subscribe({
        next: () => {
          this.toastService.show('Changes saved', 'success');
          this.loadData();
        },
        error: () => {
          this.toastService.show('Error saving changes', 'error');
          this.loadData();
        }
      });
    }
  }

  addStatus(): void {
    if (!this.newStatus.name) return;
    this.boardService.createStatus({ ...this.newStatus, board: this.boardId }).subscribe({
      next: () => {
        this.toastService.show('Status added', 'success');
        this.newStatus = { name: '', order: 0 };
        this.loadData();
      },
      error: () => this.toastService.show('Error adding status', 'error')
    });
  }

  addPriority(): void {
    if (!this.newPriority.name) return;
    this.boardService.createPriority({ ...this.newPriority, board: this.boardId }).subscribe({
      next: () => {
        this.toastService.show('Priority added', 'success');
        this.newPriority = { name: '', color_hex: '#808080', level: 0 };
        this.loadData();
      },
      error: () => this.toastService.show('Error adding priority', 'error')
    });
  }

  addType(): void {
    if (!this.newType.name) return;
    this.boardService.createTaskType({ ...this.newType, board: this.boardId }).subscribe({
      next: () => {
        this.toastService.show('Task type added', 'success');
        this.newType = { name: '', icon_name: 'fa-solid fa-tag' };
        this.loadData();
      },
      error: () => this.toastService.show('Error adding task type', 'error')
    });
  }

  addRole(): void {
    if (!this.newRole.name) return;
    this.boardService.createRole({ ...this.newRole, board: this.boardId }).subscribe({
      next: () => {
        this.toastService.show('Role added', 'success');
        this.newRole = {
          name: '',
          can_manage_board: false,
          can_manage_members: false,
          can_manage_sprints: false,
          can_create_tasks: true,
          can_edit_tasks: true,
          can_delete_tasks: false
        };
        this.loadData();
      },
      error: () => this.toastService.show('Error adding role', 'error')
    });
  }

  assignRole(membership: any, roleId: number): void {
    if (this.currentUser && membership.user.id === this.currentUser.id) {
      this.confirmService.requestConfirm('You cannot change your own role', () => {});
      return;
    }

    this.boardService.updateMembership(membership.id, { role: roleId }).subscribe({
      next: () => {
        this.toastService.show('Role updated', 'success');
        this.loadData();
      },
      error: () => this.toastService.show('Error updating role', 'error')
    });
  }

  get isOwner(): boolean {
    return this.board?.owner === this.currentUser?.username?.toString();
  }
}``