import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkSubject: BehaviorSubject<boolean>;
  dark$;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    const initial = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))
      : false;

    this.darkSubject = new BehaviorSubject<boolean>(initial);
    this.dark$ = this.darkSubject.asObservable();
    this.apply(initial);
  }

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  toggle(): void {
    const next = !this.isDark;
    this.darkSubject.next(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }
    this.apply(next);
  }

  private apply(dark: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.toggle('dark', dark);
    }
  }
}
