const ramda = require('ramda')
const tunes = require('./tunes.json');
const ytdl = require("ytdl-core");
const h = require("./help.json");

const spoon = {
  playSomething: function(tag){
    var result;
    var tune = tunes.filter(x=>x.tags.includes(tag));
    if(tune && tune.length){
      var index = Math.floor(Math.random() * tune.length-1);
      result = tune[index].source;
    }
    return result;
  },
  getTune: function(name){
    var result;
    var tune = tunes.filter(x=>x.commands.includes(name));
    if(tune && tune.length){
      result = tune[0].source;
    }
    return result;
  },

}
module.exports = spoon;
