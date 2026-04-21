import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: `./toast.html`,
  styles: [`
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(100%) scale(0.9); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toast-out {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(50%) scale(0.9); }
    }
    .toast-enter {
      animation: toast-in 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .toast-leave {
      animation: toast-out 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `]
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  remove(id: number) {
    this.toastService.remove(id);
  }
}