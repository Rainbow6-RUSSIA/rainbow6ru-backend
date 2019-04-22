import { Match } from '@r6ru/db';
import * as React from 'react';
import posed from 'react-pose';
import { RouteComponentProps } from 'react-router';
import { connect } from 'socket.io-client';
import { Decider } from './decider';
import { Footer } from './footer';
import { Log } from './log';

import * as style from './style.css';

export interface IMapvoteProps extends RouteComponentProps<{ id: string }> {}

export interface IMapvoteState {
  isVisible: boolean;
  match: Match;
}

export const FadeInDown = posed.div({
  in: { opacity: 0, y: '100%', transition: { y: {ease: 'easeIn'} } },
  out: { opacity: 1, y: '0%', transition: { y: {ease: 'easeIn'} } },
});

export const FadeIn = posed.div({
  in1: { opacity: 0 },
  out1: { opacity: 1 },
});

export class Mapvote extends React.Component<IMapvoteProps, IMapvoteState> {

  public readonly state: IMapvoteState = {
    isVisible: false,
    match: {} as Match,
  };

  public socket: SocketIOClient.Socket;

  public handleEvent = (data: Match) => {
    console.log(data);
    data.votes.sort((a, b) => a.id - b.id);
    data.teams.sort((a, b) => a.id - b.id);
    data.poolCache.sort();
    this.setState({ match: data });
  }

  public componentDidMount() {
    this.socket.on('init', this.handleEvent);
    this.socket.on('swap', this.handleEvent);
    this.socket.on('map_vote', this.handleEvent);
    this.socket.emit('subscribe', {
      id: this.props.match.params.id,
      room: 'map_vote',
    });
    setTimeout(() => {
      this.setState({ isVisible: true });
    }, 1000);
  }

  public componentDidUpdate() {
    window.dispatchEvent(new Event('resize'));
  }

  constructor(props: any) {
    super(props);
    console.log('Map Vote init');
    this.socket = connect('https://streams.rainbow6russia.ru');
  }

  public render() {
    const { isVisible, match } = this.state;

    if (Object.keys(match) && !(match.votes || match.teams)) { return null; }

    const votes = match.votes; // .slice(0, (match.poolCache.length - 1) / 2);

    return (
      <FadeInDown className={style.container} pose={isVisible ? 'out' : 'in'}>
        <div className={style.logs}>
          <Log votes={votes.filter((v, i) => Boolean(i % 2) === match.swapped && v.type !== 'decider')} team={match.teams[0]}/>
          {match.votes[match.poolCache.length - 1] ? <Decider vote={match.votes[match.poolCache.length - 1]} teams={match.teams}/> : null}
          <Log votes={votes.filter((v, i) => Boolean(i % 2) === !match.swapped && v.type !== 'decider')} team={match.teams[1]}/>
        </div>
        {match.poolCache.length > 7 ? null : <Footer votes={match.votes} poolCache={match.poolCache} />}
      </FadeInDown>
    );
  }
}
