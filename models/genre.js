var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
});

// Virtual for genre's URL
GenreSchema.virtual('url').get(function() {
  return '/catalog/genre/' + this._id;
});

GenreSchema.virtual('lowercase_name').get(function() {
  return this.name.toLowerCase();
});

//Export model
module.exports = mongoose.model('Genre', GenreSchema);
