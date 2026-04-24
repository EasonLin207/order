/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { OrderForm } from './components/OrderForm';
import { PublicOrderList } from './components/PublicOrderList';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthGate } from './components/AuthGate';
import { AppMode } from './types';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [mode, setMode] = useState<AppMode>('customer');

  return (
    <AppProvider>
      <Toaster position="top-center" />
      <Layout mode={mode} setMode={setMode}>
        {mode === 'customer' ? (
          <>
            <OrderForm />
            <PublicOrderList />
          </>
        ) : (
          <AuthGate>
            <AdminDashboard />
          </AuthGate>
        )}
      </Layout>
    </AppProvider>
  );
}
