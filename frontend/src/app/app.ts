import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar';
import { RouterOutlet, RouterModule } from '@angular/router';
import { TopBarComponent } from './components/top-bar/top-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule, RouterOutlet, TopBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'Smart Life Manager';
}