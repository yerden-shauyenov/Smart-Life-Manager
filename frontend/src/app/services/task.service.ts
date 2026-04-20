import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Task, Comment } from '../models/task.model';
import { environment } from "../../environments/environment";
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = `${environment.apiUrl}/`;
  private toastService = inject(ToastService);

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}tasks/`);
  }

  getTask(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}tasks/${taskId}/`);
  }

  createTask(data: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}tasks/`, data).pipe(
        tap(() => this.toastService.show('Task created'))
    );
  }

  updateTask(taskId: number, data: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}tasks/${taskId}/`, data).pipe(
        tap(() => this.toastService.show('Task updated'))
    );
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}tasks/${taskId}/`).pipe(
        tap(() => this.toastService.show('Task deleted'))
    );
  }

  getComments(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}comments/?task=${taskId}`);
  }

  addComment(data: { task: number, text: string }): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}comments/`, data).pipe(
        tap(() => this.toastService.show('Comment added'))
    );
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}comments/${commentId}/`).pipe(
        tap(() => this.toastService.show('Comment deleted'))
    );
  }
}