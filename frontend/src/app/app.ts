import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { TopBarComponent } from './components/top-bar/top-bar';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule, RouterOutlet, TopBarComponent],
  templateUrl: './app.html'
})
export class AppComponent {
  private router = inject(Router);

  isAuthPage$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url === '/login'),
      startWith(this.router.url === '/login')
  );
}