var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GameSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  stock: { type: Number, required: true },
  genre: {
    type: Schema.Types.ObjectId,
    ref: 'Genre',
    required: true,
  },
  price: { type: Number, required: true },
  image: { type: Schema.Types.ObjectId, ref: 'Image' },
});

// Virtual for game's URL
GameSchema.virtual('url').get(function() {
  return '/catalog/game/' + this._id;
});

// Virtual for formatted price
GameSchema.virtual('formatted_price').get(function() {
  return '$' + this.price;
});

//Export model
module.exports = mongoose.model('Game', GameSchema);
