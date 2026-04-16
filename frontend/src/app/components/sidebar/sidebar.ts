import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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
  boards: Board[] = [];
  selectedBoard: Board | null = null;
  username = '';
  showUserMenu = false;

  @Output() openBoardSettings = new EventEmitter<Board>();

  constructor(
    private boardService: BoardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();

    this.boardService.getBoards().subscribe(boards => {
      this.boards = boards;
      if (boards.length > 0 && !this.selectedBoard) {
        this.selectBoard(boards[0]);
      }
    });

    this.boardService.selectedBoard$.subscribe(board => {
      this.selectedBoard = board;
    });
  }

  selectBoard(board: Board) {
    this.boardService.selectBoard(board);
    this.router.navigate(['/tasks']);
  }

  onBoardSettings(event: MouseEvent, board: Board) {
    event.stopPropagation();
    this.openBoardSettings.emit(board);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  logout() {
    this.authService.logout();
  }

  get userInitial(): string {
    return this.username ? this.username[0].toUpperCase() : '?';
  }
}