// import * as React from 'react';
// import { TodoActions } from '../../actions/todos';
// import { TodoModel } from '../../models/TodoModel';
// import { TodoItem } from '../TodoItem';
// import * as style from './style.css';

// export namespace TodoList {
//   export interface Props {
//     todos: TodoModel[];
//     actions: TodoActions;
//   }
// }

// export class TodoList extends React.Component<TodoList.Props> {
//   public renderToggleAll(): JSX.Element | void {
//     const { todos, actions } = this.props;
//     if (todos.length > 0) {
//       const hasIncompleted = todos.some((todo) => !todo.completed);
//       return (
//         <input
//           className={style.toggleAll}
//           type="checkbox"
//           checked={hasIncompleted}
//           onChange={actions.completeAll}
//         />
//       );
//     }
//   }

//   public render() {
//     const { todos, actions } = this.props;
//     return (
//       <section className={style.main}>
//         {this.renderToggleAll()}
//         <ul className={style.normal}>
//           {todos.map((todo) => (
//             <TodoItem
//               key={todo.id}
//               todo={todo}
//               completeTodo={actions.completeTodo}
//               deleteTodo={actions.deleteTodo}
//               editTodo={actions.editTodo}
//             />
//           ))}
//         </ul>
//       </section>
//     );
//   }
// }
