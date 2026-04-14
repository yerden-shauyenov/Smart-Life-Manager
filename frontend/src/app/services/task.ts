import { Injectable } from '@angular/core';
import { Task, TaskGroup, SubTask } from '../models/task.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private STORAGE_KEY_TASKS = 'smartlife_tasks';
  private STORAGE_KEY_GROUPS = 'smartlife_groups';

  private groups: TaskGroup[] = [];
  private tasks: Task[] = [];

  private groupsSubject = new BehaviorSubject<TaskGroup[]>([]);
  groups$ = this.groupsSubject.asObservable();

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  private filterSubject = new BehaviorSubject<string>('all');
  filter$ = this.filterSubject.asObservable();

  private searchSubject = new BehaviorSubject<string>('');
  search$ = this.searchSubject.asObservable();

  constructor() {
    this.loadData();
  }

  // --- Persistence ---
  private saveData() {
    localStorage.setItem(this.STORAGE_KEY_GROUPS, JSON.stringify(this.groups));
    localStorage.setItem(this.STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
    this.groupsSubject.next(this.groups);
    this.tasksSubject.next(this.tasks);
  }

  private loadData() {
    const savedGroups = localStorage.getItem(this.STORAGE_KEY_GROUPS);
    const savedTasks = localStorage.getItem(this.STORAGE_KEY_TASKS);

    // Default Groups from your screenshot
    this.groups = savedGroups ? JSON.parse(savedGroups) : [
      { id: 'g1', name: 'Assignments', isEditing: false },
      { id: 'g2', name: 'Labs', isEditing: false }
    ];

    // Default Tasks from your screenshot
    this.tasks = savedTasks ? JSON.parse(savedTasks) : [
      { 
        id: 1, 
        groupId: 'g1',
        title: 'Assignment 1', 
        description: '', 
        dueDate: new Date('2026-04-13'), 
        isCompleted: true, 
        priority: 'high', 
        type: 'urgent-important',
        subtasks: [
          { id: 101, title: 'Task 1', isCompleted: true, isEditing: false },
          { id: 102, title: 'Task 2', isCompleted: true, isEditing: false }
        ] 
      },
      { 
        id: 2, 
        groupId: 'g1',
        title: 'Assignment 2', 
        description: '', 
        dueDate: new Date('2026-04-17'), 
        isCompleted: false, 
        priority: 'medium', 
        type: 'scheduled',
        subtasks: [
          { id: 103, title: 'Task 1', isCompleted: true, isEditing: false },
          { id: 104, title: 'Task 2', isCompleted: true, isEditing: false },
          { id: 105, title: 'Task 3', isCompleted: false, isEditing: false }
        ] 
      },
      { 
        id: 3, 
        groupId: 'g2',
        title: 'Lab 1', 
        description: '', 
        dueDate: new Date('2026-04-24'), 
        isCompleted: false, 
        priority: 'high', 
        type: 'urgent-important',
        subtasks: [
          { id: 201, title: 'Task 1', isCompleted: true, isEditing: false },
          { id: 202, title: 'Task 2', isCompleted: true, isEditing: false },
          { id: 203, title: 'Task 3', isCompleted: false, isEditing: false }
        ] 
      },
      { 
        id: 4, 
        groupId: 'g2',
        title: 'Lab 2', 
        description: '', 
        dueDate: new Date('2026-04-25'), 
        isCompleted: false, 
        priority: 'medium', 
        type: 'scheduled',
        subtasks: [
          { id: 204, title: 'Task 1', isCompleted: true, isEditing: false },
          { id: 205, title: 'Task 2', isCompleted: false, isEditing: false }
        ] 
      }
    ];

    this.groupsSubject.next(this.groups);
    this.tasksSubject.next(this.tasks);
  }

  // --- Group Operations ---
  addGroup(name: string) {
    const newGroup: TaskGroup = { id: Date.now().toString(), name, isEditing: false };
    this.groups = [...this.groups, newGroup];
    this.saveData();
  }

  updateGroup(id: string, newName: string) {
    this.groups = this.groups.map(g => 
      g.id === id ? { ...g, name: newName, isEditing: false } : g
    );
    this.saveData();
  }

  deleteGroup(groupId: string) {
    this.groups = this.groups.filter(g => g.id !== groupId);
    this.tasks = this.tasks.filter(t => t.groupId !== groupId); 
    this.saveData();
  }

  // --- Task Operations ---
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  addTask(taskData: any): void {
    const newTask: Task = {
      ...taskData,
      id: Date.now(),
      isCompleted: false,
      subtasks: [], 
      dueDate: new Date(taskData.dueDate)
    };
    this.tasks = [newTask, ...this.tasks];
    this.saveData();
  }

  updateTask(id: number, updatedData: any): void {
    this.tasks = this.tasks.map(task => 
      task.id === id 
        ? { ...task, ...updatedData, dueDate: updatedData.dueDate ? new Date(updatedData.dueDate) : task.dueDate } 
        : task
    );
    this.saveData();
  }

  toggleTask(id: number): void {
    this.tasks = this.tasks.map(task => 
      task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
    );
    this.saveData();
  }

  deleteTask(id: number) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveData();
  }

  // --- Subtask Operations ---
  addSubtask(taskId: number, title: string) {
    this.tasks = this.tasks.map(task => {
      if (task.id === taskId) {
        const newSub: SubTask = { id: Date.now(), title, isCompleted: false, isEditing: false };
        return { ...task, subtasks: [...task.subtasks, newSub] };
      }
      return task;
    });
    this.saveData();
  }

  updateSubtask(taskId: number, subtaskId: number, newTitle: string) {
    this.tasks = this.tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(sub => 
          sub.id === subtaskId ? { ...sub, title: newTitle, isEditing: false } : sub
        );
        return { ...task, subtasks: updatedSubtasks };
      }
      return task;
    });
    this.saveData();
  }

  toggleSubtask(taskId: number, subtaskId: number) {
    this.tasks = this.tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(sub => 
          sub.id === subtaskId ? { ...sub, isCompleted: !sub.isCompleted } : sub
        );
        return { ...task, subtasks: updatedSubtasks };
      }
      return task;
    });
    this.saveData();
  }

  deleteSubtask(taskId: number, subtaskId: number) {
    this.tasks = this.tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          subtasks: task.subtasks.filter(sub => sub.id !== subtaskId) 
        };
      }
      return task;
    });
    this.saveData();
  }

  setFilter(filter: string) {
    this.filterSubject.next(filter);
  }

  setSearch(query: string) {
    this.searchSubject.next(query);
  }
}