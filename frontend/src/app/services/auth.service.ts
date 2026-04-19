import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<any>(null);
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
            this.currentUserSubject.next(response.user);
            if (isPlatformBrowser(this.platformId) && userData.username) {
              localStorage.setItem('username', userData.username);
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
            this.currentUserSubject.next({ isAuthenticated: true });
            if (isPlatformBrowser(this.platformId) && credentials.username) {
              localStorage.setItem('username', credentials.username);
            }
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
      this.currentUserSubject.next({ isAuthenticated: true });
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
      return localStorage.getItem('username');
    }
    return null;
  }
}