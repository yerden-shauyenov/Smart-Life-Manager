export interface Task {
  id: number;
  title: string;
  description: string;
  board: number;
  sprint: number | null;
  status: number;
  status_name: string;
  priority: number | null;
  priority_name: string;
  task_type: number | null;
  type_name: string;
  author: number;
  assignee: number | null;
  assignee_username: string;
  created_at: string;
}

export interface Comment {
  id: number;
  task: number;
  author: number;
  author_username: string;
  text: string;
  created_at: string;
  updated_at: string;
}