import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from "../../environments/environment";
import { User } from '../models/user.model'; // Обязательно импортируй модель User

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;

  // Теперь Subject строго типизирован или null
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object,
      private router: Router
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkToken();
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, userData).pipe(
        tap((response: any) => {
          if (response && response.token) {
            this.setTokens(response.token.access, response.token.refresh);
            this.currentUserSubject.next(response.user); // Сохраняем реального юзера
            if (isPlatformBrowser(this.platformId) && response.user.username) {
              localStorage.setItem('username', response.user.username);
            }
          }
        })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, credentials).pipe(
        tap((response: any) => {
          if (response && response.access) {
            this.setTokens(response.access, response.refresh);
            // Теперь бэкенд отдает response.user при логине!
            this.currentUserSubject.next(response.user);
            if (isPlatformBrowser(this.platformId) && response.user.username) {
              localStorage.setItem('username', response.user.username);
            }
          }
        })
    );
  }

  // Новый метод для получения профиля по токену
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me/`).pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('username', user.username);
          }
        })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('username');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  private setTokens(access: string, refresh: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  }

  private checkToken() {
    const token = this.getAccessToken();
    if (token) {
      this.currentUserSubject.next({ isAuthenticated: true } as any);

      setTimeout(() => {
        this.getCurrentUserProfile().subscribe({
          error: (err) => {
            console.error('Session expired or invalid token', err);
            this.logout();
          }
        });
      }, 0);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  hasToken(): boolean {
    return this.isAuthenticated();
  }

  getUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      // Если currentUser еще не подгрузился с бэка, возвращаем из кэша
      return this.currentUserSubject.value?.username || localStorage.getItem('username');
    }
    return null;
  }
}