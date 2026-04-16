import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { TopBarComponent } from './components/top-bar/top-bar';
import { filter, map, startWith } from 'rxjs';
import {AuthService} from "./services/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule, RouterOutlet, TopBarComponent],
  templateUrl: './app.html'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  isAuthPage$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url === '/login'),
      startWith(this.router.url === '/login')
  );

  showSidebar = false;

  ngOnInit() {
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const publicRoutes = ['/login', '/register'];
      const isPublicRoute = publicRoutes.includes(this.router.url);
      const hasToken = this.authService.hasToken();

      this.showSidebar = !isPublicRoute && hasToken;

      if (!hasToken && !isPublicRoute) {
        this.router.navigate(['/login']);
      }
    });
  }
}