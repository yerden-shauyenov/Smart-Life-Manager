export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  type: 'urgent-important' | 'not_urgent-important' | 'urgent-not_important' | 'not_urgent-not_important';
}