/**
 * Created by yuanxiaomei on 2017/3/26.
 */
$(document).ready(function () {

    addInfoPrinter();
    printerInfoGet();
    $('#returnBtn').click(function () {
        window.location.href='/manage?category_index=0&model_index=0';

    });

});
function addInfoPrinter() {
    $('#add-confirm-btn').click(function () {
        $.post('/manage/models/camera-config', {
            'username': $("#printName").val(),
            'camera': $('#cameraId').val(),
            'password': '123456'
        }, function (res) {
            if (res.msg = "ok") {
                $('#addModal').modal('hide');
                window.location.reload();
            }
        });
    });
}

function printerInfoGet() {
    $.get('/manage/models/camera-data', function (result) {
        if (result.length != 0) {
            printerInfoTableBuild(result);
        }
    });

}
function printerInfoTableBuild(info) {
    var t = "";
    t += '<table id="printerTable">';
    t += " <tr>" +
        "<th class='cameraTh'>序号</th>" +
        "<th class='cameraTh' >打印机</th>" +
        "<th class='cameraTh'>摄像头</th>" +
        "<th class='cameraThAction'>修改</th>" +
        "<th class='cameraThAction'>删除</th>" +
        "</tr>";
    for (var i = 0; i < info.length; i++) {
        t += "<tr>";
        t += "<td>" + (i + 1) + "</td>";
        t += "<td>" + info[i].username + "</td>";
        t += "<td>" + info[i].camera + "</td>";
        t += "<td>" + "<div class='actionBox_modify'></div>" + "</td>";
        t += "<td>" + "<div class='actionBox_delete'></div>" + "</td>";
        t += "</tr>";
    }
    t += "</table>";
    $('#tableBox').append(t);
    $(".actionBox_modify").each(function (p) {
        $(this).attr('id', 'actionBox_modify' + p)

    });
    $(".actionBox_delete").each(function (q) {
        $(this).attr('id', 'actionBox_delete' + q)

    });
    for (var a = 0; a < info.length; a++) {
        var aToModify = document.createElement("a");
        aToModify.innerHTML = "修改";
        (function (d) {
            aToModify.onclick = function () {
                $('#modifyModal').modal('show');
                writePrinterInfo(info, d);
                $('#modify-confirm-btn').click(function () {
                    modifyPrinter(d);
                });
            }
        })(a);
        $("#actionBox_modify" + a).append(aToModify);
    }
    for (var b = 0; b < info.length; b++) {
        var aToDelete = document.createElement("a");
        aToDelete.innerHTML = "删除";
        (function (e) {
            aToDelete.onclick = function () {
                $('#deleteModal').modal('show');
                writeDeleteInfo(info, e);
                $('#delete-confirm-btn').click(function () {
                    deletePrinter(e);
                });
            }
        })(b);
        $("#actionBox_delete" + b).append(aToDelete);
    }

}
function deletePrinter(index) {
    $.get('/manage/models/camera-delete/' + index, function (res1) {
        $('#deleteModal').modal('hide');
        if (res1.msg == 'ok') {
            alert('删除成功');
            window.location.reload();
        } else {
            alert('修改失败');
        }
    });
}

function modifyPrinter(index) {
    $.post('/manage/models/camera-modify/' + index, {
        "camera": $('#cameraIdM').val()
    }, function (res0) {
        $('#modifyModal').modal('hide');
        if (res0.msg == 'ok') {
            alert('修改成功');
            window.location.reload();
        } else {
            alert('修改失败');
        }
    });
}

function writePrinterInfo(data, index) {
    var username = data[index].username;
    $('#printNameM').val(username);
}
function writeDeleteInfo(data, index) {
    var username = data[index].username;
    var camera = data[index].camera;
    $('#printNameC').val(username);
    $('#cameraIdC').val(camera);
}