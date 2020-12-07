import React, { ReactNode } from 'react';
import { css } from 'emotion';
import { TimeOption, TimeZone } from '@grafana/data';
import { TimeRange } from '@grafana/data';
import { TimePickerTitle } from './TimePickerTitle';
import { CustomTimeRangeOption } from './CustomTimeRangeOption';
import { mapOptionToTimeRange } from './customMapper';
import { stylesFactory } from '../../../themes';

const getStyles = stylesFactory(() => {
  return {
    title: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 5px 9px;
    `,
  };
});

const getOptionsStyles = stylesFactory(() => {
  return {
    grow: css`
      flex-grow: 1;
      align-items: flex-start;
    `,
  };
});

interface Props {
  title?: string;
  options: any[];
  value?: TimeRange;
  onSelect: (option: TimeRange) => void;
  placeholderEmpty?: ReactNode;
  timeZone?: TimeZone;
  firstPosibleDate?: Date;
}

export const CustomTimeRangeList: React.FC<Props> = props => {
  const styles = getStyles();
  const { title, options, placeholderEmpty } = props;

  if (typeof placeholderEmpty !== 'undefined' && options.length <= 0) {
    return <>{placeholderEmpty}</>;
  }

  if (!title) {
    return <Options {...props} />;
  }

  return (
    <>
      <div className={styles.title}>
        <TimePickerTitle>{title}</TimePickerTitle>
      </div>
      <Options {...props} />
    </>
  );
};

const Options: React.FC<Props> = ({ options, value, onSelect, timeZone, firstPosibleDate }) => {
  const styles = getOptionsStyles();

  return (
    <>
      <div>
        {options.map((option, index) => (
          <CustomTimeRangeOption
            key={keyForOption(option, index)}
            value={option}
            selected={isEqual(option, value)}
            onSelect={option => onSelect(mapOptionToTimeRange(option, timeZone, index, 0, firstPosibleDate))}
          />
        ))}
      </div>
      <div className={styles.grow}></div>
    </>
  );
};

function keyForOption(option: TimeOption, index: number): string {
  return `${option.from}-${option.to}-${index}`;
}

function isEqual(x: TimeOption, y?: TimeRange): boolean {
  if (!y || !x) {
    return false;
  }
  return y.raw.from === x.from && y.raw.to === x.to;
}
