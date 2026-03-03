import { useState, useRef } from 'react'
import { Plus, Upload, Tag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUncategorizedTransactions, useImportCsv } from '../hooks/use-transactions'
import { TransactionModal } from '../components/TransactionModal'
import { CategorizeModal } from '../components/CategorizeModal'
import type { ViewTransaction } from '../api'

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [categorizeTransaction, setCategorizeTransaction] = useState<ViewTransaction | null>(null)
  const [categorizeOpen, setCategorizeOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: uncategorized = [], isLoading, isError, error } = useUncategorizedTransactions()
  const importCsv = useImportCsv()

  const handleImportClick = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importCsv.mutate(file)
      e.target.value = ''
    }
  }

  const openCategorize = (t: ViewTransaction) => {
    setCategorizeTransaction(t)
    setCategorizeOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Uncategorized transactions, add manually or import CSV.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={handleImportClick} disabled={importCsv.isPending}>
            {importCsv.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">Import CSV</span>
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="ml-2">Add transaction</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uncategorized transactions</CardTitle>
          <CardDescription>
          Transactions imported from CSV without a category. Click &quot;Categorize&quot; to assign one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {isError && (
            <p className="text-destructive py-4">
              {(error as { message?: string })?.message || 'Failed to load list.'}
              </p>
          )}
          {!isLoading && !isError && uncategorized.length === 0 && (
            <p className="text-muted-foreground py-8 text-center">
              No uncategorized transactions.
            </p>
          )}
          {!isLoading && !isError && uncategorized.length > 0 && (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left font-medium p-3">Date</th>
                    <th className="text-left font-medium p-3">Description</th>
                    <th className="text-right font-medium p-3">Amount</th>
                    <th className="w-[120px]" />
                  </tr>
                </thead>
                <tbody>
                  {uncategorized.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3">{formatDate(t.date)}</td>
                      <td className="p-3">{t.description || '—'}</td>
                      <td className="p-3 text-right font-medium">
                        {t.amount.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCategorize(t)}
                          className="gap-1"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          Categorize
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionModal open={modalOpen} onOpenChange={setModalOpen} />
      <CategorizeModal
        open={categorizeOpen}
        onOpenChange={setCategorizeOpen}
        transaction={categorizeTransaction}
      />
    </div>
  )
}
