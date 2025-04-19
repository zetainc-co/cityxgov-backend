export interface User {
  identification: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string[];
  token: string;
  created_at: string;
  is_active: boolean;
}

export class NewUser {
  identification: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  roles?: string[];
}

export interface UserResponse {
  identification: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string[];
  is_active: boolean;
}

export interface CreateUserResponse {
  status: boolean;
  message: string;
  data?: UserResponse[];
  error?: any;
}

export interface CreateUserRequest {
  user: NewUser;
}
