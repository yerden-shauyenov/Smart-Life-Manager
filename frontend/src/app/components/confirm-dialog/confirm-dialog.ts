import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmState } from '../../services/confirm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  state: ConfirmState | null = null;
  private sub!: Subscription;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit() {
    this.sub = this.confirmService.confirmState$.subscribe(state => {
      this.state = state;
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  onConfirm() {
    if (this.state) {
      this.state.onConfirm();
    }
    this.close();
  }

  close() {
    this.confirmService.close();
  }
}