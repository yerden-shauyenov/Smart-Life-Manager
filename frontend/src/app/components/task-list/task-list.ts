import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { Task } from '../../models/task.model';
import { Board, TaskStatus } from '../../models/board.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);

  currentBoard: Board | null = null;
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData() {
    this.boardService.getBoards().subscribe(boards => {
      if (boards.length > 0) {
        this.currentBoard = boards[0];
        this.loadBoardData(this.currentBoard.id);
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