import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LangService } from '../../services/lang.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LangDropdownComponent } from '../lang-dropdown/lang-dropdown';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe, LangDropdownComponent],
  templateUrl: './login.html'
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  error = '';
  isLoading = false;

  constructor(
      private authService: AuthService,
      private router: Router,
      private cdr: ChangeDetectorRef,
      public themeService: ThemeService,
      public langService: LangService
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.error = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Invalid username or password. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}