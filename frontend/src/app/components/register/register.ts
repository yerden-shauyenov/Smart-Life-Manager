import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterComponent {
  registerData = {
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: ''
  };

  errorMessage: string = '';

  constructor(
      private authService: AuthService,
      private router: Router,
      private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    this.errorMessage = '';

    if (this.registerData.password !== this.registerData.confirm_password) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    // Подготавливаем данные для бэкенда с правильным ключом password_confirm
    const dataToSubmit = {
      email: this.registerData.email,
      username: this.registerData.username,
      password: this.registerData.password,
      password_confirm: this.registerData.confirm_password,
      first_name: this.registerData.first_name,
      last_name: this.registerData.last_name
    };

    this.authService.register(dataToSubmit).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.error && typeof err.error === 'object') {
          const errors: string[] = [];

          Object.keys(err.error).forEach(key => {
            const val = err.error[key];
            const fieldError = Array.isArray(val) ? val.join(' ') : val;
            errors.push(fieldError);
          });

          this.errorMessage = errors.join('\n');
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }

        this.cdr.detectChanges();
      }
    });
  }
}