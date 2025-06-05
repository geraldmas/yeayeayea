// Point d'entrée de l'application React. Ce fichier monte le composant App
// dans l'élément DOM "root" et initialise éventuellement la mesure des
// performances.
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './theme/globalStyles.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
