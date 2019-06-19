import React from 'react';
import './App.css';
import logo from './logo.svg';

import { User } from '@r6ru/db';

let u: User;

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Отредактируй <code>src/App.tsx</code> и сохрани, шоб можно было флексить
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Press F to pay respects {u.genome}
        </a>
      </header>
    </div>
  );
};

export default App;
