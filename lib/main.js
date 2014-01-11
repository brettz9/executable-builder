/*globals exports, require */
// This is an active module of the Executable Builder Add-on
/*
THIS ADD-ON IS NOT YET READY FOR USE (I'm linking other sites here as a place-holder)

See notes.js for plans and todos for the add-on

*/

exports.main = function() {'use strict';
    function l (msg) {
        console.log(msg);
    }
    
    var data = require('sdk/self').data,
        // file = require('sdk/io/file'),
        tabs = require('sdk/tabs'),
        pageMod = require('sdk/page-mod'),
        relayResponse = require('./relayResponse'),
        executableResponses = require('./executableResponses');

    require('sdk/widget').Widget({
        id: 'executable-btn',
        label: "Executable",
        contentURL: data.url('executable.svg'),
        onClick: function () {
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
    });
};
