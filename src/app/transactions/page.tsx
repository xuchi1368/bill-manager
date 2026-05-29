'use client';

import { useEffect, useState, useCallback } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);

  const load = useCallback(() => {
    fetch('/api/transactions?limit=100')
      .then((r) => r.json())
      .then(setTransactions);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">📝 记账</h2>
      <TransactionForm onCreated={load} />
      <TransactionList transactions={transactions} />
    </div>
  );
}
