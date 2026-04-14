export interface Habit {
  id: number;
  name: string;
  completedDays: boolean[]; // Array of 7 elements [пн, вт, ср, чт, пт, сб, вс]
  streak: number;
}