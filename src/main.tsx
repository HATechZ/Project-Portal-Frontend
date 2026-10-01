import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { router } from '@/routes/router';
import { queryClient } from '@/services/queryClient';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/global.css';
import '@/styles/settings.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
    </QueryClientProvider>
  </React.StrictMode>,
);
