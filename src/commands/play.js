const { music } = require("../events/music/commands");
const SQueue = require("../database/models/server_queueSchema");

module.exports = async function play(bot, Eris) {
    const Constants = Eris.Constants;
    bot.registerCommand("play", (msg, args) => {
        if (args.length <= 0) {
            return bot.createMessage("please state an argument")
        }
        return music(bot, msg, args, "play")
    }, {
        description: "Will play you a music type",
        fullDescription: "Will play you a music type 't?play (link)' or 't?play video title' to use",
        cooldown: 1000,
        cooldownMessage: "Processing the music, please wait"
    });

    bot.registerCommand("stop", (msg, args) => {
        return music(bot, msg, args, "stop")
    }, {
        description: "Will stop the current playlist",
        fullDescription: "Will stop the current playlist 't?stop"
    });

    bot.registerCommand("skip", (msg, args) => {
        return music(bot, msg, args, "skip")
    }, {
        description: "Will skip the current song",
        fullDescription: "Will skip the current song 't?skip'"
    });

    bot.registerCommand("clear", async (msg, args) => {
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
    }, {
        description: "Clear the song queue",
        fullDescription: "Clear the song queue"
    })

    bot.registerCommand("queue", async (msg, args) => {
        var array = [];
        let server_profile = await SQueue.findOne({ guildID: msg.guildID });
        const row = [
            {
                type: Constants.ComponentTypes.BUTTON,
                style: Constants.ButtonStyles.PRIMARY,
                custom_id: `previous`,
                label: `Previous`
            }, {
                type: Constants.ComponentTypes.BUTTON,
                style: Constants.ButtonStyles.PRIMARY,
                custom_id: "next",
                label: "Next"
            }];
        if (server_profile.songs.length <= 0)
            return bot.createMessage(msg.channel.id, "There is no song in the queue");
        var title = `Currently Playing ${server_profile.songs[0].title}`;
        if (server_profile.songs.length > 1) {
            var count = 1;
            const recursive = async (count) => {
                let desc = "Queue Songs\n";
                for (count; count < server_profile.songs.length; count++) {
                    desc += `No.${count}  [${server_profile.songs[count].title}](${server_profile.songs[count].url})\n`;
                    if (count % 7 == 0) {
                        break;
                    }
                }
                array.push({
                    title: title,
                    description: desc
                });
                const newNumber = count + 1
                if (count == server_profile.songs.length) {
                    return
                }
                if (count < server_profile.songs.length) {
                    await recursive(newNumber);
                }
            };
            if (count < server_profile.songs.length) {
                recursive(count);
            }
        } else {
            array.push({
                title: title,
                description: "There is no song in the queue"
            });
        }
        await bot.createMessage(msg.channel.id, {
            embeds: [array[0]], components: [{
                type: Constants.ComponentTypes.ACTION_ROW,
                components: row
            }]
        });
        console.log(array.length);
        var page = 0;
        bot.on("interactionCreate", (interaction) => {
            if (interaction instanceof Eris.ComponentInteraction) {
                if (interaction.data.custom_id == "next") {
                    if (page >= (array.length - 1) || array.length == 1) {
                        return interaction.acknowledge().then(() => {
                            interaction.createFollowup({
                                content:
                                    "This is the last page of queue",
                                flags: 64
                            }
                            );
                        })
                    } else {
                        page += 1;
                        return interaction.editParent({
                            embeds: [array[page]], components: [{
                                type: Constants.ComponentTypes.ACTION_ROW,
                                components: row
                            }]
                        });
                    }
                } if (interaction.data.custom_id == "previous") {
                    if (page == 0) {
                        return interaction.acknowledge().then(() => {
                            interaction.createFollowup({
                                content:
                                    "This is the first page of queue",
                                flags: 64
                            }
                            );
                        })
                    } else {
                        page -= 1;
                        return interaction.editParent({
                            embeds: [array[page]], components: [{
                                type: Constants.ComponentTypes.ACTION_ROW,
                                components: row
                            }]
                        });
                    }
                }
            }
        });
    }, {
        description: "Will display the current queue",
        fullDescription: "Will display the current queue"
    })
}