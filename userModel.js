const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    pokemons: {type:Array,default:[]},
})

module.exports = mongoose.model('User',userSchema);