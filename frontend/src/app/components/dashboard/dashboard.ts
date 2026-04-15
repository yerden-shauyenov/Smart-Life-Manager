import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { TaskService } from '../../services/task.service';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Board } from '../../models/board.model';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  dashboardData$!: Observable<{ boards: Board[], tasks: Task[] }>;

  showModal = false;
  newBoard = { title: '', description: '', is_public: true };

  constructor(
    public boardService: BoardService,
    public taskService: TaskService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dashboardData$ = combineLatest([
      this.boardService.getBoards(),
      this.taskService.getTasks()
    ]).pipe(
      map(([boards, tasks]) => ({ boards, tasks })),
      catchError(() => of({ boards: [], tasks: [] }))
    );
  }

  openModal(): void {
    this.newBoard = { title: '', description: '', is_public: true };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  createBoard(): void {
    if (!this.newBoard.title.trim()) return;
    this.boardService.createBoard(this.newBoard).subscribe({
      next: (board) => {
        this.closeModal();
        this.loadData();
        this.boardService.selectBoard(board);
        this.router.navigate(['/tasks']);
      },
      error: (err) => console.error('Failed to create board', err)
    });
  }
}