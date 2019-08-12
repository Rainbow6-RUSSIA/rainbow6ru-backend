import { Icon, Layout, Menu } from 'antd';
import React from 'react';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import './App.css';

import { ClickParam } from 'antd/lib/menu';
import HeaderMenu from './components/HeaderMenu';
import About from './components/pages/About';
import Donate from './components/pages/Donate';
import Index from './components/pages/Index';

const { Header, Content} = Layout;

export const Context = {
  state: {
    lamps: [] as boolean[],
    doors: [] as boolean[],
    tab: window.location.pathname.split('/')[1] || 'index',
  },
  actions: {
    LOG(...args: any[]) {console.log('[LOG]', ...args); },
    TAB_SELECT(e: ClickParam) {this.setState({ tab: e.key }); },

    setState: console.log, // setState proxy
  },
};

const { Consumer, Provider } = React.createContext<typeof Context>(Context);

export default class App extends React.Component<{}, typeof Context.state> {
  public static CConsumer = Consumer;
  public static CProvider = Provider;

  public state = Context.state;
  public actions = Context.actions;

  public constructor(props: any) {
    super(props);

    (Object.keys(Context.actions) as Array<keyof typeof Context.actions>).map(k => {
      this.actions[k] = this.actions[k].bind(this);
    });
  }

  public render() {
    return (
      <App.CProvider value={{
        state: {...this.state},
        actions: {...this.actions},
      }}>
        <Router>
          <Layout>
            <Header style={{ position: 'fixed', zIndex: 1, width: '100%', padding: '0 0' }}>
              <HeaderMenu />
            </Header>
            <Content style={{ padding: '0 10%', marginTop: 64, backgroundColor: 'pink' }}>
              <Route path="/" exact component={Index} />
              <Route path="/donate" component={Donate} />
              <Route path="/about" component={About} />
            </Content>
          </Layout>
        </Router>
      </App.CProvider>
    );
  }
}
