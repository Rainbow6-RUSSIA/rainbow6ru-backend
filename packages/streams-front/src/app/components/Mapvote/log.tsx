import { Team, Vote as V } from '@r6ru/db';
import { Textfit } from '@wootencl/react-textfit';
import * as React from 'react';
import posed, { PoseGroup } from 'react-pose';
import { FadeInDown } from '.';
import * as style from './style.css';
import { Vote } from './vote';

export interface ILogProps {
    team: Team;
    votes: V[];
}

export interface ILogState {
  isVisible: boolean;
  votes: V[];
}

const PoseWrapper = posed.div({
  enter: { opacity: 1, transition: { opacity: {ease: 'easeIn'} } },
  exit: { opacity: 0, transition: { opacity: {ease: 'easeIn'} } },
});

export class Log extends React.Component<ILogProps, ILogState> {

  public readonly state: ILogState = {
    isVisible: false,
    votes: [],
  };

  public async componentDidMount() {
        setTimeout(() => {
          this.setState({ isVisible: true });
        }, 1000);
    }

  public async componentWillReceiveProps(nextProps: ILogProps) {
      if (nextProps.votes.length !== this.props.votes.length) {
          this.setState({ votes: nextProps.votes });
      }
    }

  constructor(props: ILogProps) {
        super(props);
        this.state.votes = props.votes;
    }

  public render() {

    return (
      <FadeInDown className={style.log} pose={this.state.isVisible ? 'out' : 'in'}>
        <div className={style.logTeam}>
            <img className={style.teamLogo} src={this.props.team.logo}/>
            <div className={style.teamTitleText}>
              <Textfit throttle={5} max={100} min={36} mode="single" forceSingleModeWidth={false}>{this.props.team.name}</Textfit>
            </div>
        </div>
        <PoseGroup>
          {this.state.votes.map((v) => <PoseWrapper key={v.mapId}><Vote vote={v} /></PoseWrapper>)}
        </PoseGroup>
      </FadeInDown>
    );
  }
}
