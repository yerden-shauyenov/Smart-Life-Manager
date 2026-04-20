import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ConfirmService } from '../../services/confirm.service';
import { User, UserSession, BoardInvitation, OwnershipTransfer } from '../../models/user.model';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  activeTab: 'general' | 'security' | 'sessions' | 'invitations' = 'general';

  user: User | null = null;
  sessions: UserSession[] = [];
  invitations: BoardInvitation[] = [];
  transfers: OwnershipTransfer[] = [];

  editData = { first_name: '', last_name: '' };
  passwordData = { old_password: '', new_password: '', confirm_password: '' };
  selectedFile: File | null = null;

  changePasswordError: string = '';
  changePasswordSuccess: string = '';

  constructor(
      private userService: UserService,
      private confirmService: ConfirmService,
      private boardService: BoardService,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadSessions();
    this.loadInvitations();
    this.loadTransfers();
  }

  loadProfile() {
    this.userService.getProfile().subscribe(res => {
      this.user = res;
      this.editData.first_name = res.first_name;
      this.editData.last_name = res.last_name;
      this.cdr.detectChanges();
    });
  }

  loadSessions() {
    this.userService.getSessions().subscribe(res => {
      this.sessions = res;
      this.cdr.detectChanges();
    });
  }

  loadInvitations() {
    this.userService.getInvitations().subscribe(res => {
      this.invitations = res;
      this.cdr.detectChanges();
    });
  }

  loadTransfers() {
    this.userService.getTransfers().subscribe(res => {
      this.transfers = res;
      this.cdr.detectChanges();
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  updateProfile() {
    const formData = new FormData();
    formData.append('first_name', this.editData.first_name);
    formData.append('last_name', this.editData.last_name);
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.userService.updateProfile(formData).subscribe(() => {
      this.loadProfile();
      this.selectedFile = null;
      this.cdr.detectChanges();
    });
  }

  changePassword() {
    this.changePasswordError = '';
    this.changePasswordSuccess = '';

    if (this.passwordData.new_password !== this.passwordData.confirm_password) {
      this.changePasswordError = 'New passwords do not match!';
      return;
    }

    const { confirm_password, ...dataToSend } = this.passwordData;

    this.userService.changePassword(dataToSend).subscribe({
      next: () => {
        this.passwordData = { old_password: '', new_password: '', confirm_password: '' };
        this.changePasswordSuccess = 'Password successfully updated.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.error && typeof err.error === 'object') {
          const errors: string[] = [];
          Object.keys(err.error).forEach(key => {
            const val = err.error[key];
            errors.push(Array.isArray(val) ? val.join('\n') : val);
          });
          this.changePasswordError = errors.join('\n');
        } else {
          this.changePasswordError = 'An error occurred. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  revokeSession(id: number) {
    this.confirmService.requestConfirm('Are you sure you want to revoke this session?', () => {
      this.userService.revokeSession(id).subscribe(() => {
        this.loadSessions();
        this.cdr.detectChanges();
      });
    });
  }

  respondInvitation(id: number, action: 'accept' | 'reject') {
    this.userService.respondInvitation(id, action).subscribe(() => {
      this.loadInvitations();

      if (action === 'accept') {
        this.boardService.refreshBoards();
      }

      this.cdr.detectChanges();
    });
  }

  respondTransfer(id: number, action: 'accept' | 'reject') {
    this.userService.respondTransfer(id, action).subscribe(() => {
      this.loadTransfers();
      this.cdr.detectChanges();
    });
  }
}