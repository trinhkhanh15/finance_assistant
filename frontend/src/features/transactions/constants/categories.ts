export const TRANSACTION_CATEGORIES = [
  'food and drink',
  'shopping',
  'investment',
  'income',
  'subscription',
  'moving',
  'entertainment',
  'other',
] as const

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number]
