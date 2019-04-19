import { Team, Vote } from '@r6ru/db';
import * as React from 'react';
import posed from 'react-pose';
import * as style from './style.css';

export interface IDeciderProps {
    teams: Team[];
    vote: Vote;
}

export interface IDeciderState {
  isVisible: boolean;
}

const FadeInUp = posed.div({
  in2: { opacity: 0, y: '-100%', transition: { y: {ease: 'easeIn'} } },
  out2: { opacity: 1, y: '0%', transition: { y: {ease: 'easeIn'} } },
});

export class Decider extends React.Component<IDeciderProps, IDeciderState> {

  public readonly state: IDeciderState = {
    isVisible: false,
  };

  public async componentDidMount() {
        setTimeout(() => {
          console.log('decider');
          this.setState({ isVisible: true });
        }, 2000);
    }

  public render() {

    if (!this.props.vote) { return null; }

    return (
      <FadeInUp className={[style.log, style.logDecider].join(' ')} pose={this.state.isVisible ? 'out2' : 'in2'}>
        <div className={style.logTeam}>
            <img className={style.teamLogo} src={this.props.teams[0].logo}/>
            <p className={style.teamTitleText}>
              решающая карта
            </p>
            <img className={style.teamLogo} src={this.props.teams[1].logo}/>
        </div>
        <div className={style.decider} style={{backgroundImage: `url(${this.props.vote.map.splash})`}}>
            <div className={style.glyphPlaceholder} style={{backgroundPosition: 'center center'}}>
                <img src="https://cdn.rainbow6russia.ru/streams/assets/icons/handshake.svg"/>
            </div>
            <p className={style.teamActionText}>{this.props.vote.map.titleRu}</p>
        </div>
      </FadeInUp>
    );
  }
}
