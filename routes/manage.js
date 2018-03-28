'use strict'; //严格模式

// 使用第三方库
var AV = require('leanengine');
var express = require('express');
var router = require('express').Router();
var formidable = require('formidable'); //node的上传模块
var pinyin = require("pinyin");
var async = require("async");
var util = require('util');
var fs = require('fs'); //node的文件操作模块
var uuid = require('node-uuid');
var Category = AV.Object.extend('category');
var EduCategory = AV.Object.extend('EduCategory');


var global_data = {
    category_list: [],
    model_list: [],
    component_list: []
};


var camera = [];
var modelInit;
var pinyinInit = [];
var modelSerialized = [];
var modelConcat = [];
var models_data = [];
var user_data = [];
var addGcode;
var m_cost_total;
var t_cost_total;

var modelsBox;
var categoryBox;
var compsBox;


router.get('/:index', function(req, res) {
    var category_index = req.params.index; //先查category list
    //如果USERS登录了的话
    var currentUser = AV.User.current();
    if (currentUser) {
        res.redirect('/manage?category_index=' + category_index + '&model_index=0');
    } else {
        res.redirect('/users/login');
    }
});

//对于教育专区
router.get('/edu/:index', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        m_cost_total = 0;
        t_cost_total = 0;
        global_data.category_list = [];
        global_data.model_list = [];
        global_data.component_list = [];
        var category_index = req.params.index; //先查category list
        // console.log('this is edu');
        res.redirect('/manage/init/edu?category_index=' + category_index + '&model_index=0');
    } else {
        res.redirect('/users/login');
    }
});

router.get('/world/:worldIndex', function(req, res) {
    var world = req.params.worldIndex;
    if (Number(world) === 0) {
        console.log('model');
        res.redirect('/manage/0');
    } else if (Number(world) == 1) {
        // console.log('edu');
        res.redirect('/manage/edu/0');
    } else {
        res.redirect('/users/login');
    }
});

router.get('/cost-get/:cateIndex/:modelIndex', function(req, res) {
    t_cost_total = 0;
    m_cost_total = 0;
    var category_index = req.params.cateIndex;
    var model_index = req.params.modelIndex;
    var query = new AV.Query('category'); //先查目录
    query.descending('createdAt');
    query.find().then(function(results) {
        categoryBox = results;
        var obj1 = AV.Object.createWithoutData('category', '' + results[category_index].get('objectId'));
        var query2 = new AV.Query('models');
        query2.equalTo('category', obj1);
        query2.descending('createdAt');
        query2.find().then(function(res1) {
            var obj2 = AV.Object.createWithoutData('models', res1[model_index].get('objectId'));
            var query3 = new AV.Query('components'); //再查子部件
            query3.equalTo('model', obj2);
            query3.descending('createdAt');
            query3.find().then(function(res2) {
                if (res1 !== undefined && res2 !== undefined) {
                    var costObj = {};
                    for (var i = 0; i < res2.length; i++) {
                        t_cost_total += Number(compsBox[i].get('time_cost')) * 10;
                        m_cost_total += Number(compsBox[i].get('material_cost')) * 10;
                    }
                    costObj.t_cost = t_cost_total / 10;
                    costObj.m_cost = m_cost_total / 10;
                    res.json(costObj);
                } else {
                    console.log("err");
                }
            }, function(err2) {
                compsBox = [];
                console.log("component_error");
            });
        }, function(err1) {
            modelsBox = [];
        });
    }, function(err) {
    });
});
router.get('/edu-cost-get/:cateIndex/:modelIndex', function(req, res) {
    t_cost_total = 0;
    m_cost_total = 0;
    var category_index = req.params.cateIndex;
    var model_index = req.params.modelIndex;
    var query = new AV.Query('EduCategory'); //先查目录
    query.descending('createdAt');
    query.find().then(function(results) {
        categoryBox = results;
        var obj1 = AV.Object.createWithoutData('EduCategory', '' + results[category_index].get('objectId'));
        var query2 = new AV.Query('EduModels');
        query2.equalTo('category', obj1);
        query2.descending('createdAt');
        query2.find().then(function(res1) {
            var query3 = new AV.Query('EduComponents'); //再查子部件
            var obj2 = AV.Object.createWithoutData('EduModels', res1[model_index].get('objectId'));
            query3.equalTo('model', obj2);
            query3.descending('createdAt');
            query3.find().then(function(res2) {
                if (res1 !== undefined && res2 !== undefined) {
                    var costObj = {};
                    for (var i = 0; i < res.length; i++) {
                        t_cost_total += Number(compsBox[i].get('time_cost')) * 10;
                        m_cost_total += Number(compsBox[i].get('material_cost')) * 10;
                    }
                    costObj.t_cost = t_cost_total / 10;
                    costObj.m_cost = m_cost_total / 10;
                    res.json(costObj);
                } else {
                    console.log("err");
                }
            }, function(err2) {
                compsBox = [];
                console.log("component_error");
            });

        }, function(err1) {
            modelsBox = [];
        });
    }, function(err) {

    });
});


//用户模型获取
router.get('/models/camera', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        res.render('camera');
    } else {
        res.redirect('/users/login');
    }
});
//获取用户空间名单
router.get('/models/userSpace', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        res.render('userSpace');
    } else {
        res.redirect('/users/login');
    }
});

//用户空间子部件名查询
router.post('/models/userSpace-query/compName', function(req, res) {
    var mapData = new Object();
    var allData = [];
    var userCompStr = req.body.searchStr;
    var compQuery = new AV.Query('UserComponents');
    compQuery.contains('name', userCompStr);
    compQuery.include('user');
    compQuery.find().then(function(result0) {
        if (result0.length == 0) {
            console.log('没有检索到相关消息');
            res.json([]);
        } else {
            for (var i = 0; i < result0.length; i++) {
                mapData = {};
                mapData.user = result0[i].get('user');
                mapData.component = result0[i];
                allData.push(mapData);
            }
            res.json(allData);
        }
    });

});

//用户空间用户名查询
router.post('/models/userSpace-query/userName', function(req, res) {
    var count = 0;
    var mapData = new Object();
    var allData = [];
    var userStr = req.body.userStr;
    var userQuery = new AV.Query('_User');
    userQuery.contains('username', userStr);
    userQuery.find().then(function(result0) {
        if (result0.length == 0) {
            console.log('没有检索到相关消息');
            res.json([]);
        } else {
            async.whilst(
                function() {
                    return count < result0.length;
                },
                function(callback) {
                    if (count < result0.length) {
                        var userId = result0[count].id;
                        var compQuery = new AV.Query('UserComponents');
                        var obj1 = AV.Object.createWithoutData('_User', userId);
                        compQuery.equalTo('user', obj1);
                        compQuery.include('user');
                        compQuery.find().then(function(result1) {
                            if (result1.length == 0) {
                                console.log('没有检索到相关消息')
                            } else {
                                for (var i = 0; i < result1.length; i++) {
                                    mapData = {};
                                    mapData.user = result1[i].get('user');
                                    mapData.component = result1[i];
                                    allData.push(mapData);
                                }
                            }
                        });
                    }
                    count++;
                    setTimeout(callback, 2000);
                },
                function(err) {
                    res.json(allData);
                    console.log('err:');
                    console.log(err);
                }
            );
        }
    });
});


router.get('/models/userSpace-data-all', function(req, res) {
    user_data = [];
    var dataMap = new Object();
    var query = new AV.Query('UserComponents');
    query.descending('createdAt');
    query.include('user');
    query.find().then(function(results) {
        for (var i = 0; i < results.length; i++) {
            dataMap = {};
            dataMap.component = results[i];
            dataMap.user = results[i].get('user');
            user_data.push(dataMap);
        }
        res.json(user_data);
    });
});


router.get('/models/camera-data', function(req, res) {
    camera = [];
    var query = new AV.Query('_User');
    query.descending('createdAt');
    query.find().then(function(result) {
        for (var i = 0; i < result.length; i++) {
            if (result[i].get('camera') != undefined) {
                camera.push(result[i]);
            }
        }
        res.json(camera);
    });
});

//按照字母排序
router.get('/models/sort/:categoryIndex/:modelIndex', function(req, res) {
    modelSerialized = [];
    global_data.category_list = [];
    global_data.model_list = [];
    modelInit = {};
    modelConcat = [];
    var categoryIndex = req.params.categoryIndex;
    var modelIndex = req.params.modelIndex;
    var username = AV.User.current().getUsername();
    var company = '武汉小安科技有限公司';
    var query = new AV.Query('category'); //先查目录
    query.descending('createdAt');
    query.find().then(function(results) {
        global_data.category_list = results;
        var obj1 = AV.Object.createWithoutData('category', '' + results[categoryIndex].get('objectId'));
        var query2 = new AV.Query('models');
        query2.equalTo('category', obj1);
        query2.descending('createdAt');
        query2.find().then(function(res2) {
            modelInit = res2;
            for (var i = 0; i < res2.length; i++) {
                pinyinInit = [];
                //js字典，获取当前的模型名字首字母的字符数组
                var str0 = pinyin(res2[i].get('name'), {
                    style: pinyin.STYLE_FIRST_LETTER, // 设置拼音风格
                    heteronym: false
                });
                //整合字符串
                for (var j = 0; j < str0.length; j++) {
                    //获取首字母的字符放入数组中准备整合
                    var strInit = str0[j][0];
                    pinyinInit.push(strInit); //当前字符数组集合
                }
                var strConcat = pinyinInit.join(""); //当前字符串
                modelConcat["" + strConcat] = res2[i]; //将当前字符串拼接成字典
            } //字符串排序
            for (let key of Object.keys(modelConcat).sort()) {
                modelSerialized.push(modelConcat[key]);
            }
            global_data.model_list = modelSerialized;
            // res.redirect('/manage?category_index=' + categoryIndex + '&model_index=0');
            var obj2 = AV.Object.createWithoutData('components', '' + modelSerialized[modelIndex].get('objectId'));
            var query3 = new AV.Query('components'); //再查子部件
            query3.equalTo('models', obj2);
            query3.descending('createdAt');
            query3.find().then(function(res1) {
                global_data.component_list = res1;
                if (global_data.model_list !== undefined && global_data.component_list !== undefined) {
                    models_data = res2;
                    for (var i = 0; i < res2.length; i++) {
                        m_cost_total += res2[i].get('material_cost');
                        t_cost_total += res2[i].get('time_cost');
                    }
                    console.log(results.length);
                    console.log(res1.length);
                    console.log(res2.length);
                    res.render('manage', {
                        user: username,
                        company: company,
                        category_list: results,
                        category_index: categoryIndex,
                        model_list: res2,
                        model_index: modelIndex,
                        models_data: res1
                    });
                } else {
                    console.log("err");
                }
            }, function(err2) {
                // console.log(err2);
            });
        });
    });
});
//按照字母排序
router.get('/edu-models/sort/:categoryIndex/:modelIndex', function(req, res) {
    modelSerialized = [];
    global_data.category_list = [];
    global_data.model_list = [];
    modelInit = {};
    modelConcat = [];
    var categoryIndex = req.params.categoryIndex;
    var modelIndex = req.params.modelIndex;
    var query = new AV.Query('EduCategory'); //先查目录
    query.descending('createdAt');
    query.find().then(function(results) {
        global_data.category_list = results;
        var obj1 = AV.Object.createWithoutData('EduCategory', '' + results[categoryIndex].get('objectId'));
        var query2 = new AV.Query('EduModels');
        query2.equalTo('category', obj1);
        query2.descending('createdAt');
        query2.find().then(function(res2) {
            modelInit = res2;
            for (var i = 0; i < res2.length; i++) {
                pinyinInit = [];
                //js字典，获取当前的模型名字首字母的字符数组
                var str0 = pinyin(res2[i].get('name'), {
                    style: pinyin.STYLE_FIRST_LETTER, // 设置拼音风格
                    heteronym: false
                });
                //整合字符串
                for (var j = 0; j < str0.length; j++) {
                    //获取首字母的字符放入数组中准备整合
                    var strInit = str0[j][0];
                    pinyinInit.push(strInit); //当前字符数组集合
                }
                var strConcat = pinyinInit.join(""); //当前字符串
                modelConcat["" + strConcat] = res2[i]; //将当前字符串拼接成字典
            } //字符串排序
            for (let key of Object.keys(modelConcat).sort()) {
                modelSerialized.push(modelConcat[key]);
            }
            global_data.model_list = modelSerialized;
            res.redirect('/manage?category_index=' + categoryIndex + '&model_index=' + modelIndex);

        });
    });
});

//添加照相机
router.post('/models/camera-config', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var username = req.body.username;
        var cameraId = req.body.camera;
        var password = req.body.password;
        // 新建对象
        var printer = new AV.User();
        printer.setUsername(username);
        printer.setPassword(password);
        printer.set('camera', cameraId);
        printer.signUp().then(function(loginedUser) {
            res.json({ "msg": "ok", "code": "200" });
        }, function(error) {
            console.error(error);
        });
    } else {
        res.redirect('/users/login');
    }
});

router.post('/models/camera-modify/:index0', function(req, res) {
    var currentUser = AV.User.current();
    var cameraId = req.body.camera;
    var printerIndex = req.params.index0;
    if (currentUser) {
        var printer = AV.Object.createWithoutData('_User', camera[printerIndex].get('objectId'));
        printer.set('camera', cameraId);
        printer.save().then(function(success) {
            res.json({ 'msg': 'ok', 'code': '200' });
        }, function(err) {
            res.json({ 'msg': 'fail', 'code': '500' });
        });
    } else {
        res.redirect('/users/login');
    }
});


router.get('/models/camera-delete/:index0', function(req, res) {
    var currentUser = AV.User.current();
    var printerIndex = req.params.index0;
    if (currentUser) {
        var printer = AV.Object.createWithoutData('_User', camera[printerIndex].get('objectId'));
        printer.destroy().then(function(success) {
            // 删除成功
            res.json({ 'msg': 'ok', 'code': '200' });
        }, function(error) {
            // 删除失败
            res.json({ 'msg': 'ok', 'code': '500' });
        });
    } else {
        res.redirect('/users/login');
    }
});

//删除用户个人空间的东西
router.get('/models/userSpace/:index0', function(req, res) {
    var spaceCompIndex = req.params.index0;
    var userCompMap = AV.Object.createWithoutData('UserComponents', user_data[spaceCompIndex].component.get('objectId'));
    userCompMap.destroy().then(function(success0) {
        // 删除成功
        res.json({ 'msg': 'ok', 'code': '200' });
    }, function(error) {
        // 删除失败
        res.json({ 'msg': 'ok', 'code': '500' });
    });
});

//edu子部件查询路由
router.get('/edu-models-comp/:index1/:index2', function(req, res) {
    var category_index = req.params.index1;
    var model_index = req.params.index2;
    var isSorted = req.query.sort;
    var query = new AV.Query('EduCategory'); //先查目录
    query.descending('createdAt');
    query.find().then(function(results) {
        global_data.category_list = results;
        var obj1 = AV.Object.createWithoutData('EduCategory', '' + results[category_index].get('objectId'));
        var query2 = new AV.Query('EduModels');
        query2.equalTo('category', obj1);
        if(isSorted === 'true'){
            query2.ascending('name');
        } else {
            query2.descending('createdAt');
        }
        query2.find().then(function(res1) {
            var obj2 = AV.Object.createWithoutData('EduModels', res1[model_index].get('objectId'));
            var query3 = new AV.Query('EduComponents');
            query3.equalTo('model', obj2);
            query3.descending('createdAt');
            query3.find().then(function(res2) {
                if (global_data.model_list !== undefined && global_data.component_list !== undefined) {
                    models_data = res2;
                    res.json(res2);
                } else {
                    console.log("err");
                }
            }, function(err2) {
                global_data.component_list = [];
                console.log("component_error");
            });

        }, function(err1) {
            global_data.model_list = [];
        });
    }, function(err) {

    });
});

//前端部分子部件路由查询
router.get('/models/:index1/:index2', function(req, res) {
    var category_index = req.params.index1;
    var model_index = req.params.index2;
    var isSorted = req.query.sort;
    var query = new AV.Query('category'); //先查目录
    query.descending('createdAt');
    query.find().then(function(results) {
        var obj1 = AV.Object.createWithoutData('category', results[category_index].get('objectId'));
        var query2 = new AV.Query('models');
        if(isSorted === 'true'){
            query2.ascending('name');
        } else {
            query2.descending('createdAt');
        }
        query2.equalTo('category', obj1);
        query2.find().then(function(res1) {
            var obj2 = AV.Object.createWithoutData('models', res1[model_index].get('objectId'));
            var query3 = new AV.Query('components');
            query3.equalTo('model', obj2);
            query3.descending('createdAt');
            query3.find().then(function(res2) {
                if (global_data.model_list !== undefined && global_data.component_list !== undefined) {
                    models_data = res2;
                    res.json(res2);
                } else {
                    console.log("err");
                }
            }, function(err2) {
                console.log("component_error");
            });
        }, function(err1) {
            console.log('modle_err');
        });
    }, function(err) {
        console.log('category_err');
    });
});
router.get('/model/find-category', function(req, res) {
    var query0 = new AV.Query('category');
    query0.descending('createdAt');
    //注意function 参数的作用域
    query0.find().then(function(results) {
        res.json(results);
    });
});

router.get('/model/find-edu-category', function(req, res) {
    var query0 = new AV.Query('EduCategory');
    query0.descending('createdAt');
    //注意function 参数的作用域
    query0.find().then(function(results) {
        res.json(results);
    });
});
// 回复网页
// 如果有人访问如果有人直接访问localhost3000要检查是否登陆过，
// 如果是已经登陆过的他是有那些数据的，把数据传过去是为了重新渲染页面
router.get('/', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        // console.log(global_data.model_list, 'manage,render');
        var category_index = req.query.category_index;
        var model_index = req.query.model_index;
        var isSorted = req.query.sort;
        var username = currentUser.getUsername();
        var company = '武汉小安科技有限公司';
        var sort = false;
        var query = new AV.Query('category');
        query.descending('createdAt');
        //注意function 参数的作用域
        query.find().then(function(results) {
            global_data.category_list = results; //再查model list，字母排序只支持到第二级菜单。
            var obj1 = AV.Object.createWithoutData('category', results[category_index].get('objectId'));
            var query2 = new AV.Query('models');
            query2.equalTo('category', obj1);
            if(isSorted === 'true'){
                query2.ascending('name');
                sort = true;
            } else {
                query2.descending('createdAt');
                sort = false;
            }
            query2.find().then(function(res1) {
                global_data.model_list = res1;
                var obj2 = AV.Object.createWithoutData('models', res1[model_index].get('objectId'));
                var query3 = new AV.Query('components'); //再查子部件
                query3.equalTo('model', obj2);
                query3.descending('createdAt');
                query3.find().then(function(res2) {
                    global_data.component_list = res2;
                    if (global_data.model_list !== undefined && global_data.component_list !== undefined) {
                        models_data = res2;
                        for (var i = 0; i < res2.length; i++) {
                            m_cost_total += res2[i].get('material_cost');
                            t_cost_total += res2[i].get('time_cost');
                        }
                        res.render('manage', {
                            user: username,
                            company: company,
                            category_list: results,
                            category_index: category_index,
                            model_list: res1,
                            model_index: model_index,
                            models_data: res2,
                            sort : sort
                        });
                    } else {
                        console.log("err");
                    }
                }, function(err2) {
                    console.log(err2);
                });
            }, function(err1) {
                console.log(err1);
            });
        }, function(err) {
            console.log(err);
        });
    } else {
        res.redirect('/users/login');
    }
});
router.get('/init/edu', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.query.category_index;
        var model_index = req.query.model_index;
        var isSorted = req.query.sort;
        var username = currentUser.getUsername();
        var company = '武汉小安科技有限公司';
        var sort = false;
        var query = new AV.Query('EduCategory');
        query.descending('createdAt');
        //注意function 参数的作用域
        query.find().then(function(results) {
            global_data.category_list = results; //再查model list，字母排序只支持到第二级菜单。
            var obj1 = AV.Object.createWithoutData('EduCategory', results[category_index].get('objectId'));           
            var query2 = new AV.Query('EduModels');
            query2.equalTo('category', obj1);
            if(isSorted === 'true'){
                query2.ascending('name');
                sort = true;
            } else {
                query2.descending('createdAt');
                sort = false;
            }
            query2.find().then(function(res1) {
                global_data.model_list = res1;
                var obj2 = AV.Object.createWithoutData('EduModels', res1[model_index].get('objectId'));
                var query3 = new AV.Query('EduComponents'); //再查子部件
                query3.equalTo('model', obj2);
                query3.descending('createdAt');
                query3.find().then(function(res2) {
                    global_data.component_list = res2;
                    if (global_data.model_list !== undefined && global_data.component_list !== undefined) {
                        models_data = res2;
                        for (var i = 0; i < res2.length; i++) {
                            m_cost_total += res2[i].get('material_cost');
                            t_cost_total += res2[i].get('time_cost');
                        }
                        // console.info('***********res1: ', res1)
                        // console.info('***********results: ', results)
                        // console.info('***********res2: ', res2)
                        res.render('education', {
                            user: username,
                            company: company,
                            category_list: results,
                            category_index: category_index,
                            model_list: res1,
                            model_index: model_index,
                            models_data: res2,
                            sort : sort
                        });
                    } else {
                        console.log("err");
                    }
                }, function(err2) {
                    console.log(err2);
                });
            }, function(err1) {
                console.log(err1);
            });
        }, function(err) {
            console.error(err);
        });
        
    } else {
        res.redirect('/users/login');
    }
});
// 添加模型类别
router.post('/add-category', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var description = req.body.description;
        var name = uuid.v1().replace(/-/g, "");
        var query = new AV.Query('category');
        query.equalTo('description', description);
        query.find().then(function(results) {
            if (results.length == 0) {
                var category = new Category();
                category.set('name', name);
                category.set('description', description);
                category.save().then(function() {
                    res.redirect('/manage/' + 0);
                }, function(err) {

                });
            } else {
                res.redirect('/manage/' + 0);
            }
        }, function(err) {
            console.error(err);
        });

    } else {
        res.redirect('/users/login');
    }
});

// 添加模型类别
router.post('/add-edu-category', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var description = req.body.description;
        var name = uuid.v1().replace(/-/g, "");
        var query = new AV.Query('EduCategory');
        query.equalTo('description', description);
        query.find().then(function(results) {
            if (results.length == 0) {
                var category = new EduCategory();
                category.set('name', name);
                category.set('description', description);
                category.save().then(function() {
                    res.redirect('/manage/edu/' + 0);
                }, function(err) {

                });
            } else {
                res.redirect('/manage/edu/' + 0);
            }
        }, function(err) {

        });

    } else {
        res.redirect('/users/login');
    }
});

// 添加父级模型文件
router.post('/add-model/:index', function(req, res, next) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index;
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var name = fields.name;
            var note = fields.note;
            var description = [];
            var thumbnail;
            var cateObj = AV.Object.createWithoutData('category', global_data.category_list[category_index].get('objectId'));
            var models = AV.Object.extend('models');
            var newModelData = new models();
            var count = 0;
            fs.readFile(files.thumbnail.path, function(err, data) {
                var base64Data = data.toString('base64');
                var file = new AV.File(files.thumbnail.name, { base64: base64Data });
                file.save().then(function(theFile) {
                    thumbnail = {
                        id: theFile.get('objectId'),
                        name: theFile.get('name'),
                        url: theFile.get('url')
                    };
                    count++;
                    handle();
                });
            });

            function handle() {
                newModelData.set('name', name);
                newModelData.set('note', note);
                newModelData.set('description', description);
                newModelData.set('thumbnail', thumbnail);
                newModelData.set('category', cateObj);
                newModelData.set('time_cost', '0');
                newModelData.set('material_cost', 0);
                newModelData.save().then(function(success) {
                    res.redirect('/manage/' + category_index);
                }, function(err) {
                    console.log("***************************************");
                    console.log(err);
                    console.log("***************************************");
                    res.redirect('/manage/' + category_index);
                });

            }
        });
    } else {
        res.redirect('/users/login');
    }
});
// 添加edu父级模型文件
router.post('/add-edu-model/:index', function(req, res, next) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index;
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var name = fields.name;
            var note = fields.note;
            var description = [];
            var thumbnail;
            var cateObj = AV.Object.createWithoutData('EduCategory', global_data.category_list[category_index].get('objectId'));
            var models = AV.Object.extend('EduModels');
            var newModelData = new models();
            var count = 0;
            fs.readFile(files.thumbnail.path, function(err, data) {
                var base64Data = data.toString('base64');
                var file = new AV.File(files.thumbnail.name, { base64: base64Data });
                file.save().then(function(theFile) {
                    thumbnail = {
                        id: theFile.get('objectId'),
                        name: theFile.get('name'),
                        url: theFile.get('url')
                    };
                    count++;
                    handle();
                });
            });

            function handle() {
                newModelData.set('name', name);
                newModelData.set('note', note);
                newModelData.set('description', description);
                newModelData.set('thumbnail', thumbnail);
                newModelData.set('category', cateObj);
                newModelData.set('time_cost', '0');
                newModelData.set('material_cost', 0);
                newModelData.save().then(function(success) {
                    res.redirect('/manage/edu/' + category_index);
                }, function(err) {
                    console.log("***************************************");
                    console.log(err);
                    console.log("***************************************");
                    res.redirect('/manage/edu/' + category_index);
                });

            }
        });
    } else {
        res.redirect('/users/login');
    }
});


// 添加具体描述照片,这里应该由于加了三级菜单应该分开，二级菜单图片修改
router.post('/eduaddphoto/:index1/:index2/add-photo', function(req, res, next) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            //fs.readFile异步读取数据
            fs.readFile(files.photo.path, function(err, data) {
                var base64Data = data.toString('base64');
                var file = new AV.File(files.photo.name, { base64: base64Data });
                file.save().then(function(theFile) {
                    var model = AV.Object.createWithoutData('EduModels', global_data.model_list[model_index].get('objectId'));
                    var photo = {
                        id: theFile.get('objectId'),
                        name: theFile.get('name'),
                        url: theFile.get('url')
                    };
                    model.add('description', photo);
                    model.save().then(function(success) {
                        //成功以后的回调重新查询
                        var query = new AV.Query('EduCategory');
                        query.descending('createdAt');
                        query.find().then(function(results) {
                            global_data.category_list = results;
                            var obj1 = AV.Object.createWithoutData('category', global_data.category_list[category_index].get('objectId'));
                            var query1 = new AV.Query("EduModels");
                            query1.equalTo('category', obj1);
                            query1.descending('createdAt');
                            query1.find().then(function(result1) {
                                global_data.model_list = result1;
                                res.redirect('/manage/init/edu?category_index=' + category_index + '&model_index=' + model_index);
                            }, function(err) {});
                        }, function(err) {});
                    }, function(err) {

                    })
                });
            });
        });
    } else {
        res.redirect('/users/login');
    }
});


// 修改类别
router.post('/:index/mod-category', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index;
        var description = req.body.description;
        var data = AV.Object.createWithoutData('category', global_data.category_list[category_index].get('objectId'));
        data.set('description', description);
        data.save().then(function(success) {
            res.redirect('/manage/' + category_index);
        }, function(err) {});
    } else {
        res.redirect('/users/login');
    }
});
// 修改教育专区类型
router.post('/:index/mod-edu-category', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index;
        var description = req.body.description;
        var data = AV.Object.createWithoutData('EduCategory', global_data.category_list[category_index].get('objectId'));
        data.set('description', description);
        data.save().then(function(success) {
            res.redirect('/manage/edu/' + category_index);
        }, function(err) {});
    } else {
        res.redirect('/users/login');
    }
});

// 修改模型，此版本加入修改类别功能
router.post('/:index1/:index2/mod-model', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var name = req.body.name;
        var note = req.body.note;
        var categoryValue = req.body.categoryValue;
        console.log(categoryValue);
        var time_cost = req.body.time_cost;
        var material_cost = Number(req.body.material_cost);
        var model = AV.Object.createWithoutData('models', global_data.model_list[model_index].get('objectId'));
        var categoryObj = {
            __type: "Pointer",
            className: "category",
            objectId: categoryValue
        };
        model.set('name', name);
        model.set('note', note);
        model.set('category', categoryObj);
        model.set('time_cost', time_cost);
        model.set('material_cost', material_cost);
        model.save().then(function(success) {
            console.log('修改成功');
            var query = new AV.Query('category');
            query.descending('createdAt');
            query.find().then(function(results1) {
                global_data.category_list = [];
                global_data.category_list = results1;
                var obj1 = AV.Object.createWithoutData('category', '' + results1[category_index].get('objectId'));
                var query1 = new AV.Query('models');
                query1.equalTo('category', obj1);
                query1.descending('createdAt');
                query1.find().then(function(results2) {
                    global_data.model_list = [];
                    global_data.model_list = results2;
                    res.redirect('/manage?category_index=' + category_index + '&model_index=' + model_index);
                }, function(err1) {});
            }, function(err2) {});
        }, function(err) {
            console.log('修改失败');
            console.log(err);
        });
    } else {
        res.redirect('/users/login');
    }
});
// 修改edu模型，此版本加入修改类别功能
router.post('/modmodeledu/:index1/:index2/mod-model', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var name = req.body.name;
        var note = req.body.note;
        var categoryValue = req.body.categoryValue;
        console.log(categoryValue);
        var time_cost = req.body.time_cost;
        var material_cost = Number(req.body.material_cost);
        var model = AV.Object.createWithoutData('EduModels', global_data.model_list[model_index].get('objectId'));
        var categoryObj = {
            __type: "Pointer",
            className: "EduCategory",
            objectId: categoryValue
        };
        model.set('name', name);
        model.set('note', note);
        model.set('category', categoryObj);
        model.set('time_cost', time_cost);
        model.set('material_cost', material_cost);
        model.save().then(function(success) {
            console.log('修改成功');
            var query = new AV.Query('EduCategory');
            query.descending('createdAt');
            query.find().then(function(results1) {
                global_data.category_list = [];
                global_data.category_list = results1;
                var obj1 = AV.Object.createWithoutData('category', '' + results1[category_index].get('objectId'));
                var query1 = new AV.Query('EduModels');
                query1.equalTo('category', obj1);
                query1.descending('createdAt');
                query1.find().then(function(results2) {
                    global_data.model_list = [];
                    global_data.model_list = results2;
                    res.redirect('/manage/init/edu?category_index=' + category_index + '&model_index=' + model_index);
                }, function(err1) {});
            }, function(err2) {});
        }, function(err) {
            console.log('修改失败');
            console.log(err);
        });
    } else {
        res.redirect('/users/login');
    }
});

//修改gcode
router.post('/mod-comp-gcode/:index1/:index2/:index3/:objId', function(req, res) {
    var category_index = req.params.index1;
    var model_index = req.params.index2;
    var comp_index = req.params.index3;
    var comp_objId = req.params.objId;
    var form = new formidable.IncomingForm();
    var height, depth, width, mcost, timecost;

    form.parse(req, function (err, fields, files) {
        var component = AV.Object.createWithoutData('components', comp_objId);
        component.set('gcode', {
            id: fields.id,
            name: fields.name,
            url: fields.url
        });
        component.save().then(function (success) {
            
        }, function (error) {
            console.error(error)
        });
        res.json({
            'code': '200',
        })
    });
});


//修改edu
// gcode
router.post('/edu-mod-comp-gcode/:index1/:index2/:index3/:objId', function(req, res) {
    var category_index = req.params.index1;
    var model_index = req.params.index2;
    var comp_index = req.params.index3;
    var comp_objId = req.params.objId;
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        var component = AV.Object.createWithoutData('EduComponents', comp_objId);
        component.set('gcode', {
            id: fields.id,
            name: fields.name,
            url: fields.url
        });
        component.save().then(function (success) {
            
        }, function (error) {
            console.error(error)
        });

        res.json({
            'code': '200',
        });
    });
});

router.post('/add-comp-gcode/:index1/:index2', function(req, res) {
    var category_index = req.params.index1;
    var model_index = req.params.index2;
    addGcode = {};
    var form = new formidable.IncomingForm();
    
    form.parse(req, function(err, fields, files) {
        addGcode = {
            id: fields.id,
            name: fields.name,
            url: fields.url
        };
    });
});


router.post('/edu-add-comp-gcode/:index1/:index2', function(req, res) {
    var category_index = req.params.index1;
    var model_index = req.params.index2;
    addGcode = {};
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        addGcode = {
            id: fields.id,
            name: fields.name,
            url: fields.url
        };
    });
});

router.post('/add-comp/:cateIndex/:modelIndex', function(req, res) {
    var category_index = req.params.cateIndex;
    var model_index = req.params.modelIndex;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var name = fields.name;
        var note = fields.note;
        var printerTime = Number(fields.time_cost);
        var mCost = Number(fields.material_cost);
        var width = Number(fields.width);
        var depth = Number(fields.depth);
        var height = Number(fields.height);
        var description = [];
        var thumbnail;
        // console.log('global_data.model_list: ', global_data.model_list)
        var modelObj = AV.Object.createWithoutData('models', global_data.model_list[model_index].get('objectId'));
        var components = AV.Object.extend('components');
        var newModelData = new components();
        var count = 0;

        fs.readFile(files.thumbnail.path, function(err, data) {
            var base64Data = data.toString('base64');
            var file = new AV.File(files.thumbnail.name, { base64: base64Data });
            file.save().then(function(theFile) {
                thumbnail = {
                    id: theFile.get('objectId'),
                    name: theFile.get('name'),
                    url: theFile.get('url')
                };
                count++;
                handle();
            }).catch(err => {
                console.error('err:',err);
            });
        });

        function handle() {
            newModelData.set('name', name);
            newModelData.set('note', note);
            newModelData.set('description', description);
            newModelData.set('thumbnail', thumbnail);
            newModelData.set('model', modelObj);
            newModelData.set('width', width);
            newModelData.set('depth', depth);
            newModelData.set('height', height);
            newModelData.set('gcode', addGcode);
            newModelData.set('time_cost', printerTime);
            newModelData.set('material_cost', mCost);
            newModelData.save().then(function(success) {
                res.json({
                    'code': 200
                });
            }, function(err) {
                console.log("***************************************");
                console.log(err);
                console.log("***************************************");
                res.redirect('/manage/' + category_index);
            });

        }
    });
});

//add edu模型
router.post('/edu-add-comp/:cateIndex/:modelIndex', function(req, res) {
    var category_index = req.params.cateIndex;
    var model_index = req.params.modelIndex;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var name = fields.name;
        var note = fields.note;
        var printerTime = Number(fields.time_cost);
        var mCost = Number(fields.material_cost);
        var width = Number(fields.width);
        var depth = Number(fields.depth);
        var height = Number(fields.height);
        var description = [];
        var thumbnail;
        var modelObj = AV.Object.createWithoutData('EduModels', global_data.model_list[model_index].get('objectId'));
        var components = AV.Object.extend('EduComponents');
        var newModelData = new components();
        var count = 0;
        fs.readFile(files.thumbnail.path, function(err, data) {
            var base64Data = data.toString('base64');
            var file = new AV.File(files.thumbnail.name, { base64: base64Data });
            file.save().then(function(theFile) {
                thumbnail = {
                    id: theFile.get('objectId'),
                    name: theFile.get('name'),
                    url: theFile.get('url')
                };
                count++;
                handle();
            });
        });

        function handle() {
            newModelData.set('name', name);
            newModelData.set('note', note);
            newModelData.set('description', description);
            newModelData.set('thumbnail', thumbnail);
            newModelData.set('model', modelObj);
            newModelData.set('width', width);
            newModelData.set('depth', depth);
            newModelData.set('height', height);
            newModelData.set('gcode', addGcode);
            newModelData.set('time_cost', printerTime);
            newModelData.set('material_cost', mCost);
            newModelData.save().then(function(success) {
                res.json({
                    'code': 200
                });

            }, function(err) {
                console.log("***************************************");
                console.log(err);
                console.log("***************************************");
                res.redirect('/manage/' + category_index);
            });

        }
    });
});
//修改子部件
router.post('/mod-comp/:index1/:index2/:index3', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var comp_index = req.params.index3;
        var name = req.body.modName;
        var note = req.body.modNote;
        var time_cost = Number(req.body.modTimeCost);
        var material_cost = Number(req.body.modMatCost);
        var width = Number(req.body.modWidth);
        var depth = Number(req.body.mosDepth);
        var height = Number(req.body.modHeight);
        var model = AV.Object.createWithoutData('components', models_data[comp_index].get('objectId'));
        model.set('name', name);
        model.set('note', note);
        model.set('time_cost', time_cost);
        model.set('material_cost', material_cost);
        model.set('width', width);
        model.set('depth', depth);
        model.set('height', height);
        model.save().then(function(success) {
            console.log('修改成功');
            var query = new AV.Query('category');
            query.descending('createdAt');
            query.find().then(function(results1) {
                global_data.category_list = [];
                global_data.category_list = results1;
                var obj1 = AV.Object.createWithoutData('category', '' + results1[category_index].get('objectId'));
                var query1 = new AV.Query('models');
                query1.equalTo('category', obj1);
                query1.descending('createdAt');
                query1.find().then(function(results2) {
                    global_data.model_list = [];
                    global_data.model_list = results2;
                    res.json({ "status": 0 });
                }, function(err1) {
                    console.log(err1);
                });
            }, function(err2) {
                console.log(err2);
            });
        }, function(err) {
            console.log('修改失败');
            console.log(err);
        });

    } else {
        res.redirect('/users/login');
    }


});
//修改edu子部件
router.post('/edu-mod-comp/:index1/:index2/:index3', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var comp_index = req.params.index3;
        var name = req.body.modName;
        var note = req.body.modNote;
        var time_cost = Number(req.body.modTimeCost);
        var material_cost = Number(req.body.modMatCost);
        var width = Number(req.body.modWidth);
        var depth = Number(req.body.mosDepth);
        var height = Number(req.body.modHeight);
        var model = AV.Object.createWithoutData('EduComponents', models_data[comp_index].get('objectId'));
        model.set('name', name);
        model.set('note', note);
        model.set('time_cost', time_cost);
        model.set('material_cost', material_cost);
        model.set('width', width);
        model.set('depth', depth);
        model.set('height', height);
        model.save().then(function(success) {
            console.log('修改成功');
            var query = new AV.Query('EduCategory');
            query.descending('createdAt');
            query.find().then(function(results1) {
                global_data.category_list = [];
                global_data.category_list = results1;
                var obj1 = AV.Object.createWithoutData('EduCategory', '' + results1[category_index].get('objectId'));
                var query1 = new AV.Query('EduModels');
                query1.equalTo('category', obj1);
                query1.descending('createdAt');
                query1.find().then(function(results2) {
                    global_data.model_list = [];
                    global_data.model_list = results2;
                    res.json({ "status": 0 });
                }, function(err1) {
                    console.log(err1);
                });
            }, function(err2) {
                console.log(err2);
            });
        }, function(err) {
            console.log('修改失败');
            console.log(err);
        });

    } else {
        res.redirect('/users/login');
    }
});


// 删除类别
router.get('/:index1/:index2/rm-category', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;

        var data = AV.Object.createWithoutData('category', global_data.category_list[category_index].get('objectId'));
        data.destroy().then(function(success) {
            res.redirect('/manage/' + 0);
        }, function(err) {

        });
    } else {
        res.redirect('/users/login');
    }
});
// 删除EDU类别
router.get('/:index1/:index2/rm-edu-category', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;

        var data = AV.Object.createWithoutData('EduCategory', global_data.category_list[category_index].get('objectId'));
        data.destroy().then(function(success) {
            res.redirect('/manage/edu/' + 0);
        }, function(err) {

        });
    } else {
        res.redirect('/users/login');
    }
});
router.get('/models/num', function(req, res) {
    var len = global_data.model_list.length;
    res.json({ "modelsNum": len });
});
router.get('/edu-models-num/num', function(req, res) {
    var len = global_data.model_list.length;
    res.json({ "modelsNum": len });
});
// 删除模型

router.get('/:index1/:index2/rm-model', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var thumbnail = AV.File.createWithoutData(global_data.model_list[model_index].get('thumbnail').id);
        thumbnail.destroy();
        if (global_data.model_list[model_index].get('description') !== undefined) {
            for (var i = 0; i < global_data.model_list[model_index].get('description').length; i++) {
                var file = AV.File.createWithoutData(global_data.model_list[model_index].get('description')[i].id);
                file.destroy();
            }
        }
        var data = AV.Object.createWithoutData('models', global_data.model_list[model_index].get('objectId'));
        data.destroy();
        res.redirect('/manage/' + category_index);
    } else {
        res.redirect('/users/login');
    }
});
// 删除edu模型
router.get('/deledumodel/:index1/:index2/rm-model', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        console.log('<........del>');
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var thumbnail = AV.File.createWithoutData(global_data.model_list[model_index].get('thumbnail').id);
        thumbnail.destroy();
        if (global_data.model_list[model_index].get('description') != undefined) {
            for (var i = 0; i < global_data.model_list[model_index].get('description').length; i++) {
                var file = AV.File.createWithoutData(global_data.model_list[model_index].get('description')[i].id);
                file.destroy();
            }
        }
        var data = AV.Object.createWithoutData('EduModels', global_data.model_list[model_index].get('objectId'));
        data.destroy();
        res.redirect('/manage/edu/' + category_index);
    } else {
        res.redirect('/users/login');
    }
});


// 删除edu子部件
router.get('/edu-comp-rm/:index1/:index2/:index3', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var comp_index = req.params.index3;
        var data = AV.Object.createWithoutData('EduComponents', models_data[comp_index].get('objectId'));   //["" + global_data.model_list[model_index].get('objectId')]
        data.destroy();
        res.redirect('/manage/edu/' + category_index);
    } else {
        res.redirect('/users/login');
    }
});
// 删除子部件
router.get('/comp-rm/:index1/:index2/:index3', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var comp_index = req.params.index3;
        var data = AV.Object.createWithoutData('components', models_data[comp_index].get('objectId'));
        data.destroy();
        res.redirect('/manage/' + category_index);
    } else {
        res.redirect('/users/login');
    }
});

// 删除详细照片,二级菜单
router.get('/:index1/:index2/:index3/rm-photo', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var photo_index = req.params.index3;
        console.log(global_data.model_list[model_index].get('description')[photo_index].id);
        var file = AV.File.createWithoutData(global_data.model_list[model_index].get('description')[photo_index].id);
        file.destroy().then(function(success) {
            var data = AV.Object.createWithoutData('models', global_data.model_list[model_index].get('objectId'));
            data.remove('description', global_data.model_list[model_index].get('description')[photo_index]);
            data.save().then(function(sucess) {
                var query = new AV.Query('category');
                query.descending('createdAt');
                query.find().then(function(results) {
                    global_data.category_list = results;
                    var obj1 = AV.Object.createWithoutData('category', global_data.category_list[category_index]);
                    var query1 = new AV.Query('models');
                    query1.equalTo('category', obj1);
                    query1.descending('createdAt');
                    query1.find().then(function(results1) {
                        global_data.model_list = results1;
                        res.redirect('/manage?category_index=' + category_index + '&model_index=' + model_index);
                    }, function(err1) {
                        console.log('1' + err1);
                    });
                }, function(err) {
                    console.log('2' + err);
                });
            }, function(err3) {
                console.log('3' + err3);
            });
        }, function(err4) {
            console.log('4' + err4)
        });
    } else {
        res.redirect('/users/login');
    }
});
// 删除edu详细照片,二级菜单
router.get('/eduphotodel/:index1/:index2/:index3/rm-photo', function(req, res) {
    var currentUser = AV.User.current();
    if (currentUser) {
        var category_index = req.params.index1;
        var model_index = req.params.index2;
        var photo_index = req.params.index3;
        console.log(global_data.model_list[model_index].get('description')[photo_index].id);
        var file = AV.File.createWithoutData(global_data.model_list[model_index].get('description')[photo_index].id);
        file.destroy().then(function(success) {
            var data = AV.Object.createWithoutData('EduModels', global_data.model_list[model_index].get('objectId'));
            data.remove('description', global_data.model_list[model_index].get('description')[photo_index]);
            data.save().then(function(sucess) {
                var query = new AV.Query('EduCategory');
                query.descending('createdAt');
                query.find().then(function(results) {
                    console.log('find edu category success');
                    global_data.category_list = results;
                    var obj1 = AV.Object.createWithoutData('EduCategory', global_data.category_list[category_index].id);
                    var query1 = new AV.Query('EduModels');
                    query1.equalTo('category', obj1);
                    query1.descending('createdAt');
                    query1.find().then(function(results1) {
                        global_data.model_list = results1;
                        res.redirect('/manage?category_index=' + category_index + '&model_index=' + model_index);
                    }, function(err1) {
                        console.log('1' + err1);
                    });
                }, function(err) {
                    console.log('2' + err);
                });
            }, function(err3) {
                console.log('3' + err3);
            });
        }, function(err4) {
            console.log('4' + err4);
        });
    } else {
        res.redirect('/users/login');
    }
});


module.exports = router;