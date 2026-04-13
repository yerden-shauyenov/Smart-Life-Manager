export interface SubTask {
  id: number;
  title: string;
  isCompleted: boolean;
  isEditing: boolean; // Added: for inline subtask title editing
}

export interface TaskGroup {
  id: string;
  name: string;
  isEditing: boolean; // Updated: Made mandatory for consistent group handling
}

export interface Task {
  id: number;
  groupId: string; 
  title: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  type: string;
  subtasks: SubTask[];
}