import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PiggyBank, Receipt, CreditCard, LogOut, Wallet, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useBalance } from '@/features/auth/hooks/use-auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/budget', label: 'Budget', icon: Banknote },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const { data: balanceData } = useBalance()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border space-y-1">
          <h2 className="font-semibold text-lg text-foreground">FA</h2>
          {user?.username && (
            <p className="text-xs text-muted-foreground truncate">{user.username}</p>
          )}
          {balanceData != null && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground pt-1">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>Balance: {Number(balanceData.balance).toLocaleString('en-US')}</span>
            </div>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
