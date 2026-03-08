import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, type SignupRequest } from '../api'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'

export function useBalance() {
  return useQuery({
    queryKey: ['user', 'balance'],
    queryFn: authApi.getBalance,
    retry: false,
  })
}

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      authApi.login(data).then((r) => r.data),
    onSuccess: (data, variables) => {
      setAuth(data.access_token, { id: 0, username: variables.username })
      toast({ title: 'Logged in successfully', variant: 'success' })
      navigate('/dashboard', { replace: true })
    },
    onError: (err: { response?: { status: number; data?: { detail?: string } } }) => {
      const msg =
        err.response?.status === 401
          ? 'Invalid username or password'
          : (err.response?.data?.detail as string) || 'Login failed'
      toast({ title: msg, variant: 'destructive' })
    },
  })
}

export function useSignup() {
  const navigate = useNavigate()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: SignupRequest) =>
      authApi.signup(data).then((r) => r.data),
    onSuccess: () => {
      toast({ title: 'Signed up successfully. Please log in.', variant: 'success' })
      navigate('/login', { replace: true })
    },
    onError: (err: { response?: { status: number; data?: { detail?: string } } }) => {
      const msg =
        err.response?.status === 400
          ? (err.response?.data?.detail as string) || 'Invalid data'
          : (err.response?.data?.detail as string) || 'Sign up failed'
      toast({ title: msg, variant: 'destructive' })
    },
  })
}
