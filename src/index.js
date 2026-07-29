import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { ContextProvider } from "./context/contextProvider";
import { GlobalProvider } from './context/globalProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ContextProvider>
      <GlobalProvider>
        <Router>
          <App />
        </Router>
      </GlobalProvider>
    </ContextProvider>
  </React.StrictMode >
);