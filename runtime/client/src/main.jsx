import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './components/App';

import './index.css';

const domRoot = document.getElementById('root');
const reactRoot = ReactDOM.createRoot(domRoot);

reactRoot.render(<App />);
