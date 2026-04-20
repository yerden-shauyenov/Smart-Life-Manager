import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { TopBarComponent } from './components/top-bar/top-bar';
import { filter, map, startWith } from 'rxjs';
import {AuthService} from "./services/auth.service";
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog';
import {ToastComponent} from "./components/toast/toast";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule, RouterOutlet, TopBarComponent, ConfirmDialogComponent, ToastComponent],
  templateUrl: './app.html'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly authRoutes = ['/login', '/register', '/'];
  isAuthPage$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.authRoutes.includes(this.router.url)),
      startWith(this.authRoutes.includes(this.router.url))
  );

  showSidebar = false;
  sidebarOpen = false;

  ngOnInit() {
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const publicRoutes = ['/login', '/register', '/'];
      const isPublicRoute = publicRoutes.includes(this.router.url);
      const hasToken = this.authService.hasToken();

      this.showSidebar = !isPublicRoute && hasToken;
      this.sidebarOpen = false;

      if (!hasToken && !isPublicRoute) {
        this.router.navigate(['/home']);
      }

      if (hasToken && this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}