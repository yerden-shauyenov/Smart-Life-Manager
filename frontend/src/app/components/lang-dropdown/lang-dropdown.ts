import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService, Lang } from '../../services/lang.service';

@Component({
  selector: 'app-lang-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-dropdown.html'
})
export class LangDropdownComponent {
  langService = inject(LangService);
  private el = inject(ElementRef);
  isOpen = false;

  readonly options: { value: Lang; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'ru', label: 'RU' },
  ];

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  select(lang: Lang, event: Event): void {
    event.stopPropagation();
    this.langService.set(lang);
    this.isOpen = false;
  }

  @HostListener('document:click')
  onOutsideClick(): void {
    this.isOpen = false;
  }
}
