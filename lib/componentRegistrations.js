// componentRegistration.js - executable-builder's module
// author: brettz9
/*globals require, module */

(function () { 'use strict';

var registerComponent = require('./commandLineHandlerComponent');

function l (str) {
    console.log(str);
}

module.exports = function (listener) {
    var commandLineName = 'execbuild',
        openCommandLineName = 'execbuildopen';
    // Todo: One might create some Executable Builder-specific batch files which call Firefox with
    //              the necessary arguments to avoid the need for ugly namespacing like "execbuildopen"
    // Todo: Also build a batch file which can be invoked with a document file OR URL so that if in the
    //            task bar, a file or URL might be droppable upon it (if this is possible to do)

    registerComponent({
        name: openCommandLineName,
        help: '  -' + openCommandLineName + "               Open my executable builder\n", // Not apparently used
        handler: function clh_handle(cmdLine) {
            // Todo: Support additional command line arguments here to open up the executable builder dialog from the desktop with initial values such as executable or icon path, desktop/remote file or web app URL, etc.; allow command the "Browse" dialog for desktop file to be opened via command line or immediately to the document URL autocomplete field (so that Executable Builder can easily add an add-on bar/toolbar button to go immediately to picking a file or URL)
            // Todo: Provide sample batch file or exe; including ones which supply arguments based on the current directory's path; the path could determine the ultimate path of the to-be-created executable (or icon), a hard-coded desktop (or remote) file or web app URL to open
            if (cmdLine.handleFlag(openCommandLineName, false)) {
                listener.openExecBuilderDialog();
            }
        }
   });
   
    registerComponent({
        name: commandLineName,
        help: '  -' + commandLineName + "               Build my executable\n", // Not apparently used
        handler: function clh_handle(cmdLine) {
            var path;
            cmdLine.preventDefault = true; // Todo: Do we want or need this?
            try {
                path = cmdLine.handleFlagWithParam(commandLineName, false);
            }
            catch (e) {
                
                return;
            }
            // Todo: Expose full API for building executables to the command line

            if (cmdLine.handleFlag(commandLineName, false)) {
                l('A valid ID must be provided to ' + commandLineName);
                return;
              // openWindow(CHROME_URI, null);
              // cmdLine.preventDefault = true;
            }
        }
   });

};

}());
