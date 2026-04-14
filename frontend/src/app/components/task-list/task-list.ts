import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { Task } from '../../models/task.model';
import { Board, TaskStatus } from '../../models/board.model';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './task-list.html'
})
export class TaskListComponent implements OnInit {
  currentBoard: Board | null = null;
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];

  constructor(
      private taskService: TaskService,
      private boardService: BoardService
  ) {}

  ngOnInit(): void {
    this.boardService.selectedBoard$.subscribe(board => {
      this.currentBoard = board;
      if (board) {
        this.loadBoardData(board.id);
      }
    });
  }

  loadBoardData(boardId: number) {
    this.boardService.getStatuses(boardId).subscribe(statuses => {
      this.statuses = statuses.sort((a, b) => a.order - b.order);
    });

    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks.filter(t => t.board === boardId);
    });
  }

  getTasksForStatus(statusId: number): Task[] {
    return this.tasks.filter(t => t.status === statusId);
  }

  moveTask(task: Task, newStatusId: number) {
    this.taskService.updateTaskStatus(task.id, newStatusId).subscribe(updatedTask => {
      const index = this.tasks.findIndex(t => t.id === updatedTask.id);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }
    });
  }
}