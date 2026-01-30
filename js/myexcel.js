/* options 包含 
 * title  报表名称
 * data  数据
 * dateRange 时间
 * imgBase64  图片数据
 * devicename  设备名称
 * merges  合并单元格
 * contentAlign  内容水平对齐
 * hideTitle : false
 */

function ExcelCls(options) {

    this.rowHeight = 22;
    this.options = options;

    if (options.devicename) {
        options.devicename = options.devicename.replace(/[*?:\\\/\[\]]/g, "");
    }

    // 创建工作铺
    this.workbook = new ExcelJS.Workbook();
    // 曲线图工作表
    this.imgWorksheet = null;
    if (options.imgData != undefined) {

        let imgData = options.imgData;
        let echartTitle = imgData.echartTitle;
        if (echartTitle) {
            echartTitle = echartTitle.replace(/[*?:\\\/\[\]]/g, "");
            if (echartTitle.length == 0) {
                echartTitle = 'Dummy';
            }
        }
        imgData.echartTitle = echartTitle;

        this.imgWorksheet = this.workbook.addWorksheet(echartTitle ? echartTitle : "Chart");
        this.addImageToWorkbook(imgData);
    }

    let title = options.title;
    if (title) {
        title = title.replace(/[*?:\\\/\[\]]/g, "");
        if (title.length == 0) {
            title = 'Dummy';
        }
    }
    options.title = title;
    // 表格
    this.tableWorksheet = this.workbook.addWorksheet(title);
    this.addDataToWorkbook(options);

}

ExcelCls.prototype.addDataToWorkbook = function(options) {
    //  options = { title , data , dateRange ,imgBase64 ,devicename , merges} 
    let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let hideTitle = options.hideTitle ? true : false;
    let worksheet = this.tableWorksheet;
    let mergeCellIndex = 1;

    if (options.data) {
        let maxLen = options.data[0].length;

        if (hideTitle == false) {
            worksheet.addRow([options.title]);
            worksheet.mergeCells(mergeCellIndex, 1, mergeCellIndex, maxLen);
        } else {
            mergeCellIndex = 0;
        }

        if (options.dateRange) {
            worksheet.addRow([options.dateRange]);
            worksheet.mergeCells(mergeCellIndex + 1, 1, mergeCellIndex + 1, maxLen);
        }

        options.data.forEach(item => {
            worksheet.addRow(item);
        });

        if (options.merges) {

            options.merges.forEach(({ s, e }) => {
                let range = letters[s.c] + (s.r + 1) + ':' + letters[e.c] + (e.r + 1);
                worksheet.mergeCells(range);
            });
        }

        //  获取每列最大宽度（ 这里仅作示意， 实际需要实现文本宽度计算）
        let columnWidths = {};
        options.data.forEach(row => {
            row.forEach((cell, index) => {
                if (!columnWidths[index]) {
                    columnWidths[index] = cell ? cell.toString().length : 10; // 这里用长度作为宽度的近似值  
                } else {
                    columnWidths[index] = Math.max(columnWidths[index], cell ? cell.toString().length : 10);
                }
            });
        });

        let contentAlign = options.contentAlign ? options.contentAlign : 'center';
        // 设置边框  
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            row.height = this.rowHeight;
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                let align = contentAlign;
                if (rowNumber == 1) {
                    let column = worksheet.getColumn(colNumber);
                    let width = columnWidths[colNumber - 1];
                    column.width = width * 1.25;
                    column.height = this.rowHeight;
                    align = 'center';
                }
                cell.style = {
                    alignment: { horizontal: align, vertical: 'middle' },
                    border: {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    },
                    font: {
                        bold: rowNumber == 1
                    }
                }
            });
        });

    }

}


function findMaxNumber(arr) {
    // 首先，我们检查数组是否为空或未定义  
    if (!Array.isArray(arr) || arr.length === 0) {
        return null; // 或者你可以抛出一个错误，或者返回一个特定的值，比如 Number.NEGATIVE_INFINITY  
    }
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}


ExcelCls.prototype.addImageToWorkbook = function(imgData) {
    let imgBase64 = imgData.imgBase64;
    let tableList = imgData.tableList;
    let imgWorksheet = this.imgWorksheet;



    let maxLen = findMaxNumber(tableList.map((item) => item.length));

    tableList.forEach((item, index) => {
        imgWorksheet.addRow(item);
        if (item.length < maxLen) {
            imgWorksheet.mergeCells(index + 1, 1, index + 1, maxLen);
        }
    });


    //  获取每列最大宽度（ 这里仅作示意， 实际需要实现文本宽度计算）
    let columnWidths = {};
    tableList.forEach((row, idx) => {
        row.forEach((cell, index) => {
            if (idx != 0) {
                if (!columnWidths[index]) {
                    columnWidths[index] = cell ? cell.toString().length : 10; // 这里用长度作为宽度的近似值  
                } else {
                    columnWidths[index] = Math.max(columnWidths[index], cell ? cell.toString().length : 10);
                }
            }
        });
    });

    let border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    imgWorksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        row.height = this.rowHeight;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (rowNumber == 2) {
                let column = imgWorksheet.getColumn(colNumber);
                let width = columnWidths[colNumber - 1];
                column.width = width * 2.2;
            }
            cell.style = {
                alignment: { horizontal: 'center', vertical: 'middle' },
                border,
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: (rowNumber == 2 || rowNumber == 4) ? 'D9D9D9' : 'FFFFFF' }
                },
                font: {
                    bold: rowNumber == 1
                }
            }
        });
    });

    const imageId1 = this.workbook.addImage({
        base64: imgBase64,
        extension: "png", // 图片扩展名，支持“jpeg”，“png”，“gif”
    });
    // let range = `${String.fromCharCode(65 + 0 * 6)}1:${String.fromCharCode(70 + 0 * 6)}16`;
    // 在一定范围内添加图片
    imgWorksheet.addImage(imageId1,
        // {
        //     tl: { col: 0, row: tableList.length + 3 },
        //     ext: { width: 718, height: 403 }
        // }
        // 'A3:L23'
        `A${tableList.length +3 }:D${14+ tableList.length +3}`
    );
};



ExcelCls.prototype.exportExcel = function(vm) {

    function saveAs(obj, fileName) {
        var tmpa = document.createElement("a");
        tmpa.download = fileName || "下载";
        tmpa.href = URL.createObjectURL(obj);
        tmpa.click();
        setTimeout(function() {
            URL.revokeObjectURL(obj);
            vm.exportLoading1 = false;
            vm.exportLoading2 = false;
            vm.$XModal.message({
                message: vm.$t('tips.exportDataSucc'),
                status: 'success',
                zIndex: 9999
            })
        }, 100);
    }

    let devicename = this.options.devicename ? '-' + this.options.devicename : '';
    let fileName = this.options.title + devicename + '.xlsx';
    const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    this.workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], {
            type: EXCEL_TYPE
        });
        saveAs(blob, fileName);
    });
};