import moment from 'moment';
/*
  Notes:
    Modes are as follows: Shif -> Called when CustomTimeRange is choosen in the timepicker and one of timepickers navigation arrows is clicked on
                          ShifByDay -> Called from timepicker it self when Custom Time Range is clicked on, Date is set based on "From"
                          option in timepicker
*/
export function customTimeRangePicked(aMode: any, aRange: any, aDayShift: any, aEditTimeRaw: any): any {
  // Todo?? Does this if needs to be here?
  if (
    aRange.type === 'shift' ||
    aRange.type === 'day' ||
    aRange.type === 'lastDay' ||
    aRange.type === 'lastWeek' ||
    aRange.type === 'week' ||
    aRange.type === 'month' ||
    aRange.type === 'currentShift'
  ) {
    switch (aMode) {
      case 'shift':
        const shiftResult = shift(aRange, aDayShift);
        return shiftResult;

      case 'shiftByDay':
        const shiftByDayResult = shiftByDay(aRange, aEditTimeRaw);
        return {
          range: aRange,
          dayShift: shiftByDayResult.dayShift,
        };
      case 'day':
      case 'lastDay':
        const lastDayResult = lastDay(aRange, aDayShift);
        return {
          range: aRange,
          dayShift: lastDayResult.dayShift,
        };
      case 'week':
      case 'lastWeek':
        //const lastWeekResult = lastWeek(aRange);
        lastWeek(aRange, aDayShift);
        return {
          range: aRange,
          //dayShift: lastWeekResult.dayShift,
        };
      case 'currentShift':
        const resultShift = currentShift(aRange);
        return {
          range: resultShift.range,
          dayShift: resultShift.dayShift,
          index: resultShift.index,
        };
      case 'month':
        const monthResult = lastMonth(aRange, aDayShift);
        return {
          range: monthResult.range,
        };
      default:
        throw new Error('Unknown mode');
    }
  } else {
    throw new TypeError('Unknown range type');
  }
}
export function currentShiftInit(aRange: any, aDayShift: any): any {
  const resultShift = currentShift(aRange);
  return {
    range: resultShift.range,
    dayShift: resultShift.dayShift,
    index: resultShift.index,
  };
}
export function customMove(aDirection: any, aIndex: any, aTimeOption: any, aDayShift: any) {
  if (rangeIsValid(aTimeOption[aIndex])) {
    if (aTimeOption[aIndex].type === 'shift') {
      const shiftMoveResult = shiftMove(aDirection, aIndex, aTimeOption, aDayShift);
      return {
        index: shiftMoveResult.index,
        dayShift: shiftMoveResult.dayShift,
      };
    } else {
      throw new TypeError('Unknown range type');
    }
  }
  throw new Error('Invalid range');
}

export function shiftMove(aDirection: any, aIndex: any, aTimeOption: any, aDayShift: any) {
  if (rangeIsValid(aTimeOption[aIndex])) {
    let newDayPresent = 0;
    if (aDayShift % 1 !== 0 || isNaN(aDayShift) || aDayShift.length === 0) {
      throw new Error('Invalid dayShift');
    }
    if (aDirection !== -1 && aDirection !== 0 && aDirection !== 1) {
      throw new Error('Invalid direction');
    }

    for (let i = 0; i < aTimeOption.length; i++) {
      newDayPresent = newDayPresent | aTimeOption[i].newDay;
    }

    if (aDirection === -1) {
      const result = backward(aIndex, aTimeOption, aDayShift, newDayPresent);
      return {
        index: result.index,
        dayShift: result.dayShift,
      };
    } else if (aDirection === 1) {
      const result = forward(aIndex, aTimeOption, aDayShift, newDayPresent);
      return {
        index: result.index,
        dayShift: result.dayShift,
      };
    }
  }
  throw new Error('Invalid range');
}

export function forward(aIndex: any, aTimeOption: any, aDayShift: any, aNewDayPresent: any) {
  if (aTimeOption.length === 1) {
    return {
      index: aIndex,
      dayShift: aDayShift + 1,
    };
  }

  if (!aNewDayPresent && aIndex === aTimeOption.length - 1) {
    aDayShift++;
  }
  // Index handling
  aIndex = getNextIndex(aTimeOption, aIndex);
  // DayShift handling
  if (aTimeOption[aIndex].newDay || aTimeOption.length === 1) {
    aDayShift++;
  }

  return {
    index: aIndex,
    dayShift: aDayShift,
  };
}

export function backward(aIndex: any, aTimeOption: any, aDayShift: any, aNewDayPresent: any) {
  if (!aNewDayPresent && aIndex === 0) {
    aDayShift -= 1;
  }

  // Index handling
  if (aIndex === 0) {
    aIndex = aTimeOption.length - 1;
  } else {
    aIndex--;
  }
  // DayShift handling

  if (aTimeOption[aIndex].newDay) {
    aDayShift -= 1;
  }

  if (aTimeOption[aIndex].newDay && !aTimeOption[getNextIndex(aTimeOption, aIndex)].newDay) {
    aDayShift += 1;
  } else if (aTimeOption[getNextIndex(aTimeOption, aIndex)].newDay && !aTimeOption[aIndex].newDay) {
    aDayShift -= 1;
  }

  return {
    index: aIndex,
    dayShift: aDayShift,
  };
}

// Sets range absoluteFrom and absoluteTo based on dayshift input
export function shift(aRange: any, aDayShift: any) {
  if (rangeIsValid(aRange)) {
    if (aDayShift % 1 !== 0 || isNaN(aDayShift) || aDayShift.length === 0) {
      throw new Error('Invalid dayShift');
    }
    const now = new Date();
    let today, yesterday;
    now.setDate(now.getDate() + aDayShift);

    today = getDateString(now);

    if (aRange.newDay) {
      now.setDate(now.getDate() - 1);
      yesterday = getDateString(now);
      aRange.absoluteFrom = yesterday + ' ' + aRange.from + ':00';
      aRange.absoluteTo = today + ' ' + aRange.to + ':00';
      return aRange;
    } else {
      aRange.absoluteFrom = today + ' ' + aRange.from + ':00';
      aRange.absoluteTo = today + ' ' + aRange.to + ':00';
      return aRange;
    }
  }
  throw new Error('Invalid range');
}

// Sets range absoluteFrom and absoluteTo based on TimeRaw.from from timepicker itself
export function shiftByDay(aRange: any, aEditTimeRaw: any) {
  if (rangeIsValid(aRange)) {
    const from = moment(aEditTimeRaw.from).format('YYYY-MM-DD');
    const diff = moment().diff(from, 'days');
    if (aRange.newDay) {
      aEditTimeRaw.from = moment(aEditTimeRaw.from, 'YYYY-MM-DD').add(1, 'days');
    }
    const to = moment(aEditTimeRaw.from).format('YYYY-MM-DD');

    aRange.absoluteFrom = from + ' ' + aRange.from + ':00';
    aRange.absoluteTo = to + ' ' + aRange.to + ':00';
    return {
      range: aRange,
      dayShift: -diff,
    };
  }
  throw new Error('Invalid range');
}

export function lastShift(aRanges: any) {
  const temp = getToTimes(aRanges);
  const result = customTimeRangePicked('shift', aRanges[temp.index], temp.dayShift, null);

  return {
    range: result,
    dayShift: temp.dayShift,
    index: temp.index,
  };
}
export function getToTimes(aRanges: any) {
  const lNow = moment();
  const lTimeNow = lNow.hour() * 60 + lNow.minute();
  const lSmallerTimes = [];
  let lResultIndex;
  let lFound = false;

  const lTimes = [];
  let dayShift = 0;

  for (let i = 0; i < aRanges.length; i++) {
    lTimes[i] = aRanges[i].toHour * 60 + aRanges[i].toMin;

    if (lTimeNow > lTimes[i]) {
      lSmallerTimes.push(aRanges[i].toHour * 60 + aRanges[i].toMin);
      lFound = true;
    }
  }
  if (lFound === false) {
    lResultIndex = lTimes.indexOf(Math.max(...lTimes));
    dayShift = -1;
  } else {
    lResultIndex = lTimes.indexOf(Math.max(...lSmallerTimes));
  }

  return {
    index: lResultIndex,
    dayShift: dayShift,
  };
}

export function currentShift(aCurrent: any) {
  const temp = getFromTimes(aCurrent.rangeList);
  const result = getCurrentshift(aCurrent.rangeList[temp.index], temp.dayShift);

  return {
    range: result,
    dayShift: temp.dayShift,
    index: temp.index,
  };
}
export function getFromTimes(aRanges: any) {
  const lNow = moment();
  const lTimeNow = lNow.hour() * 60 + lNow.minute();
  const lSmallerTimes = [];
  let lResultIndex;
  let lFound = false;

  const lTimes = [];
  let dayShift = 0;

  for (let i = 0; i < aRanges.length; i++) {
    if (aRanges[i].type !== 'currentShift') {
      lTimes[i] = aRanges[i].fromHour * 60 + aRanges[i].fromMin;

      if (lTimeNow > lTimes[i]) {
        lSmallerTimes.push(aRanges[i].fromHour * 60 + aRanges[i].fromMin);
        lFound = true;
      }
    }
  }
  if (lFound === false) {
    lResultIndex = lTimes.indexOf(Math.max(...lTimes));
    dayShift = -1;
  } else {
    lResultIndex = lTimes.indexOf(Math.max(...lSmallerTimes));
  }

  return {
    index: lResultIndex,
    dayShift: dayShift,
  };
}

export function getCurrentshift(aRange: any, aDayShift: any) {
  if (rangeIsValid(aRange)) {
    if (aDayShift % 1 !== 0 || isNaN(aDayShift) || aDayShift.length === 0) {
      throw new Error('Invalid dayShift');
    }
    //aRange.type = 'currentShift';
    const now = new Date();
    let today, yesterday, tomorow;
    //now.setDate(now.getDate() + aDayShift);
    let timeNow = now.getHours() * 60 + now.getMinutes();
    let timeFrom = aRange.fromHour * 60 + aRange.fromMin;
    today = getDateString(now);

    if (aRange.newDay) {
      if (timeFrom < timeNow) {
        now.setDate(now.getDate() + 1);
        tomorow = getDateString(now);
        aRange.absoluteFrom = today + ' ' + aRange.from + ':00';
        aRange.absoluteTo = tomorow + ' ' + aRange.to + ':00';
        return aRange;
      } else {
        now.setDate(now.getDate() - 1);
        yesterday = getDateString(now);
        aRange.absoluteFrom = yesterday + ' ' + aRange.from + ':00';
        aRange.absoluteTo = today + ' ' + aRange.to + ':00';
        return aRange;
      }
    } else {
      aRange.absoluteFrom = today + ' ' + aRange.from + ':00';
      aRange.absoluteTo = today + ' ' + aRange.to + ':00';
      return aRange;
    }
  }
  throw new Error('Invalid range');
}

export function lastDay(aDay: any, aDayShift = 0) {
  const lNow = moment();
  const lTimeNow = lNow.hour() * 60 + lNow.minute();
  const lDayToTime = aDay.toHour * 60 + aDay.toMin;

  if (lDayToTime > lTimeNow) {
    aDayShift--;
  }

  // if (aDay.newDay) {
  //   dayShift = -1;
  // }
  aDay.type = 'day';
  const result = customTimeRangePicked('shift', aDay, aDayShift, null);

  return {
    range: result,
    dayShift: aDayShift,
  };
}

export function lastWeek(aWeek: any, aWeekShift: number) {
  aWeek.type = 'week';
  let lEndOffset = 0 + aWeekShift;
  let lStarOffset = 0 + aWeekShift;

  const lToday = moment().isoWeekday();
  const lEnd = getDayNumber(aWeek.endDay);
  const lStart = getDayNumber(aWeek.startDay);

  if (lToday === lEnd) {
    const lNow = moment();
    const lTimeNow = lNow.hour() * 60 + lNow.minute();

    if (lTimeNow < aWeek.toHour * 60 + aWeek.toMin) {
      lEndOffset--;
    }
  } else if (lToday > lEnd) {
  } else {
    lEndOffset--;
  }

  // check if Work ween is crossing from sunday into the other one
  if (lStart < lEnd) {
    lStarOffset = lEndOffset;
  } else {
    lStarOffset = lEndOffset - 1;
  }
  const result = week(aWeek, lStarOffset, lEndOffset);
  return result;
}

export function week(aWeek: any, aStarOffset: any, aEndOffset: any) {
  const lStart = getDayNumber(aWeek.startDay);
  const lEnd = getDayNumber(aWeek.endDay);

  const lFromDate = moment()
    .isoWeekday(lStart)
    .add(aStarOffset, 'week')
    .format('YYYY-MM-DD');
  const lToDate = moment()
    .isoWeekday(lEnd)
    .add(aEndOffset, 'week')
    .format('YYYY-MM-DD');

  aWeek.absoluteFrom = lFromDate + ' ' + aWeek.from + ':00';
  aWeek.absoluteTo = lToDate + ' ' + aWeek.to + ':00';
  return {
    week: aWeek,
    startOffset: aStarOffset,
    endOffset: aEndOffset,
  };
}

export function lastMonth(aMonth: any, aMonthShift = 0) {
  let LastDay = new Date();
  LastDay.setDate(0);
  let dateMonth = LastDay.getMonth();
  let year = LastDay.getFullYear();
  const FirstDay = new Date(year, dateMonth, 1);

  const dateTo = moment(FirstDay)
    .add(aMonthShift + 1, 'month')
    .format('YYYY-MM-DD');
  const dateFrom = moment(FirstDay)
    .add(aMonthShift, 'month')
    .format('YYYY-MM-DD');

  aMonth.absoluteFrom = dateFrom + ' ' + aMonth.from + ':00';
  aMonth.absoluteTo = dateTo + ' ' + aMonth.from + ':00';
  return {
    range: aMonth,
  };
}

export function getNextIndex(aTimeOption: any, aIndex: any) {
  if (aIndex === aTimeOption.length - 1) {
    aIndex = 0;
  } else {
    aIndex++;
  }

  return aIndex;
}

export function getPrewiosIndex(aTimeOption: any, aIndex: any) {
  if (aIndex === 0) {
    aIndex = aTimeOption.length - 1;
  } else {
    aIndex--;
  }

  return aIndex;
}

export function rangeIsValid(aRange: any) {
  // from and to validation
  if (aRange === undefined || aRange === null) {
    return false;
  }
  const re = /^([[0-1][0-9]|2[0-4]):[0-5][0-9]$/;
  if (!re.test(aRange.to) || !re.test(aRange.from)) {
    return false;
  }
  // name validation
  if (aRange.type === 'shift') {
    if (!aRange.name || 0 === aRange.name.length) {
      return false;
    }
  }
  return true;
}

export function getDateString(aDate: any) {
  if (!(aDate instanceof Date)) {
    throw new Error('Input is not instance of Date');
  }
  const now = aDate;
  const year = now.getFullYear();
  let month = (now.getMonth() + 1).toString();
  let day = now.getDate().toString();
  if (month.toString().length === 1) {
    month = '0' + month;
  }
  if (day.toString().length === 1) {
    day = '0' + day;
  }

  const dateTimeString = year + '-' + month + '-' + day;
  return dateTimeString;
}

export function getDayNumber(aDay: any) {
  switch (aDay) {
    case 'Monday':
      return 1;
    case 'Tuesday':
      return 2;
    case 'Wednesday':
      return 3;
    case 'Thursday':
      return 4;
    case 'Friday':
      return 5;
    case 'Saturday':
      return 6;
    case 'Sunday':
      return 7;
    default:
      throw new Error('Invalid Day');
  }
}
