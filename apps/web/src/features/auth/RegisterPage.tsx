import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Card, CardContent } from '../../components/ui/Card';
import { Wrench } from 'lucide-react';
import type { Barangay } from '@mcteb/shared';

const BARANGAYS: Array<{ value: Barangay; label: string }> = [
  { value: 'Chanarian', label: 'Chanarian' },
  { value: 'Ihubok I (Kayvaluganan)', label: 'Ihubok I (Kayvaluganan)' },
  { value: 'Ihubok II (Kaychanarianan)', label: 'Ihubok II (Kaychanarianan)' },
  { value: 'Kayhuvokan', label: 'Kayhuvokan' },
  { value: 'San Antonio', label: 'San Antonio' },
  { value: 'San Joaquin', label: 'San Joaquin' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    birth_date: '1995-01-01',
    barangay: 'San Antonio' as Barangay,
    address: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please check your information.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6">
        <div className="inline-flex p-3 bg-civic-forest text-white rounded-xl shadow-md mb-3">
          <Wrench className="h-7 w-7 text-civic-light" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Register Borrower Account
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Municipality of Basco, Batanes — Residents must be at least 18 years old.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Card>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Juan V. Dela Cruz"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@example.com"
                />

                <Input
                  label="Contact Phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0917-000-0000"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Birth Date"
                  type="date"
                  required
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  helperText="Minimum 18 years old required"
                />

                <Select
                  label="Barangay (Basco)"
                  options={BARANGAYS}
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value as Barangay })}
                />
              </div>

              <Input
                label="Residential Street Address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="National Road / Sitio Disong"
              />

              <Input
                label="Password (min. 8 characters)"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full">
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-700/60 pt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-civic-deep dark:text-civic-light hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

