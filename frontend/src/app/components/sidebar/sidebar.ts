import { Component, OnInit, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() isOpen = false;
  @Output() closeSidebarEvent = new EventEmitter<void>();

  private readonly boardService = inject(BoardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  boards: Board[] = [];
  selectedBoard: Board | null = null;

  ngOnInit(): void {
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

}