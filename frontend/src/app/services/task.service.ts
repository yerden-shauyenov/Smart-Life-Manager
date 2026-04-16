import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, Subtask } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = 'http://localhost:8000/api/tasks/';
    private subtaskUrl = 'http://localhost:8000/api/subtasks/';

    constructor(private http: HttpClient) {}

    getTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl);
    }

    createTask(data: Partial<Task>): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, data);
    }

    updateTask(taskId: number, data: Partial<Task>): Observable<Task> {
        return this.http.patch<Task>(`${this.apiUrl}${taskId}/`, data);
    }

    deleteTask(taskId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}${taskId}/`);
    }

    updateTaskStatus(taskId: number, statusId: number): Observable<Task> {
        return this.http.patch<Task>(`${this.apiUrl}${taskId}/`, { status: statusId });
    }

    getSubtasks(taskId: number): Observable<Subtask[]> {
        return this.http.get<Subtask[]>(`${this.subtaskUrl}?task=${taskId}`);
    }

    createSubtask(data: { task: number; title: string }): Observable<Subtask> {
        return this.http.post<Subtask>(this.subtaskUrl, data);
    }

    updateSubtask(subtaskId: number, data: Partial<Subtask>): Observable<Subtask> {
        return this.http.patch<Subtask>(`${this.subtaskUrl}${subtaskId}/`, data);
    }

    deleteSubtask(subtaskId: number): Observable<void> {
        return this.http.delete<void>(`${this.subtaskUrl}${subtaskId}/`);
    }
}