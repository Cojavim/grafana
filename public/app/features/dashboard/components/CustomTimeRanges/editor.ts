import angular from 'angular';
import _ from 'lodash';
import { DashboardModel } from 'app/features/dashboard/state';
import { GrafanaRootScope } from 'app/routes/GrafanaCtrl';

export let iconMap = {
  'time range': 'fa-clock-o',
};

export class CustomTimeRangeEditorCtrl {
  dashboard: DashboardModel;
  iconMap: any;
  mode: any;

  /** @ngInject */
  constructor($scope: any, $rootScope: GrafanaRootScope) {
    this.iconMap = iconMap;
    this.mode = 'list';

    $scope.$on('$destroy', () => {
      $rootScope.appEvent('custom-ranges-updated');
    });

    console.log('Custom ranges editor', this.dashboard);
  }
}

function customRangeEditor() {
  return {
    restrict: 'E',
    controller: CustomTimeRangeEditorCtrl,
    templateUrl: 'public/app/features/dashboard/custom_time_ranges/editor.html',
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      dashboard: '=',
    },
  };
}

angular.module('grafana.directives').directive('customRangeEditor', customRangeEditor);
