BEGIN TRANSACTION;

-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `albums`

CREATE TABLE `albums` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `art` VARCHAR(255) DEFAULT 'assets/default_album_art.jpg'
);


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `albumToalbum_artist`

CREATE TABLE `albumToalbum_artist` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `album_id` INTEGER NOT NULL,
  `album_artist_id` INTEGER NOT NULL
);


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `albumToart`

CREATE TABLE `albumToart` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `album_id` INTEGER NOT NULL,
  `art_id` INTEGER NOT NULL
);


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `album_artists`

CREATE TABLE `album_artists` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `name` VARCHAR(255) NOT NULL
);


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `art`

CREATE TABLE `art` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `src` TEXT
);
INSERT INTO `art` (`id`, `src`) VALUES
  (-1, NULL),
  (0, 'assets/default_album_art.jpg');


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `music`

CREATE TABLE `music` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `url` VARCHAR(255) NOT NULL,
  `type` VARCHAR(10) NOT NULL DEFAULT 'music',
  `extension` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `artist` VARCHAR(255)  DEFAULT NULL,
  `composer` VARCHAR(255) DEFAULT NULL,
  `lyrics` TEXT,
  `dynamic_lyrics` TEXT,
  `dynamic_lyrics_toggle` INTEGER NOT NULL DEFAULT '0',
  `comment` TEXT,
  `duration` VARCHAR(10) NOT NULL,
  `start_padding` VARCHAR(10) DEFAULT NULL,
  `end_padding` VARCHAR(10) DEFAULT NULL,
  `medium` INTEGER NOT NULL DEFAULT '0'
);


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `songToalbum`

CREATE TABLE `songToalbum` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `song_id` INTEGER NOT NULL,
  `album_id` INTEGER NOT NULL
);


-- --------------------------------------------------------
-- --------------------------------------------------------

-- Table structure for table `songToart`

CREATE TABLE `songToart` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  `song_id` INTEGER NOT NULL,
  `art_id` INTEGER NOT NULL
);


-- --------------------------------------------------------
-- --------------------------------------------------------

COMMIT;
