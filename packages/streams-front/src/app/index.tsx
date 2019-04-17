import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router';
// import { App as TodoApp } from './components/App';
import { Mapvote } from './components/Mapvote';

export interface IIDPath {
  id: string;
}

export const App = hot(module)(() => (
  <Switch>
    {/* <Route path="/" component={Mapvote} /> */}
    <Route path="/map_vote" component={Mapvote} />
    <Route path="/user_vote" component={Mapvote} />
    <Route path="/header" component={Mapvote} />
  </Switch>
));
