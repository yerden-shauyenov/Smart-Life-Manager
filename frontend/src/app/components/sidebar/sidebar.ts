import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardService } from '../../services/board.service';
import { AuthService } from '../../services/auth.service';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit {
  boards: Board[] = [];
  selectedBoard: Board | null = null;

  constructor(
      private boardService: BoardService,
      private authService: AuthService
  ) {}

  ngOnInit() {
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
  }

  logout() {
    this.authService.logout();
  }
}