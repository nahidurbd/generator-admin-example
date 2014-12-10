define([], function() {
  var diName = 'RulesEditCtrl';
  return {
    __register__: function(mod) {
      mod.controller(diName, ['$rootScope', '$scope', '$state', '$window', '$location', 'ds.rules', '$log', RulesEditCtrl]);
      return mod;
    }
  };

  function RulesEditCtrl($rootScope, $scope, $state, $window, $location, DS, $log) {
    var stateParams = $state.params,
      isEditState = _.has(stateParams, 'id'),
      curRefItem, curRefIndex;
    clearForm();

    if(isEditState) {
      DS.edit({
          'id': stateParams.id
        })
        .then(function(data) {
          $scope.entity = DS.data;
        })
        .then(function() {
          //handle the checkbox rendering when in edit page
          var checkboxItems = $('.checkbox-type'),
            item;
          for(var i = 0, l = checkboxItems.length; i < l; i++) {
            var item = checkboxItems[i];
            column = $(item).data('column'),
              columnItems = $(item).data('checkbox').split(',');
            $scope.entity[column].forEach(function(columnItem) {
              var index = _.indexOf(columnItems, columnItem);
              $scope.checkbox[column + (index + 1)] = index > -1 ? true : false;
            });
          }
        });
    }

    //init the collapse component

    $scope['isCollapse1'] = false;

    $scope['isCollapse2'] = false;


    $scope.save = function() {
      saveEntity(function() {
        $window.history.back();
      });
    };

    $scope.saveAndContinueEdit = function() {
      saveEntity();
    };

    $scope.saveAsNew = function() {
      saveEntity(function() {
        clearForm();
      });
    };

    $scope.change = function(modelName, itemName, item) {
      var modelValue = $scope.entity[modelName] || [];
      if($scope.checkbox[itemName]) { //if checked
        if(_.indexOf(modelValue, item) === -1) {
          modelValue.push(item);
        }
      } else {
        modelValue.splice(_.indexOf(modelValue, item), 1);
      }
      $scope.entity[modelName] = modelValue;
    };

    $scope.open = function($event, columnName) { //for datepicker
      $event.preventDefault();
      $event.stopPropagation();
      $scope[columnName] = true;
    };
    $scope.format = 'yyyy-MM-dd';

    $scope.popUp = function(pageType, moduleName, modelName, index, params) { //params: editId or display_ref
      var path = '',
        originUrl = $location.absUrl(),
        originPath = $location.path();

      if(pageType == 'list') {
        path = '/' + moduleName + '/' + modelName + '?popup=1&label=' + params;
        curRefItem = modelName;
        curRefIndex = index;
      } else if(pageType == 'add') {
        path = '/' + moduleName + '/' + modelName + '/add?popup=1';
      } else if(pageType == 'edit') {
        path = '/' + moduleName + '/' + modelName + '/' + params + '?popup=1';
      }
      openChildWindow(originUrl.replace(originPath, path), 'from-inline-ref');
    };

    $scope.popUpList = function(moduleName, modelName, displayRef) {
      var path = '',
        originUrl = $location.absUrl(),
        originPath = $location.path();

      curRefItem = modelName;
      path = '/' + moduleName + '/' + modelName + '?popup=1&label=' + displayRef;
      openChildWindow(originUrl.replace(originPath, path), 'from-ref');
    };

    $scope.$on('INLINE_REF_LIST_SELECTED', function(data, args) {
      curRefIndex = curRefIndex || 0;
      if(!$scope.entity[curRefItem]) {
        $scope.entity[curRefItem] = [];
      }
      if(!$scope.entity[curRefItem][curRefIndex]) {
        $scope.entity[curRefItem][curRefIndex] = {};
      }
      $scope.entity[curRefItem][curRefIndex] = args;
      $scope.$apply();
    });

    $scope.$on('REF_LIST_SELECTED', function(data, args) {
      $scope.entity[curRefItem] = args;
      $scope.$apply();
    });

    function saveEntity(callback) {
      var action = isEditState ? 'update' : 'add';

      //pre process the post item: remove the inline reference item to be deleted
      for(var key in $scope.entity) {
        var item = $scope.entity[key];
        if(_.isArray(item) && item.length > 0 && _.isObject(item[0])) {
          $scope.entity[key] = _.filter(item, function(filterItem) {
            return !filterItem.isDelete;
          });
        }
      }

      return DS[action]($scope.entity)
        .then(function() {
          if($location.search().popup) {
            $window.close();
          }
          callback && callback();
        }, function(error) {
          //save failed
        });
    }

    function clearForm() {
      $scope.entity = {};
      $scope.checkbox = {};
    }

    function openChildWindow(url, windowName) {
      if($rootScope.childWindow) {
        $rootScope.childWindow.close();
      }
      $rootScope.childWindow = $window.open(url, windowName, 'width=1000,height=600,resizable=1');
    }
  }
})
