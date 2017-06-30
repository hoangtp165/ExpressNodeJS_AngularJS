var express = require('express');
var fs = require('fs');
var Multipart = require('connect-multiparty');
var multipartMiddleware = Multipart();
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendfile('./views/class-management.ejs');
});


router.get('/list', function (request, response, next) {
    var onMySQLSuccess = function (conn) {
        var query = "SELECT poly_classes.id, poly_classes.class_name, poly_classes.cover_photo, COUNT(students.id) AS student_total FROM poly_classes LEFT JOIN students ON students.class_id = poly_classes.id GROUP BY poly_classes.id ";

        var onQuerySuccess = function (res) {
            console.log('res', res);
            return response.end(toJSON(true, 'Success', {class_list: res}));
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

router.get('/listKeyValue', function (request, response, next) {
    var onMySQLSuccess = function (conn) {
        var query = "SELECT id AS class_id, class_name FROM poly_classes";

        var onQuerySuccess = function (res) {
            console.log('res', res);
            return response.end(toJSON(true, 'Success', {class_list: res}));
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

router.post('/add', multipartMiddleware, function (request, response, next) {
    var post = request.body;
    var className;

    if (!post.class_data.class_name || !(className = post.class_data.class_name) || !/^[A-Z]{2}([0-9]{5,6})$/g.test(className)) {
        console.log('class name', 'missing');
        return response.end(toJSON(false, 'Class name is invalidate.', {error: {code: 6778}}));
    }

    if (typeof request.files === "undefined" || typeof request.files.file === "undefined" || typeof request.files.file.name === "undefined" || typeof request.files.file.path === "undefined") {
        return response.end(toJSON(false, 'Class Photo is missing or invalidate.', {error: {code: 6780}}));
    }
    var coverPhoto = request.files.file;
    var avatarPathSave = './public/images/uploads/' + new Date().getTime() + "_" + coverPhoto.name;
    var avatarPathView = '/images/uploads/' + +new Date().getTime() + "_" + coverPhoto.name;
    var avatarFile = fs.readFileSync(coverPhoto.path);
    var resultWriteFile = fs.writeFileSync(avatarPathSave, avatarFile);

    if (resultWriteFile !== undefined) {
        return response.end(toJSON(false, 'Cover Photo upload fail.', {error: {code: 6780}}));
    }

    var onMySQLSuccess = function (conn) {
        var query = "INSERT INTO `poly_classes` (`class_name`, `cover_photo`) VALUES ('" + className + "', '" + avatarPathView + "')";

        var onQuerySuccess = function (res) {
            console.log('res', res);
            return response.end(toJSON(true, 'Success', null));
        };

        var onQueryFail = function (err) {
            console.log('err', err);
            if (err.errno === 1062) return response.end(toJSON(false, 'Class name is exists.', {error: {code: 1062}}));
            else return response.end(toJSON(false, 'Fail on inserting', {error: {code: 500}}));
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
    if (!data.class_data) {
        return response.end(toJSON(false, 'Class data is required', {error: {code: 500}}));
    }
    var classData = data.class_data;

    if (!classData.id) {
        return response.end(toJSON(false, 'Class id is invalidate', {error: {code: 500}}));
    }

    var setName = null;
    if (classData.class_name && !/^[A-Z]{2}([0-9]{5,6})$/g.test(classData.class_name)) {
        return response.end(toJSON(false, 'Class name is invalidate', {error: {code: 500}}));
    } else if (classData.class_name && /^[A-Z]{2}([0-9]{5,6})$/g.test(classData.class_name)) {
        setName = "`class_name` = '" + classData.class_name + "'";
    }


    var setCover = null;
    if (typeof request.files !== "undefined" && typeof request.files.file !== "undefined" && typeof request.files.file.name !== "undefined" && typeof request.files.file.path !== "undefined") {
        var coverPhoto = request.files.file;
        var avatarPathSave = './public/images/uploads/' + new Date().getTime() + "_" + coverPhoto.name;
        setCover = "`cover_photo` = '/images/uploads/" + new Date().getTime() + "_" + coverPhoto.name + "'";
        var avatarFile = fs.readFileSync(coverPhoto.path);
        var resultWriteFile = fs.writeFileSync(avatarPathSave, avatarFile);

        if (resultWriteFile !== undefined) {
            return response.end(toJSON(false, 'Cover Photo upload fail.', {error: {code: 6780}}));
        }
    }

    if (!setName && !setCover) {
        return response.end(toJSON(true, 'Nothing change.', {error: {code: 500}}));
    }

    var query = "UPDATE `poly_classes` SET ";

    if (setName) {
        query += (setName + ",");
    }

    if (setCover) {
        query += (setCover + ",");
    }

    query = query.substring(0, query.length - 1);

    query += "WHERE `poly_classes`.`id` = " + classData.id;

    var onMySQLSuccess = function (conn) {
        var onQuerySuccess = function (res) {
            console.log('res', res);
            if (res.affectedRows > 0) {
                return response.end(toJSON(true, 'Success', null));
            } else if (res.affectedRows === 0) {
                return response.end(toJSON(false, 'class not found', {error: {code: 67}}));
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
    console.log(request);
    if (!request.body) {
        return response.end(toJSON(false, 'Code error', {error: {code: 500}}));
    }

    var data = request.body;
    if (!data.class_id) {
        return response.end(toJSON(false, 'Class id is required', {error: {code: 500}}));
    }

    var onMySQLSuccess = function (conn) {
        var query = "DELETE FROM poly_classes WHERE id = " + data.class_id;

        var onQuerySuccess = function (res) {
            console.log('res', res);
            if (res.affectedRows > 0) {
                return response.end(toJSON(true, 'Success', null));
            } else if (res.affectedRows === 0) {
                return response.end(toJSON(false, 'class not found', {error: {code: 67}}));
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
