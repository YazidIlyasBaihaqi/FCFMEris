const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Snowflake,
} = require("discord.js");
const ytpl = require("ytpl");
const SQueue = require("../../database/models/server_queueSchema");
const {
  createAudioPlayer,
  joinVoiceChannel,
  AudioPlayerStatus,
  createAudioResource,
} = require("@discordjs/voice");
let { player } = require("./commands");
const noop = () => {};

async function video_player(guild, message, connection) {
  //note, resource audioplayer bakal muter2 terus ampe kelar
  let database_queue = await SQueue.findOne({
    guildID: guild.id,
  });
  console.log(database_queue.songs.length);
  if (database_queue.songs.length == 0) {
    message.channel.send({
      content: `Leaving voice channel due to inactivity`,
    });
    connection.destroy();
    return;
  }
  const wrapperMethods = {
    start() {
      let stream = ytdl(database_queue.songs[0].url, {
        filter: "audioonly",
      });
      resource = createAudioResource(stream);
      player.play(resource);
      console.log(`masuk resource ${database_queue.songs[0].url}`);

      connection.subscribe(player);
      player.on(AudioPlayerStatus.Idle, async () => {
        player.removeAllListeners();
        player.pause();
        const queueShift = (guild) => {
          return new Promise(async (resolve, reject) => {
            if (database_queue.songs.length == 1) {
              return await SQueue.findOneAndUpdate(
                {
                  guildID: message.guild.id,
                },
                {
                  $pullAll: {
                    songs: database_queue.songs,
                  },
                }
              ).then(resolve(console.log("empty")));
            } else {
              await SQueue.findOneAndUpdate(
                {
                  guildID: guild.id,
                },
                {
                  $pop: {
                    songs: -1,
                  },
                }
              ).then(resolve(console.log("shifted")));
            }
          });
        };
        await queueShift(guild).then(video_player(guild, message, connection));
      });
      wrapperMethods.start = noop;
    },
  };
  wrapperMethods.start();
  const embedplaying = new MessageEmbed()
    .setTitle("**Now Playing**")
    .setDescription(
      `[${database_queue.songs[0].title}](${database_queue.songs[0].url}) \n` +
        "`[00:00/" +
        database_queue.songs[0].duration +
        "]`"
    )
    .setColor("BLURPLE");
  await message.channel.send({
    embeds: [embedplaying],
  });
}

module.exports = {
    video_player  
}