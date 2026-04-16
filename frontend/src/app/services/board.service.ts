import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Board, TaskStatus, TaskPriority, Sprint, TaskType, BoardMembership } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private apiUrl = 'http://localhost:8000/api/';

  private selectedBoardSubject = new BehaviorSubject<Board | null>(null);
  selectedBoard$ = this.selectedBoardSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentBoard(): Board | null {
    return this.selectedBoardSubject.value;
  }

  set currentBoard(board: Board | null) {
    this.selectedBoardSubject.next(board);
  }

  selectBoard(board: Board): void {
    this.currentBoard = board;
  }

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.apiUrl}boards/`);
  }

  getBoard(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}boards/${id}/`);
  }

  createBoard(data: Partial<Board>): Observable<Board> {
    return this.http.post<Board>(`${this.apiUrl}boards/`, data);
  }

  updateBoard(id: number, data: Partial<Board>): Observable<Board> {
    return this.http.patch<Board>(`${this.apiUrl}boards/${id}/`, data);
  }

  deleteBoard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}boards/${id}/`);
  }

  addMember(boardId: number, username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}boards/${boardId}/add_member/`, { username });
  }

  getStatuses(boardId: number): Observable<TaskStatus[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<TaskStatus[]>(`${this.apiUrl}statuses/`, { params });
  }

  createStatus(data: Partial<TaskStatus>): Observable<TaskStatus> {
    return this.http.post<TaskStatus>(`${this.apiUrl}statuses/`, data);
  }

  updateStatus(id: number, data: Partial<TaskStatus>): Observable<TaskStatus> {
    return this.http.patch<TaskStatus>(`${this.apiUrl}statuses/${id}/`, data);
  }

  deleteStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}statuses/${id}/`);
  }

  getPriorities(boardId: number): Observable<TaskPriority[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<TaskPriority[]>(`${this.apiUrl}priorities/`, { params });
  }

  getSprints(boardId: number): Observable<Sprint[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<Sprint[]>(`${this.apiUrl}sprints/`, { params });
  }

  getTaskTypes(boardId: number): Observable<TaskType[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<TaskType[]>(`${this.apiUrl}types/`, { params });
  }

  getMemberships(boardId: number): Observable<BoardMembership[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<BoardMembership[]>(`${this.apiUrl}memberships/`, { params });
  }
}