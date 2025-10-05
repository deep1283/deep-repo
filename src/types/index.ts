export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_admin: boolean;
  is_removed: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  is_ai: boolean;
  created_at: string;
}

export interface ChatUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_admin: boolean;
  is_removed: boolean;
}
