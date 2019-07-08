import { handleActions } from 'redux-actions';
import { TodoActions } from '../actions/todos';
import { TodoModel } from '../models';
import { RootState } from './state';

const initialState: RootState.TodoState = [
  {
    completed: false,
    id: 1,
    text: 'Use Redux',
  },
];

export const todoReducer = handleActions<RootState.TodoState, TodoModel>(
  {
    [TodoActions.Type.ADD_TODO]: (state, action) => {
      if (action.payload && action.payload.text) {
        return [
          {
            completed: false,
            id: state.reduce((max, todo) => Math.max(todo.id || 1, max), 0) + 1,
            text: action.payload.text,
          },
          ...state,
        ];
      }
      return state;
    },
    [TodoActions.Type.DELETE_TODO]: (state, action) => {
      return state.filter(todo => todo.id !== (action.payload as any));
    },
    [TodoActions.Type.EDIT_TODO]: (state, action) => {
      return state.map(todo => {
        if (!todo || !action || !action.payload) {
          return todo;
        }
        return (todo.id || 0) === action.payload.id ? { ...todo, text: action.payload.text } : todo;
      });
    },
    [TodoActions.Type.COMPLETE_TODO]: (state, action) => {
      return state.map(todo =>
        todo.id === (action.payload as any) ? { ...todo, completed: !todo.completed } : todo,
      );
    },
    [TodoActions.Type.COMPLETE_ALL]: (state, action) => {
      return state.map(todo => ({ ...todo, completed: true }));
    },
    [TodoActions.Type.CLEAR_COMPLETED]: (state, action) => {
      return state.filter(todo => todo.completed === false);
    },
  },
  initialState,
);
