import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    isLoading = signal<boolean>(false);
    private activeRequests = 0;

    private timeoutId: any;
    private readonly delayMs = 250;

    show() {
        this.activeRequests++;

        if (this.activeRequests === 1) {
            this.timeoutId = setTimeout(() => {
                this.isLoading.set(true);
            }, this.delayMs);
        }
    }

    hide() {
        this.activeRequests--;

        if (this.activeRequests <= 0) {
            this.activeRequests = 0;

            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }

            this.isLoading.set(false);
        }
    }
}