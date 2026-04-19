import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TaskListComponent } from './components/task-list/task-list';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { BoardSettingsComponent } from './components/board-settings/board-settings';
import { BacklogComponent } from './components/backlog/backlog';
import { authGuard } from './guards/auth.guard';
import {ProfileComponent} from "./components/profile/profile";

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'boards/:id',
    component: TaskListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'boards/:id/backlog',
    component: BacklogComponent,
    canActivate: [authGuard]
  },
  {
    path: 'boards/:id/settings',
    component: BoardSettingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'boards/:id/tasks/:taskId',
    component: TaskListComponent,
    canActivate: [authGuard]
  },
  { path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];