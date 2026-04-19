import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Board, TaskStatus, TaskPriority, Sprint, TaskType, BoardMembership, BoardRole } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private apiUrl = 'http://localhost:8000/api/';

  private selectedBoardSubject = new BehaviorSubject<Board | null>(null);
  selectedBoard$ = this.selectedBoardSubject.asObservable();

  private boardsSubject = new BehaviorSubject<Board[]>([]);
  boards$ = this.boardsSubject.asObservable();

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
    return this.http.get<Board[]>(`${this.apiUrl}boards/`).pipe(
        tap(boards => this.boardsSubject.next(boards))
    );
  }

  refreshBoards(): void {
    this.getBoards().subscribe();
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

  inviteMember(boardId: number, email: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}boards/${boardId}/invite_member/`, { email, role });
  }

  removeMember(boardId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}boards/${boardId}/remove_member/`, { user_id: userId });
  }

  transferOwnership(boardId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}boards/${boardId}/transfer_ownership/`, { user_id: userId });
  }

  leaveBoard(boardId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}boards/${boardId}/leave/`, {});
  }

  getMemberships(boardId: number): Observable<BoardMembership[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<BoardMembership[]>(`${this.apiUrl}memberships/`, { params });
  }

  updateMembership(id: number, data: Partial<BoardMembership>): Observable<BoardMembership> {
    return this.http.patch<BoardMembership>(`${this.apiUrl}memberships/${id}/`, data);
  }

  deleteMembership(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}memberships/${id}/`);
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

  createPriority(data: Partial<TaskPriority>): Observable<TaskPriority> {
    return this.http.post<TaskPriority>(`${this.apiUrl}priorities/`, data);
  }

  updatePriority(id: number, data: Partial<TaskPriority>): Observable<TaskPriority> {
    return this.http.patch<TaskPriority>(`${this.apiUrl}priorities/${id}/`, data);
  }

  deletePriority(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}priorities/${id}/`);
  }

  getTaskTypes(boardId: number): Observable<TaskType[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<TaskType[]>(`${this.apiUrl}types/`, { params });
  }

  createTaskType(data: Partial<TaskType>): Observable<TaskType> {
    return this.http.post<TaskType>(`${this.apiUrl}types/`, data);
  }

  updateTaskType(id: number, data: Partial<TaskType>): Observable<TaskType> {
    return this.http.patch<TaskType>(`${this.apiUrl}types/${id}/`, data);
  }

  deleteTaskType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}types/${id}/`);
  }

  getRoles(boardId: number): Observable<BoardRole[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<BoardRole[]>(`${this.apiUrl}roles/`, { params });
  }

  createRole(data: Partial<BoardRole>): Observable<BoardRole> {
    return this.http.post<BoardRole>(`${this.apiUrl}roles/`, data);
  }

  updateRole(id: number, data: Partial<BoardRole>): Observable<BoardRole> {
    return this.http.patch<BoardRole>(`${this.apiUrl}roles/${id}/`, data);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}roles/${id}/`);
  }

  getSprints(boardId: number): Observable<Sprint[]> {
    const params = new HttpParams().set('board', boardId.toString());
    return this.http.get<Sprint[]>(`${this.apiUrl}sprints/`, { params });
  }

  createSprint(data: Partial<Sprint>): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.apiUrl}sprints/`, data);
  }

  updateSprint(id: number, data: Partial<Sprint>): Observable<Sprint> {
    return this.http.patch<Sprint>(`${this.apiUrl}sprints/${id}/`, data);
  }

  deleteSprint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}sprints/${id}/`);
  }

  getTasks(boardId: number, sprintId?: number | 'none'): Observable<any[]> {
    let params = new HttpParams().set('board', boardId.toString());
    if (sprintId) {
      params = params.set('sprint', sprintId.toString());
    }
    return this.http.get<any[]>(`${this.apiUrl}tasks/`, { params });
  }

  updateTask(taskId: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}tasks/${taskId}/`, data);
  }
}