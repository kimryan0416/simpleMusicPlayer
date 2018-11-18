# **Simple Music Player**

This is the readme for the **Simple Music Player**, a HTML/JavaScript/PHP application that allows you to use any web browser as your personal media player.

The **SMP** utilizes the following coding langauges:
* HTML5
* CSS3
* JavaScript
* PHP 7.*
* SQLite

This is currently **Version 1.0.1** of the **SMP**. You can view the changelog at the end of this document.

## Installation

The SMP can operate on any localhost server that is able to process SQLite and PHP. It is recommended that the file organization within the root folder is kept as-is - adjusting file locations may cause errors to occur in the player

When the player is opened for the first time within a browser, any missing files and directories will be initialized by the player automatically. These files and directories include:
* ``scripts/database.sql`` - the SQLite-based database file that contains all information required by the SMP
* ``media/`` - the directory that contains all the local media files uploaded into the SMP by the user
* ``art/`` - the directory that contains all the local artwork images uploaded into the SMP by the user

### Restarting the SMP

If you wish to restore the SMP to its original state prior to any installations, you must delete the file ``scripts/database.sql``. Deletion of this file will cause the SMP to re-initialize a new SQL file to use as a database, thereby resetting the player.

From there, old files kept in the ``media/`` directory can be reinserted into the SMP again. If you wish to restart the ``media/`` directory, you must simply remove the directory from the root directory of the SMP - the SMP will re-initalize this directory upon reloading the page on the browser. The same applies to the ``art/`` directory.


## **Changelog**

The changelog is available for viewing within the file ``changelog.md``.
