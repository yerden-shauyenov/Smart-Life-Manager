import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list/task-list';
//import { HabitTrackerComponent } from './components/habit-tracker/habit-tracker';

export const routes: Routes = [
  { path: 'tasks', component: TaskListComponent },
  { path: '', redirectTo: '/tasks', pathMatch: 'full' }, // open tasks
  //{ path: 'habits', component: HabitTrackerComponent },
];