export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  username: string;
}
