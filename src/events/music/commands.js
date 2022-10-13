const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const ytpl = require("ytpl");
const SQueue = require("../../database/models/server_queueSchema");
let { Types, connection } = require("mongoose");
const connectionMap = new Map();
const Eris = require("eris");
require("pluris")(Eris);
const Constants = Eris.Constants;
const fs = require("fs");
var path = require("path");
const ytdlexec = require('youtube-dl-exec');
const { resolve } = require("path");

//note, tambahin argument di fungsi "interaction" atau kalau bisa ganti message jadi interaction
async function music(bot, interactionPast, args, todo) {
  const voice_channel = interactionPast.member.voiceState;
  if (connectionMap.get(interactionPast.guildID)) {
    if (
      voice_channel.channelID != connectionMap.get(interactionPast.guildID).channelID
    ) {
      return interactionPast.createMessage(
        "Please join the current playing voice channel"
      );
    }
  }

  if (!voice_channel.channelID) {
    return interactionPast.createMessage(
      "Please join the voice channel to use this command"
    );
  }

  let database_queue = await SQueue.findOne({
    guildID: interactionPast.guildID,
  });

  switch (todo) {
    case "play":
      console.log("masuk");
      let song = {};
      //note fix play
      if (ytpl.validateID(args)) {
        const playlist = await ytpl(args);
        const videos = playlist.items;
        const count = videos.length;
        const embed = new Eris.RichEmbed()
          .setTitle(`**Added Playlist to Queue**`)
          .setDescription(
            `✅ **${count} songs from [${playlist.title}](${args})  has been added to the queue!**`
          );
        interactionPast.createMessage({
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
            guildID: interactionPast.guildID,
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
              guildID: interactionPast.guildID,
            },
            {
              $push: {
                songs:
                {
                  title: song.title,
                  url: song.url,
                  duration: song.duration,
                },
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
              guildID: interactionPast.guildID,
            },
            {
              $push: {
                songs:
                {
                  title: song.title,
                  url: song.url,
                  duration: song.duration,
                },
              },
            }
          );
        }
        if (connectionMap.get(interactionPast.guildID)) {
          return;
        } else {
          return video_player(bot, interactionPast.guildID, interactionPast);
        }
      } //note fix pla
      if (ytdl.validateURL(args)) {
        const song_info = await ytdl.getInfo(args);
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
        const embed = new Eris.RichEmbed()
          .setTitle("**Added to Queue**")
          .setDescription(`[${song.title}](${song.url})`);
        interactionPast.createMessage({
          embeds: [embed],
        });
        return QueueUpdate(song, interactionPast, bot);
      } else {
        interactionPast.createMessage("Searching for **" + args + "**")
        let listsongs = "";
        let row = [];
        const video_finder = async (query, interactionPast) => {
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
            var m = await interactionPast.createMessage({
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
                  if (interaction.member.id == interactionPast.member.id) {
                    m.delete();
                    return bot
                      .createMessage(interactionPast.channel.id, {
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
              console.log(interactionPast.member.id)
              console.log(msg.member.id)
              if (msg.member.id == interactionPast.member.id && !msg.bot) {
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

        video_finder(args, interactionPast);

        function video(video) {
          if (video) {
            song = {
              title: video.title,
              url: video.url,
              duration: video.duration.timestamp,
            };
          }
          return void QueueUpdate(song, interactionPast, bot);
        }
      }
      break;
    case "skip":
      if (!connectionMap.get(interactionPast.guildID)) {
        return interactionPast.createMessage(
          "There is no song currently playing"
        );
      }

      connectionMap.get(interactionPast.guildID).stopPlaying();
      interactionPast.createMessage(
        `Skipping ${database_queue.songs[0].title}`
      );
      return;
    case "stop":
      console.log(connectionMap.get(interactionPast.guildID))
      if (!connectionMap.get(interactionPast.guildID)) {
        return bot.createMessage(
          interactionPast.channel.id,
          "There is no song currently playing"
        );
      }

      interactionPast.createMessage(
        `Stopping the queue, deleting whole queue`
      );
      await SQueue.findOneAndUpdate(
        {
          guildID: interactionPast.guildID,
        },
        {
          $pullAll: {
            songs: database_queue.songs,
          },
        }
      );
      connectionMap.get(interactionPast.guildID).stopPlaying();
      connectionMap.delete(interactionPast.guildID);
      return;
  }
}

async function QueueUpdate(song, interactionPast, bot) {
  let database_queue = await SQueue.findOne({
    guildID: interactionPast.guildID,
  });
  if (!database_queue) {
    database_queue = await new SQueue({
      _id: Types.ObjectId(),
      guildID: interactionPast.guildID,
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
        guildID: interactionPast.guildID,
      },
      {
        $push: {
          songs:
          {
            title: song.title,
            url: song.url,
            duration: song.duration,
          },
        },
      }
    );
  }
  //note fix play
  if (connectionMap.get(interactionPast.guildID) && database_queue.songs.length > 0) {
    const embed = new Eris.RichEmbed()
      .setTitle("**Added to Queue**")
      .setDescription(`[${song.title}](${song.url})`);
    return interactionPast.createMessage({
      embeds: [embed],
    });
  } else {
    try {
      return await video_player(bot, interactionPast.guildID, interactionPast);
    } catch (err) {
      await SQueue.findOneAndUpdate(
        {
          guildID: interactionPast.guildID,
        },
        {
          $pullAll: {
            songs: database_queue.songs,
          },
        }
      );
      console.log(err);
      bot.createMessage(
        interactionPast.channel.id,
        "There was an error connecting to the voice channel"
      );
      connectionMap.get(interactionPast.guildID).stopPlaying();
      // return connectionMap.delete(interactionPast.guildID);
      throw err;
    }
  }
}

async function video_player(bot, guild, interactionPast) {
  const database_queue = await SQueue.findOne({
    guildID: guild,
  });

  console.log(database_queue.songs.length);
  if (database_queue.songs.length == 0) {
    bot.createMessage(
      interactionPast.channel.id,
      `Leaving voice channel due to inactivity`
    );
    bot.leaveVoiceChannel(interactionPast.member.voiceState.channelID);
    connectionMap.delete(interactionPast.guildID);
    return connectionMap.delete(interactionPast.guildID);
  }
  bot
    .joinVoiceChannel(interactionPast.member.voiceState.channelID)
    .catch((err) => {
      // Join the user's voice channel
      bot.createMessage(
        interactionPast.channel.id,
        "Error joining voice channel: " + err.message
      ); // Notify the user if there is an error
      console.log(err); // Log the error
    })
    .then(async (connection) => {
      const path = '../../songs/' + interactionPast.guildID + '/' + database_queue.songs[0].title
      const result = ytdl(database_queue.songs[0].url, {
        filter: "audioonly",
        quality: "lowestaudio",
        format: "webm"
      })
      // .pipe(fs.createWriteStream(path)).on('finish', (output) => {
      //   if (output) {
      //     resolve(path)
      //   }
      // })
      setTimeout(() => {
        connection.play(result)

        const embedplaying = new Eris.RichEmbed()
          .setTitle("**Now Playing**")
          .setDescription(
            `[${database_queue.songs[0].title}](${database_queue.songs[0].url}) \n` +
            "`[00:00/" +
            database_queue.songs[0].duration +
            "]`"
          );
        connectionMap.set(interactionPast.guildID, connection);
        console.log("playing");
        bot.createMessage(interactionPast.channel.id, {
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
              return await video_player(bot, guild, interactionPast);
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
              return await video_player(bot, guild, interactionPast);
            }
          };
          await queueShift(guild);
        });
        connection.on("err", err => {
          bot.createMessage(interactionPast.channel.id, "Error innitiating" + err);
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
          return video_player(bot, guild, interactionPast);
        })
      }, 7500)
      // await connection.play(ytdl(database_queue.songs[0].url, {
      //   filter: "audioonly",
      //   quality: "lowestaudio",
      // }), {
      //   voiceDataTimeout: 1000
      // })
    });
}

module.exports = {
  music,
};
