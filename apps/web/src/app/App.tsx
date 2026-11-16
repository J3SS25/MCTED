import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../lib/auth-context';
import { ThemeProvider } from '../lib/theme-context';
import { WishlistCartProvider } from '../lib/wishlist-cart-context';
import { AppShell } from '../components/layout/AppShell';
import { AppRoutes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WishlistCartProvider>
            <BrowserRouter>
              <AppShell>
                <AppRoutes />
              </AppShell>
            </BrowserRouter>
          </WishlistCartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

