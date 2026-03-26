//lele
//Audio LELELELELE
global.sounds = {}; //all ze sounds go here!!!
global.sfx = {}; //only sfx
global.music = {}; //only music
global.newSound = function (name, content, type) {
    let temp = {}
    temp.src = new Audio(content);
    temp.type = type;
    temp.name = name;
    global.sounds[name] = { ...temp};
    if (type = "sound") global.sfx[name] = { ...temp};
    if (type = "music") global.music[name] = { ...temp};
};
console.log("i am the one that exists");
let sounds = [
    //Sound Effects
    ["subspaceTripmine", "//www.myinstants.com/media/sounds/subspace-tripmine.mp3", "sound"],
    ["oofy", "//www.myinstants.com/media/sounds/roblox-death-sound_1.mp3", "sound"],
    ["mchit", "//www.myinstants.com/media/sounds/minecraft_hit_soundmp3converter.mp3", "sound"],
    ["vineboom", "//www.myinstants.com/media/sounds/vine-boom.mp3", "sound"],
    ["letmeknow", "//www.myinstants.com/media/sounds/let-me-know.mp3", "sound"],
    ["metalpipe", "//www.myinstants.com/media/sounds/let-me-know.mp3", "sound"],
    ["buzzer", "//www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3", "sound"],
    ["fortnitedeath", "//www.myinstants.com/media/sounds/tmp_7901-951678082.mp3", "sound"],
    ["prowler", "//www.myinstants.com/media/sounds/prowler-sound-effect_6bXErot.mp3", "sound"],
    ["bruh", "//www.myinstants.com/media/sounds/movie_1.mp3", "sound"],
    ["flashbangg", "//www.myinstants.com/media/sounds/flashbanggg.mp3", "sound"],
    ["sadviolin", "//www.myinstants.com/media/sounds/tf_nemesis.mp3", "sound"],
    ["babylaugh", "//www.myinstants.com/media/sounds/baby-laughing-meme.mp3", "sound"],
    ["windowserror", "//www.myinstants.com/media/sounds/error_CDOxCYm.mp3", "sound"],
    ["tacobell", "//www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3", "sound"],
    ["undertaker", "//www.myinstants.com/media/sounds/undertakers-bell_2UwFCIe.mp3", "sound"],
    ["fard", "//www.myinstants.com/media/sounds/perfect-fart.mp3", "sound"],
    ["anklebreaker", "//www.myinstants.com/media/sounds/bone-crack.mp3e", "sound"],
    ["punchy", "//www.myinstants.com/media/sounds/punch-gaming-sound-effect-hd_RzlG1GE.mp3", "sound"],
    ["catlaugh", "//www.myinstants.com/media/sounds/cat-laugh-meme-1.mp3", "sound"],
    ["fardrev", "//www.myinstants.com/media/sounds/fart-with-reverb.mp3", "sound"],
    ["minussocialcredit", "//www.myinstants.com/media/sounds/999-social-credit-siren.mp3", "sound"],
    ["outro", "//www.myinstants.com/media/sounds/outro-song_oqu8zAg.mp3", "sound"],
    ["fardlong", "//www.myinstants.com/media/sounds/fart-meme-sound.mp3", "sound"],
    ["goofyahh", "//www.myinstants.com/media/sounds/goofy-ahh-sounds.mp3", "sound"],
    ["wompwompwompwoomp", "//www.myinstants.com/media/sounds/downer_noise.mp3", "sound"],
    ["mafiosoaaa", "//www.myinstants.com/media/sounds/mafioso-scream.mp3", "sound"],
    ["gokudrip", "//www.myinstants.com/media/sounds/drip-goku-meme-song-original-dragon-ball-super-music-clash-of-gods-in-description.mp3", "sound"],
    ["lobotomye", "//www.myinstants.com/media/sounds/lobotomy-sound-effect.mp3", "sound"],
    ["bahaha", "//www.myinstants.com/media/sounds/ny-video-online-audio-converter.mp3", "sound"],
    ["questahdog", "//www.myinstants.com/media/sounds/wait-wait-wait-what-the-hell-legend-sound.mp3", "sound"],
    ["exploders", "//www.myinstants.com/media/sounds/explosion-meme_dTCfAHs.mp3", "sound"],
    ["rehehehe", "//www.myinstants.com/media/sounds/rehehehe.mp3", "sound"],
    ["pewpew", "//www.myinstants.com/media/sounds/gunshotjbudden.mp3", "sound"],
    ["cave1", "//www.myinstants.com/media/sounds/cave11_0QWMESM.mp3", "sound"],
    ["wasted", "//www.myinstants.com/media/sounds/gta-v-death-sound-effect-102.mp3", "sound"],
    ["legobreaky", "//www.myinstants.com/media/sounds/lego-breaking.mp3", "sound"],
    ["roketlancher", "//www.myinstants.com/media/sounds/roblox-explosion-sound.mp3", "sound"],
    ["fahh", "//www.myinstants.com/media/sounds/faaah.mp3", "sound"],
    ["quandaledingle", "//www.myinstants.com/media/sounds/lack-of-a-father-figure.mp3", "sound"],
    ["socialcredit", "//www.myinstants.com/media/sounds/999-social-credit-siren.mp3", "sound"],
    ["ack", "//www.myinstants.com/media/sounds/ack.mp3", "sound"],
    ["hahafunny", "//www.myinstants.com/media/sounds/ny-video-online-audio-converter.mp3", "sound"],
    ["gunshot", "//www.myinstants.com/media/sounds/gunshotjbudden.mp3", "sound"],
    ["shutdown", "//www.myinstants.com/media/sounds/microsoft-windows-xp-shutdown-sound.mp3", "sound"],
    ["shaw", "//www.myinstants.com/media/sounds/hollow-knight-hornet-voice-11.mp3", "sound"],
    // Music
    ["gameOver", "./resources/music/gameOver.mp3"],
    ["crasherMayhem", "./resources/music/crasherMayhem.mp3"],
    ["title", "./resources/music/title.mp3"],
    ["aerius", "./resources/music/aerius.mp3"]
]
sounds.forEach(function (element) {
    global.newSound(element[0], element[1], element[2])
})
global.getSetting = function (setting) {
    document.getElementById(`Woomy_${setting}`).value;
}
global.playDeathSound = function () {
    if (getSetting("funnyDeath") == "on") {
        let deathSounds = []
        Object.keys(sounds).forEach(function (element) {
            if (element.type = "sound") {
                deathSounds.concat(element)
            }
        })
        let s = deathSounds[global.rnd(0, deathSounds.length()-1)];
        if (s.src.paused) {s.src.currentTime = 0} else {s.src.play()}; // If sound is already playing, restart it.
    };
};
global.stopAllAudio = function (stype) {
    Object.keys(global.sounds).forEach(function (element) {
        // Check if a type is specified. if so, only stop the sound if its type matches the selected type. If it is null (unselected), stop all sounds.
        if (stype === null ? true : element.type == stype) {
            element.src.currentTime = element.src.duration; // end the audio - this causes the ended Event to be activated instead of the paused one.
        }
    });
};
let musicPlaying = false,
    musicDelay = 0,
    musicStatus = "normal";
function playMusic(music) {
    if (music.type != "music") {
        console.warn(music[0] + " is not classified as a music track. This will cause it to not stop when music is supposed to be stopped.")
    }
    music.src.currentTime = 0;
    music.src.play();
    music.src.addEventListener("ended", (event) => {
        musicPlaying = false;
        musicDelay = musicStatus == "spawn" || musicStatus == "dead" ? 0 : global.rnd(global.c.MUSIC_DELAY[0], global.c.MUSIC_DELAY[1]);
    });

}
global.spawnMusicRestart = function () {
    musicStatus = "spawn";
    stopAllAudio(); // also stop sfx cuz they are annoying (especially wait wait wait wait wut da haeeaeaeaeaeaeaeaeaexck)
}
global.gameOverMusic = function () {
    musicStatus = "dead";
    stopAllAudio("music")
}
function musicLoop() {
    if (musicPlaying == false) {
        if (musicDelay > 0) {
            musicDelay--
        } else {
            let musicToPlay;
            if (global.gameStarted) {
                switch(musicStatus) {
                    case "dead":
                        musicToPlay = music.gameOver;
                    default:
                        switch(global.c.MUSIC_MODE) {
                            case "default":
                                musicToPlay = music.aerius;
                                break;
                            case "crasher":
                                musicToPlay = music.crasherMayhem
                        }
                }
            } else {
                musicToPlay = music.title;
            }
        };
    };
}
setInterval(musicLoop, 1);
