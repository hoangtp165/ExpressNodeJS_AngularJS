app.controller("studentController", function (Upload, $scope, $http, $location, $window) {
    $scope.configData = {
        studentInputForm: {
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
        studentObj: {},
        studentList: [],
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
        if (!$scope.contextData.studentList || !$scope.contextData.studentList.length) {
            return 0;
        }
        return Math.ceil($scope.contextData.studentList.length / $scope.configData.pagination.pageSize);
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

    var addNewStudentAJAX = function () {
        var studentInfo = $scope.contextData.studentObj;
        if (!studentInfo || !studentInfo.name || !studentInfo.avatar) {
            if (!studentInfo) {
                alertify.error('student Information is invalidate.');
            }
            if (!studentInfo.name) {
                alertify.error('student name is invalidate.');
            }
            if (!studentInfo.avatar) {
                alertify.error('student avatar is required.');
            }
            return;
        }

        // alert($location.$$protocol+"://"+$location.$$host+":"+$location.$$port + '/student-management/add');
        Upload.upload({
            url: $scope.helper.getURL() + '/student-management/add',
            data: {student_data: studentInfo},
            file: studentInfo.avatar,
        }).then(function (resp) {
            console.log(resp);
            var result = resp.data;
            if (result.success) {
                $scope.control.refreshStudentList();
                $scope.contextData.studentObj = {};
                alertify.success("Craete Student Success");
                $scope.control.scrollTextBox();
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

    var refreshStudentList = function (onloadFinish) {
        $http.get($scope.helper.getURL() + '/student-management/list')
            .then(function (response) {
                var data = response.data;
                console.log(data);
                if (data.success) {
                    $scope.contextData.studentList = data.bundle.student_list;
                    $scope.control.scrollTextBox();
                } else if (!data.success) {
                    alertify.error("Data Load Fail.");
                }
            }, function (err) {
                alertify.error("Data load fail.");
                console.log('Error status: ' + err.status);
            });
    };

    var deleteStudentAJAX = function (studentObj) {

        var onCancel = function () {

        };

        var onOk = function () {
            $http.delete($scope.helper.getURL() + '/student-management/delete', {
                data: {student_id: studentObj.id},
                headers: {'Content-Type': 'application/json'}
            }).then(function (response) {
                console.log(response);
                var data = response.data;
                if (typeof data.success === "undefined" || !data.success) {
                    alertify.error("Error. " + data.detail);
                } else if (data.success) {
                    $scope.control.refreshStudentList();
                    alertify.success("Success");
                }
            }, function (err) {
                alertify.error("Data load fail.");
                console.log('Error status: ' + err.status);
            });
        };
        alertify.confirm('Confirm Title', 'Are you sure you wanna delete this student', onOk, onCancel);
    };

    var editStudent = function (studentObj) {
        $scope.contextData.studentObj = angular.copy(studentObj);
        $scope.configData.studentInputForm.type = "edit";
    };

    var updateStudentAJAX = function () {

        var onCancel = function () {
        };

        var onOk = function () {
            var putData = {
                method: 'PUT',
                url: $scope.helper.getURL() + '/student-management/update',
                data: {student_data: $scope.contextData.studentObj}
            };

            if ($scope.contextData.studentObj.avatar && typeof $scope.contextData.studentObj.avatar === "object") {
                putData.file = $scope.contextData.studentObj.avatar;
            }

            Upload.upload(putData).then(function (response) {
                console.log(response);
                var data = response.data;
                if (typeof data.success === "undefined" || !data.success) {
                    alertify.error("Error. " + data.detail);
                } else if (data.success) {
                    $scope.control.refreshStudentList();
                    alertify.success("Success");
                    $scope.contextData.studentObj = {};
                    $scope.configData.studentInputForm.type = "new";
                    $scope.control.scrollTextBox();
                }
            }, function (err) { //catch error
                alertify.error("Error");
                console.log('Error status: ' + err.status);
            });
        };
        alertify.confirm('Confirm Title', 'Are you sure you wanna update this student', onOk, onCancel);
    };

    var cancelUpdate = function () {
        $scope.contextData.studentObj = {};
        $scope.configData.studentInputForm.type = "new";
    };

    var refreshClassOptions = function () {
        $http.get($scope.helper.getURL() + '/class-management/listKeyValue')
            .then(function (response) {
                var data = response.data;
                console.log(data);
                if (data.success) {
                    $scope.contextData.classList = data.bundle.class_list;
                } else if (!data.success) {
                    alertify.error("Class select list load fail.");
                }
            }, function (err) {
                alertify.error("Class select list load fail.");
                console.log('Error status: ' + err.status);
            });
    };

    var scrollTextBox = function () {
        $(function () {
            $('.scroll-text-box').slimscroll({
                height: '68px',
                alwaysVisible: true
            });
        });
    };

    $scope.control = {
        addNewStudentAJAX: addNewStudentAJAX,
        editStudent: editStudent,
        deleteStudentAJX: deleteStudentAJAX,
        refreshStudentList: refreshStudentList,
        updateStudentAJAX: updateStudentAJAX,
        cancelUpdate: cancelUpdate,
        scrollTextBox: scrollTextBox
    };

    $scope.control.refreshStudentList();
    refreshClassOptions();
});