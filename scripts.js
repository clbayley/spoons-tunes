const ramda = require('ramda')
const tunes = require('./tunes.json');
var Airtable = require('airtable');


var base = new Airtable({apiKey:process.env.airtable_apikey}).base('appbMvuZAKJOhRHKA');




//const moods = require('./moods.json');
const spoon = {
  getMood:function(name){
    return moods.find(x=>x.name == name.toLowerCase()).source;
  },
  playSomething: async function(tag){
    //var result;
    var query = {
        maxRecords: 10000,
        filterByFormula:`FIND("${tag}", ARRAYJOIN(Tags))`,
        view: "Grid view"
      };

      var url = await base('Tunes').select(query).firstPage().then(result=>{

        if(result && result.length){
          console.log(result.length)
          var index =  Math.floor(Math.random() * result.length)
          console.log(index)

          return result[index].fields.URL.toString();
        }
        else {return null};
      });

//    var tune = tunes.filter(x=>x.tags.includes(tag));
//    if(tune && tune.length){
//      var index = Math.floor(Math.random() * tune.length);
//      result = tune[index].source;
//    }
    return url;
  },
  getTune: async function(name){
    console.log('getting tune')
      var result;
      var query = {
          maxRecords: 1,
          filterByFormula:`{Command} = '${name}'`,
          view: "Grid view"
        };
      var url = await base('Tunes').select(query).firstPage().then(result=>{
        if(result && result.length){
          return result[0].fields.URL.toString();
        }
      });
      return url;

  //  var tune = tunes.filter(x=>x.commands.includes(name));

  },
  learn: async function(name, url, tags, message){

    base('Tunes').create({
      "Command": name,
      "URL": url,
      "Tags":tags
    }, {typecast: true}, function(err, record) {
      if (err) {
        message.channel.send("oh no too hard");
        return;
      }
      message.channel.send(`i lerned ${name} thank u`);
    });


  },
  getTags: async function(){
    var query = {
        maxRecords: 10000,
        view: "Grid View"
      };
      var tags = await base('Tunes').select().firstPage().then(result=>{
        console.log(result)
        if(result && result.length){
          var r=[];
          var tags = result.map(o=>o.fields);
          console.log(tags);
          tags.forEach((item, i) => {
            r = r.concat(item.Tags)
          });
          return r;
        }

      });
      return tags;
  },
  getSongs: async function(){
    var query = {
        maxRecords: 10000,
        view: "Grid View"
      };
      var tags = await base('Tunes').select().firstPage().then(result=>{
        console.log(result)
        if(result && result.length){
          var r=[];
          var fields = result.map(o=>o.fields);
          console.log(fields);
          fields.forEach((item, i) => {
            r.push(`name: ${item.Command}, url: ${item.URL}`)
          });
          return r;
        }

      });
      return fields;
  }

}
module.exports = spoon;
