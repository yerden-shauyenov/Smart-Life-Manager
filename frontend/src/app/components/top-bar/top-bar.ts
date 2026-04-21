import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LangService } from '../../services/lang.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LangDropdownComponent } from '../lang-dropdown/lang-dropdown';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, LangDropdownComponent],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public langService = inject(LangService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public imageBaseUrl = environment.imageBaseUrl;
  currentUser: User | null = null;
  username = '';

  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.username) this.username = user.username;
      this.cdr.detectChanges();
    });
  }

  get userAvatar(): string {
    if (!this.currentUser?.avatar) return 'assets/default-avatar.png';
    if (this.currentUser.avatar.startsWith('http')) return this.currentUser.avatar;
    const base = this.imageBaseUrl.replace(/\/$/, '');
    const path = this.currentUser.avatar.startsWith('/') ? this.currentUser.avatar : `/${this.currentUser.avatar}`;
    return `${base}${path}`;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
  }
}
