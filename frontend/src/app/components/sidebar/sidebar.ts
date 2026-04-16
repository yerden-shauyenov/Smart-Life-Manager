import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  openMenuBoardId: number | null = null;

  constructor(
    private boardService: BoardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBoards();
    this.boardService.selectedBoard$.subscribe(board => {
      this.selectedBoard = board;
    });
  }

  loadBoards() {
    this.boardService.getBoards().subscribe(boards => {
      this.boards = boards;
      if (boards.length > 0 && !this.selectedBoard) {
        this.selectBoard(boards[0]);
      }
    });
  }

  selectBoard(board: Board) {
    this.boardService.selectBoard(board);
    this.router.navigate(['/tasks']);
  }

  toggleMenu(event: MouseEvent, boardId: number) {
    event.stopPropagation();
    this.openMenuBoardId = this.openMenuBoardId === boardId ? null : boardId;
  }

  deleteBoard(event: MouseEvent, board: Board) {
    event.stopPropagation();
    if (!confirm(`Delete "${board.title}"? This cannot be undone.`)) return;
    this.boardService.deleteBoard(board.id).subscribe(() => {
      if (this.selectedBoard?.id === board.id) {
        this.boardService.selectBoard(null as any);
        this.router.navigate(['/dashboard']);
      }
      this.loadBoards();
    });
    this.openMenuBoardId = null;
  }

  @HostListener('document:click')
  closeMenus() {
    this.openMenuBoardId = null;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
  }
}