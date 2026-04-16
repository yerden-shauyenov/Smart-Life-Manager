import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Board, Sprint, TaskStatus, TaskPriority, BoardMembership } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private apiUrl = 'http://localhost:8000/api/';

  // Use Subject instead of BehaviorSubject — does NOT replay on subscribe
  private selectedBoardSource = new Subject<Board>();
  selectedBoard$ = this.selectedBoardSource.asObservable();

  // Keep last selected board accessible synchronously
  currentBoard: Board | null = null;

  constructor(private http: HttpClient) {}

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.apiUrl}boards/`);
  }

  createBoard(data: { title: string; description: string; is_public: boolean }): Observable<Board> {
    return this.http.post<Board>(`${this.apiUrl}boards/`, data);
  }

  updateBoard(boardId: number, data: Partial<Board>): Observable<Board> {
    return this.http.patch<Board>(`${this.apiUrl}boards/${boardId}/`, data);
  }

  deleteBoard(boardId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}boards/${boardId}/`);
  }

  getStatuses(boardId: number): Observable<TaskStatus[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<TaskStatus[]>(`${this.apiUrl}statuses/`, { params });
  }

  createStatus(data: { board: number; name: string; order: number }): Observable<TaskStatus> {
    return this.http.post<TaskStatus>(`${this.apiUrl}statuses/`, data);
  }

  updateStatus(statusId: number, data: { name: string }): Observable<TaskStatus> {
    return this.http.patch<TaskStatus>(`${this.apiUrl}statuses/${statusId}/`, data);
  }

  deleteStatus(statusId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}statuses/${statusId}/`);
  }

  getPriorities(boardId: number): Observable<TaskPriority[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<TaskPriority[]>(`${this.apiUrl}priorities/`, { params });
  }

  getSprints(boardId: number): Observable<Sprint[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<Sprint[]>(`${this.apiUrl}sprints/`, { params });
  }

  addMember(boardId: number, username: string): Observable<BoardMembership> {
    return this.http.post<BoardMembership>(`${this.apiUrl}memberships/`, {
      board: boardId,
      username
    });
  }

  selectBoard(board: Board) {
    this.currentBoard = board;
    this.selectedBoardSource.next(board);
  }
}