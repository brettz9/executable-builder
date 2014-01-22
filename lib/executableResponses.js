// executableResponses.js - Executable Builder's module
// author: brettz9
/*globals exports, require */

(function () {'use strict';

var chrome = require('chrome'),
    Cc = chrome.Cc,
    Ci = chrome.Ci,
    file = require('sdk/io/file'),
    system = require('sdk/system');

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

function createProcess (aNsIFile, args, observer, emit) {
    var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
    observer = (emit && observer && observer.observe) ?
        observer :
        {observe: function (aSubject, aTopic, data) {}};
	process.init(aNsIFile);
    process.runAsync(args, args.length, observer);
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

exports.manageProfiles = function (cb) {
    var file = getHardFile('CurProcD');
    file = file.parent; // Otherwise, points to "browser" subdirectory
    file.append('firefox.exe');
    createProcess(file, ['-P', '-no-remote'], cb);
};

exports.getHardPaths = function (emit) {
    return ['Desk', 'Strt', 'Progs', 'AppData', 'Pict'].reduce(function (obj, name) {
        obj[name] = getHardPath(name);
        return obj;
    }, {
        // Todo: Make OS-specific
        TaskBar: getHardPath('AppData') + '\\Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar'
    });
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

exports.saveTemplate = function (data, emit) {
    // get profile directory
    /*
    var profD = Cc['@mozilla.org/file/directory_service;1'].
               getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
    profD.append(data.fileName);
    */
    var ws,
        profD = system.pathFor('ProfD'),
        ec = file.join(profD, 'executable-creator'),
        template = file.join(profD, 'executable-creator', data.fileName + '.html'),
        lastTemplate = data.lastTemplate ? file.join(profD, 'executable-creator', data.lastTemplate + '.html') : null;
    if (!file.exists(ec)) {
        file.mkpath(ec);
    }

    ws = file.open(template, 'w');
    ws.writeAsync(data.content, function () {
        if (lastTemplate) { // Currently not in use
            file.remove(lastTemplate);
        }
        emit('saveTemplateResult', {templateName: data.fileName, message: 'Save successful! in (' + template + ')'});
    });
};

exports.deleteTemplate = function (data, emit) {
    var profD = system.pathFor('ProfD'),
        ec = file.join(profD, 'executable-creator'),
        template = file.join(profD, 'executable-creator', data.fileName + '.html');
    if (!file.exists(ec)) {
        file.mkpath(ec);
    }
    if (!file.exists(template)) {
        return {message: 'File file (' + template + ') + does not exist', fileName: data.fileName};
    }
    file.remove(template);
    return {message: 'File removed!', fileName: data.fileName};
};

exports.getTemplate = function (data, emit) {
    var profD = system.pathFor('ProfD'),
        // ec = file.join(profD, 'executable-creator'),
        template = file.join(profD, 'executable-creator', data.fileName + '.html'),
        rs = file.open(template, 'r');
    return {
        content: rs.read(),
        fileName: data.fileName
    };
};

exports.getTemplates = function (emit) {
    var profD = system.pathFor('ProfD'),
        ec = file.join(profD, 'executable-creator');
    if (!file.exists(ec)) {
        file.mkpath(ec);
    }
    return file.list(ec).filter(function (files) {
        return files.match(/\.html$/);
    }).map(function (f) {
        return f.replace(/\.html$/, '');
    });
};

/**
* Call the command line with the supplied arguments
* @param {object} Object with properties "args" and "observe"
* @example ['-P', '-no-remote']
*/
exports.cmd = function (data) {
    var cmdDir = getHardFile('SysD');
    cmdDir.append('cmd.exe');
    createProcess(cmdDir, data.args, data);
};


function buildSED (userSED) {
    // Possible values from http://www.mdgx.com/INF_web/cdfinfo.htm
    var defaultSED = [
        {Version: { // Does order within a section matter (or between sections)?
            Class:'IEXPRESS',
            SEDVersion: '3'
        }},
        {Options: {
            PackagePurpose: 'InstallApp', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            // ExtractOnly: 0|1
            ShowInstallProgramWindow: '0', // 0/1/2/3
            HideExtractAnimation: '1', // 1/0
            // ShowRebootUI: 1/0
            UseLongFileName: '0', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            // "PackageInstallSpace(KB)": xxxx
            InsideCompressed: '0', // 1
            // CompressionType: [ MSZIP | LZX | QUANTUM ]
            // Quantum: 7
            // KeepCabinet: 1/0
            CAB_FixedSize: '0', // 0
            CAB_ResvCodeSigning: '0', // 6144
            RebootMode: 'N', // 0/1/2 or A/I/N/S
            InstallPrompt: '%InstallPrompt%', // '%InstallPrompt%'
            DisplayLicense: '%DisplayLicense%', // '%DisplayLicense%'
            FinishMessage: '%FinishMessage%', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            TargetName: '%TargetName%', // '%TargetName%'
            FriendlyName: '%FriendlyName%', // '%FriendlyName%'
            AppLaunched: '%AppLaunched%', // "#Setup"
            // EndMessage: '%FinishMessage%'
            PostInstallCmd: '%PostInstallCmd%', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            AdminQuietInstCmd: '%AdminQuietInstCmd%', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            UserQuietInstCmd: '%UserQuietInstCmd%', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            SourceFiles: 'SourceFiles'
            // Strings="Strings"
        }},
        {Strings: {
            InstallPrompt: '', // '"Do you wish to install this Sample App?"'
            DisplayLicense: '', // 'License.txt'
            FinishMessage: '', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            // EndMessage: 'Thank you installing Sample App',
            // PackageName: 'Sample.exe',
            // TargetName: 'C:\\Users\\Brett\\Desktop\\test1.exe',
            // FriendlyName: 'WebAppFind1',
            // AppLaunched: 'cmd /c test1.bat', // "Setup.exe" or "#Setup"
            PostInstallCmd: '<None>', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            AdminQuietInstCmd: '', // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            UserQuietInstCmd: '' // Not present at http://www.mdgx.com/INF_web/cdfinfo.htm
            // FILE0: 'test1.bat'
        }},
        {SourceFiles: { // Path to source files. UNC or C:\<sourcedir>
            // SourceFiles0: 'C:\\Users\\Brett\\Desktop\\'
        }},
        {SourceFiles0: {
            '%FILE0%': ''
        }}
    ];
    function getSectionName (sectionObject) {
        return Object.keys(sectionObject)[0];
    }
    function findSection (userSectionName) {
        return function (sectionObject) {
            return getSectionName(sectionObject) === userSectionName;
        };
    }
    function addUserSections (userSectionObject) {
        var subsec, subsecs,
            userSectionName = getSectionName(userSectionObject),
            defaultSEDIdx = defaultSED.findIndex(findSection(userSectionName));
        if (defaultSEDIdx !== -1) {
            subsecs = userSectionObject[userSectionName];
            for (subsec in subsecs) {
                if (subsecs.hasOwnProperty(subsec)) {
                    defaultSED[defaultSEDIdx][userSectionName][subsec] = subsecs[subsec];
                }
            }
        }
        else {
            defaultSED.push(userSectionObject);
        }
    }
    function sedSerializer (str, sectionObject) {
        var sub,
            sectionName = getSectionName(sectionObject),
            subObj = sectionObject[sectionName],
            ret = str + '[' + sectionName + ']\n';
        for (sub in subObj) {
            if (subObj[sub] !== undefined) { // Give chance for user to delete a default
                ret += sub + '=' + subObj[sub] + '\n';
            }
        }
        return ret;
    }
    function serializeSED (sed) {
        return sed.reduce(sedSerializer, '');
    }
    userSED.forEach(addUserSections);
    return serializeSED(defaultSED);
}

exports.saveExecutables = function (data, emit) {
    var sed,
        templateName = data.templateName,
        exeNames = data.exeNames,
        dirPaths = data.dirPaths;
    function quote (item) {
        return '"' + item.replace(/"/g, '\\"') + '"';
    }
    exeNames.forEach(function (exeName, i) {
        var sed,
            baseName = exeName.replace(/\.exe$/, ''),
            batName = baseName + '.bat',
            dirPath = dirPaths[i].replace(/\\$/, '') + '\\';
        exeName = baseName + '.exe';
        sed = buildSED([
            {Strings: {
                TargetName: quote(dirPath + exeName),
                FriendlyName: quote(templateName),
                AppLaunched:
                    'cmd /c ' + // For XP, apparently shouldn't have (or at least don't need) this
                    quote(batName), // "Setup.exe" or "#Setup"
                FILE0: quote(batName)
            }},
            {SourceFiles: { // Path to source files. UNC or C:\<sourcedir>
                SourceFiles0: quote(dirPath)
            }}
        ]);
        l(sed);
    });
};


// THE REMAINING WAS COPIED FROM filebrowser-enhanced fileBrowserResponses.js (RETURN ALL MODIFICATIONS THERE)
function getFile (path) {
    var localFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    localFile.initWithPath(path);
    return localFile;
}

function picker (dirPath, emit, selectFolder) {
    // Note: could use https://developer.mozilla.org/en-US/docs/Extensions/Using_the_DOM_File_API_in_chrome_code
    //         but this appears to be less feature rich
    var dir,
        windowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
        nsIFilePicker = Ci.nsIFilePicker,
        fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);

    if (!selectFolder) {
        fp.defaultExtension = 'ico';
        //fp.appendFilter('ICO (.ico)', '*.ico');
        //fp.appendFilter('SVG (.svg)', '*.svg');
        //fp.appendFilter('Icon file', '*.ico; *.svg');
        fp.appendFilter('Icon file', '*.ico');
    }

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
    fp.init(
        windowMediator.getMostRecentWindow(null),
        selectFolder ? "Pick a folder for the executable" : "Pick an icon file",
        selectFolder ? nsIFilePicker.modeGetFolder : nsIFilePicker.modeOpen
    );

    fp.open({done: function (rv) {
        var file, path,
            res = '';
        if (rv === nsIFilePicker.returnOK || rv === nsIFilePicker.returnReplace) {
            file = fp.file;
            path = file.path;
            res = path;
        }
        if (selectFolder) {
            emit('dirPickResult', {path: res, i: selectFolder});
        }
        else {
            emit('filePickResult', res);
        }
        return false;
    }});
    /*
    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
        var file = fp.file;
        var path = fp.file.path;

    }*/
}

exports.dirPick = function (data, emit) {
    picker(data.dirPath, emit, data.i);
};

exports.filePick = picker;


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
