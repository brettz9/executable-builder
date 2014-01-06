


/*  
    executableBuilder = require('sdk/panel').Panel({
        width: 215,
        height: 160,
        contentScriptWhen: 'ready',
        contentScriptFile: data.url('execute.js'),
        contentURL: data.url('index.html')
    });
*/  

/*
    executableBuilder.port.on('getAutocompleteValues', function (data) {
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

        executableBuilder.port.emit('receiveAutocompleteValues', {
            listID: data.listID,
            optValues: optValues,
            userVal: userVal // Just for debugging on the other side
        });
    });
*/
    
/*
    require('sdk/widget').Widget({
        id: 'execute-btn',
        label: "Execute",
        contentURL: data.url('execute.svg'),
        panel: executableBuilder
    });
*/