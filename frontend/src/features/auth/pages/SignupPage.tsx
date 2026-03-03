import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSignup } from '../hooks/use-auth'

export function SignupPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const signup = useSignup()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    if (password !== confirmPassword) {
      return
    }
    signup.mutate({ username: username.trim(), password })
  }

  const passwordsMatch = !confirmPassword || password === confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={signup.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={signup.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={signup.isPending}
                className={!passwordsMatch ? 'border-destructive' : ''}
              />
              {!passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={signup.isPending || !passwordsMatch || !username.trim() || !password}
            >
              {signup.isPending ? 'Signing up...' : 'Sign up'}
              </Button>
            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
