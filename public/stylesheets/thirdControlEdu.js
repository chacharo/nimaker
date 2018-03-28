
/**
 * Created by joyyuanxm on 2017/1/16.
 */
var cIndex;
$(document).ready(function () {
    var APP_ID = 'ViibwUqitYktpOOBPNBPiInT-gzGzoHsz';
    var APP_KEY = 'HUpn4MAXKEhV6NLLsfCg76ug';

    AV.init({
        appId: APP_ID,
        appKey: APP_KEY
    });
    
    //按钮提示
    $("[data-toggle='tooltip']").tooltip();
    //解析URL
    var cateIndex = getQueryString("category_index");
    cIndex = cateIndex;
    var modelIndex = getQueryString("model_index");
    //获取子部件
    getConponents(cateIndex, modelIndex);
    //模型排序
    modelSortControl(cateIndex, modelIndex);
    gcodeAdd(cateIndex, modelIndex);
    addcompInfo(cateIndex, modelIndex);
    getCostInfo(cateIndex, modelIndex);
    getCategory();
    $(".thirdlayout").hide();
    $("#progressBar").hide();
    addCompManage();

    $('#cameraInput').hide();
});

function modelSortControl(categoryIndex, modelIndex) {
    $("#arrangeBtn").click(function () {
        if(getQueryString("sort")){
        } else {
            window.location.href += '&sort=true';
        }
    });
}
function getConponents(categoryIndex, modelIndex) {
    if(getQueryString("sort")){
        $.get('/manage/edu-models-comp/' + categoryIndex + '/' + modelIndex + '?sort=true', function (res) {
            console.log(res);
            var objRes = res;
            var objLen = objRes.length;
            getLen(objLen);
            listBulid(objRes, objLen, categoryIndex, modelIndex);
        });
    } else {
        $.get('/manage/edu-models-comp/' + categoryIndex + '/' + modelIndex, function (res) {
            console.log(res);
            var objRes = res;
            var objLen = objRes.length;
            getLen(objLen);
            listBulid(objRes, objLen, categoryIndex, modelIndex);
        });
    }
}
//获取目录数据列表
function getCategory() {
    $.get('/manage/model/find-edu-category', function (res) {
        var objRes = res;
        optionBuild(objRes);
    });
}
//建立option的选项
function optionBuild(objRes) {
    for (var i = 0; i < objRes.length; i++) {
        var categoryOption = document.createElement("option");
        categoryOption.value = objRes[i].objectId;
        categoryOption.innerHTML = objRes[i].description;
        $("#model-rm-sel").append(categoryOption);
    }
    setOption(objRes);
}
function setOption(objres) {
    var optValue = objres[cIndex].objectId;
    $("#model-rm-sel").val(optValue);
}
//解析url
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}
function getLen(len) {
    $.get("/manage/edu-models-num/num", function (res) {
        var modelsNum = res.modelsNum;
        for (var x = 0; x < modelsNum; x++) {
            $("#sonP" + x).html("子部件个数，" + len);
        }
    });
}
function listBulid(data, len, cateIndex1, modelIndex1) {
    var temp = '';
    var count = false;
    var flag;
    $("#sonP" + j).html("子部件个数，" + len);
    for (var j = 0; j < len; j++) {
        //li
        var thirdLi = document.createElement("li");
        thirdLi.setAttribute("id", "conLi" + j);
        thirdLi.setAttribute("class", "con3-item");
        //a
        var thirdLink = document.createElement("a");
        thirdLink.setAttribute("id", "ThirdLink" + j);
        thirdLink.setAttribute("class", "ThirdLink");
        thirdLink.style.flex = 1;
        thirdLink.style.display = "inline-block";
        thirdLink.style.height = "100%";
        (function (a) {
            thirdLink.onclick = function () {
                $(".ThirdLink").css("background-color", "#EEF5F9");
                $(".modify-icon-third").hide();
                this.style.backgroundColor = "#BAD8E7";
                count = true;
                flag = a;
                $("#text-modify" + a).show();
                writeInfo(data, a);
                $('#add-comp-input').hide();
            }
        })(j);
        $("#collapse" + modelIndex1).append(thirdLi);
        $("#conLi" + j).append(thirdLink);

    }
    for (var i = 0; i < len; i++) {
        var date = new Date(data[i].createdAt);
        temp += "<img id='thirdImg" + i + "' src='" + data[i].thumbnail.url + "' style='float: left;width:72px;height:100%'>";
        temp += "<table style='padding-left: 10px;'>";
        temp += "<tr>";
        temp += "<td>" + data[i].name + "</td>";
        temp += "</tr>";
        temp += "<tr>";
        temp += "<td>" + date.toLocaleString() + "</td>";
        temp += "</tr>";
        temp += "</table>";
        $("#ThirdLink" + i).append(temp);
        temp = '';
        //text
        var thirdModify = document.createElement("text");
        thirdModify.setAttribute("class", "modify-icon-third");
        thirdModify.setAttribute("id", "text-modify" + i);
        thirdModify.innerHTML = "修改";
        thirdModify.style.display = "none";
        (function (c) {
            thirdModify.onclick = function () {
                $("#modModalLabel").html("修改" + data[c].name + "子部件");
                $("#mod-modal-name").val(data[c].name);
                $("#mod-modal-note").val(data[c].note);
                $("#mod-modal-time-cost").val(data[c].time_cost);
                $("#mod-modal-mat-cost").val(data[c].material_cost);
                $("#mod-modal-width").val(data[c].width);
                $("#mod-modal-depth").val(data[c].depth);
                $("#mod-modal-height").val(data[c].height);
                $("#mod-modal").modal('show');



                $("#gcodeUploadBtn").click(function () {
                    gcodeModify(cateIndex1, modelIndex1, c, data[c].objectId);
                });
                $("#mod-btn").click(function () {
                    compModify(data[c].objectId, cateIndex1, modelIndex1, c);

                });
            }
        })(i);
        var thirdDelete = document.createElement("text");
        thirdDelete.setAttribute("class", "rm-model-icon");
        thirdDelete.innerHTML = "删除";

        (function (b) {
            thirdDelete.onclick = function () {
                // 删除子部件文件确认
                var src = data[b].thumbnail.url;
                $("#compModalLabel").html("删除子部件");
                $("#comp-rm-confirm-dialog img").attr("src", src);
                $("#comp-rm-confirm-dialog #dialog-info text").html("请问您确定要删除" + data[b].name + "这个子部件吗？");
                $("#comp-rm-confirm-dialog #dialog-info").css({
                    "padding-top": "20px"
                });
                $("#comp-rm-confirm-dialog").modal('show');
                $("#comp-ok-btn").click(function () {
                    compDelete(cateIndex1, modelIndex1, b);
                });
            }
        })(i);


        $('#conLi' + i).append(thirdModify);
        $('#conLi' + i).append(thirdDelete);
    }

}
//侧边详细信息栏写入信息
function writeInfo(data, compIndex) {
    $('.description-img-box').hide();
    var date1 = new Date("" + data[compIndex].createdAt);
    var date2 = new Date("" + data[compIndex].updatedAt);
    $(".thirdlayout").show();
    $("#conpName").html("" + data[compIndex].name);
    if (data[compIndex].note != undefined) {
        $("#conpNote").html("" + data[compIndex].note);
    }
    $("#timeCost").html("" + data[compIndex].time_cost + "小时");
    $("#materialCost").html("" + data[compIndex].material_cost + "克");
    $("#conpWidth").html("" + data[compIndex].width + "mm");
    $("#conpDepth").html("" + data[compIndex].depth + "mm");
    $("#conpHeight").html("" + data[compIndex].height + "mm");
    $("#gcodeFile").attr("href", "" + data[compIndex].gcode.url);
    $("#printTimes").html("" + data[compIndex].print_times);
    $("#createTime").html(date1.toLocaleString("chinese", {hour12: false}));
    $("#updateTime").html(date2.toLocaleString("chinese", {hour12: false}));
    if (data[compIndex].thumbnail.url != undefined) {
        $("#conpImg").attr("src", "" + data[compIndex].thumbnail.url);
    }

}

//cate的删除功能
function compDelete(cateIndex, modelIndex, compIndex) {
    $.get('/manage/edu-comp-rm/' + cateIndex + '/' + modelIndex + '/' + compIndex, function (res2) {
        alert('删除成功！');
        window.location.href = '/manage/' + cateIndex;
        console.log("删除成功");
    });
}
function compModify(compObjectId, cateIndex2, modelIndex2, compIndex2) {
    var modName = $("#mod-modal-name").val();
    var modNote = $("#mod-modal-note").val();
    var modTimeCost = Number($("#mod-modal-time-cost").val());
    var modMatCost = Number($("#mod-modal-mat-cost").val());
    var modWidth = Number($("#mod-modal-width").val());
    var modDpeth = Number($("#mod-modal-depth").val());
    var modHeight = Number($("#mod-modal-height").val());
    $.post("/manage/edu-mod-comp/" + cateIndex2 + "/" + modelIndex2 + "/" + compIndex2,
        {
            "objectId": compObjectId,
            "modName": modName,
            "modNote": modNote,
            "modTimeCost": modTimeCost,
            "modMatCost": modMatCost,
            "modWidth": modWidth,
            "mosDepth": modDpeth,
            "modHeight": modHeight

        },
        function (res) {
            var status = res.status;
            if (status == 0) {
                alert('已更新子部件')
                window.location.href = '/manage/init/edu?category_index=' + cateIndex2 + '&model_index=' + modelIndex2;
            }
        });
}
function gcodeModify(cateIndex3, modelIndex3, compIndex3, compObjectId) {
    new Promise((resolve, reject) => {
        resolve(1)
    }).then(function (value) {
        console.log(value);
        var f = $('#selectGcodeFile')[0];
        console.log(f.files)
        if (f.files.length > 0) {
            console.log(2);
            var localFile = f.files[0];
            var filename = $('#selectGcodeFile').val().split('\\').pop();
            var file = new AV.File(filename, localFile);
            console.log('start save');
            var form = new FormData();
            var height, depth, width, mcost, timecost;
            file.save().then(function (theFile) {
                new Promise((resolve, reject) => {
                    form.append('id', theFile.id)
                    form.append('name', theFile.name())
                    form.append('url', theFile.url())
                    var reader = new FileReader()
                    var field_num = 0   
                    reader.onload = function(e) {
                        var text = this.result;
                        console.log('text readed: ', text.length)
                        // 将文件按行拆成数组
                        text.split(/\r?\n/).forEach(function(line) {
                            // ...
                            if (line.search('code_model_height') != -1) {
                                var beginIndex0 = line.search('=') + 1;
                                height = line.substring(beginIndex0);
                                field_num++
                            }
                            if (line.search('code_model_depth') != -1) {
                                var beginIndex1 = line.search('=') + 1;
                                depth = line.substring(beginIndex1);
                                field_num++
                            }
                            if (line.search('code_model_width') != -1) {
                                var beginIndex2 = line.search('=') + 1;
                                width = line.substring(beginIndex2);
                                field_num++
                            }
                            if (line.search('code_filament_amount') != -1) {
                                var beginIndex3 = line.search('=') + 1;
                                mcost = line.substring(beginIndex3);
                                field_num++
                            }
                            if (line.search('code_print_time') != -1) {
                                var beginIndex4 = line.search('=') + 1;
                                timecost = line.substring(beginIndex4);
                                field_num++
                            }
                        })
                        if (field_num === 5) {
                            console.log('filed_num: ', field_num)
                            console.log('read field completed')
                            console.log('width ' + width + ' depth ' + depth + ' height ' + height + ' timecost ' + timecost + ' mcost ' + mcost)
                            $('#add-modal-width').val(width);
                            $('#add-modal-depth').val(depth);
                            $('#add-modal-height').val(height);
                            $('#add-modal-time-cost').val(timecost);
                            $('#add-modal-mat-cost').val(mcost);
                            resolve(form)
                        } else {
                            reject()
                        }
                    }
                    console.log('file size: ', localFile.size)
                        
                    var blob
                    start = 0
                    end = 10239
                    if (end > localFile.size) end = localFile.size
                    if(localFile.webkitSlice) {
                        blob = localFile.webkitSlice(start, end + 1);
                    } else if(localFile.mozSlice) {
                        blob = localFile.mozSlice(start, end + 1);
                    } else if(localFile.slice) {
                        blob = localFile.slice(start, end + 1);
                    } else {
                        console.log('blob is null')
                    }
                    console.log('start: ' + start + ' end: ' + end)
                    reader.readAsText(blob)
                }).then(function(value) {
                    $.ajax({
                        url: '/manage/edu-mod-comp-gcode/' + cateIndex3 + '/' + modelIndex3 + '/' + compIndex3 + '/' + compObjectId,
                        type: 'POST',
                        cache: false,
                        data: value,
                        processData: false,
                        contentType: false
                    }).done(function (res) {
                        console.log(value)
                        if (res.code == '200') {
                            alert('已更新模型文件')
                            $("#progressBar").hide();
                        } else {
                            alert('更新失败，请重新尝试');
                        }
                    }).fail(function (res) {
                        console.error(res);
                    });   
                }, function (error) {
                    reject()
                }).then(function () {
                    console.log('success')
                })
            }, function (error) {
                // 异常处理
                reject()
            }).then(function () {
                console.log('success')
            });
        }
    })
}
function addCompManage() {
    $('#add-modal-btn').click(function () {
        $('#add-modal').modal('show');
    });

}
function gcodeAdd() {
    $("#gcodeUploadaddBtn").click(function () {
        new Promise((resolve, reject) => {
            resolve(1)
        }).then(function (value) {
            console.log(value);
            var f = $('#addgcodeFile')[0];
            if (f.files.length > 0) {
                console.log(2);
                var localFile = f.files[0];
                var filename = $('#addgcodeFile').val().split('\\').pop();
                var file = new AV.File(filename, localFile);
                console.log('start save');
                var form = new FormData();
                var height, depth, width, mcost, timecost;
                file.save().then(function (theFile) {
                    alert('已上传模型文件')
                    new Promise((resolve, reject) => {
                        form.append('id', theFile.id)
                        form.append('name', theFile.name())
                        form.append('url', theFile.url())
                        var reader = new FileReader()
                        var field_num = 0
                        reader.onload = function(e) {
                            var text = this.result;
                            console.log('text readed: ', text.length)
                            // 将文件按行拆成数组
                            text.split(/\r?\n/).forEach(function(line) {
                                // ...
                                if (line.search('code_model_height') != -1) {
                                    var beginIndex0 = line.search('=') + 1;
                                    height = line.substring(beginIndex0);
                                    field_num++
                                }
                                if (line.search('code_model_depth') != -1) {
                                    var beginIndex1 = line.search('=') + 1;
                                    depth = line.substring(beginIndex1);
                                    field_num++
                                }
                                if (line.search('code_model_width') != -1) {
                                    var beginIndex2 = line.search('=') + 1;
                                    width = line.substring(beginIndex2);
                                    field_num++
                                }
                                if (line.search('code_filament_amount') != -1) {
                                    var beginIndex3 = line.search('=') + 1;
                                    mcost = line.substring(beginIndex3);
                                    field_num++
                                }
                                if (line.search('code_print_time') != -1) {
                                    var beginIndex4 = line.search('=') + 1;
                                    timecost = line.substring(beginIndex4);
                                    field_num++
                                }
                            })
                            if (field_num === 5) {
                                console.log('filed_num: ', field_num)
                                console.log('read field completed')
                                console.log('width ' + width + ' depth ' + depth + ' height ' + height + ' timecost ' + timecost + ' mcost ' + mcost)
                                $('#add-modal-width').val(width);
                                $('#add-modal-depth').val(depth);
                                $('#add-modal-height').val(height);
                                $('#add-modal-time-cost').val(timecost);
                                $('#add-modal-mat-cost').val(mcost);
                                resolve(form)
                            } else {
                                reject()
                            }
                        }
                        console.log('file size: ', localFile.size)
                        
                        var blob
                        start = 0
                        end = 10239
                        if (end > localFile.size) end = localFile.size
                        if(localFile.webkitSlice) {
                            blob = localFile.webkitSlice(start, end + 1);
                        } else if(localFile.mozSlice) {
                            blob = localFile.mozSlice(start, end + 1);
                        } else if(localFile.slice) {
                            blob = localFile.slice(start, end + 1);
                        } else {
                            console.log('blob is null')
                        }
                        console.log('start: ' + start + ' end: ' + end)
                        reader.readAsText(blob)
                    }).then(function (value) {
                        $.ajax({
                            url: '/manage/edu-add-comp-gcode/' + 0 + '/' + 0,
                            type: 'POST',
                            cache: false,
                            data: value,
                            processData: false,
                            contentType: false
                        }).done(function (res) {
                            console.log(value)
                            if (res.code == '200') {
                                console.log('已上传模型文件');
                            } else {
                                alert('更新失败，请重新尝试');
                            }
                        }).fail(function (res) {
                            console.error(res);
                        });
                    }, function (error) {
                        reject()
                    }).then(function () {
                        console.log('success')
                    })
                }, function (error) {
                    // 异常处理
                    reject()
                }).then(function () {
                    console.log('success')
                });
            }
        })
    });
}
function addcompInfo(index1, index2) {
    $('#add-btn').click(function () {
        $.ajax({
            url: '/manage/edu-add-comp/' + index1 + '/' + index2,
            type: 'POST',
            cache: false,
            data: new FormData($('#addForm')[0]),
            processData: false,
            contentType: false
        }).done(function (res) {
            if (res.code == '200') {
                alert('已添加子部件');
                window.location.reload();
            } else {
                alert('更新失败，请重新尝试');
            }
        }).fail(function (res) {
            console.error(res);
        });
    });

}

function getCostInfo(cateIndex, modelIndex) {
    $.get('/manage/edu-cost-get/' + cateIndex + '/' + modelIndex, function (costInfo) {
        var timecost = costInfo.t_cost;
        var mcost = costInfo.m_cost;
        $('#timeCost').html(timecost + '小时');
        $('#materialCost').html(mcost + '克');
    });

}


