// executableResponses.js - Executable Builder's module
// author: brettz9
/*globals exports, require */

(function () {'use strict';

var chrome = require('chrome'),
    Cc = chrome.Cc,
    Ci = chrome.Ci,
    file = require('sdk/io/file');

function l(msg) {
    console.log(msg);
}
function makeURI(aURL, aOriginCharset, aBaseURI) {
  var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
  return ioService.newURI(aURL, aOriginCharset || null, aBaseURI || null);
}

function getHardFile (dir) {
    return Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get(dir, Ci.nsIFile);
}

function getHardPath (dir) {
    return getHardFile(dir).path;
}

function createProcess (aNsIFile, args) {
	var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
	process.init(aNsIFile);
    process.run(false, args, args.length); // false=nonblocking
}


/*
http://stackoverflow.com/questions/18711327/programmatically-create-firefox-profiles
https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIToolkitProfileService
https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIToolkitProfile
http://kb.mozillazine.org/Profiles.ini_file
*/

exports.createProfile = function (name) {
    // https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIToolkitProfileService#createProfile%28%29
    var toolkitProfileService = Cc['@mozilla.org/toolkit/profile-service;1'].createInstance(Ci.nsIToolkitProfileService);
    toolkitProfileService.createProfile(null, null, name); // aRootDir, aTempDir, aName
    return true;
};

exports.getProfiles = function () {
    // Instead cycle over profiles.ini (within "%appdata%/Mozilla/Firefox/")
    var profileObj,
        profiles = [],
        toolkitProfileService = Cc['@mozilla.org/toolkit/profile-service;1'].createInstance(Ci.nsIToolkitProfileService),
        profileObjs = toolkitProfileService.profiles;
    while (profileObjs.hasMoreElements()) {
        profileObj = profileObjs.getNext();
        profileObj.QueryInterface(Ci.nsIToolkitProfile);
        profiles.push(profileObj.name);
    }
    return profiles;
};

exports.manageProfiles = function () {
    var file = getHardFile('CurProcD');
    file = file.parent; // Otherwise, points to "browser" subdirectory
    file.append('firefox.exe');
    createProcess(file, ['-P', '-no-remote']);
};

exports.getHardPaths = function (emit) {
    return ['Desk', 'Strt', 'Progs', 'AppData', 'Pict'].reduce(function (obj, name) {
        obj[name] = getHardPath(name);
        return obj;
    }, {});
};

exports.dirPick = function (data, emit) {
    //data.dirPath;
    //modeGetFolder
    //emit('dirPickResult', {path: res, i: data.i});
};

exports.filePick = function (dirPath, emit) {
    // Note: could use https://developer.mozilla.org/en-US/docs/Extensions/Using_the_DOM_File_API_in_chrome_code
    //         but this appears to be less feature rich
    var dir,
        windowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
        nsIFilePicker = Ci.nsIFilePicker,
        fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
    fp.defaultExtension = 'ico';
    //fp.appendFilter('ICO (.ico)', '*.ico');
    //fp.appendFilter('SVG (.svg)', '*.svg');
    //fp.appendFilter('Icon file', '*.ico; *.svg');
    fp.appendFilter('Icon file', '*.ico');

    if (dirPath) {
        try {
            dir = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            dir.initWithPath(dirPath);
            fp.displayDirectory = dir;
        }
        catch(e) {
            l('initWithPath error: '+ e);
        }
    }
    fp.init(windowMediator.getMostRecentWindow(null), "Pick an icon file", nsIFilePicker.modeOpen);

    fp.open({done: function (rv) {
        var file, path,
            res = '';
        if (rv === nsIFilePicker.returnOK || rv === nsIFilePicker.returnReplace) {
            file = fp.file;
            path = file.path;
            res = path;
        }
        emit('filePickResult', res);
        return false;
    }});
    /*
    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
        var file = fp.file;
        var path = fp.file.path;

    }*/
};


exports.autocompleteURLHistory = function (data, emit) {
    var i, node, result, cont,
        historyService = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService),
        // No query options set will get all history, sorted in database order,
        // which is nsINavHistoryQueryOptions.SORT_BY_NONE.
        options = historyService.getNewQueryOptions(),
        query = historyService.getNewQuery(), // No query parameters will return everything
        userVal = data.value,
        optValues = [],
        optIcons = [];

    query.uriIsPrefix = true;
    options.maxResults = 20;
    try {
        query.uri = makeURI(userVal); // May throw here (would be better
        // if this were pure strings rather than nsiURI but now at least
        // it works when user types valid URI which is only part of a larger one)

        // execute the query
        result = historyService.executeQuery(query, options);
        cont = result.root;
        cont.containerOpen = true;

        for (i = 0; i < cont.childCount; i ++) {
            node = cont.getChild(i);
            // "node" attributes contains the information (e.g. URI, title, time, icon...)
            // see : https://developer.mozilla.org/en/nsINavHistoryResultNode
            optValues.push(node.uri);
            optIcons.push(node.icon);
        }

        // Close container when done
        // see : https://developer.mozilla.org/en/nsINavHistoryContainerResultNode
        cont.containerOpen = false;
    }
    catch(e) {
        // l('autocompleteURLHistory error: '+e);
    }

    return {
        listID: data.listID,
        optValues: optValues,
        optIcons: optIcons,
        userVal: userVal // Just for debugging on the other side
    };
};

exports.openOrCreateICO = function () {
    return 'Not yet implemented';
};


// THE REMAINING WAS COPIED FROM filebrowser-enhanced fileBrowserResponses.js (RETURN ALL MODIFICATIONS THERE)
function getFile (path) {
    var localFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    localFile.initWithPath(path);
    return localFile;
}

exports.reveal = function (path) {
    var localFile = getFile(path);
    localFile.reveal();
};

exports.autocompleteValues = function (data, emit) {

    var optValues,
        userVal = data.value,
        dir = file.dirname(userVal),
        base = file.basename(userVal);

    if (file.exists(userVal)) {
        if (userVal.match(/(?:\/|\\)$/)) {
            optValues = file.list(userVal).map(function (fileInDir) {
                return file.join(userVal, fileInDir);
            });
        }
        else {
            optValues = [userVal];
        }
    }
    else if (file.exists(dir)) {
        optValues = file.list(dir).filter(function (fileInDir) {
            return fileInDir.indexOf(base) === 0;
        }).map(function (fileInDir) {
            return file.join(dir, fileInDir);
        });
    }
    
    
    optValues = data.dirOnly ?
        optValues.filter(function (optValue) {
            try {
                return getFile(optValue).isDirectory();
            }
            catch (e) {
                return false;
            }
        }) :
        optValues;

    return {
        listID: data.listID,
        optValues: optValues,
        userVal: userVal // Just for debugging on the other side
    };

};



}());
