import React from 'react';
import App, { Context } from './App';

export default (Component: React.FC<typeof Context>) => () => (<App.CConsumer>{context => (<Component {...context}/>)}</App.CConsumer>);
