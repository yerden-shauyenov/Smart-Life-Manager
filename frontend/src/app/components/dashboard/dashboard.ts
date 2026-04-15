import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { TaskService } from '../../services/task.service';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Board } from '../../models/board.model';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  dashboardData$!: Observable<{ boards: Board[], tasks: Task[] }>;

  constructor(
    private boardService: BoardService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.dashboardData$ = combineLatest([
      this.boardService.getBoards(),
      this.taskService.getTasks()
    ]).pipe(
      map(([boards, tasks]) => ({ boards, tasks })),
      catchError(error => {
        console.error('Error fetching dashboard data:', error);
        return of({ boards: [], tasks: [] });
      })
    );
  }
}