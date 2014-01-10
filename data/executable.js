/*globals self, jml */
/*jslint todo:true*/
/*
Info:
1. On building profile dir. for executables, see http://stackoverflow.com/questions/18711327/programmatically-create-firefox-profiles
and possibly https://developer.mozilla.org/en-US/docs/Profile_Manager
1. If need to convert PNG to ICO
    var imgTools = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools);
    imgTools.encodeImage( , 'image/x-icon');
1. With WebAppFind, tried -remote, -silent; didn't try -no-remote, -tray

Todos:
1. Split into generic and specific sections (so will allow building of executables regardless of whether used for WebAppFind or not):

1. Reported error (as with tooltip titles): autocomplete won't show up inside of panels: https://bugzilla.mozilla.org/show_bug.cgi?id=918600
1. Build command line output including path flag
1. Search for other "todo" instances below
*/
/*jslint sloppy: true*/
(function () {
    function l (msg) {
        console.log(msg);
    }

    var body = document.querySelector('body'),
        ct = 0, ctr = 0,
        k = 0,
        profiles = [],
        paths = {},
        on = self.port.on,
        emit = self.port.emit,
        options = self.options;

    if (body && body.innerHTML.match(/\S/)) { // Don't add page (or its listeners) more than once
        // l(body.innerHTML);
        return;
    }

    function $ (sel) {
        return document.querySelector(sel);
    }
    function getHardPath (dir) {
        return paths[dir];
    }
    function createRevealButton (sel) {
        return ['input', {
            type: 'button',
            style: 'border: none; margin-left: 5px; background-color: transparent; width: 25px; background-repeat: no-repeat; '+
                    'background-size: 20px 20px; '+
                    'background-image: url("' + options.folderImage + '");',
            'class': 'revealButton',
            dataset: {sel: sel}
        }];
    }
    function createFileExtensionControls () {
        // Todo: File extensions for association (also ask "default?"): .....   (checkbox on whether to make as default (or only use with open with...))
        var i = ctr++;
        return ['div', {id: 'fileExtensionInfoHolder' + i}, [
            ['label', [
                'File extension to associate with this executable: ',
                ['input', {size: 10}]
            ]],
            ' \u00a0 ',
            ['label', [
                'Make the default execution handler for files with this extension?',
                ['input', {type: 'checkbox'}]
            ]],
            ['button', {dataset: {fileExtensionID: i, type: 'add'}}, [
                '+'
            ]],
            ['button', {dataset: {fileExtensionID: i, type: 'remove'}}, [
                '-'
            ]]
        ]];
    }

    /**
    * Creates paths where one can save the executable, e.g., desktop,
    * start-up, start menu, task bar, quick launch (with click to reveal
    * any of these folders once added); creates an input type which
    * does auto-complete for paths.
    */
    function createPathInput() {
        var i = ct++;
        return [
            'div', {id: 'pathBoxHolder' + i}, [
                ['label', {'for': 'pathBox' + i}, [
                    'Directory where the executable will be saved: '
                ]],
                // Todo: Optionally pin apps programmatically to task bar (when task bar path is chosen)
                ['input', {
                    type: 'text', id: 'pathBox' + i, list: 'datalist', autocomplete: 'off',
                    size: 100, value: '', dataset: {pathBoxInput: i}
                }],
                ['button', {dataset: {dirPick: i}}, [
                    'Browse\u2026'
                ]],
                ' or ',
                ['select', {dataset: {pathBoxSelect: i}}, [
                    // Todo: Change for other OSes
                    // https://developer.mozilla.org/en-US/docs/Code_snippets/File_I_O#Getting_files_in_special_directories
                    // http://mxr.mozilla.org/mozilla-central/source/xpcom/io/nsAppDirectoryServiceDefs.h
                    // http://mxr.mozilla.org/mozilla-central/source/xpcom/io/nsDirectoryServiceDefs.h
                    ['option', {value: ''}, ['(Or choose a location)']],
                    ['option', {value: getHardPath('Desk')}, ['Desktop']],
                    ['option', {value: getHardPath('Strt')}, ['Start-up']],
                    ['option', {value: getHardPath('Progs')}, ['Start menu']],
                    ['option', {value: getHardPath('AppData') + '\\Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar'},
                        ['Task bar']
                    ]
                ]],
                createRevealButton('#pathBox' + i),
                ['button', {dataset: {pathInputID: i, type: 'add'}}, [
                    '+'
                ]],
                ['button', {dataset: {pathInputID: i, type: 'remove'}}, [
                    '-'
                ]]
            ]
        ];
    }

    function getProfiles() {
        return profiles.reduce(function (opts, optVal) {
            opts.push(['option', [optVal]]);
            return opts;
        }, []);
    }

    // BEGIN EVENT ATTACHMENT
    
    on('openOrCreateICOResponse', function (data) {
        alert(data);
    });

    // COPIED FROM filebrowser-enhanced directoryMod.js (RETURN ALL MODIFICATIONS THERE)
    on('autocompleteValuesResponse', function (data) {
        var datalist = document.getElementById(data.listID);
        while (datalist.firstChild) {
            datalist.removeChild(datalist.firstChild);
        }
        data.optValues.forEach(function (optValue) {
            var option = jml('option', {
                // text: optValue,
                value: optValue
            });
            datalist.appendChild(option);
        });
    });

    on('autocompleteURLHistoryResponse', function (data) {
        var datalist = document.getElementById(data.listID);
        while (datalist.firstChild) {
            datalist.removeChild(datalist.firstChild);
        }
        data.optValues.forEach(function (optValue, i) {
            var option = jml('option', {
                // text: optValue,
                value: optValue,
                // Works as a regular option, but not a datalist option (including if option text is provided)
                style: 'background: no-repeat url(' + data.optIcons[i] + ');'
            });
            datalist.appendChild(option);
        });
    });

    on('filePickResult', function (path) {
        if (path) {
            $('#iconPath').value = path;
        }
    });
    
    on('dirPickResult', function (data) {
        if (data.path) {
            $('#pathBox' + data.i).value = data.path;
        }
    });

    on('getHardPathsResponse', function (data) {
        paths = data;
        // Adapted from filebrowser-enhanced directoryMod.js (RETURN ALL RELEVANT MODIFICATIONS THERE)
        on('getProfilesResponse', function (profileData) {
            profiles = profileData;
            /*while (body.firstChild) {
                body.removeChild(body.firstChild);
            }*/
            window.addEventListener('input', function (e) {
                var id = e.target.id,
                    val = e.target.value,
                    dataset = e.target.dataset,
                    pathBoxInput = dataset.pathBoxInput;

                if (!val) {
                    return;
                }
                if (pathBoxInput) {
                    emit('autocompleteValues', {
                        value: val,
                        listID: e.target.getAttribute('list'),
                        dirOnly: true
                    });
                }
                else if (id === 'urlBox') {
                    /*
                    if (val.length < 9) { // http://.
                        return;
                    }
                    */
                    emit('autocompleteURLHistory', {
                        value: val,
                        listID: e.target.getAttribute('list')
                    });
                }
                else if (id === 'iconPath') {
                    emit('autocompleteValues', {
                        value: val,
                        listID: e.target.getAttribute('list')
                    });
                }
            });

            window.addEventListener('click', function (e) {
                var holderID, parentHolderSel, input, nextSibling, selVal,
                    val = e.target.value,
                    dataset = e.target.dataset,
                    id = e.target.id,
                    sel = dataset.sel,
                    type = dataset.type,
                    dirPick = dataset.dirPick,
                    fileExtensionID = dataset.fileExtensionID,
                    pathBoxSelect = dataset.pathBoxSelect || e.target.parentNode.dataset.pathBoxSelect,
                    pathInputID = dataset.pathInputID;

                if (dirPick) {
                    // Value can be blank (if user just wishes to browse)
                    emit('dirPick', {dirPath: $('#pathBox' + dirPick).value, i: dirPick});
                }
                else if (pathInputID) {
                    holderID = 'pathBoxHolder' + pathInputID;
                    parentHolderSel = '#pathHolder';
                    if (type === 'add') {
                        input = jml.apply(null, createPathInput());
                        nextSibling = $('#' + holderID).nextElementSibling;
                        if (nextSibling) {
                            $(parentHolderSel).insertBefore(input, nextSibling);
                        }
                        else {
                            $(parentHolderSel).appendChild(input);
                        }
                    }
                    else if (type === 'remove') {
                        if ($(parentHolderSel).children.length <= 3) { // Legend, datalist, and a single path control
                            return;
                        }
                        $('#' + holderID).parentNode.removeChild($('#' + holderID));
                    }
                }
                else if (pathBoxSelect) {
                    if (!val) {
                        return;
                    }
                    $('#pathBox' + pathBoxSelect).value = val;
                }
                else if (fileExtensionID) {
                    holderID = 'fileExtensionInfoHolder' + fileExtensionID;
                    parentHolderSel = '#fileExtensionHolder';
                    if (type === 'add') {
                        input = jml.apply(null, createFileExtensionControls());
                        nextSibling = $('#' + holderID).nextElementSibling;
                        if (nextSibling) {
                            $(parentHolderSel).insertBefore(input, nextSibling);
                        }
                        else {
                            $(parentHolderSel).appendChild(input);
                        }
                    }
                    else if (type === 'remove') {
                        if ($(parentHolderSel).children.length <= 2) { // Legend and a single path control
                            return;
                        }
                        $('#' + holderID).parentNode.removeChild($('#' + holderID));
                    }
                }
                else if (sel) {
                    selVal = $(sel).value;
                    if (selVal.match(/^resource:/)) {
                        selVal = selVal.substring(0, selVal.lastIndexOf('/') + 1);
                        window.open(selVal, 'resource' + (k++));
                        return;
                    }
                    if (selVal) {
                        emit('reveal', selVal);
                    }
                }
                else {
                    if (e.target.nodeName.toLowerCase() === 'option') {
                        switch (e.target.parentNode.id) {
                            case 'iconPathSelect': case 'profileNameSelect':
                                id = e.target.parentNode.id;
                                break;
                            default:
                                return;
                        }
                    }
                    switch (id) {
                        case 'iconPathSelect':
                            if (!val) {
                                return;
                            }
                            $('#iconPath').value = val;
                            break;
                        case 'filePick':
                            // Value can be blank (if user just wishes to browse)
                            emit('filePick', $('#iconPath').value);
                            break;
                        case 'openOrCreateICO':
                            emit('openOrCreateICO');
                            break;
                        case 'profileNameSelect':
                            $('#profileName').value = val;
                            break;
                        case 'manageProfiles':
                            emit('manageProfiles');
                            break;
                        case 'createExecutable':
                            alert('sending');
                            break;
                    }
                }
            });
            document.body.appendChild(jml('div',
                [
                    ['select', [
                        ['option', ['(Choose a template with which to populate this form)']]
                    ]],
                    ['label', [
                        'Remember these settings as a template? ',
                        ['select', [
                            ['option', ['yes']],
                            ['option', ['no']]
                        ]]
                    ]],
                    ['label', [
                        'Template name',
                        ['input']
                    ]],
                    ['button', ['Clone this template']],
                    ['button', ['Delete this template']],
                    ['br'],
                    ['label', [
                        'Executable name: ',
                        ['input']
                    ]],
                    ['div', [
                        ['label', {'for': 'iconPath'}, [
                            'Icon path for the executable (optional): '
                        ]],
                        ['select', {id: 'iconPathSelect'}, [
                            // Todo: Change for other OSes
                            // https://developer.mozilla.org/en-US/docs/Code_snippets/File_I_O#Getting_files_in_special_directories
                            // http://mxr.mozilla.org/mozilla-central/source/xpcom/io/nsAppDirectoryServiceDefs.h
                            // http://mxr.mozilla.org/mozilla-central/source/xpcom/io/nsDirectoryServiceDefs.h
                            ['option', {value: ''}, ['(Choose a location)']],
                            ['option', {value: getHardPath('Desk')}, ['Desktop']],
                            ['option', {value: getHardPath('Pict')}, ['Pictures']],
                            ['option', {value: options.ffIcon}, ['Firefox icon']]
                        ]],
                        // Todo: (optionally?) use privileged, path-aware file-picker to allow graphical browsing of paths
                        ['input', {
                            type: 'text', id: 'iconPath', list: 'datalist', autocomplete: 'off',
                            size: 70, value: ''
                        }],
                        ['button', {id: 'filePick'}, [
                            'Browse\u2026'
                        ]],
                        createRevealButton('#iconPath'),
                        ' or ',
                        /*
                        Todo:
                        1. Icon (Use export-as-png in SVG Edit; need filetypes.json ICO
                        handler--allow testing by previewing as favicon)
                            1. (Paths where to read into a list of available
                            ico files, subject to a filetypes.json file in those
                            directories) (might utilize those paths already added for saving)
                            1. If filetypes.json has an icons section, use that by default instead?
                        */
                        ['button', {id: 'openOrCreateICO', title: 'If the ICO file at the supplied path does not exist, an empty file will be created which can then be edited. Be sure to save your changes to the ICO file when done.'}, [
                            'Create/Edit ICO file'
                        ]]
                    ]],
                    ['fieldset', {id: 'fileExtensionHolder'}, [
                        ['legend', ['File extension association (optional)']],
                        createFileExtensionControls()
                    ]],
                    ['div', [
                        ['label', [
                            ['input', {type: 'radio', name: 'executableType'}],
                            'Open with WebAppFind?'
                        ]],
                        ['label', [
                            ['input', {type: 'radio', name: 'executableType'}],
                            'Open a hard-coded URL only?'
                        ]],
                        ['label', [
                            ['input', {type: 'radio', name: 'executableType'}],
                            'Don\'t open any URL'
                        ]]
                    ]],
                    /*
                    Todo:
                    1. Separate executables like Prism?: hard-code a profile (create one programmatically for user in
                    an install script?) firefox.exe -no-remote -P executable http://example.com
                    1. Whether to auto-create a new profile just for this combination of options and a
                    -no-remote call to allow executable-like behavior (creates a separate icon instance
                    in the task bar though not a separate icon unless, again, the icon is attached to a short cut)
                    */
                    ['div', [
                        ['label', {'for': 'profileName'}, [
                            'Profile to associate with this executable (optional): '
                        ]],
                        ['select', {id: 'profileNameSelect'}, getProfiles()],
                        ['input', {id: 'profileName'}],
                        ['button', {id: 'manageProfiles'}, [
                            'Manage profiles'
                        ]]
                    ]],
                    ['label', [
                        'Method: ',
                        ['select', [
                            ['option', {value: 'view'}, ['View']],
                            ['option', {value: 'binaryview'}, ['Binary view']],
                            ['option', {value: 'edit'}, ['Edit']],
                            ['option', {value: 'binaryedit'}, ['Binary edit']]
                        ]]
                    ]],
                    ['br'],
                    // Todo:
                    ['label', ['WebAppFind preference overrides: ']],
                    ['br'],
                    // Creates an autocomplete for URLs
                    // Todo:
                    // 1. An optional, hard-coded web app URL (to circumvent the normal detection procedures and always open with a given web app)
                    ['label', [
                        'Hard-coded web app URI (optional): ',
                        ['input', {
                            type: 'url', id: 'urlBox', list: 'urlDatalist', autocomplete: 'off',
                            size: 100, value: ''
                        }],
                        ['datalist', {id: 'urlDatalist'}]
                    ]],
                    ['br'],
                    ['br'],
                    // Todo: implement
                    ['label', [
                        'Behavior upon opening of web app/URL: ',
                        ['select', [
                            ['option', ['New tab']],
                            ['option', ['New window']],
                            ['option', ['Hidden window']]
                        ]]
                    ]],
                    ['br'],
                    //  Todo: 1. Whether web app to open by default in full-screen mode (could just let web app and user handle, but user may prefer to bake it in to a particular executable only)
                    ['label', [
                        'Open web app/URL by default in full-screen mode?',
                        ['input', {type:'checkbox'}]
                    ]],
                    ['br'],
                    //  Todo: 1. Batch file building section; Raw textarea (OR (only?) when webappfind is also installed...)
                    ['label', [
                        'Batch file commands in addition to any other options set above (optional): ',
                        ['br'],
                        ['textarea']
                    ]],
                    ['br'],
                    //  Todo: 1. Strings
                    ['label', [
                        'Hard-coded string to pass as content to the WebAppFind web app (optional): ',
                        ['br'],
                        ['textarea']
                    ]],
                    ['br'],
                    //  Todo: 1. JavaScript (implement with CodeMirror or option to load JS file (itself invocable with WebAppFind) instead)
                    ['label', [
                        'Hard-coded string to pass as evalable JavaScript to the WebAppFind web app (optional): ',
                        ['br'],
                        ['textarea']
                    ]],
                    ['br'],
                    //  Todo: 1. Arguments
                    ['label', [
                        'Command line arguments in addition to any other options set above (optional): ',
                        // ['br'],
                        ['input', {size: 100}]
                    ]],
                    ['fieldset', {id: 'pathHolder'}, [
                        ['legend', ['Executable directory(ies)']],
                        ['datalist', {id: 'datalist'}],
                        createPathInput()
                    ]],
                    ['br'],
                    ['button', {id: 'createExecutable'}, [
                       'Create executable(s) (and a profile if specified above and not yet existing)'
                    ]]
                ],
                null
            ));
        });
        emit('getProfiles');
    });
    emit('getHardPaths');
}());
