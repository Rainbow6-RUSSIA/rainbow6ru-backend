import { MapR6, Team } from '@r6ru/db';
import * as React from 'react';
import { FadeIn, FadeInDown } from '.';
import * as style from './style.css';

export interface IFooterItemProps {
    map: MapR6;
    team?: Team | null;
}

export interface IFooterItemState {
  isVisible: boolean;
  isOverlayed: boolean;
}

export class FooterItem extends React.Component<IFooterItemProps, IFooterItemState> {

  public readonly state: IFooterItemState = {
    isOverlayed: false,
    isVisible: false,
  };

  public async componentWillReceiveProps(nextProps: IFooterItemProps) {
      if (nextProps.team !== undefined) {
        setTimeout(() => this.setState({ isOverlayed: true }), 1000);
      }
    }

  public render() {
    return (
      <div className={style.footerItem}>
        <div className={style.footerMap}>
          <img className={style.footerImage} src={this.props.map.splash}/>
          <FadeIn style={{backgroundImage: `url(${this.props.team && this.props.team.logo})`}} className={style.footerOverlay} pose={this.state.isOverlayed ? 'out1' : 'in1'} />
        </div>
        <div className={style.footerText}>{this.props.map.titleRu}</div>
      </div>
    );
  }
}
