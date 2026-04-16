import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Board, Sprint, TaskStatus, BoardMembership } from '../models/board.model';

@Injectable({
    providedIn: 'root'
})
export class BoardService {
    private apiUrl = 'http://localhost:8000/api/';
    private selectedBoardSource = new BehaviorSubject<Board | null>(null);
    selectedBoard$ = this.selectedBoardSource.asObservable();

    constructor(private http: HttpClient) {}

    getBoards(): Observable<Board[]> {
        return this.http.get<Board[]>(`${this.apiUrl}boards/`);
    }

    createBoard(data: { title: string; description: string; is_public: boolean }): Observable<Board> {
        return this.http.post<Board>(`${this.apiUrl}boards/`, data);
    }

    deleteBoard(boardId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}boards/${boardId}/`);
    }

    updateBoard(boardId: number, data: Partial<Board>): Observable<Board> {
        return this.http.patch<Board>(`${this.apiUrl}boards/${boardId}/`, data);
    }

    getStatuses(boardId: number): Observable<TaskStatus[]> {
        const params = new HttpParams().set('board', boardId.toString());
        return this.http.get<TaskStatus[]>(`${this.apiUrl}statuses/`, { params });
    }

    createStatus(data: { board: number; name: string; order: number }): Observable<TaskStatus> {
        return this.http.post<TaskStatus>(`${this.apiUrl}statuses/`, data);
    }

    deleteStatus(statusId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}statuses/${statusId}/`);
    }

    getSprints(boardId: number): Observable<Sprint[]> {
        const params = new HttpParams().set('board', boardId.toString());
        return this.http.get<Sprint[]>(`${this.apiUrl}sprints/`, { params });
    }

    addMember(boardId: number, username: string): Observable<BoardMembership> {
        return this.http.post<BoardMembership>(`${this.apiUrl}memberships/`, {
            board: boardId,
            username: username
        });
    }

    selectBoard(board: Board) {
        this.selectedBoardSource.next(board);
    }
}