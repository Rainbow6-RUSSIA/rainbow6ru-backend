import { MapR6, Vote } from '@r6ru/db';
import * as React from 'react';
import { FadeInDown } from '.';
import { FooterItem } from './footerItem';
import * as style from './style.css';

export interface IFooterProps {
    votes: Vote[];
    poolCache: MapR6[];
}

export interface IFooterState {
  isVisible: boolean;
}

export class Footer extends React.Component<IFooterProps, IFooterState> {

  public readonly state: IFooterState = {
    isVisible: false,
  };

  public async componentDidMount() {
        setTimeout(() => {
          this.setState({ isVisible: true });
        }, 1000);
    }

  public render() {

    return (
      <FadeInDown className={style.footer} pose={this.state.isVisible ? 'out' : 'in'}>
        {this.props.poolCache.map(m => {
          const vote = this.props.votes.find(v => v.mapId === m.id);
          return (<FooterItem key={m.id} map={m} team={vote && (vote.type === 'decider' ? null : vote.team)} />);
        })}
      </FadeInDown>
    );
  }
}
