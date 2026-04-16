import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { TaskService } from '../../services/task.service';
import { of, forkJoin } from 'rxjs';
import { catchError, tap, switchMap, finalize } from 'rxjs/operators';
import { Board, Sprint } from '../../models/board.model';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  boards: Board[] = [];
  allSprints: Sprint[] = [];
  myTasks: Task[] = [];
  selectedSprintIds: number[] = [];
  
  isLoading = true;
  showModal = false;
  newBoard = { title: '', description: '' };

  constructor(
    public boardService: BoardService,
    public taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;

    this.boardService.getBoards().pipe(
      tap(boards => this.boards = boards || []),
      switchMap(boards => {
        if (!boards || boards.length === 0) return of([]);
        
        // Создаем запросы для каждой доски
        const sprintRequests = boards.map(b => 
          this.boardService.getSprints(b.id).pipe(
            catchError(() => of([])) // Если одна доска упадет, остальные загрузятся
          )
        );
        return forkJoin(sprintRequests);
      }),
      tap(sprintArrays => {
        // 1. Собираем все спринты в один плоский массив
        const rawSprints = (sprintArrays as any[]).flat();
        
        // 2. Убираем дубликаты, используя Map (ключ — id спринта)
        const uniqueSprintsMap = new Map<number, Sprint>();
        rawSprints.forEach(sprint => {
          if (sprint && sprint.id) {
            uniqueSprintsMap.set(sprint.id, sprint);
          }
        });

        // 3. Превращаем обратно в массив
        this.allSprints = Array.from(uniqueSprintsMap.values());
      }),
      // После спринтов загружаем задачи
      switchMap(() => this.taskService.getTasks().pipe(
        catchError(() => of([]))
      )),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (tasks) => {
        this.myTasks = tasks || [];
      },
      error: (err) => console.error('Ошибка загрузки дашборда:', err)
    });
  }

  toggleSprintSelection(sprintId: number): void {
    const index = this.selectedSprintIds.indexOf(sprintId);
    if (index > -1) {
      this.selectedSprintIds.splice(index, 1);
    } else {
      this.selectedSprintIds.push(sprintId);
    }
  }

  isSprintSelected(sprintId: number): boolean {
    return this.selectedSprintIds.includes(sprintId);
  }

  get filteredTasks(): Task[] {
    if (this.selectedSprintIds.length === 0) {
      return this.myTasks;
    }
    return this.myTasks.filter(t => t.sprint && this.selectedSprintIds.includes(t.sprint));
  }

  openModal(): void {
    this.newBoard = { title: '', description: '' };
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
        this.router.navigate(['/boards', board.id]);
      },
      error: (err) => console.error(err)
    });
  }
}