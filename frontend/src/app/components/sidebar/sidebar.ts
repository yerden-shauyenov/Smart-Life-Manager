import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  private readonly boardService = inject(BoardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  boards: Board[] = [];
  selectedBoard: Board | null = null;
  username = '';

  ngOnInit(): void {
    this.username = this.authService.getUsername() || "null";

    if (this.authService.hasToken()) {
      this.boardService.boards$.subscribe(boards => {
        this.boards = boards;
        this.cdr.detectChanges();
      });

      this.boardService.refreshBoards();
    }

    this.boardService.selectedBoard$.subscribe(board => {
      this.selectedBoard = board;
      this.cdr.detectChanges();
    });
  }

  loadBoards(): void {
    this.boardService.getBoards().subscribe({
      next: (boards) => {
        this.boards = boards;
        this.cdr.detectChanges();
      }
    });
  }

  selectBoard(board: Board): void {
    this.boardService.selectBoard(board);
    this.router.navigate(['/boards', board.id]);
  }

  onBoardSettings(event: MouseEvent, board: Board): void {
    event.stopPropagation();
    this.boardService.selectBoard(board);
    this.router.navigate(['/boards', board.id, 'settings']);
  }

  goToDashboard(): void {
    this.boardService.selectBoard(null as any);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userInitial(): string {
    return this.username ? this.username.substring(0, 2) : '?';
  }
}