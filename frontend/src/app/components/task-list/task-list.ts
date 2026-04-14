import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task';
import { Observable, combineLatest, map, take } from 'rxjs';
import { Task, TaskGroup, SubTask } from '../../models/task.model';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit {
  tasks$: Observable<Task[]> | undefined;
  groups$: Observable<TaskGroup[]> | undefined;
  
  // Stores the sort preference for each column
  groupSortConfig: { [key: string]: 'date' | 'priority' | 'none' } = {};

  showModal = false;
  isEditMode = false;
  currentTaskId: number | null = null;
  taskForm: FormGroup;

  constructor(public taskService: TaskService) {
    this.taskForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl(''),
      priority: new FormControl('medium'),
      type: new FormControl('urgent-important'),
      groupId: new FormControl(''),
      dueDate: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.groups$ = this.taskService.groups$;
    
    this.tasks$ = combineLatest([
      this.taskService.getTasks(),
      this.taskService.filter$,
      this.taskService.search$ 
    ]).pipe(
      map(([tasks, filter, search]) => {
        let filteredTasks = tasks;

        if (filter !== 'all') {
          filteredTasks = filteredTasks.filter(t => t.type === filter);
        }

        if (search) {
          const query = search.toLowerCase();
          filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(query) || 
            t.description.toLowerCase().includes(query)
          );
        }

        return filteredTasks;
      })
    );
  }

  // --- Group Operations ---
  
  // Handles the dropdown change event from the template
  onGroupSortChange(groupId: string, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value as 'date' | 'priority' | 'none';
    this.setGroupSort(groupId, value);
  }

  setGroupSort(groupId: string, type: 'date' | 'priority' | 'none') {
    this.groupSortConfig[groupId] = type;
  }

  onDeleteGroup(id: string) {
    // Silent delete as requested
    this.taskService.deleteGroup(id);
  }

  // Helper used in the template @for loop to sort tasks dynamically
  getSortedTasks(tasks: Task[] | null, groupId: string): Task[] {
    if (!tasks) return [];
    let groupTasks = tasks.filter(t => t.groupId === groupId);

    const sortType = this.groupSortConfig[groupId];
    
    if (sortType === 'date') {
      return groupTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } 
    
    if (sortType === 'priority') {
      const weight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return groupTasks.sort((a, b) => weight[b.priority] - weight[a.priority]);
    }

    return groupTasks; // Returns default order if 'none'
  }

  // --- Subtask Operations ---
  toggleSubtaskEdit(sub: SubTask) {
    sub.isEditing = !sub.isEditing;
  }

  updateSubtaskTitle(taskId: number, sub: SubTask, event: any) {
    const newTitle = event.target.value.trim();
    if (newTitle && newTitle !== sub.title) {
      this.taskService.updateSubtask(taskId, sub.id, newTitle);
    }
    sub.isEditing = false;
  }

  onToggleSubtask(taskId: number, subtaskId: number) {
    this.taskService.toggleSubtask(taskId, subtaskId);
    
    this.tasks$?.pipe(take(1)).subscribe(tasks => {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.subtasks.length > 0) {
        const allSubtasksDone = task.subtasks.every(s => s.isCompleted);
        // Sync parent task completion with subtask status
        if (allSubtasksDone !== task.isCompleted) {
          this.taskService.toggleTask(taskId);
        }
      }
    });
  }

  onDeleteSubtask(taskId: number, subtaskId: number) {
    this.taskService.deleteSubtask(taskId, subtaskId);
  }

  addSubtask(task: Task, inputElement: HTMLInputElement) {
    const title = inputElement.value.trim();
    if (title) {
      this.taskService.addSubtask(task.id, title);
      inputElement.value = ''; 
    }
  }

  // --- Utility Methods ---
  onSearch(event: any) { this.taskService.setSearch(event.target.value); }
  toggleGroupEdit(group: TaskGroup) { group.isEditing = !group.isEditing; }
  onToggle(id: number) { this.taskService.toggleTask(id); }
  onDeleteTask(id: number) { this.taskService.deleteTask(id); }

  updateGroupName(group: TaskGroup, event: any) {
    const newName = event.target.value.trim();
    if (newName && newName !== group.name) {
      this.taskService.updateGroup(group.id, newName);
    }
    group.isEditing = false;
  }

  getGroupProgress(groupId: string): Observable<number> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const groupTasks = tasks.filter(t => t.groupId === groupId);
        if (groupTasks.length === 0) return 0;
        const completed = groupTasks.filter(t => t.isCompleted).length;
        return Math.round((completed / groupTasks.length) * 100);
      })
    );
  }

  // --- Modal Logic ---
  openAddTask(groupId: string) {
    this.isEditMode = false;
    this.currentTaskId = null;
    this.taskForm.reset({ 
      priority: 'medium', 
      type: 'urgent-important', 
      groupId: groupId,
      dueDate: new Date().toISOString().split('T')[0]
    });
    this.showModal = true;
  }

  openEditTask(task: Task) {
    this.isEditMode = true;
    this.currentTaskId = task.id;
    const formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
    this.taskForm.patchValue({ ...task, dueDate: formattedDate });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.taskForm.reset();
  }

  onSubmit() {
    if (this.taskForm.valid) {
      if (this.isEditMode && this.currentTaskId) {
        this.taskService.updateTask(this.currentTaskId, this.taskForm.value);
      } else {
        this.taskService.addTask(this.taskForm.value);
      }
      this.closeModal();
    }
  }
}