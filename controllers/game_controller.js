const Genre = require('../models/genre');
const Game = require('../models/game');
const Image = require('../models/image');
const debug = require('debug')('game');
const { body, validationResult } = require('express-validator');
const { upload } = require('../upload');
const fs = require('fs');
const path = require('path');

// Display index and counters
exports.index = async (req, res, next) => {
  try {
    const [game_count, genre_count, genres, games] = await Promise.all([
      Game.countDocuments({}),
      Genre.countDocuments({}),
      Genre.find(),
      Game.find(),
    ]);
    let array_of_values = [];
    games.forEach((game) => array_of_values.push(game.stock));
    const units_count = array_of_values.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);
    res.render('index', {
      title: 'Vidya Gamez Inventory',
      game_count,
      genre_count,
      genres,
      units_count,
    });
  } catch (err) {
    next(err);
  }
};

// Display list of all games.
exports.game_list = async (req, res, next) => {
  try {
    const games = await Game.find({}).populate('image');
    const genres = await Genre.find();
    res.render('game_list', { title: 'Game List', games, genres });
  } catch (err) {
    next(err);
  }
};

// Display game detail page
exports.game_detail = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id).populate('genre image');
    const genres = await Genre.find();
    res.render('game_detail', {
      title: game.title,
      game,
      genres,
    });
  } catch (err) {
    next(err);
  }
};

// Display game create form on GET
exports.game_create_get = async (req, res, next) => {
  try {
    const genres = await Genre.find();
    res.render('game_form', {
      title: 'Create Game',
      genres,
    });
  } catch (err) {
    next(err);
  }
};

// Handle game create on POST.
exports.game_create_post = [
  upload.single('image'),
  // Validate fields.
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Description must not be empty.')
    .trim()
    .isLength({ min: 1 }),
  body('stock', 'Stock must be a number').isNumeric(),
  body('price', 'Price must be a number').isNumeric(),

  // Sanitize fields (using wildcard).
  body('*').escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Game object with escaped and trimmed data.
    let image;
    let game = new Game({
      title: req.body.title,
      description: req.body.description,
      stock: req.body.stock,
      price: req.body.price,
      genre: req.body.genre,
    });
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      try {
        const genres = await Genre.find();
        // Mark the selected genre as selected.
        for (let i = 0; i < genres.length; i++) {
          if (game.genre.indexOf(genres[i]._id) > -1) {
            genres[i].selected = 'true';
          }
        }
        res.render('game_form', {
          title: 'Create Game',
          genres,
          game,
          errors: errors.array(),
        });
      } catch (err) {
        next(err);
      }
      return;

      // No errors, try saving it
    } else {
      if (req.file) {
        image = new Image({
          filename: req.file.filename,
          content_type: req.file.mimetype,
        });
        game = new Game({
          title: req.body.title,
          genre: req.body.genre,
          description: req.body.description,
          stock: req.body.stock,
          price: req.body.price,
          image: image._id,
        });
      }
      try {
        if (req.file) await image.save();
        await game.save();
        res.redirect(game.url);
      } catch (err) {
        next(err);
      }
    }
  },
];

// Display Game delete form on GET.
exports.game_delete_get = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    // Successful, so render.
    res.render('game_delete', {
      title: 'Delete Game',
      game,
      password: 'true',
    });
  } catch (err) {
    res.redirect('/catalog/games');
    throw err;
  }
};

// Handle Game delete on POST.
exports.game_delete_post = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (req.body.password == process.env.PASSWORD) {
      await Game.findByIdAndRemove(req.body.gameid);
      res.redirect('/catalog/games');
    } else {
      res.render('game_delete', {
        title: 'Delete Game',
        game,
        password: true,
        no_match: true,
      });
    }
  } catch (err) {
    next(err);
  }
};

// Display game update form on GET.
exports.game_update_get = async (req, res, next) => {
  // Get game and genres for form.
  try {
    const game = await Game.findById(req.params.id).populate('genre');
    const genres = await Genre.find();
    if (game == null) {
      // No results.
      let err = new Error('Game not found');
      err.status = 404;
      return next(err);
    }
    // Success.
    // Mark our selected genres as selected.
    for (var all_g_iter = 0; all_g_iter < genres.length; all_g_iter++) {
      for (
        var game_g_iter = 0;
        game_g_iter < game.genre.length;
        game_g_iter++
      ) {
        if (
          genres[all_g_iter]._id.toString() ==
          game.genre[game_g_iter]._id.toString()
        ) {
          genres[all_g_iter].selected = 'true';
        }
      }
    }
    res.render('game_form', {
      title: 'Update Game',
      genres,
      game,
      password: 'true',
      remove_image: game.image ? true : false,
    });
  } catch (err) {
    next(err);
  }
};

// Handle game update on POST.
exports.game_update_post = [
  upload.single('image'),
  // Validate fields.
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Description must not be empty.')
    .trim()
    .isLength({ min: 1 }),
  body('stock', 'Stock must be a number').isNumeric(),
  body('price', 'Price must be a number').isNumeric(),

  // Sanitize fields.
  body('title').escape(),
  body('description').escape(),
  body('stock').toInt(),
  body('price').toInt(),
  body('genre.*').escape(),
  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    const genres = await Genre.find();

    let image;
    let game;

    // If user selected cover
    if (req.file) {
      image = new Image({
        filename: req.file.filename,
        content_type: req.file.mimetype,
      });
      game = new Game({
        title: req.body.title,
        genre: req.body.genre,
        description: req.body.description,
        stock: req.body.stock,
        price: req.body.price,
        image: image._id,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });
      try {
        // Check if password matches
        if (req.body.password == process.env.PASSWORD) {
          let old_game = await Game.findById(req.params.id).populate('image');
          if (old_game.image) {
            await Image.findByIdAndRemove(old_game.image._id);
            await fs.unlink(
              path.resolve(
                __dirname,
                '../public/images/' + old_game.image.filename
              ),
              function(err) {
                if (err) throw new Error(err);
              }
            );
          }
        }
      } catch (err) {
        next(err);
      }
      // If user didn't select cover
    } else {
      try {
        let previous_image = await Game.findById(req.params.id);
        // If updated game has a cover
        if (previous_image.image) {
          // If user selected to remove the cover
          if (req.body.removeImage == 'yes') {
            if (req.body.password == process.env.PASSWORD) {
              let old_game = await Game.findById(req.params.id);
              let image = await Image.findById(old_game.image);
              if (old_game.image) {
                await Image.findByIdAndRemove(old_game.image);
                await fs.unlink(
                  path.resolve(__dirname, '../public/images/' + image.filename),
                  function(err) {
                    if (err) throw new Error(err);
                  }
                );
              }
              game = new Game({
                title: req.body.title,
                genre: req.body.genre,
                description: req.body.description,
                stock: req.body.stock,
                price: req.body.price,
                _id: req.params.id, //This is required, or a new ID will be assigned!
                image: null,
              });
            } else {
              game = new Game({
                title: req.body.title,
                genre: req.body.genre,
                description: req.body.description,
                stock: req.body.stock,
                price: req.body.price,
                _id: req.params.id, //This is required, or a new ID will be assigned!
              });
              res.render('game_form', {
                title: 'Update Game',
                genres,
                game,
                password: true,
                no_match: true,
              });
            }
            // If game has a cover and user wants to keep it
          } else {
            game = new Game({
              title: req.body.title,
              genre: req.body.genre,
              description: req.body.description,
              stock: req.body.stock,
              price: req.body.price,
              _id: req.params.id, //This is required, or a new ID will be assigned!
              image: previous_image.image,
            });
          }
          // If updated game doesn't have cover
        } else {
          game = new Game({
            title: req.body.title,
            genre: req.body.genre,
            description: req.body.description,
            stock: req.body.stock,
            price: req.body.price,
            _id: req.params.id, //This is required, or a new ID will be assigned!
          });
        }
      } catch (err) {
        next(err);
      }
    }

    if (req.body.password == process.env.PASSWORD) {
      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
        // Get all authors and genres for form.
        try {
          const genres = await Genre.find();
          // Mark our selected genres as selected.
          for (let i = 0; i < genres.length; i++) {
            if (game.genre.indexOf(genres[i]._id) > -1) {
              genres[i].selected = 'true';
            }
          }
          res.render('game_form', {
            title: 'Update Game',
            genres,
            game,
            errors: errors.array(),
          });
          return;
        } catch (err) {
          next(err);
        }
      } else {
        try {
          // Data from form is valid. Update the record.
          await Game.findByIdAndUpdate(req.params.id, game, {});
          if (req.file) {
            await image.save();
          }
          res.redirect(game.url);
        } catch (err) {
          next(err);
        }
      }
      // Password doesn't match
    } else {
      if (req.file) {
        await fs.unlink(
          path.resolve(__dirname, '../public/images/' + req.file.filename),
          function(err) {
            if (err) throw new Error(err);
          }
        );
      }
      let previous_image = await Game.findById(req.params.id);
      game = new Game({
        title: req.body.title,
        genre: req.body.genre,
        description: req.body.description,
        stock: req.body.stock,
        price: req.body.price,
        _id: req.params.id, //This is required, or a new ID will be assigned!
        image: previous_image.image ? previous_image.image : null,
      });
      res.render('game_form', {
        title: 'Update Game',
        genres,
        game,
        password: true,
        no_match: true,
      });
    }
  },
];
