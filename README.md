# executable-builder

***NOTE: This project is not yet functional!!***

Executable Builder is a browser add-on (currently Firefox only) which allows for the building of desktop executables (currently Windows only) which can launch URLs and which are associated with their own icons.

Executable Builder provides particular functionality for use with [WebAppFind](https://github.com/brettz9/webappfind) so that one can build, in a more customizable manner, executables which can pass a selected desktop file to a web application for viewing and optional editing. (Windows will find the executable if the user right-clicks "Open with..." over a given desktop file or if the user opts to select the executable as the default application handling for files of a given file extension.)

For an example of such WebAppFind behavior customization, Executable Builder might be used to build an executable which hard-codes a particular web app as the handler for the clicked-on file instead of relying on WebAppFind's behavior of checking for a protocol handler for the file's type (with the type determined by the file's extension or, if present, a filetypes.json file in the same directory as the file).

For any WebAppFind executable, one may choose the level of privilege by which the web app may act on the supplied file (currently: view, edit, viewbinary, or editbinary). One may customize how a new tab or window is created, over-ride preferences, or default the web app display of the opened file in full screen mode. Advanced users can include additional batch commands or Firefox command line parameters or pass a custom hard-coded string to the web app so that it may tweak its behavior accordingly.

A particular benefit of the builder is to allow for the creation and association of an
icon with the executable which in turn allows for display of the icon in Windows
Explorer, the start menu, the task bar, and in IE, in its location bar, tabs, favorites,
and on the list of "Your most popular sites" or "Frequent". If one opts to tie this executable
to a separate Firefox profile, this icon will show up in the task bar independent from
other Firefox windows. (If WebAppFind can be adapte to support XULRunner instead of Firefox,
one might be able to get an even more light weight "executable" environment.)

The executables built by Executable Builder are actually just simple files working with the command line which pass some additional instructions to it. In the case of WebAppFind executables, these will be passing command line instructions to Firefox.

Used in conjunction with Firefox profiles, one will get the benefits of former projects like Mozilla Prism/Chromeless/WebRunner which provided web applications as executables with their
ability to show up independently in the task bar, but with the added optional ability of granting
privileged features to web applications (such as one may get if using Executable Builder/WebAppFind with an AsYouWish application) and with the ability to utilize add-ons, even
a separate set of add-ons for each executable (and without the problem that all of these other mentioned executable projects are all now apparently defunct).

# Potential use with AsYouWish

If one launches an AsYouWish app, one can utilize awareness of the supplied desktop path and contents along with escalated privileges (see [WebAppFind](https://github.com/brettz9/webappfind) and [AsYouWish](https://github.com/brettz9/asyouwish/) for more, including the possibility for console-less batch-like operations).

# Todos

1. IMPORTANT: Upgrade my quick-and-dirty, ironically non-concern-separated data files approach in favor of some kind of data-only form serialization (in case fields change), e.g., https://github.com/macek/jquery-serialize-object
1. IMPORTANT: See execute.js for specific todos already under-way
1. Ask Mozilla re: -new-instance on Windows (if it is supposed to create a new separate icon) and whether can add as feature, including for the sake of this add-on
1. Implement command line handler to support auto-opening exec dialog on start so that until web apps support file writing to arbitrary locations (WebActivity or new addition to WebAppFind?), one can at least treat ExecutableBuilder as itself an executable (and be able to bake it into an executable with its own icon, profile, etc.)
1. Add AsYouWish (and ExecutableBuilder and WebAppFind) optionally to profile folder (or global?) so apps can have
privs from any profile! (Ought to be desirable to have easy
way to share back from one profile to another though in case
people start building independent executables and then decide
want to share again so as to allow independent executable)

# Other dependent read-me todos:

1. Remove from WebAppFind/filebrowser-enhanced todos any items completed in process of this add-on
1. Deprecate executables in WebAppFind when batch approach done.
1. Comparing to exes? adding to favorites, etc.? (any other unimplemented left to replicate and add as a todo?)
1. Open with batch ok for "Open with" but a problem with task bar (without tricks); any
other reasons for exe over batch? try drag&drop onto cmd alias to batch (another advantage
of executables) and describe usage with ExecutableBuilder-created batch files. Can
use drag-onto-batch approach to pass in file path to Firefox with protocol
(e.g., for creating and validating but especially the file-path-specific
view and editing): see http://stackoverflow.com/questions/6852833/running-a-batch-script-by-right-clicking-any-file
and cf. to drag-and-drop into browser; allow drag-and-drop of files onto add-on icon
for processing similar to C++-based right-click? Drag files onto batch icon as another option?

# Planned future todos

1. Support other OSes

# Possible todos

1. Ability to manage previously added items (including if added to extended filebrowser) so that one knows which file types have been associated through this add-on
1. Include ability to embed configuration information if WebAppFind command line starts to support
    more configuration options (e.g., full screen mode, or stage of type-detection algorithm to require or at which to begin).
1. Build executables which could work in other browsers (if WebAppFind can be ported).
1. Try installing WebAppFind and ExecutableBuilder extensions globally so each profile (or multiple profiles--e.g., one
profile for each WebAppFind method and/or different environments--e.g., multiple tabs but
only for HTML reading) can access it? (since --install-global-extension is removed from
FF now, should apparently use this instead: https://developer.mozilla.org/en-US/docs/Installing_extensions )
1. If WebAppFind implements eval()-like behavior (see its todos for more on this possibility),
create batch files (also for Linux/Mac) which pass evalable JS files (or embed JS strings) as
a command line argument which will be sent to FF for (privileged) evaluation along with
the optional WebAppFind files on which they are executed.
1. Ability to pass in string of HTML/JS to the add-on command line to
execute that instead of a specific file (so that an exe could include
the launching app and processing within one file)? (removing last?
advantage of exes beyond allowing file dropping/right-click usage
and own task bar icons? example: open a specific file, that gets sent
to a particular eval: protocol which listens for the content and then
passes it to a script that it dynamically loads
1. Get code review of C++ file (e.g., ShellExecuteEx vs. CallProcess and -remote; other bugs?) and
feedback on general approach, security concerns, etc. esp. if batch
won't work for needs
1. Ability to proposed WebAppFind handle multiple files on right-click (cycling through
arguments)? e.g., to open a group and then commit as a group (seems to be
no "open with option when done this way); pass in additional files for access
(e.g., to save to a config file, to build an icon file in a predictable
location along with the other file data, etc.)
1. Conditional logic to check if -no-remote (preferred is open) and if not, open a specific or vice versa? (?)
1. Demo todos
    1. Demo dogfooding reading/editing our special file type once separation-of-concerns/serialize to-do is complete (so it could be handled by other apps as with any other WebAppFind file) though would need AYW for privileges (as also could do with SVG icons when done)
