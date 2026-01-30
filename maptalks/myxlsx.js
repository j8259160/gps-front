function XlsxCls(options) {
    options = options ? options : {};

    var _options = {
        title: '',
        isDateRange: false,
        data: [],
        contentAlign: 'center',
    }


    var keyPrefixs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU'];

    this._options = Object.assign(_options, options);

    this._options.isDateRange = !!this._options.dateRange;

    var isDateRange = this._options.isDateRange;

    if (isDateRange) {
        this._options.data.unshift([this._options.dateRange]);
    }

    let isHasTitle = !(this._options.title == 'mark' || this._options.title == 'marken');

    if (isHasTitle && this._options.title) {
        this._options.data.unshift([this._options.title]);
        var len = (isDateRange ? 2 : 1) + 1
        if (this._options.data.length <= len) {
            return;
        }
    }



    var merges = [];
    if (_options.merges) {
        merges = _options.merges;
    } else {
        if (isHasTitle && this._options.title) {
            merges = [{
                s: {
                    r: 0,
                    c: 0
                },
                e: {
                    r: 0,
                    c: _options.data[2].length - 1
                },
            }];
        }

        if (isDateRange) {
            merges.push({
                s: {
                    r: 1,
                    c: 0,
                    border: this.getBorderStyle(),
                },
                e: {
                    r: 1,
                    c: _options.data[2].length - 1
                },
            });
        }
    }



    var exportMaxLength = this._options.exportMaxLength ? this._options.exportMaxLength : 30000;

    this.datas = {
        '!ref': 'A1:AU' + exportMaxLength,
        '!merges': merges
    };


    var _this = this;

    this._options.data.forEach(function(row, rowIndex) {
        row.forEach(function(col, colIndex) {

            var key = keyPrefixs[colIndex] + (rowIndex + 1);
            var value = _this._options.data[rowIndex][colIndex];

            if (rowIndex == 0 && _this._options.title != "") {
                if (!_this.datas[key]) {

                    _this.datas[key] = {
                        v: value,
                        s: _this.getExcelHeaderStyle()
                    }
                }
            } else {

                if (isDateRange && rowIndex == 1 && _this._options.title != "") {
                    _this.datas[key] = {
                        v: value,
                        s: {
                            alignment: {
                                horizontal: 'left',
                                vertical: 'center',
                            },
                        },
                    }
                } else {
                    _this.datas[key] = {
                        v: value,
                        s: {
                            border: _this.getBorderStyle(),
                            alignment: {
                                horizontal: _options.contentAlign,
                                vertical: 'center',
                            },
                        }
                    }
                }

            }

        });

    });

    // console.log(' _this.datas');
    // console.log(_this.datas);

    this.setColWidths();

}

var XlsxClsPro = XlsxCls.prototype;


XlsxClsPro.setColWidths = function() {
    function getCellWidth(value) {
        // 判断是否为null或undefined
        if (value == null) {
            return 10
        } else if (/.*[\u4e00-\u9fa5]+.*$/.test(value)) {
            // 判断是否包含中文
            return value.toString().length * 1.8;
        } else {
            return value.toString().length * 1.2;
            /* 另一种方案
            value = value.toString()
            return value.replace(/[\u0391-\uFFE5]/g, 'aa').length
            */
        }
    }

    var cache = {};

    var data = this._options.data.slice(this._options.isDateRange ? 2 : 1, this._options.data.length);

    data.forEach(function(item) {
        item.forEach(function(value, index) {

            if (cache[index] == undefined) {
                cache[index] = 0;
            }

            var size = getCellWidth(value);
            if (size > cache[index]) {
                cache[index] = size;
            }

        })
    });


    var colWidths = [];

    for (var key in cache) {
        colWidths.push({ wch: cache[key] });
    }

    this.datas['!cols'] = colWidths;

}

XlsxClsPro.getBorderStyle = function(style) {
    var styleObj = {
        style: style ? style : 'thin',
    };
    return {
        top: styleObj,
        left: styleObj,
        right: styleObj,
        bottom: styleObj,
    }
}

XlsxClsPro.getExcelHeaderStyle = function() {
    return {
        alignment: {
            horizontal: 'center',
            vertical: 'center',
        },
        font: {
            sz: 14,
            bold: true,
            color: {
                rgb: "00000000"
            }
        },
    };
}

XlsxClsPro.exportOilTempExcel = function(vm) {

    function saveAs(obj, fileName) {
        var tmpa = document.createElement("a");
        tmpa.download = fileName || "下载";
        tmpa.href = URL.createObjectURL(obj);
        tmpa.click();
        setTimeout(function() {
            URL.revokeObjectURL(obj);
        }, 100);
    }

    function s2ab(s) {
        if (typeof ArrayBuffer !== 'undefined') {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i != s.length; ++i) {
                view[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        } else {
            var buf = new Array(s.length);
            for (var i = 0; i != s.length; ++i) {
                buf[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        }
    }

    var sheetName = vm.isZh ? '测量标定' : 'VolumeCalibration';
    var wb = {
        SheetNames: [sheetName],
        Sheets: vm.isZh ? {
            '测量标定': this.datas
        } : {
            'VolumeCalibration': this.datas
        }
    };

    var tmpDown = new Blob([
        s2ab(
            // 这里的数据是用来定义导出的格式类型
            XLSX.write(wb, {
                bookType: 'xlsx',
                bookSST: false,
                type: 'binary'
            })
        )
    ], {
        type: ""
    });
    saveAs(tmpDown, sheetName + ' ' + vm.devicenameAndDeviceid + ".xlsx");
}


XlsxClsPro.exportExcel = function(vm) {
    // console.log('exportExcel -----');
    var len = (this._options.isDateRange ? 2 : 1) + 1
    if (this._options.data.length <= len) {
        return;
    }

    function saveAs(obj, fileName) {
        var tmpa = document.createElement("a");
        tmpa.download = fileName || "下载";
        tmpa.href = URL.createObjectURL(obj);
        tmpa.click();
        setTimeout(function() {
            URL.revokeObjectURL(obj);
            vm.exportLoading1 = false;
            vm.exportLoading2 = false;
            vm.$XModal.message({ message: vm.$t('tips.exportDataSucc'), status: 'success', zIndex: 9999 })
        }, 100);
    }

    function s2ab(s) {
        if (typeof ArrayBuffer !== 'undefined') {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i != s.length; ++i) {
                view[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        } else {
            var buf = new Array(s.length);
            for (var i = 0; i != s.length; ++i) {
                buf[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        }
    }
    var sheetName = this._options.title;
    var sheets = {}
    sheets[sheetName] = this.datas;

    // sheets.sheetName = this.datas;
    var wb = {
        SheetNames: [sheetName],
        Sheets: sheets,
    };

    var tmpDown = new Blob([
        s2ab(
            // 这里的数据是用来定义导出的格式类型
            XLSX.write(wb, {
                bookType: 'xlsx',
                bookSST: false,
                type: 'binary'
            })
        )
    ], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(tmpDown, sheetName + ".xlsx");
    // console.log('exportExcel --- end')
}


XlsxClsPro.exportMarkExcel = function(vm) {

    this._options.data.shift();

    if (this._options.data.length == 0) {
        return;
    }

    function saveAs(obj, fileName) {
        var tmpa = document.createElement("a");
        tmpa.download = fileName || "下载";
        tmpa.href = URL.createObjectURL(obj);
        tmpa.click();
        setTimeout(function() {
            URL.revokeObjectURL(obj);
            vm.exportLoading1 = false;
            vm.exportLoading2 = false;
            vm.$XModal.message({ message: vm.$t('tips.exportDataSucc'), status: 'success', zIndex: 9999 })
        }, 100);
    }

    function s2ab(s) {
        if (typeof ArrayBuffer !== 'undefined') {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i != s.length; ++i) {
                view[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        } else {
            var buf = new Array(s.length);
            for (var i = 0; i != s.length; ++i) {
                buf[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        }
    }
    var sheetName = this._options.title;
    var sheets = {}
    sheets[sheetName] = this.datas;

    // sheets.sheetName = this.datas;
    var wb = {
        SheetNames: [sheetName],
        Sheets: sheets,
    };

    var tmpDown = new Blob([
        s2ab(
            // 这里的数据是用来定义导出的格式类型
            XLSX.write(wb, {
                bookType: 'xlsx',
                bookSST: false,
                type: 'binary'
            })
        )
    ], {
        type: ""
    });
    saveAs(tmpDown, sheetName + ".xlsx");
    // console.log('exportExcel --- end')
}