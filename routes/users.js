var express = require('express');
var router = express.Router();

var AV = require('leanengine');


router.get('/login', function (req, res, next) {
    var currentUser = AV.User.current();
    var errCode = req.query.errCode;

    if (errCode != null) {
        var code = JSON.parse(errCode).code;
    }

    res.render('login', {errCode: code});
});

router.post('/login', function (req, res, next) {
    var username = '';
    var password = '';

    // 判断用户名和密码是否为空
    if (!(req.body.username) || req.body.username.trim().length == 0) {
        return res.redirect('/users/login?errCode={"code":1}');
    }
    else if (!(req.body.password) || req.body.password.trim().length == 0) {
        return res.redirect('/users/login?errCode={"code":2}');
    }
    else if (req.body.username == 'administrator') {
        username = req.body.username;
        password = req.body.password;
    }else {
        return res.redirect('/users/login?errCode={"code":3}');
    }

    AV.User.logIn(username, password).then(function (user) {
        res.saveCurrentUser(user);
        res.redirect('/manage/0');
    }, function (err) {
        res.redirect('/users/login?errCode=' + JSON.stringify(err));
    }).catch(next);
});


router.get('/logout', function (req, res, next) {
    AV.User.logOut();
    res.clearCurrentUser();
    return res.redirect('/users/login');
});


module.exports = router;