import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Board, Sprint, TaskStatus } from '../models/board.model';

@Injectable({
    providedIn: 'root'
})
export class BoardService {
    private apiUrl = 'http://localhost:8000/api/';

    constructor(private http: HttpClient) {}

    getBoards(): Observable<Board[]> {
        return this.http.get<Board[]>(`${this.apiUrl}boards/`);
    }

    getStatuses(boardId: number): Observable<TaskStatus[]> {
        let params = new HttpParams().set('board', boardId.toString());
        return this.http.get<TaskStatus[]>(`${this.apiUrl}statuses/`, { params });
    }

    getSprints(boardId: number): Observable<Sprint[]> {
        let params = new HttpParams().set('board', boardId.toString());
        return this.http.get<Sprint[]>(`${this.apiUrl}sprints/`, { params });
    }
}