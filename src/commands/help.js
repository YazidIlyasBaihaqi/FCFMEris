module.exports = async function test(bot, Eris) {
    const Constants = Eris.Constants;

    bot.registerCommand(
        "help",
        (msg, args) => {
            bot.createMessage(msg.channel.id, {
                embeds: [{
                    title: "Help command list",
                    author: {
                        name: "FurcaFM",
                        icon_url: "https://i.postimg.cc/8cq527Zw/Furry-Cafe-Logo.png"
                    },
                    color: 0x008000,
                    fields: [{
                        name: "play",
                        value: "Play a music from link, name title, or playlist"
                    }, {
                        name: "queue",
                        value: "Give list of song queue"
                    }, {
                        name: "stop",
                        value: "Stop the current playlist"
                    }, {
                        name: "skip",
                        value: "Skip the current song"
                    }]
                }]
            })
        },
        {
            description: "Help list",
            fullDescription: "Command help list",
        }
    );
};
//     // bot.registerCommand("button", (msg, args) => {
//     //     bot.createMessage(msg.channel.id, {
//     //         content: "Button Example",
//     //         components: [
//     //             {
//     //                 type: Constants.ComponentTypes.ACTION_ROW, // You can have up to 5 action rows, and 1 select menu per action row
//     //                 components: [
//     //                     {
//     //                         type: Constants.ComponentTypes.BUTTON, // https://discord.com/developers/docs/interactions/message-components#buttons
//     //                         style: Constants.ButtonStyles.PRIMARY, // This is the style of the button https://discord.com/developers/docs/interactions/message-components#button-object-button-styles
//     //                         custom_id: "click_one",
//     //                         label: "Click me!",
//     //                         disabled: false // Whether or not the button is disabled, is false by default
//     //                     }
//     //                 ]
//     //             }
//     //         ]
//     //     });
//     // })

//     /*bot.registerCommand("ping", "Pong!", { // Make a ping command
//         // Responds with "Pong!" when someone says "!ping"
//         description: "Pong!",
//         fullDescription: "This command could be used to check if the bot is up. Or entertainment when you're bored."
//     });

//     bot.registerCommand("pong", ["Pang!", "Peng!", "Ping!", "Pung!"], { // Make a pong command
//         // Responds with a random version of "Ping!" when someone says "!pong"
//         description: "Ping!",
//         fullDescription: "This command could also be used to check if the bot is up. Or entertainment when you're bored."
//     });

//     const echoCommand = bot.registerCommand("echo", (msg, args) => { // Make an echo command
//         if (args.length === 0) { // If the user just typed "!echo", say "Invalid input"
//             return "Invalid input";
//         }
//         const text = args.join(" "); // Make a string of the text after the command label
//         return text; // Return the generated string
//     }, {
//         description: "Make the bot say something",
//         fullDescription: "The bot will echo whatever is after the command label.",
//         usage: "<text>"
//     });

//     echoCommand.registerSubcommand("reverse", (msg, args) => { // Make a reverse subcommand under echo
//         if (args.length === 0) { // If the user just typed "!echo reverse", say "Invalid input"
//             return "Invalid input";
//         }
//         let text = args.join(" "); // Make a string of the text after the command label
//         text = text.split("").reverse().join(""); // Reverse the string
//         return text; // Return the generated string
//     }, {
//         description: "Make the bot say something in reverse",
//         fullDescription: "The bot will echo, in reverse, whatever is after the command label.",
//         usage: "<text>"
//     });

//     echoCommand.registerSubcommandAlias("backwards", "reverse");*/
// }
