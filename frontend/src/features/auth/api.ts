import { api } from '@/api/axios'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface SignupRequest {
  username: string
  password: string
  age: number
  sex: string
}

export interface UserResponse {
  id: number
  username: string
}

export interface BalanceResponse {
  balance: number
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>(
      '/user/login',
      new URLSearchParams({ username: data.username, password: data.password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ),

  signup: (data: SignupRequest) => api.post<UserResponse>('/user/signup', data),

  getBalance: () => api.get<BalanceResponse>('/user/balance').then((r) => r.data),
}
