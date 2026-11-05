import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Card, CardContent } from '../../components/ui/Card';
import { Wrench } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex p-3 bg-civic-forest text-white rounded-xl shadow-md mb-3">
          <Wrench className="h-7 w-7 text-civic-light" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Sign In to MCTEB
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Municipal Community Tool & Equipment Bank — Basco, Batanes
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan.d@basco.net"
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full">
                  Sign In
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-700/60 pt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                New to MCTEB?{' '}
                <Link to="/register" className="font-semibold text-civic-deep dark:text-civic-light hover:underline">
                  Register as a borrower
                </Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Demo Credentials:</p>
              <p>Borrower: <code className="text-slate-700 dark:text-slate-300">maria.c@basco.net</code> / <code className="text-slate-700 dark:text-slate-300">Basco@2026!</code></p>
              <p>Staff: <code className="text-slate-700 dark:text-slate-300">staff@basco.gov.ph</code> / <code className="text-slate-700 dark:text-slate-300">Basco@2026!</code></p>
              <p>Admin: <code className="text-slate-700 dark:text-slate-300">admin@basco.gov.ph</code> / <code className="text-slate-700 dark:text-slate-300">Basco@2026!</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

