const Eris = require("eris");
require("dotenv").config();
const path = require('path');
const fs = require('fs').promises;
const Guilds = require("./database/models/guildSchema")
const mongoose = require('../src/database/mongoose');
const express = require('express');
mongoose.innit();
const app = express();
const SQueue = require("./database/models/server_queueSchema");
const { music } = require("./events/music/commands")

const Constants = Eris.Constants;

const PORT = process.env.PORT || 80;

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/statusPage.html")
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})

const bot = new Eris(process.env.TOKEN, {
    intents: ['guilds', 'guildVoiceStates']
})

// const bot = new Eris.CommandClient(process.env.TOKEN, {}, {
//     description: "Custom music bot for Furry Cafe",
//     owner: "Drakov",
//     prefix: "f?",
// })

bot.on("ready", async () => { // When the bot is ready
    console.log("Ready!"); // Log "Ready!"

    //Note: You should use guild commands to test, as they update instantly. Global commands can take up to an hour to update.
    const database_guild = await Guilds.find();
    database_guild.map(async function (guild) {
        const commands = await bot.getGuildCommands(guild.guildID)
        if (commands.length) {
            try {
                bot.createGuildCommand(guild.guildID, {
                    name: "play",
                    description: "Play music from youtube by search query or link",
                    options: [{
                        "name": "link-or-query",
                        "description": "Link or search query",
                        "type": Constants.ApplicationCommandTypes.MESSAGE,
                        "required": "true"
                    }],
                    type: Constants.ApplicationCommandTypes.CHAT_INPUT
                })

                bot.createGuildCommand(guild.guildID, {
                    name: "stop",
                    description: "Stop whole queue and delete the queue",
                    type: Constants.ApplicationCommandTypes.CHAT_INPUT
                })

                bot.createGuildCommand(guild.guildID, {
                    name: "skip",
                    description: "Skip the current song",
                    type: Constants.ApplicationCommandTypes.CHAT_INPUT
                })

                bot.createGuildCommand(guild.guildID, {
                    name: "queue",
                    description: "Show the current queue list",
                    type: Constants.ApplicationCommandTypes.CHAT_INPUT
                })
            }
            catch (err) {
                console.log(err)
            }
            return
        }
        bot.createGuildCommand(guild.guildID, {
            name: "play",
            description: "Play music from youtube by search query or lyric",
            options: [{
                "name": "lyric-or-query",
                "description": "Link or search query",
                "type": Constants.ApplicationCommandTypes.MESSAGE,
                "required": "true"
            }],
            type: Constants.ApplicationCommandTypes.CHAT_INPUT
        })

        bot.createGuildCommand(guild.guildID, {
            name: "stop",
            description: "Stop whole queue and delete the queue",
            type: Constants.ApplicationCommandTypes.CHAT_INPUT
        })

        bot.createGuildCommand(guild.guildID, {
            name: "skip",
            description: "Skip the current song",
            type: Constants.ApplicationCommandTypes.CHAT_INPUT
        })

        bot.createGuildCommand(guild.guildID, {
            name: "queue",
            description: "Show the current queue list",
            type: Constants.ApplicationCommandTypes.CHAT_INPUT
        })
        return
    })
});

bot.on("error", (err) => {
    console.error(err); // or your preferred logger
});

//full penjelasan di command.js
bot.on("interactionCreate", async (interaction) => {
    if (interaction instanceof Eris.CommandInteraction) {
        // console.log(interaction.member.id)
        switch (interaction.data.name) {
            case "queue":
                const Constants = Eris.Constants;
                var array = [];
                let server_profile = await SQueue.findOne({ guildID: interaction.guildID });
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
                    return interaction.createMessage("There is no song in the queue");
                var title = `Currently Playing ${server_profile.songs[0].title}`;
                if (server_profile.songs.length > 1) {
                    var count = 1;
                    const recursive = async (count) => {
                        let desc = "Queue Songs\n";
                        for (count; count < server_profile.songs.length; count++) {
                            console.log(server_profile.songs[count])
                            desc += `${count}  [${server_profile.songs[count].title}](${server_profile.songs[count].url})\n`;
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
                await interaction.createMessage({
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
                return
            default:
                var value
                if (!interaction.data.options) {
                    value = false
                } else {
                    value = interaction.data.options[0].value
                }
                console.log(interaction.data.name)
                // return console.log(interaction.member.voiceState.channelID)
                // const m = await interaction.createMessage("masuk tai").then(() => {
                //     return Math.trunc(Math.random() * 999999999)
                // }).catch(console.log("gk bisa"));
                // console.log(m)
                // return interaction.acknowledge()
                // return music(bot,interaction, args, todo)
                return music(bot, interaction, value, interaction.data.name)
        }
    }
})

bot.on("error", (err) => {
    console.error(err); // or your preferred logger
});

bot.connect();