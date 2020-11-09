import {
  TimeOption,
  TimeRange,
  isDateTime,
  DateTime,
  TimeZone,
  dateMath,
  dateTime,
  dateTimeForTimeZone,
  TIME_FORMAT,
} from '@grafana/data';

import { customTimeRangePicked } from '../range_ctrl';

import { stringToDateTimeType } from '../time';

export const mapOptionToTimeRange = (option: any, timeZone?: TimeZone, index?: number, aDayShift = 0): TimeRange => {
  let canMoveForward = true;
  let name = '';
  if (option.type === 'currentShift') {
    const result = customTimeRangePicked(option.type, option, aDayShift, null);
    option = result.range;
    index = result.index;
    aDayShift = result.dayShift;
    name = 'Current Shift';

    if (new Date(option.absoluteTo) > new Date()) {
      option.absoluteTo = 'now';
      canMoveForward = false;
    }
  } else {
    customTimeRangePicked(option.type, option, aDayShift, null);
    if (new Date(option.absoluteTo) > new Date()) {
      mapOptionToTimeRange(option, timeZone, index, aDayShift - 1);
    }
    name = option.name;
  }
  // if (new Date(option.absoluteTo) > new Date()) {
  //   option.absoluteTo = 'now';
  //   canMoveForward = false;
  // }
  if (option.newDay === undefined) {
    option.newDay = false;
  }
  return {
    name: name,
    from: stringToDateTime(option.absoluteFrom, false, timeZone),
    to: stringToDateTime(option.absoluteTo, false, timeZone),
    index: index,
    newDay: option.newDay,
    dayShift: aDayShift,
    canMoveForward: canMoveForward,
    raw: {
      from: option.from,
      to: option.to,
    },
  };
};

export const mapMovedToTimeRange = (option: any, timeZone?: TimeZone, index?: number, aDayShift = 0): TimeRange => {
  let canMoveForward = true;
  let name = '';

  name = option.name;
  if (option.type === 'shift' || option.type === 'currentShift') {
    customTimeRangePicked(option.type, option, aDayShift, null);
    if (new Date(option.absoluteTo) > new Date()) {
      option.absoluteTo = 'now';
      canMoveForward = false;
      name = 'Current Shift';
    }
  } else {
    customTimeRangePicked(option.type, option, aDayShift, null);
    if (new Date(option.absoluteTo) > new Date()) {
      option.absoluteTo = 'now';
      canMoveForward = false;
    }
  }

  if (option.newDay === undefined) {
    option.newDay = false;
  }
  return {
    name: name,
    from: stringToDateTime(option.absoluteFrom, false, timeZone),
    to: stringToDateTime(option.absoluteTo, false, timeZone),
    index: index,
    newDay: option.newDay,
    dayShift: aDayShift,
    canMoveForward: canMoveForward,
    raw: {
      from: option.from,
      to: option.to,
    },
  };
};

export const mapCurrentShiftInit = (option: any, timeZone?: TimeZone, index?: number, aDayShift = 0): TimeRange => {
  let canMoveForward = false;
  let name = 'Current Shift';

  option.absoluteTo = 'now';

  return {
    name: name,
    from: stringToDateTime(option.absoluteFrom, false, timeZone),
    to: stringToDateTime(option.absoluteTo, false, timeZone),
    index: index,
    newDay: option.newDay,
    dayShift: aDayShift,
    canMoveForward: canMoveForward,
    raw: {
      from: option.from,
      to: option.to,
    },
  };
};

export const mapRelativeOptionToTimeRange = (option: TimeOption, timeZone?: TimeZone): TimeRange => {
  return {
    from: stringToDateTime(option.from, false, timeZone),
    to: stringToDateTime(option.to, false, timeZone),
    raw: {
      from: option.from,
      to: option.to,
    },
  };
};

export const mapRangeToTimeOption = (range: TimeRange, timeZone?: TimeZone): TimeOption => {
  const formattedFrom = stringToDateTime(range.from, false, timeZone).format(TIME_FORMAT);
  const formattedTo = stringToDateTime(range.to, true, timeZone).format(TIME_FORMAT);
  const from = dateTimeToString(range.from, timeZone);
  const to = dateTimeToString(range.to, timeZone);

  return {
    from,
    to,
    section: 3,
    display: `${formattedFrom} to ${formattedTo}`,
  };
};

export const mapStringsToTimeRange = (from: string, to: string, roundup?: boolean, timeZone?: TimeZone): TimeRange => {
  const fromDate = stringToDateTimeType(from, roundup, timeZone);
  const toDate = stringToDateTimeType(to, roundup, timeZone);

  if (dateMath.isMathString(from) || dateMath.isMathString(to)) {
    return {
      from: fromDate,
      to: toDate,
      raw: {
        from,
        to,
      },
    };
  }

  return {
    from: fromDate,
    to: toDate,
    raw: {
      from: fromDate,
      to: toDate,
    },
  };
};

const stringToDateTime = (value: string | DateTime, roundUp?: boolean, timeZone?: TimeZone): DateTime => {
  if (isDateTime(value)) {
    if (timeZone === 'utc') {
      return value.utc();
    }
    return value;
  }

  if (value.indexOf('now') !== -1) {
    if (!dateMath.isValid(value)) {
      return dateTime();
    }

    const parsed = dateMath.parse(value, roundUp, timeZone);
    return parsed || dateTime();
  }

  return dateTimeForTimeZone(timeZone, value, TIME_FORMAT);
};

const dateTimeToString = (value: DateTime, timeZone?: TimeZone): string => {
  if (!isDateTime(value)) {
    return value;
  }

  const isUtc = timeZone === 'utc';
  if (isUtc) {
    return value.utc().format(TIME_FORMAT);
  }

  return value.format(TIME_FORMAT);
};
