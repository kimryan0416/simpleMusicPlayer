How Everything Works:

"media" Directory:
--> "Music", "Movies"
There are two types of files: Audio (aka Music), and Music Videos (aka Movies).
The Javascript will parse through each directory in the "media" directory, taking note of which songs are in which albums and which movies are under which songs.
When parsing through, the PHP will create a "database.json" file inside the "functions" directory - this will serve as a quick reference and will be used by the website as its main jumping-off point. It will not be edited unless the button used to parse through the "media" directory is clicked by the website manager.

"Music" directory:
--> [albums] --> [songs inside albums]
Each directory inside the "Music" directory is an "album", so to speak. Inside each "album" directory are songs.