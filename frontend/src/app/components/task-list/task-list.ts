import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for pipes and directives
import { TaskService } from '../../services/task';
import { Observable } from 'rxjs';
import { Task } from '../../models/task.model';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'; //to work with input fields
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit {
  tasks$: Observable<Task[]> | undefined;
  showModal = false; // Controls the visibility of the "Add Task" modal
  taskForm: FormGroup;

  constructor(private taskService: TaskService) {
    // Initializing the form with validation rules
    this.taskForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl(''),
      priority: new FormControl('medium'),
      type: new FormControl('urgent-important'),
      dueDate: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.tasks$ = combineLatest([
      this.taskService.getTasks(),
      this.taskService.filter$
    ]).pipe(
      map(([tasks, filter]) => {
        if (filter === 'all') return tasks;
        return tasks.filter(t => t.type === filter);
      })
    );
  }

  // Toggle modal visibility
  toggleModal() {
    this.showModal = !this.showModal;
  }

  onToggle(id: number): void {
    this.taskService.toggleTask(id);
  }

  // Handle form submission
  onSubmit() {
    if (this.taskForm.valid) {
      this.taskService.addTask(this.taskForm.value);
      this.taskForm.reset({ priority: 'medium', type: 'urgent-important' });
      this.toggleModal();
    }
  }
}