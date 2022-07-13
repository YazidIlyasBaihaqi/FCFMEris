const Eris = require("eris");
require("dotenv").config();
const path = require('path');
const fs = require('fs').promises;
const Guild = require("./database/models/guildSchema")
const mongoose = require('../src/database/mongoose');
const express = require('express');
mongoose.innit();
const app = express();

const PORT = process.env.PORT || 80;

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/statusPage.html")
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})

const bot = new Eris.CommandClient(process.env.TOKEN, {}, {
    description: "A test bot made with Eris",
    owner: "somebody",
    prefix: "!",
    defaultHelpCommand: true
})

async function registerCommands(dir) {
    const filePath = path.join(__dirname, dir);
    const files = await fs.readdir(filePath);
    for (const file of files) {
        const stat = await fs.lstat(path.join(filePath, file));
        if (stat.isDirectory()) await registerCommands(client, path.join(dir, file));
        if (file.endsWith('.js')) {
            const Command = require(path.join(filePath, file));
            console.log(path.join(filePath, file))
            if (Command instanceof Function) {
                Command(bot, Eris)
            }
        }
    }
}

async function registerEvents(dir) {
    const filePath = path.join(__dirname, dir);
    const files = await fs.readdir(filePath);
    for (const file of files) {
        if (file.endsWith('.js')) {
            const Event = require(path.join(filePath, file));
            if (Event instanceof Function) {
                return Event()
            }
        }
    }
}

bot.on("ready", () => { // When the bot is ready
    (async () => {
        await registerCommands("./commands");
        const database_guild = await Guild.find();
        database_guild.map(function (guild) {
            return bot.registerGuildPrefix(guild.guildID, guild.prefix)
        })
        console.log(bot.guildPrefixes)
    })();
    console.log(`${bot.user} ready`);
    // Log "Ready!"
});

bot.on("error", (err) => {
    console.error(err); // or your preferred logger
});

bot.connect();