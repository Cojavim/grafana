// Libraries
import React, { PureComponent, memo, FormEvent } from 'react';
import { css, cx } from 'emotion';

// Components
import { Tooltip } from '../Tooltip/Tooltip';
import { TimePickerContent } from './TimePickerContent/TimePickerContent';
import { ClickOutsideWrapper } from '../ClickOutsideWrapper/ClickOutsideWrapper';

// Utils & Services
import { stylesFactory } from '../../themes/stylesFactory';
import { withTheme, useTheme } from '../../themes/ThemeContext';

// Types
import { isDateTime, DateTime, rangeUtil, GrafanaTheme, TIME_FORMAT } from '@grafana/data';
import { TimeRange, TimeOption, TimeZone, dateMath } from '@grafana/data';
import { Themeable } from '../../types';

import { customMove, lastShift, currentShift, getDayNumber } from './range_ctrl';
import {
  mapOptionToTimeRange,
  mapMovedToTimeRange,
  mapRelativeOptionToTimeRange,
  mapCurrentShiftInit,
} from './TimePickerContent/customMapper';

import { DashboardModel } from '../../../../../public/app/features/dashboard/state';
// import { relative } from 'path';
// import { truncateSync } from 'fs';
import moment from 'moment';
// import { any } from 'prop-types';
// import { range } from 'd3';
// import { ObjectUnsubscribedError } from 'rxjs';

const quickOptions: TimeOption[] = [
  { from: 'now-5m', to: 'now', display: 'Last 5 minutes', section: 3 },
  { from: 'now-15m', to: 'now', display: 'Last 15 minutes', section: 3 },
  { from: 'now-30m', to: 'now', display: 'Last 30 minutes', section: 3 },
  { from: 'now-1h', to: 'now', display: 'Last 1 hour', section: 3 },
  { from: 'now-3h', to: 'now', display: 'Last 3 hours', section: 3 },
  { from: 'now-6h', to: 'now', display: 'Last 6 hours', section: 3 },
  { from: 'now-12h', to: 'now', display: 'Last 12 hours', section: 3 },
  { from: 'now-24h', to: 'now', display: 'Last 24 hours', section: 3 },
  { from: 'now-2d', to: 'now', display: 'Last 2 days', section: 3 },
  { from: 'now-7d', to: 'now', display: 'Last 7 days', section: 3 },
  { from: 'now-30d', to: 'now', display: 'Last 30 days', section: 3 },
  { from: 'now-90d', to: 'now', display: 'Last 90 days', section: 3 },
  { from: 'now-6M', to: 'now', display: 'Last 6 months', section: 3 },
  { from: 'now-1y', to: 'now', display: 'Last 1 year', section: 3 },
  { from: 'now-2y', to: 'now', display: 'Last 2 years', section: 3 },
  { from: 'now-5y', to: 'now', display: 'Last 5 years', section: 3 },
];

const otherOptions: TimeOption[] = [
  { from: 'now-1d/d', to: 'now-1d/d', display: 'Yesterday', section: 3 },
  { from: 'now-2d/d', to: 'now-2d/d', display: 'Day before yesterday', section: 3 },
  { from: 'now-7d/d', to: 'now-7d/d', display: 'This day last week', section: 3 },
  { from: 'now-1w/w', to: 'now-1w/w', display: 'Previous week', section: 3 },
  { from: 'now-1M/M', to: 'now-1M/M', display: 'Previous month', section: 3 },
  { from: 'now-1y/y', to: 'now-1y/y', display: 'Previous year', section: 3 },
  { from: 'now/d', to: 'now/d', display: 'Today', section: 3 },
  { from: 'now/d', to: 'now', display: 'Today so far', section: 3 },
  { from: 'now/w', to: 'now/w', display: 'This week', section: 3 },
  { from: 'now/w', to: 'now', display: 'This week so far', section: 3 },
  { from: 'now/M', to: 'now/M', display: 'This month', section: 3 },
  { from: 'now/M', to: 'now', display: 'This month so far', section: 3 },
  { from: 'now/y', to: 'now/y', display: 'This year', section: 3 },
  { from: 'now/y', to: 'now', display: 'This year so far', section: 3 },
];

let customOptions: any[] = [];
let customDay: any[] = [];
let customWeek: any[] = [];
let customMonth: any[] = [];
let currentShiftOption: any[] = [];
let shiftNameHelper: any[] = [];
// let labelHistory: any[] = [];
// let dirHelper: number;
// let newDayInit: boolean;
let customIndex: number;
let customDayShift: number;
let relativeStep: number;
let relativeValue: any;
let previousRelativeRange: any;

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      position: relative;
      display: flex;
      flex-flow: column nowrap;
    `,
    buttons: css`
      display: flex;
    `,
    caretIcon: css`
      margin-left: 3px;

      i {
        font-size: ${theme.typography.size.md};
      }
    `,
    noRightBorderStyle: css`
      label: noRightBorderStyle;
      border-right: 0;
    `,
    customName: css`
      min-width: 100px;
    `,
  };
});

const getLabelStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      display: inline-block;
    `,
    utc: css`
      color: ${theme.colors.orange};
      font-size: 75%;
      padding: 3px;
      font-weight: ${theme.typography.weight.semibold};
    `,
    labelBlue: css`
      color: #33b5e5;
    `,
  };
});

export interface Props extends Themeable {
  hideText?: boolean;
  value: TimeRange;
  timeZone?: TimeZone;
  timeSyncButton?: JSX.Element;
  isSynced?: boolean;
  onChange: (timeRange: TimeRange) => void;
  onCustomChange: (timeRange: any) => void;
  onCustomDaySelected: (timeRange: any) => void;
  onCustomWeekSelected: (timeRange: any) => void;
  onCustomMonthSelected: (timeRange: any) => void;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onZoom: () => void;
  history?: TimeRange[];
  dashboard: DashboardModel;
}

export interface State {
  isOpen: boolean;
  isRelative: boolean;
  isCustom: boolean;
  isDay: boolean;
  isWeek: boolean;
  isMonth: boolean;
  canMoveForward: boolean;
  rangeName: string;
}

export class UnthemedTimePicker extends PureComponent<Props, State> {
  state: State = {
    isOpen: false,
    isRelative: false,
    isCustom: false,
    isDay: false,
    isWeek: false,
    isMonth: false,
    canMoveForward: true,
    rangeName: '',
  };

  componentDidMount() {
    this.populateCustomOptions();
    if (this.shiftFound()) {
    } else if (this.props.dashboard.customReloadCurrent) {
      if (customOptions.length > 0) {
        this.currentShift(currentShiftOption[0]);
      }
      this.setState({ isCustom: true });
    } else if (this.props.dashboard.customReload) {
      if (customOptions.length > 0) {
        this.lastShift(customOptions);
      }
      this.setState({ isCustom: true });
    }
    // else {
    //   // this.setState({ isRelative: true });
    // }
  }

  shiftFound() {
    if (!moment.isMoment(this.props.dashboard.time.from) || !moment.isMoment(this.props.dashboard.time.to)) {
      return false;
    }
    let dathToMilli = this.props.dashboard.time.to.millisecond();
    let time = this.props.dashboard.time;
    let dashFrom = time.from;
    let dashTo = time.to;
    let dateFrom = dashFrom.local().format('YYYY-MM-DD HH:mm');
    let dateTo = dashTo.local().format('YYYY-MM-DD HH:mm');
    let dashFromTimeLocal = dashFrom.local().format('HH:mm');
    let dashHourDiff = dashTo.diff(dashFrom, 'hours');
    //let dathToMilli = dashToTO.millisecond();
    if (moment.isMoment(this.props.dashboard.time.from) && dathToMilli) {
      if (dashHourDiff > 168) {
        let dashFromDayLocal = dashFrom.local().format('DD');
        if (dashFromDayLocal === '01' && customMonth[0].from === dashFromTimeLocal) {
          //It is most probably a month
          this.setFoundMonth(dateFrom, 'now', dashTo);
          return true;
        }
      }
      if (dashHourDiff > 24) {
        // Not a day
        let weekFromIsoDay = getDayNumber(customWeek[0].startDay);
        let dashFromIsoDay = dashFrom.isoWeekday();
        if (customWeek[0].from === dashFromTimeLocal && dashFromIsoDay === weekFromIsoDay) {
          // Most liklely a week
          this.setFoundWeek(dateFrom, 'now', dashTo);
          return true;
        }
      }
      for (let i = 0; i < customOptions.length; i++) {
        //let dashTo = time.to;
        if (customOptions[i].from === dashFromTimeLocal) {
          // find out if to date is possible, if not it is this shift
          //let dashToTimeLocal = dashTo.local().format('HH:mm');
          let todayDate = moment().format('YYYY-MM-DD') + ' ' + customOptions[i].to;
          let posibleToMoment = moment(todayDate).local();
          let posibleToDate = posibleToMoment.toDate();
          let helpNow = new Date();
          if (posibleToDate < helpNow) {
            // IT IS THIS DAY!!!
            this.setFoundDay(dateFrom, 'now', dashTo);
            return true;
          }
        }
      }
      // check Current Day
    } else {
      let dashToTimeLocal = dashTo.local().format('HH:mm');

      if (dashHourDiff > 24) {
        // probably week
        // check Isoday of week to start and end day + start and end times
        let dashFromIsoDay = dashFrom.isoWeekday();
        let dashToIsoDay = dashTo.isoWeekday();
        let weekFromIsoDay = getDayNumber(customWeek[0].startDay);
        let weekToIsoDay = getDayNumber(customWeek[0].endDay);
        if (
          customWeek[0].from === dashFromTimeLocal &&
          customWeek[0].to === dashToTimeLocal &&
          dashFromIsoDay === weekFromIsoDay &&
          dashToIsoDay === weekToIsoDay
        ) {
          this.setFoundWeek(dateFrom, dateTo, dashTo);
          return true;
        }
      }
      let dashDayDiff = dashTo.diff(dashFrom, 'days');
      if (dashDayDiff > 7) {
        // probably month
        let dashFromDayLocal = dashFrom.local().format('DD');
        let dashToDayLocal = dashFrom.local().format('DD');
        if (
          customMonth[0].from === dashFromTimeLocal &&
          customMonth[0].from === dashToTimeLocal &&
          dashFromDayLocal === '01' &&
          dashToDayLocal === '01'
        ) {
          this.setFoundMonth(dateFrom, dateTo, dashTo);
          return true;
        }
      }
      if (dashFromTimeLocal === customDay[0].from && dashToTimeLocal === customDay[0].to) {
        this.setFoundDay(dateFrom, dateTo, dashTo);
        return true;
      }

      if (customOptions !== undefined && customOptions.length !== 0) {
        // Check if it is not Day or Week
        for (let i = 0; i < customOptions.length; i++) {
          //let dashTo = time.to;
          if (customOptions[i].from === dashFromTimeLocal) {
            if (customOptions[i].to === dashToTimeLocal) {
              let rangeFound = {
                absoluteFrom: dateFrom,
                absoluteTo: dateTo,
                from: customOptions[i].from,
                to: customOptions[i].to,
                newDay: customOptions[i].newDay,
                name: customOptions[i].name,
                type: customOptions[i].type,
                index: i,
              };

              let lmapped = mapOptionToTimeRange(rangeFound, this.props.timeZone, 0, customDayShift);
              this.disableCustomStates();
              this.setState({ canMoveForward: lmapped.canMoveForward });
              this.setState({ isCustom: true });

              let todayDate = moment().format('YYYY-MM-DD') + ' ' + dashToTimeLocal;
              let lastPosibleToDateTime = moment(todayDate).local();
              customDayShift = lastPosibleToDateTime.diff(dashTo, 'days') * -1;

              this.onCustomMove(lmapped);

              lmapped.name = this.setCustomRangeName(lmapped.name);

              customIndex = i;
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  setFoundMonth(aDateFrom: any, aDateTo: any, aDashTo: any) {
    // let dateFrom = dashFrom.local().format('YYYY-MM-DD HH:mm');
    // let dateTo = dashTo.local().format('YYYY-MM-DD HH:mm');
    let rangeFound = {
      absoluteFrom: aDateFrom,
      absoluteTo: aDateTo,
      from: customMonth[0].from,
      to: customMonth[0].to,
      name: customMonth[0].name,
      type: customMonth[0].type,
    };
    let lmapped = mapMovedToTimeRange(rangeFound, this.props.timeZone, 0, customDayShift);
    this.onCustomMove(lmapped);
    this.disableCustomStates();
    this.setState({ isMonth: true });
    if (aDateTo === 'now') {
      this.setState({ canMoveForward: false });
      this.setState({ rangeName: 'Current Month' });
    } else {
      let now = moment();
      customDayShift = now.diff(aDashTo, 'months') * -1;
      this.setRangeName(customMonth[0].name, customDayShift);
    }
  }
  setFoundWeek(aDateFrom: any, aDateTo: any, aDashTo: any) {
    // let dateFrom = dashFrom.local().format('YYYY-MM-DD HH:mm');
    // let dateTo = dashTo.local().format('YYYY-MM-DD HH:mm');
    let rangeFound = {
      absoluteFrom: aDateFrom,
      absoluteTo: aDateTo,
      from: customWeek[0].from,
      to: customWeek[0].to,
      name: customWeek[0].name,
      type: customWeek[0].type,
      startDay: customWeek[0].startDay,
      endDay: customWeek[0].endDay,
    };
    let lmapped = mapMovedToTimeRange(rangeFound, this.props.timeZone, 0, customDayShift);
    this.onCustomMove(lmapped);
    this.disableCustomStates();
    this.setState({ isWeek: true });
    this.setState({ canMoveForward: lmapped.canMoveForward });
    let now = moment();
    customDayShift = now.diff(aDashTo, 'weeks') * -1;
    this.setRangeName(customWeek[0].name, customDayShift);
  }
  setFoundDay(aDateFrom: any, aDateTo: any, aDashTo: any) {
    // let dateFrom = dashFrom.local().format('YYYY-MM-DD HH:mm');
    // let dateTo = dashTo.local().format('YYYY-MM-DD HH:mm');
    let rangeFound = {
      absoluteFrom: aDateFrom,
      absoluteTo: aDateTo,
      from: customDay[0].from,
      to: customDay[0].to,
      name: customDay[0].name,
      type: customDay[0].type,
      newDay: customDay[0].newDay,
    };
    let lmapped = mapMovedToTimeRange(rangeFound, this.props.timeZone, 0, customDayShift);
    this.onCustomMove(lmapped);
    this.disableCustomStates();
    this.setState({ isDay: true });
    if (aDateTo === 'now') {
      this.setState({ canMoveForward: false });
      this.setState({ rangeName: 'Current Day' });
    } else {
      let now = moment();
      customDayShift = now.diff(aDashTo, 'days') * -1;
      this.setRangeName(customDay[0].name, customDayShift);
    }
  }

  setCustomRangeName(aName: string | undefined) {
    let dashToTimeLocal = this.props.dashboard.time.to.local().format('HH:mm');
    let todayDate = moment().format('YYYY-MM-DD') + ' ' + dashToTimeLocal;
    let lastPosibleToDateTime = moment(todayDate).local();
    let dashTo = this.props.dashboard.time.to;
    // Get DayShiftForName
    let helpDate = lastPosibleToDateTime.toDate();
    let helpNow = new Date();
    if (helpDate > helpNow) {
      lastPosibleToDateTime.add(-1, 'days');
    }
    let dayShiftForName = lastPosibleToDateTime.diff(dashTo, 'days');
    //let dayShiftForName = hourShiftForName / 24;
    if (dayShiftForName === 0) {
      aName = 'Last ' + aName;
    } else {
      aName = aName + ' - ' + dayShiftForName;
    }
    this.setState({ rangeName: aName });
    return aName;
  }

  currentShift(aRanges: any[]) {
    const result = currentShift(aRanges);
    customDayShift = result.dayShift;
    //result.range.type = 'currentShift';
    let lmapped = mapCurrentShiftInit(result.range, this.props.timeZone, 0, customDayShift);
    this.onCustomMove(lmapped);
    this.setState({ canMoveForward: lmapped.canMoveForward });
    customIndex = result.index;
  }

  lastShift(aRanges: any[]) {
    const result = lastShift(aRanges);
    customDayShift = result.dayShift;
    let lmapped = mapOptionToTimeRange(result.range, this.props.timeZone, 0, customDayShift);
    this.onCustomMove(lmapped);
    customIndex = result.index;
  }

  populateCustomOptions() {
    customOptions.length = 0;
    customDay.length = 0;
    customWeek.length = 0;
    customMonth.length = 0;
    currentShiftOption.length = 0;
    shiftNameHelper.length = 0;
    //dirHelper = 0;
    let MonthStartTime = '';
    if (this.props.dashboard.ranges !== undefined && this.props.dashboard.ranges.length !== 0) {
      for (let i = 0; i < this.props.dashboard.ranges.length; i++) {
        customOptions.push(this.props.dashboard.ranges[i]);
        if (MonthStartTime === '' || MonthStartTime > this.props.dashboard.ranges[i].from) {
          MonthStartTime = this.props.dashboard.ranges[i].from;
        }
        shiftNameHelper.push('');
      }
      let currentShiftDefinition = {
        name: 'Current Shift',
        type: 'currentShift',
        rangeList: customOptions,
      };
      currentShiftOption.push(currentShiftDefinition);
    }
    let month = {
      name: 'Last Month',
      type: 'month',
      from: MonthStartTime,
      to: '23:59',
    };
    if (this.props.dashboard.day !== undefined && this.props.dashboard.day !== null) {
      customDay.push(this.props.dashboard.day);
    }
    if (this.props.dashboard.week !== undefined && this.props.dashboard.week !== null) {
      customWeek.push(this.props.dashboard.week);
    }
    customMonth.push(month);
  }

  disableCustomStates() {
    this.setState({ isOpen: false });
    this.setState({ isCustom: false });
    this.setState({ isDay: false });
    this.setState({ isWeek: false });
    this.setState({ isMonth: false });
    this.setState({ canMoveForward: true });
    this.setState({ isRelative: false });
  }

  onChange = (timeRange: TimeRange) => {
    customDayShift = 0;
    this.props.onChange(timeRange);
    this.disableCustomStates();
    this.removeChanges();
  };

  onCustomChange = (timeRange: TimeRange) => {
    //customDayShift = 0;
    this.props.onChange(timeRange);
    customIndex = timeRange.index;
    customDayShift = timeRange.dayShift;
    this.setDayShift(timeRange);
    if (timeRange.name === 'Current Shift') {
      this.setState({ rangeName: timeRange.name });
    } else {
      this.setState({ rangeName: 'Last ' + timeRange.name });
    }
    this.disableCustomStates();
    this.setState({ isCustom: true });
    this.setState({ canMoveForward: timeRange.canMoveForward });
    //this.setCustomRangeName(timeRange.name);
    for (let i = 0; i < shiftNameHelper.length; ++i) {
      shiftNameHelper[i] = '';
    }
    //dirHelper = 0;
    if (timeRange.newDay) {
      customDayShift++;
    }
    this.removeChanges();
  };

  setDayShift(timeRange: TimeRange) {
    if (customDayShift === 0) {
      let originalDate = timeRange.from.toDate();
      let from = moment(originalDate).format('YYYY-MM-DD');
      let now = moment().format('YYYY-MM-DD');
      if (from < now) {
        customDayShift = -1;
      }
    }
  }

  removeChanges() {
    if (customDay.length > 0) {
      customDay[0].absoluteFrom = '';
      customDay[0].absoluteTo = '';
    }
    if (customWeek.length > 0) {
      customWeek[0].absoluteFrom = '';
      customWeek[0].absoluteTo = '';
    }
    if (customMonth.length > 0) {
      customMonth[0].absoluteFrom = '';
      customMonth[0].absoluteTo = '';
    }
    if (customOptions.length > 0) {
      for (let i = 0; i < customOptions.length; i++) {
        customOptions[i].absoluteFrom = '';
        customOptions[i].absoluteTo = '';
      }
    }
  }

  onCustomMove = (timeRange: TimeRange) => {
    this.props.onChange(timeRange);
    customIndex = timeRange.index;
    this.setState({ rangeName: timeRange.name });
    this.removeChanges();
  };

  onCustomDaySelected = (timeRange: TimeRange) => {
    customDayShift = 0;
    this.props.onChange(timeRange);
    this.setState({ rangeName: timeRange.name });
    this.disableCustomStates();
    this.setState({ isDay: true });
    this.removeChanges();
  };

  onCustomWeekSelected = (timeRange: TimeRange) => {
    customDayShift = 0;
    this.props.onChange(timeRange);
    this.setState({ rangeName: timeRange.name });
    this.disableCustomStates();
    this.setState({ isWeek: true });
    this.removeChanges();
  };
  onCustomMonthSelected = (timeRange: TimeRange) => {
    customDayShift = 0;
    this.props.onChange(timeRange);
    this.setState({ rangeName: timeRange.name });
    this.disableCustomStates();
    this.setState({ isMonth: true });
    this.removeChanges();
  };

  onRelativeChange = (timeRange: TimeRange) => {
    customDayShift = 0;
    timeRange.relative = true;
    this.props.onChange(timeRange);
    let from = String(timeRange.raw.from);
    relativeValue = this.parseUnit(from.slice(4), relativeValue);
    relativeStep = relativeValue[0] * -1;
    previousRelativeRange = timeRange.raw;
    this.disableCustomStates();
    this.setState({ isRelative: true });
  };

  onOpen = (event: FormEvent<HTMLButtonElement>) => {
    console.log('TimePicker.tsx OnOpen', this.props.dashboard);
    // this.populateCustomOptions();
    const { isOpen } = this.state;
    event.stopPropagation();
    this.setState({ isOpen: !isOpen });
  };

  onClose = () => {
    this.setState({ isOpen: false });
  };

  onCustomMoveBackward = () => {
    if (customDayShift === undefined) {
      customDayShift = 0;
    }
    let lResult = customMove(-1, customIndex, customOptions, customDayShift);
    customDayShift = lResult.dayShift;
    let lRange = customOptions[lResult.index];
    let lmapped = mapMovedToTimeRange(lRange, this.props.timeZone, lResult.index, customDayShift);
    this.setState({ canMoveForward: lmapped.canMoveForward });
    this.onCustomMove(lmapped);
    this.setCustomRangeName(lmapped.name);
  };
  onCustomMoveForward = () => {
    if (customDayShift === undefined) {
      customDayShift = 0;
    }
    // if (newDayInit) {
    //   customDayShift++;
    //   newDayInit = false;
    // }
    let lResult = customMove(1, customIndex, customOptions, customDayShift);
    customDayShift = lResult.dayShift;
    if (customDayShift > 0) {
      customDayShift = 0;
    }
    let lRange = customOptions[lResult.index];
    let lmapped = mapMovedToTimeRange(lRange, this.props.timeZone, lResult.index, customDayShift);
    this.setState({ canMoveForward: lmapped.canMoveForward });
    this.onCustomMove(lmapped);
    this.setCustomRangeName(lmapped.name);
  };

  // setShiftName(aRangeName: string, aDayShift: number, aIndex: number, aDir: number) {
  //   dirHelper += aDir;
  //   let lChange = 0;
  //   if (dirHelper > 1) {
  //     dirHelper = 1;
  //   } else if (dirHelper < -1) {
  //     dirHelper = -1;
  //     lChange = 1;
  //   }
  //   if (aDir === -1) {
  //     let Shift = aDayShift;
  //     let lName = shiftNameHelper[aIndex];
  //     if (aRangeName === 'Current Shift') {
  //       for (let i = 0; i < shiftNameHelper.length; ++i) {
  //         shiftNameHelper[i] = '';
  //       }
  //       return;
  //     } else if (shiftNameHelper[aIndex] === '') {
  //       if (Shift === 0 || Shift === -1) {
  //         lName = 'Last ' + aRangeName;
  //       } else {
  //         lName = aRangeName + ' - 1';
  //       }
  //     }
  //     if (shiftNameHelper[aIndex] === lName) {
  //       if (shiftNameHelper[aIndex].substring(0, 5) === 'Last ') {
  //         lName = aRangeName + ' - 1';
  //       } else {
  //         let lLabelParts = shiftNameHelper[aIndex].split(' - ');
  //         let lLabelNumber: number = +lLabelParts[1] + lChange;
  //         lName = aRangeName + ' - ' + lLabelNumber;
  //       }
  //     }
  //     shiftNameHelper[aIndex] = lName;
  //     labelHistory.push(lName);
  //     this.setState({ rangeName: lName });
  //   } else {
  //     if (aRangeName === 'Current Shift') {
  //       for (let i = 0; i < shiftNameHelper.length; ++i) {
  //         shiftNameHelper[i] = '';
  //       }
  //       return;
  //     }
  //     labelHistory.pop();
  //     let lName = labelHistory[labelHistory.length - 1];
  //     if (lName === null || lName === undefined || lName === '') {
  //       lName = 'Last ' + aRangeName;
  //     }
  //     if (lName.substring(0, 5) === 'Last ') {
  //       shiftNameHelper[aIndex] = '';
  //     } else {
  //       shiftNameHelper[aIndex] = lName;
  //     }
  //     this.setState({ rangeName: lName });
  //   }
  // }

  onCustomDayMoveBackward = () => {
    this.onMoveDay(-1);
  };
  onCustomDayMoveForward = () => {
    this.onMoveDay(1);
  };

  onMoveDay(aDirection: number) {
    customDayShift += aDirection;
    this.checkDayShiftLimit();
    let lmapped = mapMovedToTimeRange(customDay[0], this.props.timeZone, 0, customDayShift);
    this.setState({ canMoveForward: lmapped.canMoveForward });
    this.onCustomMove(lmapped);
    this.setRangeName(lmapped.name, customDayShift);
  }

  onCustomWeekMoveBackward = () => {
    this.onMoveWeek(-1);
  };
  onCustomWeekMoveForward = () => {
    this.onMoveWeek(1);
  };
  onMoveWeek(aDirection: number) {
    customDayShift += aDirection;
    this.checkDayShiftLimit();
    let lmapped = mapMovedToTimeRange(customWeek[0], this.props.timeZone, 0, customDayShift);
    this.setState({ canMoveForward: lmapped.canMoveForward });
    this.onCustomMove(lmapped);
    this.setRangeName(lmapped.name, customDayShift);
  }

  onCustomMonthMoveBackward = () => {
    this.onMoveMonth(-1);
  };
  onCustomMonthMoveForward = () => {
    this.onMoveMonth(1);
  };
  onMoveMonth(aDirection: number) {
    customDayShift += aDirection;
    this.checkDayShiftLimit();
    let lmapped = mapMovedToTimeRange(customMonth[0], this.props.timeZone, 0, customDayShift);
    this.setState({ canMoveForward: lmapped.canMoveForward });
    this.onCustomMove(lmapped);
    this.setRangeName(lmapped.name, customDayShift);
  }
  checkDayShiftLimit() {
    if (customDayShift > 1) {
      customDayShift = 1;
    }
  }
  setRangeName(aRangeName: string, aDayShift: number) {
    let Shift = aDayShift;
    if (aRangeName === 'Current Shift') {
      return;
    }
    if (Shift > 0) {
      if (aRangeName.substring(0, 5) === 'Last ') {
        aRangeName = aRangeName.slice(5);
      }
      this.setState({ rangeName: 'Current ' + aRangeName });
    } else if (Shift === 0) {
      if (aRangeName.substring(0, 5) === 'Last ') {
        this.setState({ rangeName: aRangeName });
      } else {
        this.setState({ rangeName: 'Last ' + aRangeName });
      }
    } else {
      if (aRangeName.substring(0, 5) === 'Last ') {
        aRangeName = aRangeName.slice(5);
      }
      this.setState({ rangeName: aRangeName + ' - ' + Shift * -1 });
    }
  }

  onRelativeMoveBackward = () => {
    let newRange = {
      from: '',
      to: '',
      display: '',
      section: 0,
    };

    newRange.to = previousRelativeRange.from;
    newRange.from = 'now' + relativeStep + relativeValue[1];

    if (newRange.from === newRange.to) {
      relativeStep += relativeValue[0] * -1;
      newRange.from = 'now' + relativeStep + relativeValue[1];
    }

    let lmapped = mapRelativeOptionToTimeRange(newRange, this.props.timeZone);
    this.onCustomMove(lmapped);
    previousRelativeRange = newRange;
  };

  onRelativeMoveForward = () => {
    let newRange = {
      from: '',
      to: '',
      display: '',
      section: 0,
    };

    let nextStep = relativeStep + relativeValue[0];

    newRange.from = previousRelativeRange.to;
    newRange.to = 'now' + nextStep + relativeValue[1];

    if (newRange.from === newRange.to) {
      relativeStep += relativeValue[0];
      nextStep += relativeValue[0];
      newRange.to = 'now' + nextStep + relativeValue[1];
    }

    if (nextStep >= 0) {
      newRange.to = 'now';
      newRange.from = 'now' + -relativeValue[0] + relativeValue[1];
      relativeStep = relativeValue[0] * -1;
    }

    let lmapped = mapRelativeOptionToTimeRange(newRange, this.props.timeZone);
    this.onCustomMove(lmapped);
    previousRelativeRange = newRange;
  };

  parseUnit(str: any, out: any) {
    if (!out) {
      out = [0, ''];
    }
    str = String(str);
    const num = parseFloat(str);
    out[0] = num;
    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || '';
    return out;
  }

  render() {
    const {
      value,
      onMoveBackward,
      onMoveForward,
      onZoom,
      timeZone,
      timeSyncButton,
      isSynced,
      theme,
      history,
    } = this.props;

    const { isOpen, isRelative, isCustom, isDay, isWeek, rangeName, isMonth, canMoveForward } = this.state;
    const styles = getStyles(theme);
    const hasAbsolute = isDateTime(value.raw.from) || isDateTime(value.raw.to);
    const syncedTimePicker = timeSyncButton && isSynced;
    const timePickerIconClass = cx('fa fa-clock-o fa-fw', { ['icon-brand-gradient']: syncedTimePicker });
    const timePickerButtonClass = cx('btn navbar-button navbar-button--tight', {
      [`btn--radius-right-0 ${styles.noRightBorderStyle}`]: !!timeSyncButton,
      [`explore-active-button`]: syncedTimePicker,
    });

    return (
      <div className={styles.container}>
        <div className={styles.buttons}>
          {isCustom && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'red' }}
              onClick={this.onCustomMoveBackward}
            >
              <i className="fa fa-chevron-left" />
            </button>
          )}
          {isRelative && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'yellow' }}
              onClick={this.onRelativeMoveBackward}
            >
              <i className="fa fa-chevron-left" />
            </button>
          )}
          {isDay && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'green' }}
              onClick={this.onCustomDayMoveBackward}
            >
              <i className="fa fa-chevron-left" />
            </button>
          )}
          {isWeek && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'red' }}
              onClick={this.onCustomWeekMoveBackward}
            >
              <i className="fa fa-chevron-left" />
            </button>
          )}
          {isMonth && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'yellow' }}
              onClick={this.onCustomMonthMoveBackward}
            >
              <i className="fa fa-chevron-left" />
            </button>
          )}
          {hasAbsolute && !isCustom && !isRelative && !isDay && !isWeek && !isMonth && (
            <button className="btn navbar-button navbar-button--tight" onClick={onMoveBackward}>
              <i className="fa fa-chevron-left" />
            </button>
          )}
          <div>
            <Tooltip content={<TimePickerTooltip timeRange={value} />} placement="bottom">
              <button aria-label="TimePicker Open Button" className={timePickerButtonClass} onClick={this.onOpen}>
                <i className={timePickerIconClass} />
                {this.props.dashboard.absoluteBefore && <TimePickerButtonLabel {...this.props} />}
                {(isCustom || isDay || isWeek || isMonth) && <span className={styles.customName}>{rangeName}</span>}
                {this.props.dashboard.absoluteAfter && <TimePickerButtonLabel {...this.props} />}
                <span className={styles.caretIcon}>
                  {isOpen ? <i className="fa fa-caret-up fa-fw" /> : <i className="fa fa-caret-down fa-fw" />}
                </span>
              </button>
            </Tooltip>
            {isOpen && (
              <ClickOutsideWrapper onClick={this.onClose}>
                <TimePickerContent
                  timeZone={timeZone}
                  value={value}
                  onChange={this.onChange}
                  onCustomChange={this.onCustomChange}
                  onRelativeChange={this.onRelativeChange}
                  onCustomDaySelected={this.onCustomDaySelected}
                  onCustomWeekSelected={this.onCustomWeekSelected}
                  onCustomMonthSelected={this.onCustomMonthSelected}
                  onCurrentShiftSelected={this.onCustomChange}
                  otherOptions={otherOptions}
                  quickOptions={quickOptions}
                  customOptions={customOptions}
                  currentShift={currentShiftOption}
                  customDay={customDay}
                  customWeek={customWeek}
                  customMonth={customMonth}
                  history={history}
                  showCustomRanges={this.props.dashboard.showCustomRanges}
                  hideRelativeRanges={this.props.dashboard.hideRelativeRanges}
                  hideOtherRelativeRanges={this.props.dashboard.hideOtherRelativeRanges}
                  mobileView={this.props.dashboard.mobileView}
                />
              </ClickOutsideWrapper>
            )}
          </div>

          {timeSyncButton}
          {isCustom && canMoveForward && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'red' }}
              onClick={this.onCustomMoveForward}
            >
              <i className="fa fa-chevron-right" />
            </button>
          )}
          {isRelative && canMoveForward && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'yellow' }}
              onClick={this.onRelativeMoveForward}
            >
              <i className="fa fa-chevron-right" />
            </button>
          )}
          {isDay && canMoveForward && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'green' }}
              onClick={this.onCustomDayMoveForward}
            >
              <i className="fa fa-chevron-right" />
            </button>
          )}
          {isWeek && canMoveForward && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'red' }}
              onClick={this.onCustomWeekMoveForward}
            >
              <i className="fa fa-chevron-right" />
            </button>
          )}
          {isMonth && canMoveForward && (
            <button
              className="btn navbar-button navbar-button--tight"
              // style={{ color: 'yellow' }}
              onClick={this.onCustomMonthMoveForward}
            >
              <i className="fa fa-chevron-right" />
            </button>
          )}
          {hasAbsolute && !isCustom && !isRelative && !isDay && !isWeek && !isMonth && (
            <button className="btn navbar-button navbar-button--tight" onClick={onMoveForward}>
              <i className="fa fa-chevron-right" />
            </button>
          )}

          <Tooltip content={ZoomOutTooltip} placement="bottom">
            <button className="btn navbar-button navbar-button--zoom" onClick={onZoom}>
              <i className="fa fa-search-minus" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }
}

const ZoomOutTooltip = () => (
  <>
    Time range zoom out <br /> CTRL+Z
  </>
);

const TimePickerTooltip = ({ timeRange }: { timeRange: TimeRange }) => (
  <>
    {timeRange.from.format(TIME_FORMAT)}
    <div className="text-center">to</div>
    {timeRange.to.format(TIME_FORMAT)}
  </>
);

const TimePickerButtonLabel = memo<Props>(props => {
  const theme = useTheme();
  const styles = getLabelStyles(theme);
  const isUTC = props.timeZone === 'utc';
  const rangeString = formattedRange(props.value, isUTC);
  let range = rangeString.split(' to ');
  if (props.hideText) {
    return null;
  }
  const isToNeeded = range.length === 2;

  return (
    <span className={styles.container}>
      <span className={styles.labelBlue}>{range[0]}</span>
      {(isUTC || isToNeeded) && <span> to </span>}
      <span className={styles.labelBlue}>{range[1]}</span>
      {isUTC && <span className={styles.utc}>UTC</span>}
    </span>
  );
});

const formattedRange = (value: TimeRange, isUTC: boolean) => {
  const adjustedTimeRange = {
    to: dateMath.isMathString(value.raw.to) ? value.raw.to : adjustedTime(value.to, isUTC),
    from: dateMath.isMathString(value.raw.from) ? value.raw.from : adjustedTime(value.from, isUTC),
  };
  return rangeUtil.describeTimeRange(adjustedTimeRange);
};

const adjustedTime = (time: DateTime, isUTC: boolean) => {
  if (isUTC) {
    return time.utc() || null;
  }
  return time.local() || null;
};

export const TimePicker = withTheme(UnthemedTimePicker);
