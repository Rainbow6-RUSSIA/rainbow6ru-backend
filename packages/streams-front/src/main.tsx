import { createHashHistory } from 'history';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router } from 'react-router';
import { App } from './app';

// const history = createBrowserHistory();
const history = createHashHistory();

ReactDOM.render(
    <Router history={history}>
      <App />
    </Router>,
  document.getElementById('root'),
);
