// import * as classNames from 'classnames';
// import * as React from 'react';
// import { TodoModel } from '../../models';
// import * as style from './style.css';

// export const FILTER_TITLES = {
//   [TodoModel.Filter.SHOW_ALL]: 'All',
//   [TodoModel.Filter.SHOW_ACTIVE]: 'Active',
//   [TodoModel.Filter.SHOW_COMPLETED]: 'Completed',
// };

// export namespace Footer {
//   export interface Props {
//     filter: TodoModel.Filter;
//     activeCount?: number;
//     completedCount?: number;
//     onClickFilter: (filter: TodoModel.Filter) => any;
//     onClickClearCompleted: () => any;
//   }
// }

// export class Footer extends React.Component<Footer.Props> {
//   public static defaultProps: Partial<Footer.Props> = {
//     activeCount: 0,
//     completedCount: 0,
//   };

//   public renderTodoCount(): JSX.Element {
//     const { activeCount } = this.props;
//     const itemWord = activeCount === 1 ? 'item' : 'items';

//     return (
//       <span className={style.count}>
//         <strong>{activeCount || 'No'}</strong> {itemWord} left
//       </span>
//     );
//   }

//   public renderFilterLink(filter: TodoModel.Filter): JSX.Element {
//     const { filter: selectedFilter, onClickFilter } = this.props;

//     return (
//       <a
//         className={classNames({ [style.selected]: filter === selectedFilter })}
//         style={{ cursor: 'pointer' }}
//         onClick={() => onClickFilter(filter)}
//         children={FILTER_TITLES[filter]}
//       />
//     );
//   }

//   public renderClearButton(): JSX.Element | void {
//     const { completedCount, onClickClearCompleted } = this.props;
//     if (completedCount! > 0) {
//       return (
//         <button
//           className={style.clearCompleted}
//           onClick={onClickClearCompleted}
//           children={'Clear completed'}
//         />
//       );
//     }
//   }

//   public render() {
//     return (
//       <footer className={style.normal}>
//         {this.renderTodoCount()}
//         <ul className={style.filters}>
//           {(Object.keys(TodoModel.Filter) as Array<keyof typeof TodoModel.Filter>).map((key) => (
//             <li key={key} children={this.renderFilterLink(TodoModel.Filter[key])} />
//           ))}
//         </ul>
//         {this.renderClearButton()}
//       </footer>
//     );
//   }
// }
