import { Icon, Menu } from 'antd';
import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import withContext from '../contextWrapper';

const HeaderMenu = withContext(({actions, state }) => (
  <Menu theme="dark" onClick={actions.TAB_SELECT} selectedKeys={['index', state.tab]} mode="horizontal" style={{ lineHeight: '64px' }}>
    <Menu.Item key="index">
      <Link to="/" className="logo">Rainbow6-RUSSIA</Link>
    </Menu.Item>
    <Menu.Item key="donate">
      <Icon type="bulb" />
      <Link to="/donate" >Donate {state.tab}</Link>
    </Menu.Item>
    <Menu.Item key="about">
      <Icon type="gateway" />
      <Link to="/about">About</Link>
    </Menu.Item>
  </Menu>
));

export default HeaderMenu;
