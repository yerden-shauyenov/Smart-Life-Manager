import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list/task-list';

export const routes: Routes = [
  { path: 'tasks', component: TaskListComponent },
  { path: '', redirectTo: '/tasks', pathMatch: 'full' }
];