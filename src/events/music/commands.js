const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const ytpl = require("ytpl");
const SQueue = require("../../database/models/server_queueSchema");
let { Types } = require("mongoose");
const connectionMap = new Map();
const Eris = require("eris");
require("pluris")(Eris);
const Constants = Eris.Constants;
const fs = require("fs");
var path = require("path");

async function music(bot, message, args, todo) {
  const voice_channel = message.member.voiceState;
  if (connectionMap.get(message.guildID)) {
    if (
      voice_channel.channelID != connectionMap.get(message.guildID).channelID
    ) {
      return bot.createMessage(
        message.channel.id,
        "Please join the current playing voice channel"
      );
    }
  }

  if (!voice_channel.channelID) {
    return bot.createMessage(
      message.channel.id,
      "Please join the voice channel to use this command"
    );
  }

  let database_queue = await SQueue.findOne({
    guildID: message.guildID,
  });

  console.log("masuk function");
  switch (todo) {
    case "play":
      console.log("masuk");
      let song = {};
      //note fix play
      if (ytpl.validateID(args[0])) {
        const playlist = await ytpl(args[0]);
        const videos = playlist.items;
        const count = videos.length;
        const embed = new Eris.RichEmbed()
          .setTitle(`**Added Playlist to Queue**`)
          .setDescription(
            `✅ **${count} songs from [${playlist.title}](${args[0]})  has been added to the queue!**`
          );
        await bot.createMessage(message.channel.id, {
          embeds: [embed],
        });
        let song = {
          title: videos[0].title,
          url: videos[0].url,
          duration: videos[0].duration,
        };
        if (!database_queue) {
          database_queue = await new SQueue({
            _id: Types.ObjectId(),
            guildID: message.guildID,
            songs: [
              {
                title: song.title,
                url: song.url,
                duration: song.duration,
              },
            ],
          });
          await database_queue.save().catch((err) => console.log(err));
        } else {
          await SQueue.findOneAndUpdate(
            {
              guildID: message.guildID,
            },
            {
              $push: {
                songs: [
                  {
                    title: song.title,
                    url: song.url,
                    duration: song.duration,
                  },
                ],
              },
            }
          ); //note fix play
        }
        videos.shift();
        for (const video of videos) {
          song = {
            title: video.title,
            url: video.url,
            duration: video.duration,
          };
          await SQueue.findOneAndUpdate(
            {
              guildID: message.guildID,
            },
            {
              $push: {
                songs: [
                  {
                    title: song.title,
                    url: song.url,
                    duration: song.duration,
                  },
                ],
              },
            }
          );
        }
        if (connectionMap.get(message.guildID)) {
          return;
        } else {
          return video_player(bot, message.guildID, message);
        }
      } //note fix pla
      if (ytdl.validateURL(args[0])) {
        const song_info = await ytdl.getInfo(args[0]);
        const equation = (seconds) => {
          var detik = seconds % 60;
          var menit = Math.round(seconds / 60);
          var durasi = menit + ":" + detik;
          return durasi;
        };
        song = {
          title: song_info.videoDetails.title,
          url: song_info.videoDetails.video_url,
          duration: equation(song_info.videoDetails.lengthSeconds),
        };
        return QueueUpdate(song, message, bot);
      } else {
        let listsongs = "";
        let row = [];
        const video_finder = async (query) => {
          return new Promise(async function (resolve, reject) {
            //try and catch error
            const videoResult = await ytSearch(query);
            for (let x = 0; x < 5; x++) {
              let songtitle = videoResult.videos[x];
              listsongs +=
                `\n**${x + 1}.** [${songtitle.title}](${songtitle.url})\n` +
                "`[00:00/" +
                songtitle.duration.timestamp +
                "]`";
              row.push({
                type: Constants.ComponentTypes.BUTTON,
                style: Constants.ButtonStyles.PRIMARY,
                custom_id: x,
                label: x + 1,
              });
              console.log(`masuk button ${x + 1}`);
            }
            let embed1 = new Eris.RichEmbed()
              .setTitle(`**Choose song below by pressing the button**`)
              .setDescription(`${listsongs}`)
              .setFooter("To 'cancel' type cancel");
            var m = await bot.createMessage(message.channel.id, {
              embeds: [embed1],
              components: [
                {
                  type: Constants.ComponentTypes.ACTION_ROW,
                  components: row,
                },
              ],
            });
            console.log(`sended`);

            bot.on("interactionCreate", (interaction) => {
              if (interaction instanceof Eris.ComponentInteraction) {
                if (interaction.message.id == m.id) {
                  if (interaction.member.id == message.member.id) {
                    m.delete();
                    return bot
                      .createMessage(message.channel.id, {
                        embeds: [
                          {
                            title: "**Selected**",
                            description: `[${videoResult.videos[interaction.data.custom_id]
                              .title
                              }](${videoResult.videos[interaction.data.custom_id].url
                              }) to queue`,
                          },
                        ],
                        components: [],
                      })
                      .then(
                        resolve(
                          video(videoResult.videos[interaction.data.custom_id])
                        )
                      )
                      .catch(console.error);
                  } else {
                    interaction.acknowledge();
                  }
                }
              }
            });
            bot.on("messageCreate", (msg) => {
              if (msg.member.id == message.member.id && !msg.bot) {
                if (msg.content == "cancel")
                  try {
                    return m.edit({
                      content: "**🛑 Selection cancelled**",
                      components: [],
                      embeds: [],
                    });
                  } catch {
                    throw console.log(err);
                  }
              }
            });
          });
        };

        video_finder(args.join(" "));

        function video(video) {
          if (video) {
            song = {
              title: video.title,
              url: video.url,
              duration: video.duration.timestamp,
            };
          }
          return void QueueUpdate(song, message, bot);
        }
      }
      break;
    case "skip":
      if (!connectionMap.get(message.guildID)) {
        return bot.createMessage(
          message.channel.id,
          "There is no song currently playing"
        );
      }

      if (
        message.member.voiceState.channelID !=
        connectionMap.get(message.guildID).channelID
      ) {
        return bot.createMessage(
          message.channel.id,
          "Please join the current voice channel"
        );
      }

      connectionMap.get(message.guildID).stopPlaying();
      bot.createMessage(
        message.channel.id,
        `Skipping ${database_queue.songs[0].title}`
      );
      return;
    case "stop":
      if (!connectionMap.get(message.guildID)) {
        return bot.createMessage(
          message.channel.id,
          "There is no song currently playing"
        );
      }

      if (
        message.member.voiceState.channelID !=
        connectionMap.get(message.guildID).channelID
      ) {
        return bot.createMessage(
          message.channel.id,
          "Please join the current voice channel"
        );
      }

      bot.createMessage(
        message.channel.id,
        `Stopping the queue, deleting whole queue`
      );
      await SQueue.findOneAndUpdate(
        {
          guildID: message.guildID,
        },
        {
          $pullAll: {
            songs: database_queue.songs,
          },
        }
      );
      connectionMap.get(message.guildID).stopPlaying();
      connectionMap.delete(message.guildID);
      return;
  }
}

async function QueueUpdate(song, message, bot) {
  let database_queue = await SQueue.findOne({
    guildID: message.guildID,
  });
  if (!database_queue) {
    database_queue = await new SQueue({
      _id: Types.ObjectId(),
      guildID: message.guildID,
      songs: [
        {
          title: song.title,
          url: song.url,
          duration: song.duration,
        },
      ],
    });
    await database_queue.save().catch((err) => console.log(err));
  } else {
    await SQueue.findOneAndUpdate(
      {
        guildID: message.guildID,
      },
      {
        $push: {
          songs: [
            {
              title: song.title,
              url: song.url,
              duration: song.duration,
            },
          ],
        },
      }
    );
  }
  //note fix play
  if (connectionMap.get(message.guildID) && database_queue.songs.length > 0) {
    const embed = new Eris.RichEmbed()
      .setTitle("**Added to Queue**")
      .setDescription(`[${song.title}](${song.url})`);
    return bot.createMessage(message.channel.id, {
      embeds: [embed],
    });
  } else {
    try {
      return await video_player(bot, message.guildID, message);
    } catch (err) {
      await SQueue.findOneAndUpdate(
        {
          guildID: message.guildID,
        },
        {
          $pullAll: {
            songs: database_queue.songs,
          },
        }
      );
      console.log(err);
      bot.createMessage(
        message.channel.id,
        "There was an error connecting to the voice channel"
      );
      connectionMap.get(message.guildID).stopPlaying();
      returnconnectionMap.delete(message.guildID);
      throw err;
    }
  }
}

async function video_player(bot, guild, message) {
  const database_queue = await SQueue.findOne({
    guildID: guild,
  });

  console.log(database_queue.songs.length);
  if (database_queue.songs.length == 0) {
    bot.createMessage(
      message.channel.id,
      `Leaving voice channel due to inactivity`
    );
    bot.leaveVoiceChannel(message.member.voiceState.channelID);
    connectionMap.delete(message.guildID);
    return connectionMap.delete(message.guildID);
  }
  bot
    .joinVoiceChannel(message.member.voiceState.channelID)
    .catch((err) => {
      // Join the user's voice channel
      bot.createMessage(
        message.channel.id,
        "Error joining voice channel: " + err.message
      ); // Notify the user if there is an error
      console.log(err); // Log the error
    })
    .then((connection) => {
      const download = ytdl(database_queue.songs[0].url, {
        filter: "audioonly",
        quality: "highestaudio",
      });
      connection.play(download);
      const embedplaying = new Eris.RichEmbed()
        .setTitle("**Now Playing**")
        .setDescription(
          `[${database_queue.songs[0].title}](${database_queue.songs[0].url}) \n` +
          "`[00:00/" +
          database_queue.songs[0].duration +
          "]`"
        );
      connectionMap.set(message.guildID, connection);
      console.log("playing");
      bot.createMessage(message.channel.id, {
        embeds: [embedplaying],
      });
      connection.once("end", async () => {
        console.log("ending")
        const queueShift = async (guild) => {
          let database_queue = await SQueue.findOne({
            guildID: guild,
          });
          if (database_queue.songs.length == 1) {
            await SQueue.findOneAndUpdate(
              {
                guildID: guild,
              },
              {
                $pullAll: {
                  songs: database_queue.songs,
                },
              }
            );
            return await video_player(bot, guild, message);
          } else {
            await SQueue.findOneAndUpdate(
              {
                guildID: guild,
              },
              {
                $pop: {
                  songs: -1,
                },
              }
            );
            return await video_player(bot, guild, message);
          }
        };
        await queueShift(guild);
      });
      connection.on("err", err => {
        bot.createMessage(message.channel.id, "Error innitiating" + err);
        SQueue.findOneAndUpdate(
          {
            guildID: guild,
          },
          {
            $pop: {
              songs: -1,
            },
          }
        );
        return video_player(bot, guild, message);
      })
    });
}

module.exports = {
  music,
};
