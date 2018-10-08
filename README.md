# **Simple Music Player**

This is the readme for the **Simple Music Player**, a HTML/JavaScript/PHP application that allows you to use any web browser as your personal media player.

The **SMP** utilizes the following coding langauges:
* HTML5
* CSS3
* JavaScript (jQuery)
* PHP 7.*
* SQLite

This is currently **Version 5.1** of the **SMP**. You can view the changelog at the end of this document.



## **Changelog**

### **Version 5**

#### Version 5.0 - The Bug-Fixing Build:
Version 5.0 was a step up from the latest version of Version 4 and is mostly comprised of bug fixes and code cleanups.

##### Version 5.00
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

#### Version 5.1 - The SQLite Build:
Version 5.1 improves code and load time significantly due to moving to an SQLite database - requests now no longer require MySQL servers! Anybody who can run a PHP server with SQLite installed now can utilize the player.

##### Version 5.10
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

##### Version 5.11
1. Modified mobile version for use with SQLite player

##### Version 5.12
1. Remove JavaScript redundant code & function-ized common code sequences, specifically code that creates new DOM elements
2. Modified Search function - searches now show suggestions below search bar instead of relying on clicking "Enter" to cycle through song items
3. Removed redundant script files no longer being used

#### Version 5.2 - The Editor And Styling Build:
Version 5.2 replaces a lot of extraneous code by utilizing functions and erasing now-nonfunctional code. As a result, improvements have been made to the general stability of the build.
Major stylistic changes have also been made, with major changes made to the general look of the player, info editor, and list of songs.
Back-end adjustments mainly include altering how dynamic lyrics are managed by the editor, fixes to code that previewed new art when uploading new artwork, etc.
New functions have been added into the build, including the ability to save and toggle between simple lyrics and dynamic lyrics, being able to transfer simple lyrics into dynamic lyrics and vice versa, and being able to add new dynamic lyric segments before and after particular lyric segments that have already been added into the lyrics editor.

##### Version 5.20
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

###### Version 5.21
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
