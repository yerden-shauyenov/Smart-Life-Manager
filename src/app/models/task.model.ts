export interface Task {
  id?: number;
  title: string;
  description?: string;
  is_completed: boolean;
  created_at: string;
}

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}