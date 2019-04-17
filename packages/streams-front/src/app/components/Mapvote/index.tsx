import { Match } from '@r6ru/db';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { connect } from 'socket.io-client';
import { IIDPath } from '../../';
// import { Footer, Header, TodoList } from '..';
import * as style from './style.css';

export interface IMapvoteProps extends RouteComponentProps<IIDPath> {
  // filter: TodoModel.Filter;
}

export class Mapvote extends React.Component<IMapvoteProps> {
  public static defaultProps: Partial<IMapvoteProps> = {

  };

  public socket: SocketIOClient.Socket;

  public async init(data: Match) {
    console.log(data);
  }
  public async swap(data: Match) {
    console.log(data);
  }
  public async vote(data: Match) {
    console.log(data);
  }

  public async componentDidMount() {
    this.socket.on('init', this.init);
    this.socket.on('swap', this.swap);
    this.socket.on('map_vote', this.vote);
    this.socket.emit('subscribe', {
      id: location.hash.slice(1),
      room: 'map_vote',
    });
  }

  constructor(props: IMapvoteProps, context?: any) {
    super(props, context);
    this.socket = connect('http://localhost:3001');
  }

  public render() {
    // const { todos, actions, filter } = this.props;
    // const activeCount = todos.length - todos.filter((todo) => todo.completed).length;
    // const filteredTodos = filter ? todos.filter(FILTER_FUNCTIONS[filter]) : todos;
    // const completedCount = todos.reduce((count, todo) => (todo.completed ? count + 1 : count), 0);

    return (
      <div className={style.normal}>
        САНЯ ХУЙ СОСИ
        {/* <Header addTodo={actions.addTodo} />
        <TodoList todos={filteredTodos} actions={actions} />
        <Footer
          filter={filter}
          activeCount={activeCount}
          completedCount={completedCount}
          onClickClearCompleted={this.handleClearCompleted}
          onClickFilter={this.handleFilterChange}
        /> */}
      </div>
    );
  }
}
