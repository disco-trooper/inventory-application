const Genre = require('../models/genre');
const Game = require('../models/game');
const { body, validationResult } = require('express-validator');

// Display list of all Genres.
exports.genre_list = async (req, res, next) => {
  try {
    const genres = await Genre.find();
    //Successful, so render
    res.render('genre_list', {
      title: 'Genre List',
      genres,
    });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific Genre.
exports.genre_detail = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    const genre_games = await Game.find({ genre: req.params.id }).populate(
      'image'
    );
    const genres = await Genre.find();
    if (genre == null) {
      // No results.
      let err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('genre_detail', {
      title: genre.name,
      genre,
      genre_games,
      genres,
    });
  } catch (err) {
    next(err);
  }
};

// Display Genre create form on GET.
exports.genre_create_get = async (req, res, next) => {
  try {
    const genres = await Genre.find({});
    res.render('genre_form', { title: 'Create Genre', genres });
  } catch (err) {
    next(err);
  }
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate that the name field is not empty.
  body('name', 'Genre name required')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Genre description required').isLength({ min: 1 }),

  // Sanitize (escape) the name field.
  body('name').escape(),
  body('description').escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    let genre = new Genre({
      name: req.body.name,
      description: req.body.description,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', {
        title: 'Create Genre',
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      try {
        let existing_genre = await Genre.findOne({ name: req.body.name });
        res.redirect(existing_genre.url);
      } catch (err) {
        try {
          await genre.save();
          res.redirect(genre.url);
        } catch (err) {
          next(err);
        }
      }
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    const genre_games = await Game.find({ genre: req.params.id });
    const genres = await Genre.find();
    // Successful, so render
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_games,
      genres,
      password: true,
    });
  } catch (err) {
    // No results.
    res.redirect('/catalog/genres');
  }
};

// Handle Genre delete on POST.
exports.genre_delete_post = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    const genre_games = await Game.find({ genre: req.params.id });
    // Success
    if (genre_games.length > 0) {
      // Genre has games. Render in same way as for GET route.
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre,
        genre_games,
      });
      return;
    } else {
      if (req.body.password == process.env.PASSWORD) {
        try {
          // Genre has no games. Delete object and redirect to the list of genres.
          await Genre.findByIdAndRemove(req.body.genreid); // Success - go to genres list
          res.redirect('/catalog/genres');
        } catch (err) {
          next(err);
        }
      } else {
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre,
          genre_games,
          password: true,
          no_match: true,
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

// Display Genre update form on GET.
exports.genre_update_get = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    const genres = await Genre.find();
    if (genre == null) {
      // No results.
      var err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    res.render('genre_form', {
      title: 'Update Genre',
      genre,
      genres,
      password: true,
    });
  } catch (err) {
    next(err);
  }
};

// Handle genre update on POST.
exports.genre_update_post = [
  // Validate that the name field is not empty.
  body('name', 'Genre name required')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Genre description required').isLength({ min: 1 }),

  // Sanitize (escape) the name field.
  body('name').escape(),
  body('description').escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Genre object with escaped/trimmed data and old id.
    let genre = new Genre({
      name: req.body.name,
      description: req.body.description,
      _id: req.params.id,
    });

    if (req.body.password == process.env.PASSWORD) {
      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
        res.render('genre_form', {
          title: 'Update Genre',
          genre,
          errors: errors.array(),
        });
        return;
      } else {
        try {
          await Genre.findByIdAndUpdate(req.params.id, genre, {});
          res.redirect(genre.url);
        } catch (err) {
          next(err);
        }
      }
    } else {
      res.render('genre_form', {
        title: 'Update Genre',
        genre,
        errors: errors.array(),
        password: true,
        no_match: true,
      });
    }
  },
];
