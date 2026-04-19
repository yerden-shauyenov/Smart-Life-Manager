import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserSession, BoardInvitation, OwnershipTransfer } from '../models/user.model';
import {environment} from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/users/me`;

    constructor(private http: HttpClient) {}

    getProfile(): Observable<User> {
        return this.http.get<User>(this.apiUrl + '/');
    }

    updateProfile(data: FormData): Observable<User> {
        return this.http.patch<User>(this.apiUrl + '/', data);
    }

    changePassword(data: any): Observable<any> {
        return this.http.post(this.apiUrl + '/change-password/', data);
    }

    getSessions(): Observable<UserSession[]> {
        return this.http.get<UserSession[]>(this.apiUrl + '/sessions/');
    }

    revokeSession(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/sessions/${id}/`);
    }

    getInvitations(): Observable<BoardInvitation[]> {
        return this.http.get<BoardInvitation[]>(`${environment.apiUrl}/invitations/`);
    }

    respondInvitation(id: number, action: 'accept' | 'reject'): Observable<any> {
        return this.http.post(`${environment.apiUrl}/invitations/${id}/${action}/`, {});
    }

    getTransfers(): Observable<OwnershipTransfer[]> {
        return this.http.get<OwnershipTransfer[]>(`${environment.apiUrl}/transfers/`);
    }

    respondTransfer(id: number, action: 'accept' | 'reject'): Observable<any> {
        return this.http.post(`${environment.apiUrl}/transfers/${id}/${action}/`, {});
    }
}