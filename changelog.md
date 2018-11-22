# Simple Music Player - CHANGELOG

## **Version 0.5**

### Version 0.5.0 - The Bug-Fixing Build:
Version 5.0 was a step up from the latest version of Version 4 and is mostly comprised of bug fixes and code cleanups.

#### Version 0.5.00
1. Main ``script.js`` JavaScript reduced in complexity
	- ~1800+ lines => 1530 lines
	- Unused functions and code removed
	- All similar functions reduced into single multi-functioning functions
2. PHP code improvements all around
	- Line shortenings in almost every PHP-related piece of code
	- Replacement of double quotes (") to single quotes (') for faster processing
	- ``if`` statements reduced in complexity and simplified - far fewer and made shortened
3. Mobile version of website updated to accommodate the latest changes made in Version 4
4. Bug fixes associated with JavaScript
	- Editor now displays proper artwork associated with piece of audio when changing art of an audio file
	- Art assets such as loop buttons and shuffle buttons now alter color properly based on whether if player is playing audio or video
	- Player in general no longer lags under long stretches of time due to memory leakages being fixed

### Version 0.5.1 - The SQLite Build:
Version 5.1 improves code and load time significantly due to moving to an SQLite database - requests now no longer require MySQL servers! Anybody who can run a PHP server with SQLite installed now can utilize the player.

#### Version 0.5.10
1. Conversion from MySQL to SQLite
	- Load time significantly improved over MySQL runtime
	- Player can now run on any server with only PHP and SQLite installed (which comes default with most Apache servers with PHP)
	- SQLite database automatically created alongside other necessary folders upon initialization of Player for the first time on a browser
2. Bug fixes
	- Player no longer freezes when editing a piece of media that is currently being played concurrently
	- Editor no longer uploads multiple versions of the same file when changing the art of an audio file
	- Audio files no longer default to the "Unknown Album Artist" artwork when updating that audio file's artwork
	- Title and Artist no longer being empty by default when uploading video files
3. UI changes
	- Video player now sports a black background and no longer sports the album artwork
4. Version control improvements
	- When pushing to Github, personal databases and media files no longer are pushed either - significantly easier to update without uploading massive amounts of media
	- Redundant and unused files and directories deleted from Github pushing process + have been deleted from the Github Repo

#### Version 0.5.11
1. Modified mobile version for use with SQLite player

#### Version 0.5.12
1. Remove JavaScript redundant code & function-ized common code sequences, specifically code that creates new DOM elements
2. Modified Search function - searches now show suggestions below search bar instead of relying on clicking "Enter" to cycle through song items
3. Removed redundant script files no longer being used

### Version 0.5.2 - The Editor And Styling Build:
Version 5.2 replaces a lot of extraneous code by utilizing functions and erasing now-nonfunctional code. As a result, improvements have been made to the general stability of the build.
Major stylistic changes have also been made, with major changes made to the general look of the player, info editor, and list of songs.
Back-end adjustments mainly include altering how dynamic lyrics are managed by the editor, fixes to code that previewed new art when uploading new artwork, etc.
New functions have been added into the build, including the ability to save and toggle between simple lyrics and dynamic lyrics, being able to transfer simple lyrics into dynamic lyrics and vice versa, and being able to add new dynamic lyric segments before and after particular lyric segments that have already been added into the lyrics editor.

#### Version 0.5.20
1. Styling changes:
	- General changes:
		- Using classes, many repetitious elements have been commonly styled and therefore reduced in number of overwritten CSS code
		- Both left and write bars now feature transparent backgrounds - all wrapper elements now feature common CSS styling
	- Main player changes
		- Background image now visible but blurred behind all major elements on the screen
			- CSS blur filter produced a lot of lag, but now possible without lag due to finding out that using the ``<canvas>`` tag with a blur filter significantly reduces blur.
		- Controls and Title/Artist now take up less space on the screen in general
		- Autoscroll (on the music player) / Lyrics (on the video player) toggle now switched in appearance - dark when dynamic lyrics are deactivated, white when dynamic lyrics are activated
	- Left bar changes:
		- Completely transparent background - able to see blurred background through the left bar
		- Album artwork changed position - now side-by-side with Album title
		- Albums sport a slightly-transparent background rectangle to separate them from the blurred background
		-	Songs no longer have a completely white background, instead a transparent one to match the new background rectangle of their parent albums
		- YouTube Video Embed form now also sports a similar, slightly-transparent background rectangle to separate it from the blurred background.
		- Search bar now animates to open when hovered over - styling matches that of settings button
			- dropdown items also now share common CSS styling via classes
	- Editor changes
		- Navigation bar at top that toggles between main details, lyrics, and album artwork removed
		- All 3 sections (main details, lyrics, and album work) now all visible at the same time
		- Album artwork preview, upload button, and choice of existing artwork take up significantly less space in the editor
		- Toggle between dynamic and simple lyrics actual labels that change with interaction instead of just radio buttons
2. Back-End changes:
	- HTML-based:
		- Left bar now part of a flex container alongside the main player instead of a position-absoluted element - makes toggling the left bar easier with adjusting 1 class instead of multiple classes
		- Simplified some ID's and Classes names
		- Switched some inline-elements to ``flex`` due to concerns with compatibility. These include:
			- Left Bar: album headers that contain album artwork and album names
			- Main Player: controls divider and artwork/lyrics divider now flex items
		- Right (editor) side now sports fewer wrapper divs and elements
		- dropdown elements simplified into common structures, most notably for the left bar header items for settings and search bar
	- Database Alterations:
		- Added new ``dynamic_lyrics`` column - now able to save both simple lyrics within ``lyrics`` and dynamic lyrics within ``dynamic_lyrics``
	- PHP-based:
		- Replaced several double quotes ``""`` with single quotes ``''`` to improve efficiency
		- Removed remaining MySQL code that was commented out when converting to SQLite.
		- Adjusted queries to reflect database alterations mentioned above
		- Combined ``getAllArtForEdit.php`` and ``getAlbumArtForEdit.php`` into single file - beginning process of combining extraneous files

##### Version 0.5.21
1. Further Styling Changes
	- ALL elements originally on the RIGHT side of the screen (editor and album artwork editor) moved to the LEFT side, alongside the embed form and song list.
	- Normalized all form element styling using classes - all common form elements (i.e. text inputs, half segments, textareas, cancel buttons, submit buttons) now utilize common css using classes with exceptions made with ID's or unique combinations classes
		- simplifies amount of code for CSS significantly, though combinations of classes may make future CSS editing harder. Still preferred over using ID's for css personally.
	- CSS class common-ification implemented into song list on left side as well - using ``.container`` and ``.item`` classes to format song list items - can also be used iteratively using nesting
		- ex) an album contains a header with an image and 2 songs - the format would be like:
		````
		<div class='container album'>
			<div class='item album'>
				<img src='albumArtwork.jpg' alt='Album Name'>
				<h2>Album Name</h2>
			</div>
			<div class='item song'>...</div>
			<div class='item song'>...</div>
		</div>
		````
	- Left bar now rechanged back into ``position:absolute;`` due to problems associated with ``flex`` property added V5.20
		- ``flex`` property was causing left bar to shrink instead of remain at its ``flex-basis`` width if the song title in the main audio player was too long. For example:
		````
		|   (flex-basis:400px;)   | SHORT TITLE
		vs
		|	(flex-basis:400px;)|	LONG LONG LONG LONG TITLE
		````
		This problem among smaller grievances made me reconsider using the flex box, in favor of the ``position:absolute``
	- CSS animations attached to left bar toggling (ease-in)
	- Local videos now have their own icon, to differentiate between YouTube embeded videos, local videos, and songs (finally...)

2. JavaScript Changes:
	- Changes made in relation to moving both edit form and album artwork edit form to the left
	- originally separate objects of their own, the ``editForm`` and ``editAlbumArtForm`` objects moved into the ``globalPlayer`` parent object as ``editMediaForm`` and ``editAlbumArtForm`` respectively
	- variable names starting to replace underscore ``_`` with naming convention of ``lowercaseUppercase``

#### Version 0.5.3 - Back-End Update:
This new version mostly focuses on improvements made to the back-end of the music player - namely PHP-based improvements - as well as continuing alterations to the JavaScript and CSS coding of the website. Major PHP improvements include creating a runner file that is able to access all the other PHP files via ``require`` or ``require_once`` based on the ``GET`` inputs it gets from any AJAX calls made to it, the function-ization of error-reporting and success-reporting when printing back to the JavaScript, the implementation of ``Transactions`` to prevent adjustments to the SQLite database when an error has occurred, and the the ability to clean up artwork that is not being used anymore (due to possible duplications that could occur when uploading new artwork). JavaScript improvements include removal of extraneous code and small adjustments to global variables, functions, and objects. CSS updates include changing class organization such that further repetitious, extraneous code is removed. Updates will explain this in further detail.

##### Version 0.5.30
1. PHP Updates:
	- When making AJAX calls to interact with the SQLite database, all AJAX calls interact with a new ``simpleMusicPlayer.php`` that is able to interpret what needs to be done via a ``GET`` input received from the AJAX call and ``require_once`` or ``require`` the particular PHP file that can do the appropriate actions.
		- All other PHP files moved into ``requireOnce`` directory
		- all these files can still be called individually if needed
	- Error reporting and Success reporting now uses function-based programming
		- any errors that occur during the back-end process will execute the ``returnError()`` function, which returns the appropriate response with the necessary components that tell the AJAX callback if there was an error or not
			- Usual cases for errors to be sent back are:
				- errors with SQL queries
				- problems with file-based operations such as moving files, renaming files, etc.
			- When called, automatically executes a ``rollback`` on the database to undo any possible alterations prepared.
		- The same goes for the new ``returnSuccess()`` function, which does the same as ``returnError()`` but with the appropriate components that indicate that whichever process has been appropriately executed.
			- When called, executes as ``commit`` onto the database to allow for alterations to be made.
	- Artwork duplication can occur sometimes, but with a new ``cleanArtTable()`` function duplicate artwork that isn't actually being used is removed appropriately.
2. JavaScript Updates:
	- Small alterations to functions to improve efficacy
	- New ``ajaxCall()`` function deals with all ajax requests, error-reporting, and the like
		- now other functions won't have to take care of errors themselves, as all error-reporting is performed by ``ajaxCall()`` unless specified by a function to use a unique error reporting methodology.
3. CSS Updates:
	- In the attempt to remove further CSS extraneous code, class reorganization within the website has been performed
		- Now all left-side components (i.e. forms, song list) now follow an ``.container`` / ``.item`` structure where these classes can be nested within each other to prevent repeating the same code again and again.
			- This was done due to the realization that all forms in the Simple Music Player tend to follow a similar HTML hierarchy that also happened to correspond eerily similarly to the nesting behavior of the song list elements.
		- Only the player-based HTML elements did not receive any updates to their CSS - this is expected to change relatively soon, however.

##### Version 0.5.31
1. PHP updates:
	- Changed time format of dynamic lyric storage
		- **Originally:** Times for each dynamic lyric segment were stored as a MM:SS._ _ _ format. While this made it easier for the text to be readable when editing dynamic lyrics, it required a lot of micromanagement to convert them into pure millisecond format, which the audio and video players use.
		- **Now:** It is flipped - times are stored as pure milliseconds and are converted into the MM:SS._ _ _ format only when editing dynamic lyrics.
		- Functions that convert pure milliseconds to MM:SS format now allow for milliseconds to be added at the end, fully returning a string formatted as MM:SS._ _ _
		- Function that prints out dynamic lyrics into a player-friendly HTML format no longer need to convert from MM:SS._ _ _ format
	- Images from audio files with artwork embedded now extract artwork when adding media files into database initially
		- **Originally:** All artwork for art was not extracted from audio files when adding them into the database - they defaulted to what was essentially NULL
			- When the song was clicked for the first time, an AJAX call was made to extract the artwork from the audio file, then that artwork was saved into the database
			- this functionality barely even worked anyways... most of the time, the PHP script would return a base64 encoded string with no data
		- **Now:** Artwork can be properly extracted from the audio file at the moment of insertion into the database, thereby removing the need to extract artwork when songs are played for the first time
	- Fixed a bug where the PHP function "mkdir()" was accidentally typed as "makeDir()"
2. CSS updates:
	- When the audio player selects a lyric segment to highlight, the text increases in size and top/bottom padding instead of left-padding (which looked awkward since the lyrics were text-aligned to the center...)
3. JavaScript updates:
	- Artwork sourced with base64 encoding and not by an external image now show up properly
		- Previously, in order to prevent cached images to show erroneous artwork, a system was implemented where the 'src' attributes in images had an additional '?date=...'  string attached at the end of the source link
			- This works well for images that are linked to files... but not so well with images sourced with base64 encoded data
			- This meant that images sourced with base64 encoded data did not show up
		- Now, conditional statements now check for the image source type and adjust accordingly - images sourced by files have the additional data appended, while base64 images do not

##### Version 0.5.32
File Upload System Updated - now supports drag-and-drop
- Initially, uploading files into the SMP required placing files into a ``upload_directory`` folder present within the root directory of the SMP.
	- This was not user-friendly because this does not allow users to upload via some interface in the SMP directly.
- Now, a completely separate form has been added to allow users to upload their media directly into the SMP without interacting with root directories.
	- The file upload form allows for users to upload single files traditionally via an upload button, or to Drag-And-Drop multiple files into the form
	- The form itself does not interact with the PHP backend - JavaScript takes care of all file management via AJAX calls
	- PHP file ``addMedia.php`` altered to now match this upload format
- Interface changes as a result:
	- Dropdown button ``Add Media`` opens a new form with both a file upload button and a div that allows for files to be dragged in.
	- All files to be uploaded are presented as a list - the ``type`` of media (video or audio), the ``name`` of the file, and the ``file size`` of the file are all visible
	- The maximum file upload limit is 96 MB
		- possible with new ``.htaccess`` file that designates the maximum memory limit, post upload size, and maximum file upload size.
	- Files that are not audio or video files are automatically rejected
	- If any files must be deleted from the list prior to upload, deleting files is possible
	- When files are uploading, new ``loading.gif`` image indicates which files are being currently processed by the website
	- Any files that cannot be uploaded are kept in the form's file list and highlighted in red, alongside an ``alert()`` message popping up; successful files are removed from the form's file list.

##### Version 0.5.33
1. Dynamic Lyrics Bug-Fixing
	- Original bug: If a piece of media has dynamic lyrics, the player would highlight from the beginning through all lyric segments until it reaches the current lyric segment after adjustment of the time slider
		- Occasionally, dynamic lyrics would loop until the end, preventing the proper lyric segment to be highlighted.
		- No stopgap was made to prevent the ``ontimechange`` event from firing constantly, potentially affecting the calculations to decide the current lyric segment.
	- Now, dynamic lyrics properly display the correct current lyric segment without highlighting all lyric segments before reaching the correct one.
		- If the player is attempting to determine the correct lyric segment to highlight, a stopgap prevents the ``ontimechange`` effect from firing the lyric-finding process until it is complete
2. All forms have been turned into objects that pseudo-inherent global functions
	- 5 new functions each return an object list representing a form's inputs and necessary functions.
	- This is an attempt to make the Simple Music Player take the form of a framework library instead of its own product.

##### Version 0.5.34
1. JavaScript Debugging and Removal of Video Player-specific Controls
	- **Originally:** The audio player and the video player were completely different HTML elements, each having different event handlers to their controls that basically did the same thing.
		- **Now:** All video player controls have been removed - audio player controls now work globally among both the audio and video player.
	- **Originally:** Event handlers were appended to elements via jQuery, and most HTML element references were done via jQuery
		- **Now:** most HTML references and event handler appending are now done via pure JavaScript - this is in an attempt to remove dependency on jQuery, though this is a work-in-progress.
	- All forms now are initiated via functions
	- Several keyboard keys initiate certain function calls, such as:
		- **M:** mute/unmute the player
		- **Backspace:** the previous media that was played
		- **Enter:** the next media that should be played
		- **Left Arrow:** Back 5 seconds
		- **Right Arrow:** Forward 5 seconds
		- **Space:** Pause/play the current media
3. Styling Changes:
	- Player controls now utilize image sprites ([https://www.w3schools.com/css/css_image_sprites.asp](https://www.w3schools.com/css/css_image_sprites.asp)), reducing the number of assets that need to be loaded into the player per page reload.
	- Player controls now are designed to fit better across a variety of backgrounds, as well as the black background of the video player.
	- Current time of the current media being played has been moved next to the duration on the right
	- Video player still features its own title and artist text at the top of the page (whereas the audio player's title and artist text is still right above the time slider) - the video player's title and artist text are colored white
	- If an audio media is played and no lyrics are stored, then the lyrics are not present on-screen, instead the image art takes center stage until another piece of media with lyrics is selected
	- When a video media is being played, the controls and title/artist disappear after 3 seconds of inactivity to better let the user view the video.
###### Version 0.5.34
1. Bug Fixes:
	- When editing a piece of media that is 1) currently playing, and 2) is a video:
		1. Updates to the ``Title`` and ``Artist`` now appropriately update after submitting an edit
			- Problem occurred due to forgetting to update alongside Version 5.33 custom JS function ``UpdateCurrent()``, which updates a piece of media if it was edited while being played.
		2. Lyrics no longer default to ``black`` font color
			- problem occurred due to forgetting a parameter when calling the custom PHP function ``printDynamicLyrics`` which determined if the lyrics should default to black or white font color depending on current media type
	- When uploading new media, default lyrics are blank instead of "No Lyrics Provided"
		- This is due to the fact that the player no longer displays the lyric containers for both video and audio if no lyrics come with a media.
	- Keyboard commands from V5.33 now properly operate
		- Problem occurred due to false positive IF condition 		
			- IF falsely believed that if the current target was an input that wasn't a range then the command would run, but this must be that if the input WAS a range then it was okay to run the command
			- false positive caused commands to run even when current event target was an input of type 'text'
2. Changes to custom ``getAllMedia()`` JS function
	- JavaScript now handles sorting of list of media items retrieved from database - this was originally performed by PHP handler ``getAllMedia.php``
		- This allows for greater control of which media items should be removed from printing depending on certain criteria.
3. Changes to Uploading Media Form
	- Successful uploads have their items in the drop area of the form removed immediately after success - only the media items that could not be uploaded are left in the drop area for either deletion or replacement.
	- Should all files be uploaded properly, then an ``alert()`` indicating success is launched
4. Stylistic Changes:
	- Left header now follows similar color styling to player controls, as well as album artist header text
	- Toggle for left bar changed to arrow ``<<`` and changed background color to fit with altered left header style
	- Album art for albums now sport a box shadow to help differentiate greyer album art from background
	- Album background color now altered to be slightly transparent
	- Videos now fit such that their maximum width does not expand beyond padding of their parent HTML container.

##### Version 0.5.35
1. jQuery ``$.ajax()`` replaced with Pure JavaScript ``XMLHttpRequest()``
	- In order to remove the SMP from its jQuery dependency, the ``$.ajax()`` command offered by jQuery has been replaced by the ``XMLHttpRequest()`` API offered by JavaScript
	- The affected functions are:
		1. ``getAllMedia()``
		2. ``createLoop()``
		3. ``populateAlternativeArtContainer()``
		4. ``editIcon()``
		5. ``submitEdit()``
		6. ``startAlbumArtEdit()``
		7. ``submitAlbumArtEdit()``
		8. ``submitEmbed()``
		9. ``updateCurrent()``
		10. ``addMedia()``
	- As a result of the transfer from ``$.ajax()`` to ``XMLHttpRequest()``, several massive changes were made to the following:
		1. Editing Media:
			- values that were originally retrieved via ``GET`` are now sent via ``POST`` for protection.
			- If the user submits an edit that does not require uploading new artwork, the JS skips the process of sending an ``XMLHttpRequest`` to the server
				- Originally, regardless if the user was uploading new artwork or not, an ``$.ajax`` request was sent to the server, and the server would track whether to skip the upload process or commence an upload
			- Based on whether the user is editing the media without uploading new artwork, the user is editing while uploading new artwork, or the user is deleting the media being edited, the form takes in a new entry named ``command`` that tells the server to take the appropriate action.
		2. Updating Album Artwork
			- values that were originally retrieved via ``GET`` are now sent via ``POST`` for protection.
			- If the user submits by selecting an already-existing artwork instead of uploading new artwork, the JS makes this consideration and removes the file from the FormData() that is sent to the server - otherwise, the JS removes the alternative input instead
			- A variable called ``iconEditSet``, which was used to track if a new file was uploaded or not, has been removed completely
			- Based on whether the user is updating the album artwork with or without uploading new artwork, the form takes in a new entry named ``command`` that tells the server to take the appropriate action.
		3. Adding Media:
			- Promises now used to handle asynchronous XML requests and check whether all files have been successfully uploaded or not.
2. Bug Fixes:
	- When editing a media, selecting an alternative artwork now appropriately replaces the current album artwork selected on the left to the chosen artwork.
	- When editing a video, the form does not leave an empty space where the simple/dynamic lyrics toggle was originally
	- When updating album artwork, the file that is newly uploaded will now properly add to the FormData being sent to the server
	- Made proper adjustments to printing artwork onto the screen by creating conditionals to detect if the art src for a piece of media was in 64byte or a simple URL.
3. Other Miscellaneous Changes
	- Complete removal of JS custom functions ``getImageArt()`` and ``saveMediaArt()`` due to ``addMedia.php`` handling album artwork during process of upload.
		- Consequentially, PHP files ``getImageArt.php`` and ``saveMediaArt.php`` removed, as these are no longer required by the SMP.
	- Adjusted CSS of time slider by removing margins and vertically-centering time slider.

---
## **Version 1.0 - Official Release on Github!**

This marks Version 1.0 being released as a package on Github!
No significant changes were made here; this is merely an official release version to mark the first stable version of the SMP.

### Version 1.0.1 - Bug Fixes, Control Changes, and Stylistic Changes

This marks Version 1.0.1, which consists of multiple bug fixes and stylistic changes to the SMP.

1. Bug Fixes:
	-  Fixed bug where album artists would be printed onto the DOM in reverse alphabetical order
	- Fixed bug where Google Chrome could not find parent node of Video Embed &lt;div&gt;
2. Control Changes:
	- Control to hide/show Song List column now inside top header, instead of on the right of the Song List column
	- Editing media item now require right-clicking the media item in the Song List and clicking "Edit Media".
		- Song edit button commonly found on right of media item inside Song List now officially gone
3. Stylistic Changes
	- Fully committed for Night look appearance at this juncture
		- Will release version to alternate between light and dark versions later
		- Default background light gray - headers and important sections now dark gray
	- Header that was originally contained only within Song List now spans whole width of browser
	- Song List appearance drastically changed:
		- Removal of most "border-radius" CSS - now in middle of converting to straight-edge appearance
		- Removal of majority of "box-shadow" CSS - now in middle of converting to no shadows
		- Album artwork in Song List made smaller in size
		- Most text now left-aligned
		- With removal of icon within each media item in Song List to call editMedia() function, icons for video and YouTube embed-based media items now moved to the right side
		- Album names now moved to the right of album art
		- Album Artist names made slightly smaller in size
		- Song List now more compact in appearance
	- Some icons altered:
		- Settings icon in top header now uses same sprite as that of the Player's Extras icon that appears when the screen in narrow
		- Search icon now uses new sprite
	- Color changes (additional)
		- Blue colors usually used for "submit" buttons for forms now converted to default button color (dark gray)
		- Currently-playing media item in Song List has slightly darker appearance to make easier to read with white text
		- borders for most input forms now removed completely
	- Miscellaneous Changes:
		- Lyrics textbox when editing media now fits whole height of browser to prevent massive amounts of scrolling due to small height

### Version 1.0.2 *alpha* - Minor Bug Fixes + Function Updates, Further Stylistic Changes, Staging for New Update

This marks version 1.0.2 *alpha*, which consists of minor bug fixes and updates to existing functions. Stylistic changes also made to SMP. This also allows for staging of some new features, TBA.
1. Bug Fixes
	- Reorganized some function calls to make order of operations more seamless
	- Re-added "openMedia()" function inside "songClicked()", which is called when a piece of media is clicked
2. Function Updates
	- **2** new functions:
		- ``setLoop``: function used to set up loop functionality of SMP, can take either a value to set the loop at or default to using ``globalPlayer``'s pre-set loop value
		- ``setShuffle``: function used to set up shuffle functionality of SMP, which can take either a value to set the shuffle at or default to using ``globalPlayer``'s pre-set shuffle value
	- SMP Song List now is default closed at startup - opens once all data from ``getAllMedia()`` is received and processed.
	- Song List can be modified to be either on the left or right side of the screen
		- Use ``settings.json`` (explained below at #4) to change ``listPos`` variable (boolean: ``true`` = right side, ``false`` = left side)
	- Queue order changed:
		- Originally, current media ID was the first item in the queue
		- Now, current media ID is the last item in the queue **if looped** - otherwise (aka no loop), queue is empty.
3. Further Stylistic Changes
	- ``Border-Radius`` CSS mostly removed from most elements
	- Some form divs widened to fit width 100%
	- **Add Media Form** - item divs stylized to fit aesthetic of rest of SMP
	- Album Artwork in Player side of SMP adjusted:
		- If a song does not have lyrics, Album Artwork is widened to fill empty space
		- If a song has lyrics, Album Artwork is returned to its original smaller size
4. Staging for New Update
	- New update requires new functionality: **global user settings**. To stage for this update, the SMP requires the ability to grab settings data from ``settings.json`` and utilize it within the SMP
		- This is why ``setLoop`` and ``setShuffle`` were created
	- New PHP page: ``getSettings`` - not implemented, but theoretically pulls settings from JSON file ``settings.json``
	- New ``$thisFileDir`` variable within PHP for checking location of ``settings.json`` file.
	- SMP grabs settings file from ``settings.json`` when calling function ``getAllMedia()`` used when the SMP first loads - the settings are then integrated into the SMP thusly

### Version 1.0.2 *beta* - New "Edit Settings" Form Scaffolding
This marks version 1.0.2 *beta*, which consists of the introduction of a basic "Edit Settings" Form and the scaffolding to prepare for the official Version 1.0.3.

Version 1.0.2 *alpha* prepared a ``settings.json`` file that was used to store global SMP settings such as Song List Position and default Loop options.

Version 1.0.2 *beta* involves the creation and basic JS and PHP processing for a form that allows the editing of these global functions.

The only settings that can be changed at this point is the Song List position (either left or right) - further settings that can be changed will be added later.

New Functions:
* JavaScript:
	* ``initializeEditSettingsForm()`` -  initializes the form for editing SMP global settings
	* ``openEditSettingsForm()`` - closes all other forms and Song List, and opens the "Edit Settings" form
	* ``closeEditSettingsForm()`` - closes the "Edit Settings" and opens the Song List form
* PHP
	* ``getSettings.php`` - gets the settings from ``settings.json``
	* ``setSettings.php`` - saves the new settings from the "Edit Settings" form into ``settings.json``

---

## **Version 1.0.2 - New Global Settings**
Version 1.0.2 mostly entails the creation and implementation of global settings that users can edit and customize on their own local machines.

A new file, ``settings.json``, contains local settings that the SMP reads and interprets, prior to loading anything else. The new default settings are so:

| Setting | Type | Default | Description |
| ------- | ---- | ------- | ----------- |
| ``listPos`` | string | "left" | Which side the Song List is located on the screen ("left", or "right") |
| ``headerPos`` | string | "top" | Which side the header bar is located on the screen ("top", or "bottom") |
| ``loop`` | integer | 1 | Default loop configuration (0 = no looping, 1 = repeat, 2 = album loop) |
| ``shuffle`` | integer | 0 | Default shuffle configuration (0 = shuffle off, 1 = shuffle on) |
| ``volume`` | integer | 100 | Default volume level of player (between 0 and 100) |

To edit these settings, a new option was added to the ``Gear`` icon in the header: "Edit Settings". Users can customize these settings for their custom use.

Other changes are included here:
* New "Edit Settings" form created to allow users to customize global settings
* Player buttons now moved to Header - only scrollbar is left inside the player itself
	* player buttons now can be accessed by scrolling horizontally if they cannot fit within the width of the header
* Minor CSS adjustment to forms
* CSS animations added to many elements to make transitions less jarring
* New JavaScript function ``setHeaderPos()`` takes care of adjusting orientation of header and song list based on retrieved settings from ``settings.json``
* New JavaScript function ``getSettings()`` retrieves settings from ``settings.json`` and is initialized upon startup by default.
* PHP file ``getSettings.php`` handles cases of missing ``settings.json`` files, since it runs on startup by default
