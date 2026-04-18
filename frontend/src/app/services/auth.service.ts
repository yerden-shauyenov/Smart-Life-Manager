import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/users/';

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}register/`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login/`, credentials).pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          
          if (credentials.username) {
            localStorage.setItem('username', credentials.username);
          }
        })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }
}