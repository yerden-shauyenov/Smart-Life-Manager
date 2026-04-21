import { Pipe, PipeTransform } from '@angular/core';
import { LangService } from '../services/lang.service';
import { translations } from '../i18n/translations';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private lang: LangService) {}

  transform(key: string): string {
    return translations[this.lang.current]?.[key] ?? translations['en'][key] ?? key;
  }
}
