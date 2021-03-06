/*globals exports, require */
// This is an active module of the Executable Builder Add-on
/*
THIS ADD-ON IS NOT YET READY FOR USE
*/

exports.main = function() {'use strict';
    function l (msg) {
        console.log(msg);
    }
    
    var data = require('sdk/self').data,
        _ = require('sdk/l10n').get,
        // file = require('sdk/io/file'),
        tabs = require('sdk/tabs'),
        // pageMod = require('sdk/page-mod'),
        relayResponse = require('./relayResponse'),
        executableResponses = require('./executableResponses');

    function openExecBuilderDialog () {
        tabs.open(data.url('index.html'));
        tabs.activeTab.on('ready', function (tab) {
            var worker = tab.attach({
                contentScriptFile: [data.url('jml.js'), data.url('XMLSerializer.js'), data.url('executable.js')],
                contentScriptOptions: { // any JSON-serializable key/values
                    folderImage: data.url('Yellow_folder_icon_open.png'),
                    ffIcon: data.url('firefox32.ico')
                }
            });
            relayResponse.bind(executableResponses)()(worker);
        });
    }

    require('./componentRegistrations')({
        openExecBuilderDialog: openExecBuilderDialog
    });

    require('sdk/widget').Widget({
        id: 'executable-btn',
        label: _("Executable"),
        contentURL: data.url('executable.svg'), // Todo: i18n-ize this or abstractify it?
        onClick: openExecBuilderDialog
    });
};
