import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://localhost:8000/api/';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}tasks/`);
  }

  createTask(data: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}tasks/`, data);
  }

  updateTask(taskId: number, data: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}tasks/${taskId}/`, data);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}tasks/${taskId}/`);
  }

  updateTaskStatus(taskId: number, statusId: number): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}tasks/${taskId}/`, { status: statusId });
  }
}