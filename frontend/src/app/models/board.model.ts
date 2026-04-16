export interface Board {
    id: number;
    title: string;
    description: string;
    owner: string;
    created_at: string;
}

export interface Sprint {
    id: number;
    board: number;
    name: string;
    goal: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
}

export interface TaskStatus {
    id: number;
    board: number;
    name: string;
    order: number;
}

export interface TaskPriority {
    id: number;
    board: number;
    name: string;
    color_hex: string;
    level: number;
}

export interface TaskType {
    id: number;
    board: number;
    name: string;
    icon_name: string;
}

export interface BoardRole {
    id: number;
    board: number;
    name: string;
    can_manage_board: boolean;
    can_manage_members: boolean;
    can_create_tasks: boolean;
    can_edit_tasks: boolean;
    can_delete_tasks: boolean;
}

export interface BoardMembership {
    id: number;
    user: number;
    user_username: string;
    board: number;
    role: number;
    role_name: string;
    joined_at: string;
}