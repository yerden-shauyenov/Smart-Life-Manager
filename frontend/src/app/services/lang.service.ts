import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en' | 'ru';

@Injectable({ providedIn: 'root' })
export class LangService {
  private langSubject: BehaviorSubject<Lang>;
  lang$;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    const stored = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('lang') as Lang | null)
      : null;
    const initial: Lang = stored === 'ru' ? 'ru' : 'en';
    this.langSubject = new BehaviorSubject<Lang>(initial);
    this.lang$ = this.langSubject.asObservable();
  }

  get current(): Lang {
    return this.langSubject.value;
  }

  get isRu(): boolean {
    return this.langSubject.value === 'ru';
  }

  set(lang: Lang): void {
    this.langSubject.next(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', lang);
    }
  }

  toggle(): void {
    this.set(this.current === 'en' ? 'ru' : 'en');
  }
}
