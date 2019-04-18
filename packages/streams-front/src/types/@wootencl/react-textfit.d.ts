import * as React from 'react';
    interface ITextfitProps {
        mode: 'single' | 'multi';
        forceSingleModeWidth: boolean;
        className?: string;
        min?: number;
        max?: number;
        throttle?: number;
        onReady?: Function;
    }

declare module '@wootencl/react-textfit' {
    export class Textfit extends React.Component<ITextfitProps, any> {}
    // export const Textfit: (props: ITextfitProps) => React.SFC<ITextfitProps>;
}
