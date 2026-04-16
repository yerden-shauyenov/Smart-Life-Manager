import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  private readonly boardService = inject(BoardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Output() openBoardSettings = new EventEmitter<Board>();

  boards: Board[] = [];
  selectedBoard: Board | null = null;
  username = '';

  ngOnInit(): void {
    this.username = this.authService.getUsername();

    if (this.authService.hasToken()) {
      this.loadBoards();
    }

    this.boardService.selectedBoard$.subscribe(board => {
      this.selectedBoard = board;
    });
  }

  loadBoards(): void {
    this.boardService.getBoards().subscribe({
      next: (boards) => {
        this.boards = boards;
        if (boards.length > 0 && !this.selectedBoard) {
          this.selectBoard(boards[0]);
        }
      },
      error: () => this.boards = []
    });
  }

  selectBoard(board: Board): void {
    this.boardService.selectBoard(board);
    this.router.navigate(['/tasks']);
  }

  onBoardSettings(event: MouseEvent, board: Board): void {
    event.stopPropagation();
    this.openBoardSettings.emit(board);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userInitial(): string {
    return this.username ? this.username[0].toUpperCase() : '?';
  }
}