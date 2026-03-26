'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAPI() {
  const [users, setUsers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testCreateUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `TestUser${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          password: 'testpass123'
        }),
      });
      
      const data = await response.json();
      setMessage(data.success ? 'User created successfully!' : `Error: ${data.error}`);
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/balances');
      const data = await response.json();
      if (data.success) {
        setBalances([data.data]); // Wrap in array for display
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const testAddTransaction = async () => {
    if (users.length === 0) {
      setMessage('Please create a user first');
      return;
    }

    setLoading(true);
    try {
      const userId = users[0]._id;
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.floor(Math.random() * 1000) + 100,
          type: Math.random() > 0.5 ? 'credit' : 'debit',
          reason: 'Test transaction',
          userId: userId
        }),
      });
      
      const data = await response.json();
      setMessage(data.success ? 'Transaction added successfully!' : `Error: ${data.error}`);
      if (data.success) {
        fetchBalances();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            API Testing Dashboard
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Test your MongoDB integration with Mongoose
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Operations</CardTitle>
              <CardDescription>Test user creation and retrieval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testCreateUser} 
                disabled={loading}
                className="w-full"
              >
                Create Test User
              </Button>
              <Button 
                onClick={fetchUsers} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Fetch All Users
              </Button>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Users: {users.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance Operations</CardTitle>
              <CardDescription>Test balance and transaction operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testAddTransaction} 
                disabled={loading || users.length === 0}
                className="w-full"
              >
                Add Test Transaction
              </Button>
              <Button 
                onClick={fetchBalances} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Fetch All Balances
              </Button>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Balances: {balances.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-slate-500">No users found</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user._id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-slate-500">ID: {user._id}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balances ({balances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <p className="text-slate-500">No balances found</p>
              ) : (
                <div className="space-y-2">
                  {balances.map((balance) => (
                    <div key={balance._id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                      <p className="font-medium">Global Balance</p>
                      <p className="text-sm">Balance: ${balance.currentBalance}</p>
                      <p className="text-sm text-slate-500">Transactions: {balance.transactions.length}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500">
            Make sure MongoDB is running and MONGODB_URI is set in .env.local
          </p>
        </div>
      </div>
    </div>
  );
}
