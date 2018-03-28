/**
 * Created by yuanxiaomei on 2017/3/28.
 */

var clickNum = 0;
var searchStatus = 'compName';
$(document).ready(function () {
    $("[data-toggle='tooltip']").tooltip();
    switchBtnCheck();
    modelListGet();
    modelListQuery();

    $('#returnBtn').click(function () {
        window.location.href='/manage?category_index=0&model_index=0';
    });

});
function switchBtnCheck() {
    $('.tgl-btn').click(function () {
        clickNum += 1;
        if (clickNum % 2 == 1) {
            $('#searchStatus').html('用户名称');
            searchStatus = 'userName';
        }
        else {
            $('#searchStatus').html('子部件名称');
            searchStatus = 'compName';

        }

    });

}


function modelListGet() {
    $.get('/manage/models/userSpace-data-all', function (res0) {
        console.log(res0);
        listGenerate(res0);
    });
}
function modelListQuery() {
    $('#searchNavBtn').click(function () {
        if (searchStatus == 'compName') {
            $.post('/manage/models/userSpace-query/compName', {
                searchStr: $('#searchModelIn').val()
            }, function (res1) {
                if (res1.length != undefined || res1.length != 0) {
                    console.log(res1);
                    //查询条件提示
                    if ($('#searchModelIn').val() != "") {
                        $('#searchSpan').html('子部件名包含'+$('#searchModelIn').val());
                    } else {
                        $('#searchSpan').html('无');
                    }
                    tableClean();
                    listGenerate(res1);
                }
            });
        } else if (searchStatus == 'userName') {
            $.post('/manage/models/userSpace-query/userName', {
                userStr: $('#searchModelIn').val()
            }, function (res2) {
                if (res2.length != undefined || res2.length != 0) {
                    console.log(res2);
                    //查询条件提示
                    if ($('#searchModelIn').val() != "") {
                        $('#searchSpan').html('用户名包含'+$('#searchModelIn').val());
                    } else {
                        $('#searchSpan').html('无');
                    }
                    tableClean();
                    listGenerate(res2);
                }
            });
        }

    });

}

function listGenerate(modelList) {
    $('#resultNum').html(modelList.length);
    var t = "";
    t += '<table id="modelTable">';
    t += " <tr>" +
        "<th class='modelTh' id='OrderTh'>序号</th>" +
        "<th class='modelTh' id='imgTh'>缩略图</th>" +
        "<th class='modelTh' id='compTh'>子部件名称</th>" +
        "<th class='modelTh' id='ownerTh'>拥有者</th>" +
        "<th class='modelTh' id='timeTh'>创建的时间</th>" +
        "<th class='modelTh' id='detailTh'>详情</th>" +
        "<th class='modelTh' id='delTh'>删除</th>" +
        "</tr>";
    for (var i = 0; i < modelList.length; i++) {
        var date = new Date("" + modelList[i].component.createdAt);
        t += "<tr>";
        t += "<td>" + (i + 1) + "</td>";
        t += "<td>" + "<div class='imgBox'><img class='img-thumbnail'></div>" + "</td>";
        t += "<td>" + modelList[i].component.name + "</td>";
        t += "<td>" + modelList[i].user.username + "</td>";
        t += "<td>" + date.toLocaleString("chinese", {hour12: false}) + "</td>";
        t += "<td>" + "<div class='actionBox_details'></div>" + " </td> ";
        t += "<td>" + "<div class='actionBox_delete'></div>" + " </td> ";
        t += "</tr>";
    }
    t += "</table>";
    $('#modelResultBox').append(t);

    $(".img-thumbnail").each(function (b) {
        $(this).attr('id', 'modelImg' + b)
    });
    for (var a = 0; a < modelList.length; a++) {
        if (modelList[a].component.thumbnail != undefined) {
            var imgUrl = modelList[a].component.thumbnail.url;
            $("#modelImg" + a).attr('src', imgUrl);
        }
    }
    $(".actionBox_details").each(function (c) {
        $(this).attr('id', 'detailId' + c)
    });
    $(".actionBox_delete").each(function (d) {
        $(this).attr('id', 'delId' + d)
    });
    //删除按钮的生成
    for (var k = 0; k < modelList.length; k++) {
        var delBtn = document.createElement("button");
        var realId = k;
        delBtn.innerHTML = "删除";
        delBtn.id = 'del' + realId;
        $(delBtn).attr("class", "btn btn-default");
        (function (k) {
            delBtn.onclick = function () {
                $('#delModal').modal('show');
                deleteComp(modelList, k);
            }
        })(k);
        $('#delId' + k).append(delBtn);
    }

    for (var p = 0; p < modelList.length; p++) {
        var detailBtn = document.createElement("button");
        var detailId = p;
        detailBtn.innerHTML = "查看详情";
        detailBtn.id = 'detail' + detailId;
        $(detailBtn).attr("class", "btn btn-default");
        (function (w) {
            detailBtn.onclick = function () {
                $('#detailModal').modal('show');
                compClean();
                compInfoWrite(modelList, w);
            }
        })(p);
        $('#detailId' + p).append(detailBtn);
    }
}
function deleteComp(data, compIndex) {
    //模态框中写入数据
    if (data[compIndex].component.thumbnail != undefined) {
        $('.delImage').attr('src', data[compIndex].component.thumbnail.url);

    } else {

    }
    $('#delConfirmBtn').click(function () {
        $.get('/manage/models/userSpace/' + compIndex, function (res) {
            if (res.msg == 'ok') {
                $("#delInfo").html('删除成功,自动刷新');
                setTimeout(function () {
                    window.location.reload();
                },600);
            } else {
                alert('网络错误，删除失败');
            }
        });
    });
}

function compInfoWrite(data, compIndex) {
    var date1 = new Date("" + data[compIndex].component.createdAt);
    var date2 = new Date("" + data[compIndex].component.updatedAt);
    //缩略图
    if (data[compIndex].component.thumbnail != undefined) {
        $('.img-modal').attr('src', '' + data[compIndex].component.thumbnail.url);
    }
    if ($('.model-value').html() == '') {
        $('.model-value').html('无相关信息');
    }
    $('#compName').html(data[compIndex].component.name);
    $('#compNote').html(data[compIndex].component.note);
    $('#timeCost').html(data[compIndex].component.time_cost);
    $('#materialCost').html(data[compIndex].component.material_cost);
    $('#compWidth').html(data[compIndex].component.width);
    $('#compHeight').html(data[compIndex].component.height);
    $('#compDepth').html(data[compIndex].component.depth);
    $('#printTimesModal').html(data[compIndex].component.print_times);
    $('#createTimeModal').html(date1.toLocaleString("chinese", {hour12: false}));
    $('#updateTimeModal').html(date2.toLocaleString("chinese", {hour12: false}));
    $('#gcodeFileModal').attr('href', data[compIndex].component.gcode.url);
    if (data[compIndex].component.description != undefined) {
        for (var i = 0; i < data[compIndex].component.description.length; i++) {
            var descImg = document.createElement('img');
            descImg.src = data[compIndex].component.description[i].url;
            descImg.setAttribute("class", 'descImgModal');
            $('#modal-img-desc').append(descImg);
        }
    }
}
function compClean() {
    $('.img-modal').attr('src', '');
    $('#compName').html('');
    $('#compNote').html('');
    $('#timeCost').html('');
    $('#materialCost').html('');
    $('#compWidth').html('');
    $('#compHeight').html('');
    $('#compDepth').html('');
    $('#printTimesModal').html('');
    $('#createTimeModal').html('');
    $('#updateTimeModal').html('');
    $('#gcodeFileModal').attr('href', '#');
    var myNode = document.getElementById("modal-img-desc");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
}
function tableClean() {
    var myNode = document.getElementById("modelResultBox");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
}
