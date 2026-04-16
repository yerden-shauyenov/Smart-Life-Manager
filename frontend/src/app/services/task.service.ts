import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, Subtask } from '../models/task.model';

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

  createSubtask(data: { task: number; title: string }): Observable<Subtask> {
    return this.http.post<Subtask>(`${this.apiUrl}subtasks/`, data);
  }

  updateSubtask(subtaskId: number, data: Partial<Subtask>): Observable<Subtask> {
    return this.http.patch<Subtask>(`${this.apiUrl}subtasks/${subtaskId}/`, data);
  }

  deleteSubtask(subtaskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}subtasks/${subtaskId}/`);
  }
}