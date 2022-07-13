/*
if (todo === "play") {
  console.log("masuk");
  let database_queue = await SQueue.findOne({
    guildID: message.guild.id,
  });

  if (!args.length) return message.channel.send("You need to state the music");
  let song = {};
  //note fix play
  if (ytpl.validateID(args[0])) {
    const playlist = await ytpl(args[0]);
    const videos = playlist.items;
    const count = videos.length;
    const embed = new MessageEmbed()
      .setColor("GOLD")
      .setTitle(`**Added Playlist to Queue**`)
      .setDescription(
        `✅ **${count} songs from [${playlist.title}](${args[0]})  has been added to the queue!**`
      );
    await message.channel.send({
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
        guildID: message.guild.id,
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
          guildID: message.guild.id,
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
          guildID: message.guild.id,
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
    return video_player(message.guild, message, connection);
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
    console.log(song_info.videoDetails.timestamp);
    const embed = new MessageEmbed()
      .setTitle("**Added to Queue**")
      .setDescription(`[${song.title}](${song.url})`);
    if (!AudioPlayerStatus.Playing) {
      return QueueUpdate(connection, song, message, voice_channel);
    } else {
      await message.channel.send({
        embeds: [embed],
      });
      return QueueUpdate(connection, song, message, voice_channel);
    }
  } else {
    let listsongs = "";
    let row = new MessageActionRow();
    const video_finder = async (query) => {
      return new Promise(async function (resolve, reject) {
        //try and catch error
        const videoResult = await ytSearch(query);
        for (let x = 0; x < 5; x++) {
          let songtitle = videoResult.videos[x];
          listsongs +=
            `\n**${x + 1}.** [${songtitle.title}](${songtitle.url})` +
            "`[00:00/" +
            songtitle.duration.timestamp +
            "]`";
          row.addComponents(
            new MessageButton()
              .setCustomId(`${x + 1}`)
              .setLabel(`${x + 1}`)
              .setStyle(`PRIMARY`)
          );
          console.log(`masuk button ${x + 1}`);
        }
        let embed1 = new MessageEmbed()
          .setTitle(`**Choose song below by pressing the button**`)
          .setDescription(`${listsongs}`);
        var m = await message.channel.send({
          embeds: [embed1],
          components: [row],
        });
        console.log(`sended`);
        const filter = (interaction) =>
          interaction.user.id === message.member.user.id;
        const collector = message.channel.createMessageComponentCollector(
          filter,
          {
            max: 1,
            time: 150000,
          }
        );
        collector.on("collect", (i) => {
          i.update({
            embeds: [
              {
                title: "**Selected**",
                description: `[${videoResult.videos[i.customId].title}](${
                  videoResult.videos[i.customId].url
                }) to queue`,
              },
            ],
            components: [],
          })
            .then(resolve(video(videoResult.videos[i.customId])))
            .catch(console.error);
          //i.deferUpdate().then(m.delete().then(resolve(video(videoResult.videos[i.customId]).catch(console.error))).catch(console.error))
        });
        //tadi (collected) sama (i)
        collector.on("end", (collected) => {
          if (collected.size == 0) {
            m.delete().then(message.channel.send("**🛑 Selection cancelled**"));
          } else {
            console.log(collected.customId);
          }
        });
      });
    };

    await video_finder(args.join(" "));

    function video(video) {
      if (!video) {
        song = {
          title: video.title,
          url: video.url,
          duration: video.duration.timestamp,
        };
        const embedSong = new MessageEmbed()
          .setTitle(`**Selected**`)
          .setDescription(`[${song.title}](${song.url}) to queue`);
        message.channel.send({
          embeds: [embedSong],
        });
      }
      return void QueueUpdate(connection, song, message, voice_channel);
    }
  } //note fix play
}

//skip
let database_queue = await SQueue.findOne({
    guildID: message.guild.id,
  });
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Please join the voice channel to use this command"
    );
  }
  if (!voiceChannel.get(message.guild.id)) {
    return message.channel.send("There is no music playing right now");
  }
  if (!database_queue.songs.length < 0) {
    return message.channel.send("Currently there is no song in the queue");
  }
  player.stop();
  message.channel.send(`Skipping ${database_queue.songs[0].title}`);
  return await SQueue.OneAndUpdate(
    {
      guildID: message.guild.id,
    },
    {
      $pop: {
        songs: -1,
      },
    }
  ); */