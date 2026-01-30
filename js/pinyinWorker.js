importScripts('./pinyinhanzi.js');

var pinyinMap = {};

function setDeviceList(groups) {
    if (groups) {
        for (var i = 0; i < groups.length; ++i) {
            let group = groups[i];
            let key = group.groupname;
            pinyinMap[key] = __pinyin.get(key);
            if (group.devices) {
                group.devices.forEach(function(device) {
                    let key = device.devicename;
                    pinyinMap[key] = __pinyin.get(key);
                });
            }
        }
    }
}

function doCastUsersTreeToDevices(usersTrees) {
    if (usersTrees != null && usersTrees.length > 0) {
        for (let i = 0; i < usersTrees.length; ++i) {
            let usersTree = usersTrees[i];
            let username = usersTree.username;
            let showname = usersTree.showname ? usersTree.showname : username;
            let subusers = usersTree.subusers;

            pinyinMap[showname] = __pinyin.get(showname);

            setDeviceList(usersTree.groups);
            if (username != null && subusers != null && subusers.length > 0) {
                doCastUsersTreeToDevices(subusers);
            }
        }
    }
}



self.onmessage = function(e) {
    let rootuser = e.data;
    if (rootuser) {
        var username = rootuser.username;
        var subusers = rootuser.subusers;
        pinyinMap[username] = __pinyin.get(username);
        setDeviceList(rootuser.groups);
        if (username != null && subusers != null && subusers.length > 0) {
            doCastUsersTreeToDevices(subusers);
        }

    }

    self.postMessage(pinyinMap);

    pinyinMap = null;

};