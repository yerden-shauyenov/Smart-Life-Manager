export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
}

export interface UserSession {
    id: number;
    ip_address: string;
    os: string;
    browser: string;
    device: string;
    is_active: boolean;
    created_at: string;
    last_activity: string;
}

export interface BoardInvitation {
    id: number;
    board: { id: number; name: string };
    inviter: User;
    email: string;
    role: { id: number; name: string };
    status: string;
    created_at: string;
}

export interface OwnershipTransfer {
    id: number;
    board: { id: number; name: string };
    from_user: User;
    to_user: User;
    status: string;
    created_at: string;
}