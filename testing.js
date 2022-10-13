const ytdl = require("ytdl-core");

const download = new Promise(function (resolve, reject) {
    const finish = ytdl("https://www.youtube.com/watch?v=hA_DhRRDRMY", {
        filter: "audioonly",
        quality: "lowestaudio",
    })
    if (finish) {
        resolve(finish)
    } else {
        reject("nothing")
    }
})

download.then((value) => {
    console.log(value)
}, (err) => {
    console.log(err)
})