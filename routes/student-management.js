var express = require('express');
var fs = require('fs');
var Multipart = require('connect-multiparty');
var multipartMiddleware = Multipart();
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendfile('./views/student-management.ejs');
});

router.get('/list', function (request, response, next) {
    var onMySQLSuccess = function (conn) {
        var query = "SELECT students.id, students.class_id, students.avatar, students.name, students.address, students.description, poly_classes.class_name as class_name FROM students INNER JOIN poly_classes ON students.class_id = poly_classes.id";

        var onQuerySuccess = function (res) {
            return response.end(toJSON(true, 'Success', {student_list: res}));
        };

        var onQueryFail = function (err) {
            return response.end(toJSON(false, 'Error', {error: {code: 500}}));
        };

        tryQuery(conn, query, onQuerySuccess, onQueryFail);
    };

    tryToConnect(onMySQLSuccess, function (err) {
        return response.end(toJSON(false, 'MYSQL connect fail', {error: {code: 7767}}));
    });
});


router.post('/add', multipartMiddleware, function (request, response, next) {
    var post = request.body;
    var studentName;

    if (!post.student_data.name || !(studentName = post.student_data.name) || !/[\wÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]/g.test(studentName) || studentName.length > 25 || studentName.length < 6) {
        return response.end(toJSON(false, 'student name is invalidate.', {error: {code: 8378}}));
    }

    if (typeof request.files === "undefined" || typeof request.files.file === "undefined" || typeof request.files.file.name === "undefined" || typeof request.files.file.path === "undefined") {
        return response.end(toJSON(false, 'Class Photo is missing or invalidate.', {error: {code: 6780}}));
    }

    var avatar = request.files.file;
    var avatarPathSave = './public/images/uploads/' + new Date().getTime() + "_" + avatar.name;
    var avatarPathView = '/images/uploads/' + +new Date().getTime() + "_" + avatar.name;
    var avatarFile = fs.readFileSync(avatar.path);
    var resultWriteFile = fs.writeFileSync(avatarPathSave, avatarFile);

    if (resultWriteFile !== undefined) {
        return response.end(toJSON(false, 'avatar upload fail.', {error: {code: 6585}}));
    }

    var classId;
    if (!post.student_data.class_id || !(classId = post.student_data.class_id) || isNaN(classId)) {
        return response.end(toJSON(false, 'class name is invalidate.', {error: {code: 6778}}));
    }

    if (post.student_data.address && post.student_data.address.length > 255) {
        return response.end(toJSON(false, 'address is too long.', {error: {code: 6576}}));
    }

    if (post.student_data.description && post.student_data.description.length > 255) {
        return response.end(toJSON(false, 'description is too long.', {error: {code: 6876}}));
    }

    var onMySQLSuccess = function (conn) {
        var query = "INSERT INTO `students` (`name`,`class_id`, `avatar`, `address`, `description`) VALUES ('" + studentName + "', " + classId + ", '" + avatarPathView + "'," + (post.student_data.address ? "'" + post.student_data.address + "'" : "null" ) + "," + (post.student_data.description ? "'" + post.student_data.description + "'" : "null") + ")";

        var onQuerySuccess = function (res) {
            return response.end(toJSON(true, 'Success', null));
        };

        var onQueryFail = function (err) {
            return response.end(toJSON(false, 'Fail on inserting', {error: {code: 500}}));
        };

        tryQuery(conn, query, onQuerySuccess, onQueryFail);
    };

    tryToConnect(onMySQLSuccess, function (err) {
        return response.end(toJSON(false, 'MYSQL connect fail', {error: {code: 7767}}));
    });
});


router.put('/update', multipartMiddleware, function (request, response, next) {
    if (!request.body) {
        return response.end(toJSON(false, 'Code error', {error: {code: 500}}));
    }

    var data = request.body;
    var studentData;
    if (!(studentData = data.student_data)) {
        return response.end(toJSON(false, 'Student data is required', {error: {code: 500}}));
    }

    if (!studentData.id) {
        return response.end(toJSON(false, 'Student id is required', {error: {code: 500}}));
    }

    var setName = null;
    if (studentData.name && !/[\wÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]/g.test(studentData.name)) {
        return response.end(toJSON(false, 'name is invalidate', {error: {code: 500}}));
    } else if (studentData.name && /[\wÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]/g.test(studentData.name) && studentData.name.length <= 25 && studentData.name.length >= 6) {
        setName = " `name` = '" + studentData.name + "'";
    }

    var setAvatar = null;
    if (typeof request.files !== "undefined" && typeof request.files.file !== "undefined" && typeof request.files.file.name !== "undefined" && typeof request.files.file.path !== "undefined") {
        var avatar = request.files.file;
        var avatarPathSave = './public/images/uploads/' + new Date().getTime() + "_" + avatar.name;
        setAvatar = " `avatar` = '/images/uploads/" + new Date().getTime() + "_" + avatar.name + "'";
        var avatarFile = fs.readFileSync(avatar.path);
        var resultWriteFile = fs.writeFileSync(avatarPathSave, avatarFile);

        if (resultWriteFile !== undefined) {
            return response.end(toJSON(false, 'avatar upload fail.', {error: {code: 6780}}));
        }
    }

    var setClassId = null;
    if (typeof studentData.class_id !== "undefined") {
        if (isNaN(studentData.class_id)) {
            return response.end(toJSON(false, 'Class ID is invalidate.', {error: {code: 6778}}));
        }
        setClassId = " `class_id` = " + studentData.class_id;
    }

    var setAddress = null;
    if (typeof studentData.address !== "undefined") {
        if (typeof studentData.address !== "string")
            return response.end(toJSON(false, 'address have to be a string.', {error: {code: 6583}}));

        if (studentData.address && studentData.address.length > 255)
            return response.end(toJSON(false, 'address is too long.', {error: {code: 6576}}));
        setAddress = " `address` = '" + studentData.address + "'";
    }

    var setDescription = null;
    if (typeof studentData.description !== "undefined") {
        if (typeof studentData.description !== "string")
            return response.end(toJSON(false, 'description have to be a string.', {error: {code: 6883}}));

        if (studentData.description && studentData.description.length > 255)
            return response.end(toJSON(false, 'description is too long.', {error: {code: 6876}}));

        setDescription = " `description` = '" + studentData.description + "'";
    }

    var query = "UPDATE `students` SET ";

    if (setName) {
        query += (setName + ",");
    }

    if (setAvatar) {
        query += (setAvatar + ",");
    }

    if (setAddress && studentData.address !== "null") {
        query += (setAddress + ",");
    }

    if (setDescription && studentData.description !== "null") {
        query += (setDescription + ",");
    }

    if (setClassId) {
        query += (setClassId + ",");
    }

    query = query.substring(0, query.length - 1);

    query += " WHERE `students`.`id` = " + studentData.id;

    console.log("query", query);

    var onMySQLSuccess = function (conn) {
        var onQuerySuccess = function (res) {
            console.log('res', res);
            if (res.affectedRows > 0) {
                return response.end(toJSON(true, 'Success', null));
            } else if (res.affectedRows === 0) {
                return response.end(toJSON(false, 'student not found', {error: {code: 83404}}));
            } else {
                return response.end(toJSON(false, 'Error', {error: {code: 500}}));
            }
        };

        var onQueryFail = function (err) {
            console.log('err', err);
            return response.end(toJSON(false, 'Error', {error: {code: 500}}));
        };

        tryQuery(conn, query, onQuerySuccess, onQueryFail);
    };

    tryToConnect(onMySQLSuccess, function (err) {
        return response.end(toJSON(false, 'MYSQL connect fail', {error: {code: 7767}}));
    });
});

router.delete('/delete', function (request, response, next) {
    // console.log(request);
    if (!request.body) {
        return response.end(toJSON(false, 'Code error', {error: {code: 500}}));
    }

    var data = request.body;
    console.log(data);
    if (!data.student_id) {
        return response.end(toJSON(false, 'student id is required', {error: {code: 500}}));
    }

    var onMySQLSuccess = function (conn) {
        var query = "DELETE FROM students WHERE id = " + data.student_id;

        var onQuerySuccess = function (res) {
            console.log('res', res);
            if (res.affectedRows > 0) {
                return response.end(toJSON(true, 'Success', null));
            } else if (res.affectedRows === 0) {
                return response.end(toJSON(false, 'student not found', {error: {code: 83404}}));
            } else {
                return response.end(toJSON(false, 'Error', {error: {code: 500}}));
            }
        };

        var onQueryFail = function (err) {
            console.log('err', err);
            return response.end(toJSON(false, 'Error', {error: {code: 500}}));
        };

        tryQuery(conn, query, onQuerySuccess, onQueryFail);
    };

    tryToConnect(onMySQLSuccess, function (err) {
        return response.end(toJSON(false, 'MYSQL connect fail', {error: {code: 7767}}));
    });
});

function toJSON(success, detail, bundle) {
    return JSON.stringify({success: success, detail: detail, bundle: bundle});
}

function getMySQL() {
    return require('mysql').createConnection({
        host: 'localhost',
        user: 'root',
        password: 'abc123',
        database: 'asm2'
    });
}

function tryToConnect(onConnected, onConnectFail) {
    var conn = getMySQL();
    conn.connect(function (err) {
        if (err) onConnectFail(err);
        onConnected(conn)
    })
}

function tryQuery(conn, query, onSuccess, onFail) {
    conn.query(query, function (err, res) {
        if (!err) onSuccess(res);
        else onFail(err);
    });
}

module.exports = router;
