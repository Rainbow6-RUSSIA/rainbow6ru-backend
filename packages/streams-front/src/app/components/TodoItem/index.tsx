// import * as classNames from 'classnames';
// import * as React from 'react';
// import { TodoActions } from '../../actions';
// import { TodoModel } from '../../models';
// import { TodoTextInput } from '../TodoTextInput';
// import * as style from './style.css';

// export namespace TodoItem {
//   export interface Props {
//     todo: TodoModel;
//     editTodo: typeof TodoActions.editTodo;
//     deleteTodo: typeof TodoActions.deleteTodo;
//     completeTodo: typeof TodoActions.completeTodo;
//   }

//   export interface State {
//     editing: boolean;
//   }
// }

// export class TodoItem extends React.Component<TodoItem.Props, TodoItem.State> {
//   constructor(props: TodoItem.Props, context?: any) {
//     super(props, context);
//     this.state = { editing: false };
//   }

//   public handleDoubleClick() {
//     this.setState({ editing: true });
//   }

//   public handleSave(id: number, text: string) {
//     if (text.length === 0) {
//       this.props.deleteTodo(id);
//     } else {
//       this.props.editTodo({ id, text });
//     }
//     this.setState({ editing: false });
//   }

//   public render() {
//     const { todo, completeTodo, deleteTodo } = this.props;

//     let element;
//     if (this.state.editing) {
//       element = (
//         <TodoTextInput
//           text={todo.text}
//           editing={this.state.editing}
//           onSave={(text) => todo.id && this.handleSave(todo.id, text)}
//         />
//       );
//     } else {
//       element = (
//         <div className={style.view}>
//           <input
//             className={style.toggle}
//             type="checkbox"
//             checked={todo.completed}
//             onChange={() => todo.id && completeTodo(todo.id)}
//           />
//           <label onDoubleClick={() => this.handleDoubleClick()}>{todo.text}</label>
//           <button
//             className={style.destroy}
//             onClick={() => {
//               if (todo.id) { deleteTodo(todo.id); }
//             }}
//           />
//         </div>
//       );
//     }

//     // TODO: compose
//     const classes = classNames({
//       [style.completed]: todo.completed,
//       [style.editing]: this.state.editing,
//       [style.normal]: !this.state.editing,
//     });

//     return <li className={classes}>{element}</li>;
//   }
// }
