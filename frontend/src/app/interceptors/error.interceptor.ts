import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const AUTH_ENDPOINTS = ['/login/', '/logout/', '/register/'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const toastService = inject(ToastService);

    const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => req.url.includes(ep));

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthEndpoint) {
                authService.logout();
                router.navigate(['/login']);
                toastService.show('Session expired. Please log in again.', 'error');
            } else if (!req.url.includes('/logout/')) {
                const message = error.error?.detail || error.error?.message || 'An unexpected error occurred';
                toastService.show(message, 'error');
            }
            return throwError(() => error);
        })
    );
};