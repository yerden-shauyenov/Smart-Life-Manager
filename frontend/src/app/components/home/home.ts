import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { LangService } from '../../services/lang.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LangDropdownComponent } from '../lang-dropdown/lang-dropdown';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, LangDropdownComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  themeService = inject(ThemeService);
  langService = inject(LangService);
}