import angular from 'angular';
import _ from 'lodash';
import { DashboardModel } from 'app/features/dashboard/state';
import { GrafanaRootScope } from 'app/routes/GrafanaCtrl';
import { CoreEvents } from 'app/types';

export let iconMap = {
  'time range': 'fa-clock-o',
  dashboard: 'fa-th-large',
  question: 'fa-question',
  info: 'fa-info',
  bolt: 'fa-bolt',
  doc: 'fa-file-text-o',
  cloud: 'fa-cloud',
};

export function timeToString(aHour: any, aMinute: any) {
  if (aHour % 1 === 0 && aMinute % 1 === 0 && aHour < 24 && aHour >= 0 && aMinute < 60 && aMinute >= 0) {
    if (aHour.toString().length === 1) {
      aHour = '0' + aHour;
    }
    if (aMinute.toString().length === 1) {
      aMinute = '0' + aMinute;
    }
    const TimeString = aHour + ':' + aMinute;
    return TimeString;
  }
  throw new Error('Invalid input');
}

export class NewRangesEditorCtrl {
  dashboard: DashboardModel;
  iconMap: any;
  mode: any;
  link: any;
  range: any;
  form: any;
  days: any;
  customReload: any;

  /** @ngInject */
  constructor($scope: any, $rootScope: GrafanaRootScope) {
    this.iconMap = iconMap;
    this.dashboard.ranges = this.dashboard.ranges || [];
    this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.mode = 'list';

    $scope.$on('$destroy', () => {
      $rootScope.appEvent(CoreEvents.customRangessUpdated);
    });
  }

  isValid = () => {
    if (!this.form.$valid) {
      return false;
    }

    const sameName = _.find(this.dashboard.ranges, { name: this.range.name });
    if (sameName && sameName !== this.range) {
      //appEvents.emit('alert-warning', ['Validation', 'Time Range with the same name already exists']);
      return false;
    }

    return true;
  };

  backToList() {
    this.mode = 'list';
  }

  setupNew() {
    this.mode = 'new';
    this.range = { type: 'shift', icon: 'time range' };
  }

  addRange() {
    if (this.isValid()) {
      this.range.from = timeToString(this.range.fromHour, this.range.fromMin);
      this.range.to = timeToString(this.range.toHour, this.range.toMin);
      this.dashboard.ranges.push(this.range);
      this.mode = 'list';
    }
  }

  editRange(aRange: any) {
    this.range = aRange;
    this.mode = 'edit';
  }

  saveRange() {
    if (this.isValid()) {
      this.range.from = timeToString(this.range.fromHour, this.range.fromMin);
      this.range.to = timeToString(this.range.toHour, this.range.toMin);
      this.backToList();
    }
  }

  // moveRange(aIndex: string | number, aDir: string | number) {
  //   _.move(this.dashboard.ranges, aIndex, aIndex + aDir);
  // }
  moveRange(index: string | number, dir: string | number) {
    // @ts-ignore
    this.array_move(this.dashboard.ranges, index, index + dir);
  }

  array_move(arr: any[], old_index: any, new_index: any) {
    if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  }

  deleteRange(aIndex: any) {
    this.dashboard.ranges.splice(aIndex, 1);
    this.dashboard.updateSubmenuVisibility();
  }

  editDay() {
    this.mode = 'edit-Day';
    //this.dashboard.day = 'DAY!!!!'
  }
  saveDay() {
    this.dashboard.day.from = timeToString(this.dashboard.day.fromHour, this.dashboard.day.fromMin);
    this.dashboard.day.to = timeToString(this.dashboard.day.toHour, this.dashboard.day.toMin);
    this.dashboard.day.name = 'Last Day';
    this.dashboard.day.type = 'lastDay';
    this.backToList();
  }
  editWeek() {
    this.mode = 'edit-Week';
    //this.dashboard.week = 'DAY!!!!'
  }
  saveWeek() {
    this.dashboard.week.from = timeToString(this.dashboard.week.fromHour, this.dashboard.week.fromMin);
    this.dashboard.week.to = timeToString(this.dashboard.week.toHour, this.dashboard.week.toMin);
    this.dashboard.week.name = 'Last Week';
    this.dashboard.week.type = 'lastWeek';
    this.backToList();
  }
}

function newRangesEditor() {
  return {
    restrict: 'E',
    controller: NewRangesEditorCtrl,
    templateUrl: 'public/app/features/dashboard/components/CustomTimeRanges/editor.html',
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      dashboard: '=',
    },
  };
}

angular.module('grafana.directives').directive('newRangesEditor', newRangesEditor);
