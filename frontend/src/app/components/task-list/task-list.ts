import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { BoardService } from '../../services/board.service';
import { Task } from '../../models/task.model';
import { Board, TaskStatus } from '../../models/board.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.html'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private router = inject(Router);

  currentBoard: Board | null = null;
  statuses: TaskStatus[] = [];
  tasks: Task[] = [];

  // invite member
  showInviteModal = false;
  inviteUsername = '';
  inviteError = '';
  inviteSuccess = '';

  ngOnInit(): void {
    this.boardService.selectedBoard$.subscribe(board => {
      if (board) {
        this.currentBoard = board;
        this.loadBoardData(board.id);
      } else {
        this.boardService.getBoards().subscribe(boards => {
          if (boards.length > 0) {
            this.currentBoard = boards[0];
            this.boardService.selectBoard(boards[0]);
            this.loadBoardData(boards[0].id);
          } else {
            this.router.navigate(['/dashboard']);
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
      if (index !== -1) this.tasks[index] = updated;
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  openInvite(): void {
    this.inviteUsername = '';
    this.inviteError = '';
    this.inviteSuccess = '';
    this.showInviteModal = true;
  }

  closeInvite(): void {
    this.showInviteModal = false;
  }

  inviteMember(): void {
    if (!this.inviteUsername.trim() || !this.currentBoard) return;
    this.boardService.addMember(this.currentBoard.id, this.inviteUsername.trim()).subscribe({
      next: () => {
        this.inviteSuccess = `✅ ${this.inviteUsername} added to the board!`;
        this.inviteUsername = '';
      },
      error: () => {
        this.inviteError = '❌ User not found or already a member.';
      }
    });
  }
}