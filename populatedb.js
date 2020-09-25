#! /usr/bin/env node

console.log(
  'This script populates some test games and categories to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0-mbdj7.mongodb.net/inventory-application?retryWrites=true'
);

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require('async');
var Game = require('./models/game');
var Genre = require('./models/genre');

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var games = [];
var genres = [];

function gameCreate(title, description, price, stock, genre, cb) {
  gamedetail = {
    title: title,
    description: description,
    price: price,
    stock: stock,
  };
  if (genre != false) gamedetail.genre = genre;

  var game = new Game(gamedetail);

  game.save(function(err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log('New Game: ' + game);
    games.push(game);
    cb(null, game);
  });
}

function genreCreate(name, description, cb, ...games) {
  genredetail = { name: name, description: description };
  if (games != false) genredetail.games = games;
  var genre = new Genre(genredetail);

  genre.save(function(err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log('New Genre: ' + genre);
    genres.push(genre);
    cb(null, genre);
  });
}

function createGenres(cb) {
  async.parallel(
    [
      function(callback) {
        genreCreate(
          'FPS',
          "First-person shooter (FPS) is a video game genre centered on gun and other weapon-based combat in a first-person perspective; that is, the player experiences the action through the eyes of the protagonist. The genre shares common traits with other shooter games, which in turn makes it fall under the heading action game. Since the genre's inception, advanced 3D and pseudo-3D graphics have challenged hardware development, and multiplayer gaming has been integral.",
          callback
        );
      },
      function(callback) {
        genreCreate(
          'MMORPG',
          'A massively multiplayer online role-playing game (MMORPG) is a video game that combines aspects of a role-playing video game and a massively multiplayer online game.',
          callback
        );
      },
      function(callback) {
        genreCreate(
          'Indie',
          'An independent video game or indie game is a video game typically created by individuals or smaller development teams without the financial and technical support of a large game publisher, in contrast to most "AAA" (triple-A) games.',
          callback
        );
      },
    ],
    // optional callback
    cb
  );
}

function createGames(cb) {
  async.series(
    [
      function(callback) {
        gameCreate(
          'Counter-Strike',
          'Counter-Strike (CS) is a series of multiplayer first-person shooter video games in which teams of terrorists battle to perpetrate an act of terror (bombing, hostage-taking, assassination) while counter-terrorists try to prevent it (bomb defusal, hostage rescue).',
          15,
          3,
          genres[0],
          callback
        );
      },
      function(callback) {
        gameCreate(
          'World of Warcraft',
          'World of Warcraft (WoW) is a massively multiplayer online role-playing game (MMORPG) released in 2004 by Blizzard Entertainment.',
          20,
          5,
          genres[1],
          callback
        );
      },
      function(callback) {
        gameCreate(
          'Terraria',
          'Terraria is an action-adventure sandbox game developed by Re-Logic.',
          10,
          7,
          genres[2],
          callback
        );
      },
      function(callback) {
        gameCreate(
          "Tom Clancy's Rainbow Six Siege",
          "Tom Clancy's Rainbow Six Siege is an online tactical shooter video game developed by Ubisoft Montreal and published by Ubisoft. The game puts heavy emphasis on environmental destruction and cooperation between players. Each player assumes control of an attacker or a defender in different gameplay modes such as rescuing a hostage, defusing a bomb, and taking control of an objective within a room.",
          35,
          3,
          genres[0],
          callback
        );
      },
      function(callback) {
        gameCreate(
          'Stardew Valley',
          'Stardew Valley is a simulation role-playing video game developed by Eric "ConcernedApe" Barone. In Stardew Valley, players take the role of a character who, to get away from the hustle of the city, takes over their deceased grandfather\'s dilapidated farm in a place known as Stardew Valley. The game is open-ended, allowing players to take on several activities such as growing crops, raising livestock, crafting goods, mining for ores, selling produce, and socializing with the townsfolk, including marriage and having children.',
          15,
          5,
          genres[2],
          callback
        );
      },
    ],
    // optional callback
    cb
  );
}

async.series(
  [createGenres, createGames],
  // Optional callback
  function(err, results) {
    if (err) {
      console.log('Creating error: ' + err);
    } else {
      mongoose.connection.close();
    }
  }
);
