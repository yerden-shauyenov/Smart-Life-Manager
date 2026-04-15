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
  templateUrl: './task-list.html'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);

  currentBoard: Board | null = null;
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];

  ngOnInit(): void {
    this.fetchInitialData();
  }

  private fetchInitialData(): void {
    this.boardService.selectedBoard$.subscribe(selected => {
      if (selected) {
        this.currentBoard = selected;
        this.loadBoardData(selected.id);
      } else {
        this.boardService.getBoards().subscribe(boards => {
          if (boards.length > 0) {
            this.currentBoard = boards[0];
            this.boardService.selectBoard(boards[0]);
            this.loadBoardData(boards[0].id);
          }
        });
      }
    });
  }

  private loadBoardData(boardId: number): void {
    this.boardService.getStatuses(boardId).subscribe(data => {
      this.statuses = data.sort((a, b) => a.order - b.order);
    });

    this.taskService.getTasks().subscribe(data => {
      this.tasks = data.filter(t => t.board === boardId);
    });
  }

  getTasksByStatus(statusId: number): Task[] {
    return this.tasks.filter(t => t.status === statusId);
  }

  moveTask(task: Task, newStatusId: number): void {
    this.taskService.updateTaskStatus(task.id, newStatusId).subscribe(updated => {
      const index = this.tasks.findIndex(t => t.id === updated.id);
      if (index !== -1) {
        this.tasks[index] = updated;
      }
    });
  }
}