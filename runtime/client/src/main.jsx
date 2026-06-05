import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AppLayout } from './components/AppLayout';
import { Home } from './components/Home';
import { MLVisuals } from './components/MLVisuals';
import { ErrorFallback } from './components/ErrorFallback';

import './index.css';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/visuals', element: <MLVisuals /> },
    ],
  },
]);

const domRoot = document.getElementById('root');
const reactRoot = ReactDOM.createRoot(domRoot);

reactRoot.render(<RouterProvider router={router} />);
