import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks: Task[] = [
    { 
      id: 1, 
      title: 'Do lab work', 
      description: 'Show types of View', 
      dueDate: new Date(), 
      isCompleted: false, 
      priority: 'high', 
      type: 'urgent-important' 
    }
  ];

  private filterSubject = new BehaviorSubject<string>('all');
  filter$ = this.filterSubject.asObservable();

  // Filter change
  setFilter(filter: string) {
    this.filterSubject.next(filter);
  }

  private tasksSubject = new BehaviorSubject<Task[]>(this.tasks);
  tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  constructor() {}

  //Returns an observable stream of tasks
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  /**
   * Adds a new task to the list
   * @param taskData Data from the task form
   */
  addTask(taskData: any): void {
    const newTask: Task = {
      ...taskData,
      id: Date.now(), // Unique ID based on timestamp
      isCompleted: false,
      dueDate: new Date(taskData.dueDate)
    };

    this.tasks = [newTask, ...this.tasks];
    this.tasksSubject.next(this.tasks);
  }

  /**
   * Toggles completion status of a specific task
   * @param id The ID of the task to toggle
   */
  toggleTask(id: number): void {
    this.tasks = this.tasks.map(task => 
      task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
    );
    this.tasksSubject.next(this.tasks);
  }
}