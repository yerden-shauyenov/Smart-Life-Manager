import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    message: string;
    type: 'success' | 'error';
    id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    toasts$ = this.toastsSubject.asObservable();
    private counter = 0;

    show(message: string, type: 'success' | 'error' = 'success') {
        const id = this.counter++;
        const toast: Toast = { id, message, type };
        this.toastsSubject.next([...this.toastsSubject.value, toast]);

        setTimeout(() => this.remove(id), 5000);
    }

    remove(id: number) {
        this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
    }
}