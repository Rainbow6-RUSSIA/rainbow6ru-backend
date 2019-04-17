import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router';
import { App as TodoApp } from './containers/App';

export const App = hot(module)(() => (
  <Switch>
    <Route path="/" component={TodoApp} />
  </Switch>
));
