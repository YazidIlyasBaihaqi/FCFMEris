const Eris = require("eris")
require("dotenv").config();
// Replace TOKEN with your bot account's token
const bot = new Eris(process.env.TOKEN, {
  intents: [
    "guilds",
    "guildMessages"
  ]
});


/*const { innit } = require('../src/database/mongoose');

innit();*/

bot.on("ready", async () => { // When the bot is ready
  console.log("Ready!"); // Log "Ready!"

  //Note: You should use guild commands to test, as they update instantly. Global commands can take up to an hour to update.

  const commands = await bot.getCommands();

  if (!commands.length <= 0) {
    bot.createCommand({
      name: "ping",
      description: "Test ping",
      type: 1
    }).then(() => console.log('Created ping')).catch(console.log)
  }
});

bot.on("error", (err) => {
  console.error(err); // or your preferred logger
});

bot.on("interactionCreate", (interaction) => {
  if (interaction instanceof Eris.CommandInteraction) {
    if (interaction.data.name === "ping") {
      return interaction.createMessage("pong")
    }
  }
})

bot.connect();