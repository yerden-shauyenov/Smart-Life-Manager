import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit } from '../../models/habit.model';

@Component({
  selector: 'app-habit-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-tracker.html',
})
export class HabitTrackerComponent {
  daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  habits: Habit[] = [
    {
      id: 1,
      name: 'LeetCode Practice',
      completedDays: [true, true, false, false, false, false, false],
      streak: 2
    },
    {
      id: 2,
      name: 'Gym / Workout',
      completedDays: [true, false, true, false, false, false, false],
      streak: 1
    }
  ];

  toggleDay(habitId: number, dayIndex: number) {
    const habit = this.habits.find(h => h.id === habitId);
    if (habit) {
      habit.completedDays[dayIndex] = !habit.completedDays[dayIndex];
      this.calculateStreak(habit);
    }
  }

  private calculateStreak(habit: Habit) {
    let currentStreak = 0;
    for (let i = 0; i < habit.completedDays.length; i++) {
      if (habit.completedDays[i]) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break;
      }
    }
    habit.streak = currentStreak;
  }
}