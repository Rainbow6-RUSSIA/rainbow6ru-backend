import { Vote as V } from '@r6ru/db';
import * as React from 'react';
import { FadeInDown } from '.';
import * as style from './style.css';

export interface IVoteProps {
    vote: V;
}

export interface IVoteState {
  isVisible: boolean;
}

export class Vote extends React.Component<IVoteProps, IVoteState> {

  public readonly state: IVoteState = {
    isVisible: false,
  };

  public async componentDidMount() {
        setTimeout(() => {
          this.setState({ isVisible: true });
        }, 1000);
    }

  public render() {

    if (!this.props.vote) { return null; }

    return (
      <FadeInDown className={[style.logAction, this.props.vote.type === 'ban' ? style.logActionRed : style.logActionGreen].join(' ')} pose={this.state.isVisible ? 'out' : 'in'} style={{backgroundImage: `url(${this.props.vote.map.splash})`}}>
        <div className={style.glyphPlaceholder}>
            <i className="material-icons" style={{fontSize: '100px'}}>{this.props.vote.type === 'ban' ? 'clear' : 'check'}</i>
        </div>
        <p className={style.teamActionText}>{this.props.vote.map.titleRu}</p>
      </FadeInDown>
    );
  }
}
