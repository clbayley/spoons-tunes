require('dotenv').config();

const Discord = require("discord.js");
const {prefix } = require("./auth.json");
const ytdl = require("ytdl-core");
const h = require("./help.json");
const tunes = require('./tunes.json');
const ramda = require('ramda')

const spoon = require('./scripts.js');

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {

  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.toLowerCase().startsWith(`${prefix}play`)) {
    execute(message, serverQueue, "music");
    return;
  }
  else if (message.content.toLowerCase().startsWith(`${prefix}volume`)) {
      if(serverQueue){
        serverQueue.volume = message.content.split(' ')[2];
        return message.channel.send(
          "done!"
        );
      }
      return;
    }
	 else if (message.content.toLowerCase().startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  }
	else if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
		help(message, serverQueue);
    return;
  }	else if (message.content.toLowerCase().startsWith(`${prefix}songs`)) {
			songs(message, serverQueue);
	    return;
	  }
		else if (message.content.toLowerCase().startsWith(`${prefix}setlist`)) {
	 	setlist(message, serverQueue);
	 	return;
	 }
	 else if (message.content.toLowerCase().startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  }
	else if (message.content.toLowerCase().startsWith(`${prefix}tags`)) {
	 tags(message, serverQueue);
	 return;
 }
 else if (message.content.toLowerCase().startsWith(`${prefix}learn`)) {
  learn(message);
  return;
 }
 else if (message.content.startsWith(`${prefix}@`)) {
	soundEffect(message.content.split('@')[1],message);
	return;
}
 else {
    message.channel.send("oh no that maks no sens try agen pls");
  }
});

async function soundEffect(sound, message){
	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel)
		return message.channel.send(
      "pls join a voice chanel first so i can sing for u!"
		);
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send(
      "i need permishun to join and speak in your voice chanel!"
		);
	}
		var connection = await voiceChannel.join();
	//	connection.play('./files/howl.mp3')

};


async function execute(message, serverQueue, type) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "pls join a voice chanel first so i can sing for u!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "i need permishun to join and speak in your voice chanel!"
    );
  }
	var url;
  var fn;
	var playNow = false;
	if(type == "music"){
		if(args[2] == "something"){
			url = await spoon.playSomething(args[3]);
      if(!url){
        return message.channel.send(`i dont know any ${args[3]} tunes sorry`);
      }
			if(args[4] == "now"){
				playNow = true;
			}
		}
    else if(args[2].startsWith('http')){
      url = args[2];
      if(args[3] == "now"){
        playNow = true;
      }
    }
		else {
      console.log(args[2])
			url = await spoon.getTune(args[2]);
      if(!url){
        return message.channel.send(`I don't know '${args[2]}`);
      }
			if(args[3] == "now"){
				playNow = true;
			}
		}
	}


  console.log(playNow)
  const songInfo = await ytdl.getInfo(url);
	if(songInfo){

  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url
  };

  if (!serverQueue || playNow) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 2,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
		if(playNow){
			serverQueue.songs.unshift(song)
		}else{
			serverQueue.songs.push(song);
		}
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

async function setlist(message, serverQueue){
	if(!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0){
		return message.channel.send("There aren't any songs in Spoon's setlist! Add some by using `!play [song]` ");
	}
	else{
		serverQueue.songs.forEach((item, i)=>{
			return message.channel.send(item.title);
		})
	}
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function help(message, serverQueue){
	h.forEach((item, i) => {
		message.channel.send(`${i+1}. ${item}`);
	});
};

async function learn(message){
  // spoon learn (cats) http://.../ one,two,three
  var msg = message.content.split('(')[1];
  if(!msg){
    return message.channel.send('oh no invalid string')
  }

  var name = msg.split(') ')[0];
  if(!name){
    return message.channel.send('oh no invalid string')
  }
  var args = msg.split(') ')[1].split(' ');
  if(!args){
    return message.channel.send('oh no invalid string')
  }
  var url = args[0];

  var t = args[1].split(',');
  var tags=[];
  console.log(t);
  t.forEach((item, i) => {
    tags= tags.concat(item.replace(/ /g, ''));
  });
  console.log(tags)


try{
  const songInfo = await ytdl.getInfo(url);
	if(songInfo){
    var result = await  spoon.learn(name, url, tags, message);
    return;
    }

}catch(err){
    return message.channel.send('that is not a reel song pls try agen')

}


}

async function tags(message, song){
  var result =[];
	var t = await spoon.getTags();

	//var r = ramda.clone(tunes).map(x=>x.tags);
	t.forEach((item, i) => {
		result = result.concat(item);
	});
	message.channel.send([...new Set(result)]);
}
client.login(process.env.token);
