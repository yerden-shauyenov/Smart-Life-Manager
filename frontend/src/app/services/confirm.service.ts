import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmState {
    message: string;
    onConfirm: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmService {
    private confirmSubject = new Subject<ConfirmState | null>();
    confirmState$ = this.confirmSubject.asObservable();

    requestConfirm(message: string, onConfirm: () => void) {
        this.confirmSubject.next({ message, onConfirm });
    }

    close() {
        this.confirmSubject.next(null);
    }
}