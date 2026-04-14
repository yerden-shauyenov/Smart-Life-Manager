import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = 'http://localhost:8000/api/tasks/';

    constructor(private http: HttpClient) {}

    getTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl);
    }

    updateTaskStatus(taskId: number, statusId: number): Observable<Task> {
        return this.http.patch<Task>(`${this.apiUrl}${taskId}/`, { status: statusId });
    }
}