import { Component } from '@angular/core';
import { TaskService } from '../../services/task';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  constructor(private taskService: TaskService) {}

  applyFilter(category: string) {
    this.taskService.setFilter(category);
  }
}
