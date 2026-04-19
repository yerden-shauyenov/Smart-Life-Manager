import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ConfirmService } from '../../services/confirm.service';
import { User, UserSession, BoardInvitation, OwnershipTransfer } from '../../models/user.model';

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
  passwordData = { old_password: '', new_password: '' };
  selectedFile: File | null = null;

  constructor(
      private userService: UserService,
      private confirmService: ConfirmService
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
    });
  }

  loadSessions() {
    this.userService.getSessions().subscribe(res => this.sessions = res);
  }

  loadInvitations() {
    this.userService.getInvitations().subscribe(res => this.invitations = res);
  }

  loadTransfers() {
    this.userService.getTransfers().subscribe(res => this.transfers = res);
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
    });
  }

  changePassword() {
    this.userService.changePassword(this.passwordData).subscribe(() => {
      this.passwordData = { old_password: '', new_password: '' };
    });
  }

  revokeSession(id: number) {
    this.confirmService.requestConfirm('Вы уверены, что хотите завершить эту сессию?', () => {
      this.userService.revokeSession(id).subscribe(() => this.loadSessions());
    });
  }

  respondInvitation(id: number, action: 'accept' | 'reject') {
    this.userService.respondInvitation(id, action).subscribe(() => this.loadInvitations());
  }

  respondTransfer(id: number, action: 'accept' | 'reject') {
    this.userService.respondTransfer(id, action).subscribe(() => this.loadTransfers());
  }
}