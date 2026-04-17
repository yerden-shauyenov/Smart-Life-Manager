import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { Sprint, Board } from '../../models/board.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backlog.html'
})
export class BacklogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private cdr = inject(ChangeDetectorRef);

  boardId!: number;
  board: Board | null = null;
  sprints: any[] = [];
  backlogTasks: any[] = [];

  showCreateSprint = false;
  newSprint: Partial<Sprint> = { name: '', goal: '' };

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.boardId = Number(params.get('id'));
      this.loadData();
    });
  }

  loadData(): void {
    forkJoin({
      board: this.boardService.getBoard(this.boardId),
      sprints: this.boardService.getSprints(this.boardId),
      tasks: this.boardService.getTasks(this.boardId, 'none')
    }).subscribe({
      next: (res) => {
        this.board = res.board;
        this.backlogTasks = res.tasks;
        this.sprints = res.sprints.map((s: any) => ({ ...s, tasks: [] }));

        let loadedSprints = 0;
        if (this.sprints.length === 0) {
          this.cdr.detectChanges();
        } else {
          this.sprints.forEach(sprint => {
            this.boardService.getTasks(this.boardId, sprint.id).subscribe(tasks => {
              sprint.tasks = tasks;
              loadedSprints++;
              if (loadedSprints === this.sprints.length) {
                this.cdr.detectChanges();
              }
            });
          });
        }
      }
    });
  }

  createSprint(): void {
    if (!this.newSprint.name) return;
    this.boardService.createSprint({ ...this.newSprint, board: this.boardId }).subscribe(() => {
      this.newSprint = { name: '', goal: '' };
      this.showCreateSprint = false;
      this.loadData();
    });
  }

  startSprint(sprint: Sprint): void {
    this.boardService.updateSprint(sprint.id, { is_active: true }).subscribe(() => {
      this.router.navigate(['/boards', this.boardId]);
    });
  }

  moveTask(taskId: number, sprintId: string | null): void {
    const payload = { sprint: sprintId ? Number(sprintId) : null };
    this.boardService.updateTask(taskId, payload).subscribe(() => {
      this.loadData();
    });
  }
}