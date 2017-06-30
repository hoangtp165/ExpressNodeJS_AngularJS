app.controller("classController", function (Upload, $scope, $http, $location, $window) {
    $scope.configData = {
        classInputForm: {
            type: 'new'
        },
        pagination: {
            pageSize: 10,
            currentPage: 1
        }
    };

    $scope.contextData = {
        disabled: 'disabled',
        active: 'active',
        classObj: {},
        classList: [],
        pagination: {},
        configData: $scope.configData,
    };

    $scope.contextData.pagination.changePage = function (pageNumber) {
        if (pageNumber < 1) return;
        if (pageNumber > $scope.contextData.pagination.pageCount()) return;
        if ($scope.configData.pagination.currentPage === pageNumber) return;

        $scope.configData.pagination.currentPage = pageNumber;
    };

    $scope.contextData.pagination.pageCount = function () {
        if (!$scope.contextData.classList || !$scope.contextData.classList.length) {
            return 0;
        }
        return Math.ceil($scope.contextData.classList.length / $scope.configData.pagination.pageSize);
    };

    /**
     *
     * set up
     *
     * */

    $scope.openFileSelect = function () {
        document.getElementById("input-avatar").click();
    };

    function getURL() {
        return $location.$$protocol + "://" + $location.$$host + ":" + $location.$$port;
    }

    $scope.helper = {
        getURL: getURL
    };

    var addNewClassAJAX = function () {
        var classInfo = $scope.contextData.classObj;
        if (!classInfo || !classInfo.class_name || !classInfo.cover_photo) {
            if (!classInfo) {
                alertify.error('Class information is invalidate.');
            }

            if (!classInfo.class_name) {
                alertify.error('Class name is invalidate.');
            }

            if (!classInfo.cover_photo) {
                alertify.error('Class cover is required.');
            }

            if (typeof classInfo.cover_photo === "string") {
                alertify.error('please reopen your cover.');
            }
            return;
        }

        // alert($location.$$protocol+"://"+$location.$$host+":"+$location.$$port + '/class-management/add');
        Upload.upload({
            url: $scope.helper.getURL() + '/class-management/add',
            data: {class_data: classInfo},
            file: classInfo.cover_photo,
        }).then(function (resp) {
            console.log(resp);
            var result = resp.data;
            if (result.success) {
                $scope.control.refreshClassList();
                $scope.contextData.classObj = {};
                alertify.success("Thành Công");
            } else if (!result.success) {
                alertify.error(result.detail + " (Error ID: " + result.bundle.error.code + ")");
            }
        }, function (err) { //catch error
            alertify.error("Error");
            console.log('Error status: ' + err.status);
        }, function (evt) {
            console.log(evt);
        });
    };

    var refreshClassList = function (onloadFinish) {
        $http.get($scope.helper.getURL() + '/class-management/list')
            .then(function (response) {
                var data = response.data;
                console.log(data);
                if (data.success) {
                    $scope.contextData.classList = data.bundle.class_list;
                } else if (!data.success) {
                    alertify.error("Data Load Fail.");
                }
            }, function (err) {
                alertify.error("Data load fail.");
                console.log('Error status: ' + err.status);
            });
    };

    var deleteClassAJX = function (classObj) {

        var onCancel = function () {

        };

        var onOk = function () {
            $http.delete($scope.helper.getURL() + '/class-management/delete', {
                data: {class_id: classObj.id},
                headers: {'Content-Type': 'application/json'}
            }).then(function (response) {
                console.log(response);
                var data = response.data;
                if (typeof data.success === "undefined" || !data.success) {
                    alertify.error("Error");
                } else if (data.success) {
                    $scope.control.refreshClassList();
                    alertify.success("Success");
                }
            }, function (err) {
                alertify.error("Data load fail.");
                console.log('Error status: ' + err.status);
            });
        };
        alertify.confirm('Confirm Title', 'Are you sure you wanna delete this classes', onOk, onCancel);
    };

    var editClassAJAX = function (classObj) {
        $scope.contextData.classObj = classObj;
        $scope.configData.classInputForm.type = "edit";
    };

    var updateClassAJAX = function () {

        var onCancel = function () {

        };

        var onOk = function () {
            var dataSend = {
                class_data: $scope.contextData.classObj
            };
            if ($scope.contextData.classObj.cover_photo && typeof $scope.contextData.classObj.cover_photo === "object") {
                dataSend.file = $scope.contextData.classObj.cover_photo;
            }

            Upload.upload({
                method: 'PUT',
                url: $scope.helper.getURL() + '/class-management/update',
                data: dataSend
            }).then(function (response) {
                console.log(response);
                var data = response.data;
                if (typeof data.success === "undefined" || !data.success) {
                    alertify.error("Error");
                } else if (data.success) {
                    $scope.control.refreshClassList();
                    alertify.success("Success");
                    $scope.contextData.classObj = {};
                    $scope.configData.classInputForm.type = "new";
                }
            }, function (err) { //catch error
                alertify.error("Error");
                console.log('Error status: ' + err.status);
            });
        };
        alertify.confirm('Confirm Title', 'Are you sure you wanna update this classes', onOk, onCancel);
    };

    var cancelUpdate = function () {
        $scope.contextData.classObj = {};
        $scope.configData.classInputForm.type = "new";
    };

    $scope.control = {
        addNewClassAJAX: addNewClassAJAX,
        editClassAJAX: editClassAJAX,
        deleteClassAJX: deleteClassAJX,
        refreshClassList: refreshClassList,
        updateClassAJAX: updateClassAJAX,
        cancelUpdate: cancelUpdate
    };

    $scope.control.refreshClassList();
});

app.directive('tablePagination', function () {
    return {
        scope: {contextData: "=bundle"},
        resreict: 'E',
        template: '<ul class="pagination">' +
        '<li class="first {{(1===contextData.configData.pagination.currentPage || 0===contextData.configData.pagination.currentPage)?contextData.disabled:0}}" ng-click="contextData.pagination.changePage(1)"><span>&lt;&lt;</span></li>' +
        '<li class="prev {{(1===contextData.configData.pagination.currentPage || 0===contextData.configData.pagination.currentPage)?contextData.disabled:0}}" ng-click="contextData.pagination.changePage(contextData.configData.pagination.currentPage-1)"><span>&lt;</span></li>' +
        '<li class="{{($index+1===contextData.configData.pagination.currentPage)?contextData.active:0}}"  ng-repeat="n in (((b=[]).length=contextData.pagination.pageCount())&&b) track by $index" ng-click="contextData.pagination.changePage($index+1)"><a href="//" data-page="0">{{ $index+1 }}</a></li>' +
        '<li class="next {{(contextData.configData.pagination.currentPage==contextData.pagination.pageCount())?contextData.disabled:contextData.pageCount()}}" ng-click="contextData.pagination.changePage(contextData.configData.pagination.currentPage+1)"><a href="//" data-page="1">&gt;</a></li>' +
        '<li class="last {{(contextData.configData.pagination.currentPage==contextData.pagination.pageCount())?contextData.disabled:$index+1}}" ng-click="contextData.pagination.changePage(contextData.pagination.pageCount())"><a href="//" data-page="1">&gt;&gt;</a></li>' +
        '</ul>'
    }
});