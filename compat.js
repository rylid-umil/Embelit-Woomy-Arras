window.global = window

global.utility = {
    log: (e)=>{console.log("[LOG]",e)}
}

window.process = {
    env: {},
    argv: []
}

window.serverMessage = () => {}
window.serverSocket = () => {
    return {
        on: (type, funct)=>{
            if(type === "message"){
                serverMessage = funct
            }
        },
        send: (e)=>{
            window.clientMessage(e)
        }
    }
}
window.WebSocket = () => {
    return {
        set onmessage(v){
            window.clientMessage = v
        },
        set onopen(v) {
            let waitForSockets = setInterval(()=>{
              if(!window.sockets) return;
              clearInterval(waitForSockets)
              v()
            })
        },
        send: (e)=>{
            window.serverMessage(e)
        }
    }
}

window.mapConfig = {
    getBaseShuffling: function (teams, max = 5) {
        const output = [];
        for (let i = 1; i < max; i++) {
            output.push(i > teams ? 0 : i);
        }
        return output.sort(function () {
            return .5 - Math.random();
        });
    },

    id: function (i, level = true, norm = false) {
        if (i) {
            return !!level ? `n_b${i}` : `bas${i}`;
        } else if (norm) {
            return "norm";
        } else {
            const list = ["rock", "rock", "roid", "norm", "norm"];
            return list[Math.floor(Math.random() * list.length)];
        }
    },

    oddify: function (number, multiplier = 1) {
        return number + ((number % 2) * multiplier);
    },

    setup: function (options = {}) {
        if (options.width == null) options.width = defaults.X_GRID;
        if (options.height == null) options.height = defaults.Y_GRID;
        if (options.nestWidth == null) options.nestWidth = Math.floor(options.width / 4) + (options.width % 2 === 0) - (1 + (options.width % 2 === 0));
        if (options.nestHeight == null) options.nestHeight = Math.floor(options.height / 4) + (options.height % 2 === 0) - (1 + (options.width % 2 === 0));
        if (options.rockScatter == null) options.rockScatter = .175;
        options.rockScatter = 1 - options.rockScatter;
        const output = [];
        const nest = {
            sx: oddify(Math.floor(options.width / 2 - options.nestWidth / 2), -1 * ((options.width % 2 === 0) && Math.floor(options.width / 2) % 2 === 1)),
            sy: oddify(Math.floor(options.height / 2 - options.nestHeight / 2), -1 * ((options.height % 2 === 0) && Math.floor(options.height / 2) % 2 === 1)),
            ex: Math.floor(options.width / 2 - options.nestWidth / 2) + options.nestWidth,
            ey: Math.floor(options.height / 2 - options.nestHeight / 2) + options.nestHeight
        };

        function testIsNest(x, y) {
            if (options.nestWidth == 0 || options.nestHeight == 0) {
                return false;
            }
            if (x >= nest.sx && x <= nest.ex) {
                if (y >= nest.sy && y <= nest.ey) {
                    return true;
                }
            }
            return false;
        }
        for (let i = 0; i < options.height; i++) {
            const row = [];
            for (let j = 0; j < options.width; j++) {
                row.push(testIsNest(j, i) ? "nest" : Math.random() > options.rockScatter ? Math.random() > .5 ? "roid" : "rock" : "norm");
            }
            output.push(row);
        }
        return output;
    }
}

window.require = (thing) => {
    switch(thing){
        case "../../lib/util.js":
        case "./util.js":
        case "./lib/util":
            let angleDifference = (() => {
                    let mod = function(a, n) {
                        return (a % n + n) % n;
                    };
                    return (sourceA, targetA) => {
                        let a = targetA - sourceA;
                        return mod(a + Math.PI, 2 * Math.PI) - Math.PI;
                    };
                })()
            let deepClone = (obj, hash = new WeakMap()) => {
                    let result;
                    // Do not try to clone primitives or functions
                    if (Object(obj) !== obj || obj instanceof Function) return obj;
                    if (hash.has(obj)) return hash.get(obj); // Cyclic reference
                    try { // Try to run constructor (without arguments, as we don't know them)
                        result = new obj.constructor();
                    } catch (e) { // Constructor failed, create object without running the constructor
                        result = Object.create(Object.getPrototypeOf(obj));
                    }
                    // Optional: support for some standard constructors (extend as desired)
                    if (obj instanceof Map) Array.from(obj, ([key, val]) => result.set(deepClone(key, hash), deepClone(val, hash)));
                    else if (obj instanceof Set) Array.from(obj, (key) => result.add(deepClone(key, hash)));
                    // Register in hash
                    hash.set(obj, result);
                    // Clone and assign enumerable own properties recursively
                    return Object.assign(result, ...Object.keys(obj).map(key => ({
                        [key]: deepClone(obj[key], hash)
                    })));
                }
            let time = () => {
                    return Date.now() - serverStartTime;
                }
            let formatTime = x => Math.floor(x / (1000 * 60 * 60)) + " hours, " + Math.floor(x / (1000 * 60)) % 60 + " minutes and " + Math.floor(x / 1000) % 60 + " seconds"
            let getLogTime = () => (time() / 1000).toFixed(3)
            let serverStartTime = Date.now();
            let formatDate = function(date = new Date()) {
                    function pad2(n) {
                        return (n < 10 ? '0' : '') + n;
                    }
                    var month = pad2(date.getMonth() + 1);
                    var day = pad2(date.getDate());
                    var year = date.getFullYear();
                    return [month, day, year].join("/");
                }
            return {
                addArticle: function(string, cap = false) {
                    let output = (/[aeiouAEIOU]/.test(string[0])) ? 'an ' + string : 'a ' + string;
                    if (cap) {
                        output = output.split("");
                        output[0] = output[0].toUpperCase();
                        output = output.join("");
                    }
                    return output;
                },
                getLongestEdge: function getLongestEdge(x1, y1, x2, y2) {
                    let diffX = Math.abs(x2 - x1),
                        diffY = Math.abs(y2 - y1);
                    return diffX > diffY ? diffX : diffY;
                },
                getDistance: function(vec1, vec2) {
                    const x = vec2.x - vec1.x;
                    const y = vec2.y - vec1.y;
                    return Math.sqrt(x * x + y * y);
                },
                getDirection: function(p1, p2) {
                    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
                },
                clamp: function(value, min, max) {
                    return value > max ? max : value < min ? min : value;
                },
                lerp: (a, b, x) => a + x * (b - a),
                angleDifference: angleDifference,
                loopSmooth: (angle, desired, slowness) => {
                    return angleDifference(angle, desired) / slowness;
                },
                deepClone: deepClone,
                averageArray: arr => {
                    if (!arr.length) return 0;
                    var sum = arr.reduce((a, b) => {
                        return a + b;
                    });
                    return sum / arr.length;
                },
                sumArray: arr => {
                    if (!arr.length) return 0;
                    var sum = arr.reduce((a, b) => {
                        return a + b;
                    });
                    return sum;
                },
                signedSqrt: x => {
                    return Math.sign(x) * Math.sqrt(Math.abs(x));
                },
                getJackpot: x => {
                    return (x > 26300 * 1.5) ? Math.pow(x - 26300, 0.85) + 26300 : x / 1.5;
                },
                serverStartTime: serverStartTime,
                time: time,
                formatTime: formatTime,
                getLogTime: getLogTime,
                log: text => {
                    console.log('[' + getLogTime() + ']: ' + text);
                },
                info: text => {
                    console.log('[' + getLogTime() + ']: ' + text);
                },
                spawn: text => {
                    console.log('[' + getLogTime() + ']: ' + text);
                },
                warn: text => {
                    console.log('[' + getLogTime() + ']: ' + '[WARNING] ' + text);
                },
                error: text => {
                    console.log('[' + getLogTime() + ']: ' + '[ERROR] ' + text);
                },
                remove: (array, index) => {
                    // there is more than one object in the container
                    if (index === array.length - 1) {
                        // special case if the obj is the newest in the container
                        return array.pop();
                    } else {
                        let o = array[index];
                        array[index] = array.pop();
                        return o;
                    }
                },
                removeID: function remove(arr, i) {
                    const index = arr.findIndex(e => e.id === i);
                    if (index === -1) {
                        return arr;
                    }
                    if (index === 0) return arr.shift();
                    if (index === arr.length - 1) return arr.pop();
                    return arr.splice(index, 1);
                },
                formatLargeNumber: x => {
                    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                },
                timeForHumans: x => {
                    // ought to be in seconds
                    let seconds = x % 60;
                    x /= 60;
                    x = Math.floor(x);
                    let minutes = x % 60;
                    x /= 60;
                    x = Math.floor(x);
                    let hours = x % 24;
                    x /= 24;
                    x = Math.floor(x);
                    let days = x;
                    let y = '';
                    function weh(z, text) {
                        if (z) {
                            y = y + ((y === '') ? '' : ', ') + z + ' ' + text + ((z > 1) ? 's' : '');
                        }
                    }
                    weh(days, 'day');
                    weh(hours, 'hour');
                    weh(minutes, 'minute');
                    weh(seconds, 'second');
                    if (y === '') {
                        y = 'less than a second';
                    }
                    return y;
                },
                
                formatDate: formatDate,
                
                constructDateWithYear: function(month = (new Date()).getMonth() + 1, day = (new Date()).getDate(), year = (new Date()).getFullYear()) {
                    function pad2(n) {
                        return (n < 10 ? '0' : '') + n;
                    }
                    month = pad2(month);
                    day = pad2(day);
                    year = year;
                    return [month, day, year].join("/");
                },
                
                dateCheck: function(from, to, check = formatDate()) {
                    var fDate, lDate, cDate;
                    fDate = Date.parse(from);
                    lDate = Date.parse(to);
                    cDate = Date.parse(check);
                    return cDate <= lDate && cDate >= fDate;
                },
                
                cleanString: (string, length = -1) => {
                    if (typeof string !== "string") {
                        return "";
                    }
                    string = string.replace(/[\u0000\uFDFD\u202E\uD809\uDC2B\x00\x01\u200b\u200e\u200f\u202a-\u202e\ufdfd\ufffd-\uffff]/g, "").trim();
                    if (length > -1) {
                        string = string.slice(0, length);
                    }
                    return string;
                }
            }
        break;
        case "./lib/random":
            const names = ["That Guyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", "SOMEONE", "꧁༺𝓘𝓷𝓼𝓪𝓷𝓲𝓽𝔂༻꧂", "🅸 🅰🅼 🅶🅾🅳", "I", "jaffa calling", "Ill Tear your eyes out..", "Me-arac", "Aniketos", "🌌Miñe🌌", "ℭ𝔬𝔣𝔣𝔢𝔢", "Akilina", "Mythical", "exc", "=", "o o o o o o o o", "!!!", "Lixeiro do mal", "Thanks M8", "Frost? Mobile", "Dream", "We Do A Little Trolling", "earth", "NightFire", "Free to insult", "dino", "AMOGUS??????????????", "bruh", "No Surviors", "<[AXS]> RASHOT", "Pizza Bread", "[lag]Armando", "Gay Overlord", "willim", "Everything RAM Mobile", "General", "H̵͊̕ė̵̮l̷͎̈́l̵̅͛ơ̸͊", "{WOF} Nightwing", "footeloka", "[⚔️wiki]₵₳V₳ⱠłɆⱤ", "Jes;/;ter", "Team Boom", "🖤ISAAC🖤", "naruto", "занято42/Busybody42", "A+", "Raul39", "Lety <3 :)", "team protect", "i will troll :D", "heroy_105", "[FBI]Σvi₺ℭℏἏ❀₴#1628", "BigBadBoom", "nope", "glurip", "ffk the desrtroy", "Spin=Team", "comrade", "Alkali", "Impact of TY-77", "😈Stormys Domain😈", "YOUR BAD = YOUR DEAD!!!", "pushmetothe sancuary", "Im not a tank", "Snow", "Hm", "DanceTillYou'reDead", "gmonster", "Die!!!", "developer", "noob", "zX-TwinChilla-Xz", "[BK] [XC] PAKISTAN", "Bryson", "Musa♗ - The Shipwrecker", "bob", "Mothership Drone", "t-rex vs raptor", "mai", "Arisu", "gamer.io", "RİKKET FAN", "FOLLOW ME OCTO TANKS", "XP_Toxic_CJS", "TV", "constructor", "among us", "jkl", "XP_Toxic_CST", "d", "I love nahu", "Spade", "XxNicolas GamerxX", "xAd_rian", "FabianTu", "Eminx", "max", "OOOOOOOOFfffffffffffffff", "WalleeE", " KA2", "MIKE", "pedro :(", "BEDROCK", "Frostbite#6915", "koishi", "eu tenho a melhor mae^-^", "asdfghjkl;:]@ouytrewq", "😎👿david988😎👿", "Zaphkiel", "tryhard mode on !!!!!!!", "⚰️🔥👻WITNESS ME👻🔥⚰️", "[Σϰ][Ωϰ] ...", "That Guy", "Aniketos", "Play wommy-arras.io", "ARMADA", "// jAX", "🔱Ƒιяєωσяк🚫", "DEATH TO TEAMERS", "Milan", "your worst lightmare", "XxshadowxX Ilove u", "Alkaios", " 🥧π🥧", "🔱 𝓽𝓲𝓶𝓮𝓽𝓸𝓭𝓲𝓮 🚫", "Can u see me? :D", "Apollon", "ok", "Crazyattacker9YT", "XtremeJoan", "cz sk", "give me your butt dude", "[🌀]Brain𝐼nHalf", "Hexagon Temple", "-_-", "You", "CACA", "Athena", "Artemis", "DOEBLE TOP!", "the only one", "hi (original)", "SOMEONE", "can you beat me smashey", "s7ㅋㅋㅋ", "pika :P", "Fallen", "Big Papa", "m̸̐̽ᵃ𝔭ʟₑ౪🌸🎀🌺🌷🩰🧁", "GONIALS", "прівіт", "lnwZa007", "🐸🐌【HapPy】", "Daluns the one?", "CAMALEON", "factory not op :(", "/BIG BOYRockety", "circus of the dead", "𝒮𝔭00𝔡𝔢𝔯𝔪𝔞𝔫", "hackercool", "🔱⨊ $؋₲₥₳🚫", "Go Away", "Protector Of Worlds", "me", "vn", "RAHAN", "........................", "Soviet Union", "Flash", "❰𝞑𝞡𝞣❱ 𝝙𝝼𝝴𝝶𝘂𝝴", "🌌Miñe🌌", "King Pikachu", "EzzeKiel", "h", "Homeless man", "Asdfghjkjjhgfdsdfghjhgfd", "Felchas", "starwarrior", "Spin=Team", "TERA BAAP✿AYA★💓Bhagwanmr noob", "Dream", "DIEGO", "Lagmat YT = 🎷 channel", "be dum like me", "lagg", "APplayer113", "tiky", "🇧🇷HUE🇧🇷", "am low, I Need Backup!", "Thunder(Tapenty)", "Beeg Yoshi Squad", "reeeeeeee", ";]", "Arena Closer", "abd lhalim", "Badaracco", "emir", "Türk  polisi", "Paladin", "stop plz", "d", "glenn <3 rachel", "[AI] Kidell", "dan", "I am milk", "Türk'ün Gücü Adına🌸 OwO", "҉s҉h҉u҉n҉a҉", "Teuge", "Dave", "abbi_alin", "im a joke", "huy vn :D", "🌊🦈🌊", "scortt reach 1m friend", "ET", "vlasta", "𝒰𝒞ℋİℋ𝒜", "Nyroca", "German", "[ɨƙ]ɳøʘɗɫɚ", "I'm so lag(sinbadx)", "🇸🇦", "asdf", "X℘ExͥplͣoͫຮᎥveﾂ✔", "Apollon", "^^", "I", "natasha", "no me mates amigos", "dáwsda", "FEWWW....", "lol", "A team with 💚 is doomed", "Raul39", "Noob AC", "ddqdqwdqw", "[MG] GLITCH TR", "LemonTea", "Party_CZE", "Diep_daodan", "What?", "kuro", "cute pet", "demon", "ALEXANDER👑💎", "Cursed", "copy The tank", "", "dsa.", "Vinh HD", "Mago", "hi UwU", "avn", "d", "naruto", "ARRASMONSTER KILLYOUha5x", "MICAH", "Jotaro", "king vn", "𝕰𝖓𝖊𝖒𝖞_𝕯𝖔𝖌", "Raoof", "Leviathan", "SUN", "❬☬❭  ⚜️Ð𝐙𝕐 ッ 〜 🌷", "FALLEN SWORD", "🇧🇷HUE🇧🇷", "BoyFriend [FnF]", "motherhip", "𝓼𝓮𝓻𝓲𝓸𝓾𝓼𝓵𝔂", "lolera", "Dark Devil", "press F", "Detective Conan", "Pet", "MAICROFT", "Holy", "IXGAMËSS", "h", "umm,dab?", "Ihavelocty", "ewqasd2021vinicius", "[🇻🇳] Hùng", "I Love you", "Healer", "hacker lololololol", "boooster.io", "dscem", "bibi", "TEAM POLICE", "", "jj", "SHARK", "arena closer", "•长ąϮëąℓ⁀ᶜᵘᵗᵉ╰ ‿ ╯ ☂", "Weяw𝕖𝐑ώ€я𝓺q2️⃣prankeo", "nani?", "OTTOMAN EMPİRE", "------------------------", "kr9ssy", "not P", "winnner", "friendly", "genocide BBB", "HI", "I'm poor:(fortnine duo", "JSABJSAB", "jmanplays", "starwarrior", "were", "PLAYER", "mothership protrector 1", "Gamer🎮", "6109", "PRO", "enr", "_____P___E___N___E______", "annialator", "kaio", "(UwU)", "Arras.io", "...", "Denied", "Paladin", "Zaphkiel", "Pikachu ^~^", "ah~", "Steve", "{<:Void", "AƓ Aηgєℓ#Use AƓ  Tag", "Amyntas", "⁄•⁄ω⁄•⁄卡比獸🖤", "poui", "PH - r҉a҉i҉n҉", "A M O U G U S", "idk bro", "Artemis", "Hey team", "b T規RㄩIes矩W ˋ*ˊd", "한국 Lime Lemon", "phong fan vn!", "me fan valt shu lui free", "Mobile no work", "Hi 香港😘> pls don't kill�", "[/G]/O1D SL/Y3R", "mil leches", "Major Meowzer YT", "Providence", "Lore", "ОХОТНИК", "vordt", "Linghtning McQueen", "Pentagon Nest Miner", "꧁☬☬😈꧁꧂ ☠HARSH ☠꧁꧂😈 ☬☬꧂", "vovotthh", "Nope :))", "||||||||||||||||||||||||", " ꧁ℤ𝕖𝔱𝔥𝔢𝔯𝔫𝕚𝕒꧂", "CTRL+W=godmode(viet nam)", "🔱LordΛภ𝓰𝖑Ɇ🚫", "1 + 1 = 3", "XYZ", "[PFF][|| ı'ɱ ცąცყ||]", "Boop", "RAPTURE", "o", "/.//.[]", "", "Roskarya", "no. 9", "Lost MvP#7777", "Jon", "🔱Saint LilY⚜🚫", "Green.grey.purple.blue.", ":P", "C - 4 Spank Spank", "VN", "Snapwingfriendstriker007", "overlord is:):)", " pluss亗", "[Repsaj]ĎąŗĸMãştɛɾ", "Phoenix_Gamer", "Relatively Harmless Tonk", "Array.io", "Spin=Team", "I am your shield :)", "j", "1", "TheBasil", "【The L1litle One】", "X.Clamator .YT", "ENDERMÉN", "CC", "BEST", "Among Us", "lobo", "asky", "Opan Come Go Note Yeah", "Bowler", "ad", "haha bowler no 1M", "Tin", "[GZ]GESETA", "woomy arras.io", "Remuru Tempest", "PvPok", "Scarlet Rage(mobile)", "nam", "STRIKER007", "[VN] MeltedGirl", "100000000000000000000000", "eee", "Q", "mắm tôm", "REVENGE✨", "Achi", "AC Perú", "bvnfgh", "hi", "Pet :3", "little bitch", "khang", "lets be freinds guys!!!!", "sans pro", "phantanduy", "[AC] VGamerZ", "StevenUniverseFan", "azen", "Waffles", "jesian", "Ⱬł₭Ɽł₮₳Ӿ", "Gay Overlord", "pikachuboi124", "mundo x bomb", "ducky", "🌀DESTROYER🌀", "Stupid Overlord", "++", "phantantri", "VoteOutRacists", "Denied", "floof", "Bowler", "Sinbadx", "🎈IT🎈 APOCOLYPSE", "ExpectMe2BeDeadCuzOfLag", "Damage", "Aniketos", "⨝∑₮ξ₹ͶΛL⨝", "Artemis", "_", "Archimedes", "♪KING♫♕-dev#3917", "no", "Doofus", "MINI defender", "꧁✯[🕋]MÂRSHMÆLLØW 𖣘✯꧂", "Alkaios", "(・ω・＼)i am(/・ω・)/pinch!", "Việt Cường 2A5", "I Love you", "fdsmn", "!", "R", "you shall not pass!!", "harmless shower", "lol", "Mythical", "oath sign", "finland", "bob", "hetman666", "lio", "VN~I LoVe You Chu Ca Mo", "Your mom", "Friendly", "the protector", "leave me alone pls", "Grill my flippen butt", "n o i c e", "bo", "onsen", "._.", "Frostbite#6915", "💞", "CTRL+W=godmode", "noob", "ad", "Soviet Union", "be freind", "   HCM MUÔN NĂM", ":P", "FALLEN SWORD", "anh tuấn anh nè tôm", "fnf is a poop", "Zp r oZ", "꧁҈$ꫀꪖ  ,҉ℭն𝚌մꪑ𝜷ꫀ᥅ ༻", "VN:P", "margaret thatcha", "[VN]Ảo Vãi Lồn🤔", "ㅋㅋㄹㅃㅃ", "pin h 3", "Vỹ đẹp zai", "Snapwingfriendstriker007", "everybodybecomespike", "a", "1", "vyde", "Mothership Drone", "op", "click 'F'", "Noob", "🐰chiro🐰", "PJfd13", "CELESTIAL", "Team", "Pet :3", "FeZTiVAL", "anime", "t", "C - 4 Spank Spank", "Rockety", "Valley", "Im New,dont kill me pls", "Friends?", "하이루", "KILL ME I DARE YOU", "pet basic -(======>", "pet", "♕ ❤VIỆT NAM ❤♕", "team ?", "꧁༒☬✞😈VîLLãñ😈✞☬༒ ꧂", "Công", "Opan Come Go Note Yeah", "1 + 1 = 3", "Elite Knigh*", "vn{CHP}", "Dasher8162", "Xlo-250", "under_gamer092", "VN", "Mtp tv tiktoker", "Denied", "Paladin", "『YT』Just𝕸𝖟𝖆𝖍ヅ", "shame", "Corrupt Y", "spin= team", "Please no more Y team", "Syringe", "Pickerel Frog", "Bitter Dill", "Your Triggering Me 🤬", "117", "FleRex", "Archimedes", "Neonlights", "🌌Miñe🌌", "〖-9999〗-҉R҉e҉X҉x҉X҉x҉X҉", "FEWWW....", "bob", "0800 fighter¯_(ツ)_/¯", "◯ . ◯⃨̅", "𝕁𝕖𝕤𝕥𝕖𝕣", "Apollon", "Ɓṏṙḕd Ṗläÿệŕ {✨}", "i never bin 1 mill", "残念な人", "KillerTMSJ", "Дракон", "[VN]Ảo Vãi Lồn🤔", "😎", "warrion", "ARMADA", "asd", "alr-ight", "AAAAAAAAAAAAAAAAAAAAAAAA", "♣☆  ⓂⒶ𝓻s𝐇Ⓜ𝔼𝕝ᒪσω  ☯♚", "FREJEA CELESTIAL 1.48MXyn", "poker 567", "C", "4tomiX", "meliodas", "Việt Cường 2A5", "(ZV) foricor", "", "Marxtu", "me?? 😢", "m̸̐̽ᵃ𝔭ʟₑ౪🌸🎀🌺🌷🩰🧁", "PeaceKeeper", "Eeeeeeva", "diện", "[MM]  Ⓕ𝓸𝓻𝓫𝓲𝓭𝓭𝓮𝓷", "Doofus", "TS/RRRR", "Nothing.", "🐶(X)~pit¥🐺te matare jajaja", "⌿⏃⋏⎅⏃", "go", "[PFF][|| ı'ɱ ცąცყ||]", "hola", "polyagon", "Galactic slush", "9999999999999999999999dx", "zaphkiel celestial", "noob", "$$$%$la plaga$%$$$", "Sorry broh", "Roberto", "EHSY BAAA", "Nnmnnnmmmnmmmm", "use fighter plsss :)", "Mini", "spitandsteelfriend", ";)", "lol", "Mobile player", "the ultimate multitool", "i vow to protect", "oofania", "hi", "why am i here", "H̵͊̕ė̵̮l̷͎̈́l̵̅͛ơ̸͊", "A.L.", "Hi", "ONE SHOT", "luis", "saitan", "Felchas", "Im gonna knock you out", "Aquiles TEAM LOVE", "qwertyuiop", ":3", "diep.io", "invisible drones", "team plz:(", "DIONAX", "again and again", "100000000000000000000000", "nicolas123", "JESUS E AMOR", "Alice", "Bob", "Carmen", "David", "Edith", "Freddy", "Gustav", "Helga", "Janet", "Lorenzo", "Mary", "Nora", "Olivia", "Peter", "Queen", "Roger", "Suzanne", "Tommy", "Ursula", "Vincent", "Wilhelm", "Xerxes", "Yvonne", "Zachary", "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Hotel", "India", "Juliet", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-Ray", "Yankee", "Zulu", "The Bron Jame", "[MG] Team", "team??!", "trump", "facu++", "TEST", "Jake", "PEST_YT", "GOKU", "big me!", "arras > diep", "k", "[MG] PRO TEAM", "Solomon", "novice", "noob", "Angel", "😈", "max", "Allah Is King", "Hug Me", "dont touch me", "leonardo", "colombia", "", "Friends ? ", "✈", "Kim Jong-Un", "1", "An unnamed player", "agar.io", "road to 1m", "FEED ME", "DOGE", "GABE", "boi", "[GZ] team", "buff arena closer", ".", "Ramen", "SPICY RAMEN", "Jera", "[insert creative name]", "Rake", "arras.io", "KOA", "die", "king of diep", "Hagalaz", "Ehwaz", "Dagaz", "Berkanan", "Algiz", "Blank", "Mango", "TOUCAN", "Bee", "Honey Bee", "oof", "Toast", "Captian", "Alexis", "FeZTiVAl", "kitten", "Derp", "Gabogc", "U S A", "name", "[IX] clan", "LOL", "ur mom", "llego el pro!", "Impeach Trump", "luka modric", "bob", "MATRIX", "no", "e", "kek", "read and u gay", "Decagon?", "take this L", "mm", "Aleph Null", "summoner", "T-REX", "buff basic", "stink", "jumla", "no team Kill", "pet", "V", "Broccoli", "toon", "Sinx", "JTG", "Hammer", " ", "Basic", "Discord", "NO WITCH-HUNTING", "salty", "CJ", "angel", "a salty discord kid", "satan", "NoCopyrightSounds", "Am I Sinbadx?", "AHHHHHH!", "rush", "squirt", "AMIGOS", "Windows 98", "FeZTivAL", "illuminati", "Fallen Bot", "Anonymous", "koala", "iXPLODE", ":D", "BrOBer The Prod", "OwO", "O_O", "UwU", "Alpha", "TheFatRat", "kokak", "D:", "YouRIP", "WOOT", "𝕯𝖆𝖙 𝕺𝖓𝖊 𝕭𝖔𝖎", "hell", "Y", "why", "Lucas", "LOCO", "FeZTi Fan", "0", "AK-47", "Friend pls", "cool", "NO U", "hmst", "Sub 2 Pewdiepie", "T-Gay", "t-series succs", "Balloon", "CX Fan", "The Nameless", "What?", "Our World of Tanks", "Real AI", "Totally Not A Bot", "...", "Fallen AI", "green square", "Dagaz 2.0", "Internet Explorer", "teamplz", "Paradox", "Fallen Nothing", "developer", "ruler of tanks", "IRS", "king slayer", "sael savage", "Zplit", "CUCK", "Popo", "¡AY PAPI!", "Vogelaj", "Ruthless", "BOMBS AWAY", "im new", "best", ".-.", "dont feed me", "rIsKy", "Brian", "Angel", "Knoz", "Caesar", "Baller", "¿Equipo?", "¡Vamos!", "Road To 10m", "Real Hellcat", "Real Kitty!", "Canada > USA", "A named player", "Tyson", "Slayer", "666", "Nooblet", "M8", "Trans Rights", "Bar Milk", "Jambi", "Elmo is gone", "The Grudge", "Rosetta Stoned", "Lateralus", "Fourty-Six & 2", "Vicarious", "Judith", "Give Me Wings", "The Pot", "look behind you", "Bruh Momentum", "Sucko mode", "ArenaC", "!foO", "Lateralus", "Disposition", "Reflection", "Triad", "Mantra", "The Patient", "Real CreepyDaPolyplanet", "Real Despacit.io", "Mew", "Magikarp", "Real Dark Knight", "ok boomer", "PP Tank", "COPPA Sucks", "meme", "Womp Womp", "W = Team", "Real CX", "Neo", "crasher", "Minecrafter", "King of Pros", "Vanze", "Have mercy...", "Im scary", "cookie", "Liberty Prime", "bruh moment", "Rubrub", "Banarama", "poyo", "Nova", "Creeper, Aw Man", "Theory of Everything", "DJVI", "jotaro kujo", "Faaip de Oiad", "MrBeast", "ForeverBound", "Are you okay?", "BUSTER WOLF", "MJK", "F-777", "Dex Arson", "alpharad", "ORA ORA ORA", "Waterflame", "DJ-Nate", "penguinz0", "#teamtrees", "Electrodynamix", "brogle", "im beef", "Salsa Verde", "The Audacity of this tank", "Joe Mamma", "Red Hot Chili Pepper", "Halal Certified Tank", "Coronavirus", "The Common Cold", "The Flu", "Ight Bro", "Little Red Rocket", "Bruh Monument", "Bruh Monumentum", "Spree", "KING CRIMSON!", "THE WORLD!", "ZA WARUDO!", "taal volcano", "Synth", "Brotherhood of Steel", "Railroad", "A Settlement Needs Your Help", "final destination, fox only", "food", "fezti fan", "FeZtiVaL", "CATS", "Careenervirus", "Dumb", "[AI]", "Insanity", "Steven Universe", "MrBeast Rules", "Oswald Veblen", "how to get testbed?", "Mahlo Cardinal?", "mf=r", "dragons go mlem", "丹†eÐiuϻbee††ℓy†", "TωorᴍaͥHoͣrͫnet", "NoͥteͣwͫoℝthyCสtHeสt", "ᴴᵃⁿʸᵐᵖᶜᵘᵗᵉᴾᵃⁿᵗˢ", "Oᶠectบสlsereedl", "CℓeDⱥiryVⱥiͥήtͣeͫℓ✨", "EyeCⱥnᖙyᖘunᖙeseg", "Witψภclคi", "⫷PนℝeMiͥℝeͣyͫ⫸", "𝓕𝓸𝓵𝓿𝓮𝓞𝓵𝓭𝓳𝓸𝓴𝓮⚔", "⦃φօʂìէìѵҽԱʂէìէմąɾ⦄", "🎻Hiקle𝔶lutקuᖙiѕh", "✐ЯΣΛ爪ΛПΣЦЯΣ", "∉Eᴍiภeภ†Miภa多iho∌", "[M๏ℝec𝔥Muy𝔊๏rᖙØ]", "やlachaҜ𝔢d๖ۣ•҉", "FicบℝneCบʝo", "Jame∂iͥPaͣtͫtψMeℓt", "PℝoͥfuͣsͫeOftsΐ", "Hiภⱥls†MiAlmⱥ", "Cสneͥຮeͣfͫight", "Ŧฬeͥirͣoͫ͢͢͢Tฬin🅺les😎", "VenomoบຮNorτnear", "🎲๖ۣۜƤⱥranAsian𐌁øyz", "StͥedͣiͫรDilrubⱥ", "ᖘiͥŇgͣeͫsτri", "Ac𐍉͢͢͢ᵐᵐSiรcuᵐMum🌼", "⫷EᴍiήentOffec☢ne⫸", "Evalingђteᖙseᖙi", "FoบຮervͥᎥdͣeͫ", "⪓Offigeร℘er⪔", "Vuͥldͣrͫatediesio", "⁅🆂🅴🅽🆂🅸🅱🅻🅴🅰🅽🆃🅴🅽🆂🅸🅾⁆", "Houℝgͥΐcͣaͫr︾", "Doe£🆄lMψSo🆄l😬", "Ǥrel𐍉resit", "𐄡𝒫𝑜𝓉𝑒𝓃𝓉𝒯𝒾𝑒𝓃𐄪", "୨𝔄𝔟𝔫𝔬𝔯𝔪𝔞𝔩𝔄𝔫𝔫𝔞𝔩𝔤𝔞𝔱⪑", "ElfuภΐBΐBαr͢͢͢rel", "Liͥveͣrͫiภgบi", "𝕆𝕗𝕗𝕠𝕦𝕝𝕕𝕠𝕨𝕚𝕥𝕚𝕝⚡", "Na†eℝaŇiŇgs⚠", "𝓗𝓪𝓭𝓭𝓚𝓱𝓪𝓷𝔃𝓲𝓻", "Partℽ𝓌𝔥ᎥꜱᎥภ∂บc", "Aήสℓroseℓ♛", "Aຮiaτinga", "⑉Elͥegͣeͫήτreα⑉", "Inͥ∂eͣlͫψຮtr", "CoϻpePregy", "〖Grͥetͣyͫdrest〗", "⑉S☢mp☢รpͥGuͣmͫp⑉", "丹pสτheτᎥcṨømpⱥthⱥ", "⁣𓆩NօthΣurΣeŇtment", "Ofͥ†eͣnͫcheye", "「FℓuͥttͣeͫriήgItingenv」", "😻SƤ𝔯iήgy🅼orkingɭ", "〖ṨoftOftwTนft〗", "GℝegⱥℝiouຮMeⱥℝee☂", "🏄", "😌CømiภgPoթcorn", "MossfนlthapeᖙyŇ☘", "๖ۣۜ山☢uͥsiͣaͫℓℓeﾂ", "A𝖙hedi🆁on", "✰QนestaΐŇgl✰", "Wⱥsͥ†iͣoͫnfℝou", "｟VoℓคtᎥℓeAtentᎥⱥt｠", "Arninℓץie", "★彡[๖ۣۜƊreคᖙ͢͢͢๖ۣۜƊeωᖙrop]彡★", "JบicץJบnᖙen", "Öµł†µÐï†ê§", "「Ate∂iͥDiͣlͫly๖ۣۜßØo」", "〖Aήthent฿ⱥdbreⱥth〗", "🎹ͲօցìօղժƓմղժ", "᚛VerรeᖙTurรeᖙΐe᚜", "Sקityℝicђe", "❅Camedΐℝ๖ۣۜƊℝedd❅", "IŇeττivie♛", "﹄𝔇𝔬𝔫𝔨𝔢𝔶𝔒𝔠𝔨𝔢𝔡𝔲﹃", "Dousermⱥi∂ﾂ", "彡ΛЯᄂƧΣᄃΛ彡", "⁣𓆩🅰🅳🅼͢͢͢🅸🅽🅴🆆🅴🆁🅴🅽🆃", "AŇergeNeesคnค", "💤Fสή†สຮ†icͥAfͣfͫic", "⌁NaτemacτᎥ⌁", "LΐvͥesͣeͫsChΐℓΐ", "íɑʍOภຮgrⱥigน", "𝓟𝓻𝓸𝓰𝓷𝓲𝔁𝓽𝓾𝓻", "😶ＧｕｔｔｕｒａｌＰｕｔｈｅｒｉｐ", "Ϛageร𐍉HϚ𐍉ℓ☢😇", "𝕹͢͢͢𐍉τempℓeᴀɾ😠", "🚣AՇitℽสrDสrͥinͣgͫ", "༺Hⱥrm๏ni๏us๖ۣۜ山ermisty༻", "CoͥŇeͣrͫŇizαr⚔", "Tormaภτmerΐcaภg", "⦇ƑⱥℓiKi𝖒多๏Ṩℓice⦈", "⚡Uppontork⚡", "C𝓪ge¥W𝓪gencie︾", "彡Ri๏ภt͢͢͢αhαbigiv彡", "😐🅲🆄🆁🅽🅰🅽🅱🅾🅽🅰🅵🅸🅳🅴", "ShⱥŇdΐDΐŇyͥerͣoͫ❥", "EήthHⱥlfPint", "𝕴ภc☢meMสch☢mคn🏀", "๖ۣۜ山Øozץ๖ۣۜ山ome♛", "J𐍉viαℓC𐍉vi𐍉", "Exͥamͣiͫckร☢ή", "🌰🆂🅴🅽🅸🅽🅶🅻🆂🅸🆁🅴🅽🅸🆃🅰", "⑉Officђ𐍉uττi⑉", "❅Ju͢͢͢diciøusᖘheสdjur❅", "Ｗｅｄｉｓｐｉｃｈａｖｉｔ▒", "▥Jeสncies†i?", "JohŇiteƤⱥ", "𐐚ewil∂ere∂Ne∂iภ", "ñê§łê§þê🐨", "Rᴇsp☢ήsΐvᴇC☢ήsi", "〖Is†rͥสlͣlͫץpe〗", "L𐍉veCaภdψMaͥภdͣeͫra✨", "F๏นghτsere", "𝕃𝕠𝕘͢͢͢𝕖𝕕𝕦𝕒𝕝𝕚𝕒", "☁Ofเrethe☢", "Aᖙeth☢☢LØυᖙmØυth💌", "CyͥniͣcͫalIntudynt", "CoภsนdBeสภs", "TheͥℝvͣeͫᖙS†aℝveᖙ", "Iτedeຮeded", "♐OfficebᵒℽOffee", "︽CӨ🅽𝔞ℓsoᴍe𝔱tee", "🐯ᎠⱥrlΐภgArҜs🅱ⱥt", "Heͥstͣsͫookerinec", "TaleήtedEήtiรa⚔", "S๏ñcͥifͣeͫ͢͢͢Mนñchie🎤", "JeͥcrͣeͫสCleʝerrℽ", "❅ᴛᴏᴀꜱᴛʏᴀꜱɪᴏɴᴅꜱᴛ❅", "թг๏Ɔoupsoɹʇɥ", "HeaຮΉ𐍉ducҜᴸᴵᶠᴱ", "⁅๖ۣۜƤoeτicViτhic⁆", "S𝒽ⁱlⁱŇgบre", "IfΐeรeŇUŇΐverรe", "Offᖙ🅰𝔶botᴳᵒ", "𝓟𝓸𝓻𝓮𝓽𝔂𝓷𝓽𝓼𝔰𝔲𝔭𝔢𝔯", "𝓗𝓮𝔂𝓸𝓗𝓸𝓷𝓮𝔂𝓬𝓪𝓴𝓮🎨", "ƤlคץรChⱥή∂☢ese", "Awes๏meStanψt๏m", "FαcͥτoͣrͫyInτorτ", "≪Nummiຮ๖ۣۜ山his𝔱l͢͢͢er≫", "IssℓαtSℓoͥppͣyͫ", "PђeαlαHitcђeภ", "ⱮօղѵҠօմҟӀąʍօմ", "🎮丹թթєɐli𝓃gQuɐli𝓃gє", "「Grǝacklψeτ」", "IήesนrͥŇeͣmͫ", "≋Beήτic͢͢͢ediή≋", "Meͥภeͣqͫuสles♦️", "😦UnwielᖙℽNexק", "WateᖙeToℝ℘eᖙo", "Veℝ∂สntͥSiͣmͫสntสc", "「ƤสrigͥCoͣrͫriᖙor」", "Anͥkeͣnͫtscru", "⪨Äภioภ§Jสภeman⪩", "ᴵᴬᴹDaͥzzͣlͫᎥŇgWᎥlieรτi", "Naΐgͥΐcͣaͫℓℓef", "『WสψstℝWสt🅲hfส🅲e』", "🐅Exקreαrfer", "OfͥfeͣcͫKΐck𐍉ff", "☽乃ץՇ๏קץՇђ๏ภ☾", "ṨuήnyAuserสny", "Meℝaͥ∂lͣyͫקen⚠", "ͲąղէìçմҍӀ", "Se∂iสCสucสsiสŇ", "OfͥfeͣcͫelŦec†𐍉", "He∂uαlrigive", "⧼Deͥpsͣeͫᄂfarg⧽", "AήixecemØcultiή", "Ŧollicuรectior", "W๏rͥteͣsͫSᴍartie", "丹ภefFคภgs", "Ot☢☢sℓคwคℓtede", "❅WђizคJคckWђi†e❅", "Heɭɭ฿☢ᴿåbo", "「Abi∂iŇgDicaŇℽ」", "Isͥheͣrͫΐτaℓes", "᚛Θficຮoภeຮ᚜", "๖ۣۜᖘⱥuͥncͣhͫyCⱥustiᴍ", "🚊Ӌeสτenͥτrͣiͫ͢͢͢n", "𝔗ec†iga†eechersҜ♐", "⚡U†eͥreͣvͫe∂a⚡", "𐄡ɢlaήsaรailØrM͢͢͢aή𐄪", "ⲘสysτᎥnⲘᎥnou😌", "°”Ṩi𝓭ityethicl”°", "J๏ѵiaℓP𝓇iaℓ", "๖ۣۜℜevⱥsนpSⱥssⱥfrⱥs", "M☢tivͥαtͣiͫngB☢nαtiff", "༺Thøuɾnᵃnꜱt༻", "I๓թe𝒸cąbℓeMusper☘", "✰Aאָiͥcaͣpͫђeℓ✰", "ᶠ͢͢͢ᵉⁱᵍⁿᵉᵈᴸᵉˢˢᵃᵐᵉᵈ", "𝒞𐍉nl𝖞r𐍉𝖇s", "Grαcΐ๏uຮCaͥ๏uͣnͫc", "Mสmm☢τhT☢τh☢ldi", "𓊈卄ανσ͢͢͢ℓ丂αναє𓊉", "✰W☢☢ℓutte∂espect✰", "⁣𓆩ⱮմʂʂҽąⱮմʂէąçհҽ", "Ofͥerͣsͫやr𐍉fess𐍉r", "๖ۣۜ฿uͥ†sͣiͫ多Mu††er", "SⱥτBigPØτⱥτØ✪", "Inf𝔞M𐍉nFr𝔞ΐรe", "〖IŇviŇci多leAdeŇƤual〗", "🐯Hคndy͢͢͢Hคtiɭity", "ˢᵐᵒᵘᵗᵉᵐᵃᶜᴳᵒᵈ", "Ofͥteͣdͫΐe฿edbeⱥuty", "⦃ExtegสExtℝ𝒶H☢t⦄", "Orͥ∂sͣmͫนcessน⚔", "Y𐍉utђr𐍉uภ", "✰Tђℝ☢titsc✰", "íɑʍ≋AℓtŁiℓŦ𝓇Øℓl≋", "FiήgtFiggץ⚔", "ScieήtificPสti", "GrͥesͣsͫB𐍉sslคdψ", "Mⱥภumbℝip", "T๏iͥndͣeͫLⱥcewing", "★Shͥouͣlͫ∂en∂ieve★", "Suallizatiᴍe", "♐P͢͢͢herstst☢", "I†iͥonͣgͫingeℝna⚠", "Ofͥfeͣdͫg๖ۣۜßαllØfFαt❥", "๖ۣۜℜaͥnsͣtͫredu", "MØcipParรήip", "Se∂iͥรhͣiͫmส∂", "𝔚𝔥𝔞𝔫𝔡𝔢𝔱𝔉𝔞𝔫𝔞𝔱𝔦𝔠⇜", "๖ۣۜOffeℝtBαffy", "AttentiveFornate", "Faͥveͣrͫnext", "UnusuⱥʟFrøungdø", "Geຮຮionͥຮtͣaͫ", "୨丹𝓃d𝓼e๖ۣۜƤⱥ𝓃cⱥce𝓼⪑", "ร๏ɭɭร๏ภɭץ", "S℘iяiᵗe∂Pie🅽t💦", "L𐍉𐍉ภψSi𐍉ภaͥlsͣeͫ❥", "🎮𝕊ecτolαrץຮτ", "◤NorNoRegαrᖙ◢", "DeͥℓiͣgͫhτfuℓAnᖙeg", "Rec†scess", "✫Itͥคlͣlͫsømme", "⧼ᴀภqͥ𝕦eͣsͫτeds⧽", "๖ۣۜ山angຮᎥRagຮ", "HeͥᴍaͣdͫeDelᎥ𝖗Ꭵum😇", "⫷M🆄ɔtsΐ𝕓lest⫸", "Iภge†eͥℝeͣdͫu", "🐥IภêℝtAshtaℝt", "Pieceℓᴮøøkie🌺", "Ƒrͥedͣeͫτw☢u", "Imק𝔯essi𝕧eや𝔯iτs", "Reͥivͣiͫ๖ۣۜᗯeiner", "ReήsecoEnglishRose", "᚛UήisliήBigHuήk᚜", "TΐrelessToήdessΐ", "Sµccessfµ͢͢͢𝖑Toccesse", "HⱥŇceIcepicҜ❥", "Trͥitͣeͫ丹ภtຮeภtr", "AlสrᴍingSђerᴍ", "୨Fei𝓈tyLexte∂i𝓈⪑", "⚡H☢sH☢neͥℽbͣuͫn⚡", "🍃𝕲rคᎥŇคÈlคᎥs", "CℝectͥℓiͣgͫŇe", "Sollℽstriongst", "⦇¢aphօℓօSnappy⦈", "◤𝓟𝓲𝓰𝓰𝔂𝓒𝓸𝓾𝓰𝓰𝓵𝓲𝓼୧", "⚡Abͥ☢nͣdͫynᎠynสm☢⚡", "∉Gℽmͥnaͣsͫт🅸𝖈丹terΐamn∌", "▥ƆouƆouʌıɔʇıou¿", "𐐚ץƬuƬtepØω", "OffeรeรSugαrͥᖘuͣfͫf♛", "【Çðñêð₥͢͢͢å¢ïł】", "Aгti𝒸ulateUภtalaภ", "🆆🅷🅴🆂🅿🅸🆂🅷🅰🅳🅾🌗", "★AbͥreͣcͫuℓCuթieDoℓℓ★", "∉𝕾nappʸ𝓝alꜱ๏∌", "Fℓน††eriή𝓰T๏ήce͢͢͢∂in", "PeℝfectIteήeℝ⚔", "😋𐌁𝔯αήgsτ𐌁ruddah", "🌳H𐍉Ňe͢͢͢st𝓘Ňew", "ℓเττℓєA𝕤𝒾𝕤͢͢͢ul🅰natedes", "Agͥreͣeͫⱥ多leCⱥ多liรรi☂", "◤AŇdสtMสŇŇeͥℚuͣiͫŇ◢", "CaภdefJefe", "Neττeຮ℘andaττr", "Ofτeᖙบree", "Ƥ𝕣αlØ𝔫scallᴳᵒᵈ", "✰Habi†ualΘn∂ingua✰", "【EaℝŇestͥIsͣtͫaŇdne】", "ArΐsVΐssψ✨", "฿eenGoatees⚔", "Atereatha", "Θffi多ℓoTrou多ℓe", "GraվรⁱRนgraτ🌻", "𝕴ñⱥτ🅸vScrⱥtchy🐆", "AƤeͥndͣiͫMonLaƤຮin", "StͥunͣnͫingAndin", "⩻๖ۣۜᗯorl𝒹ly๖ۣۜᗯonsi𝕥u⩼", "Men†e∂eem", "〖CoℝdsђWaℝdoŇ〗", "🐫PønΛctiαrsenaℓ", "ᴴᵃⁿᶜᵉˢʰᵃⁿᵍᵒ▒", "PℝocͥRoͣbͫotobαmα", "BℝeͥncͣyͫtRสncoℝ", "▓TreήdץTrคm", "𝕻𝖑𝖆𝖙𝖎𝖘𝖊𝖓𝖙𝖙єค๓", "๖ۣۜBloαtyAnat͢͢͢e", "【Cบrruτiv𝖊͢͢͢ภ】", "✰VΐcͥtoͣrͫΐousStor∂eส✰", "✹Shΐll๖ۣۜᗯildfire", "Noωαselli", "Guͥΐlͣtͫless𐐚otlץsΐs", "RⱥyRⱥyDisђirⱥƤ", "𝔚hΐ†eℽWhΐm", "「Ciaℓiͥᖘhͣoͫbia」", "𐐚eeͥᖙgͣeͫήve", "千lu🆃🆃er𝕚𝓃gṨαu🆃e🏂", "᚛BℝαzenBℝeα᚜", "CoήMonƑrสise", "๖ۣۜ山iͥggͣlͫץ๖ۣۜ山ing⇜", "FeͥllͣsͫoϻƤlo", "㍶𝕎𝕠𝕟𝕕𝕖𝕣𝕗𝕦𝕝𝕍𝕖𝕣𝕗𝕠𝕣", "Sτiᵛeʀmin〽️", "Rilαtoℝyᴍ⚔", "₧Anสτ͢͢͢Rสτit☢", "Wสs†eGℽmⲘสs†eℝ", "PlaภtøƤee", "⚾ꜱcrค℘℘yIsτraℓΐf", "DittØήSqͥuaͣtͫty", "⚡O多ʝecτiveDeco⚡", "TสiͥsiͣgͫerƤsץmend☘", "OrryᎥeรᎥ๏", "Ƒuͥℓdͣsͫhinec", "ThaͥŇkͣfͫulChaℝᴍis", "íɑʍIsτʀᴇթ๏sᴇτ", "★Θfferencesթece★", "Ar†h☢uldre🅽diส▤", "ForgivingForn", "N𐍉ᴍbec𐍉ήts✨", "๔เгєςՇгє๔เς🐵", "〖Oภvest𐍉pΐ〗", "⫷Ofteภ𐍉Gift⫸", "🚣ᴅʀɪᴠᴇɴᴇᴠᴇʀʀ", "RⱥsƤberrψ๖ۣۜ山heriesi", "Affeuredi", "MⱥiήτFunͥτoͣnͫ", "ΘffireKhⱥήzir", "Meͥdeͣmͫeήdiήgeή", "★I†uℝFuͥℝmͣuͫzzℓe★", "⫷FⱥrϻbØyFⱥϻb⫸", "Itarᖙรcreϻa", "⋉Direllooductຮe⋊", "TreαNeαt𐍉", "SuթerBoℽAvetℽթe", "°”φմէէҽԱէʂվβìէʂվ”°", "Oⁿeรsitedit⚠", "⸔Ṩaΐηg↻haΐ͢͢͢nຮ⸕", "I𝓃gMøn🅰nge", "A∂aptableやapti☢ng", "〖WⱥsτrSτⱥbͥbeͣrͫ〗", "ཌInͥgeͣdͫighØ𝓊ndད", "█▬█ █ ▀█▀Asser†iveSegingin", "Ofteᖙucee︾", "CђⱥrᴍingPⱥcerᴍⱥr♛", "฿eͥirͣoͫᴍeŇclo", "∂яα¢σηιαη卄αη∂яє∂υ", "EthΐcαlͥHoͣdͫyetre⚠", "〖Tiͥสnͣyͫouℓthom〗", "AbrasiveBrivilly", "InceirKissyFace", "Ittelitingly", "SomentsSoul", "Wooksommen", "UnizPizzawife", "FersoPowerpuff", "MelodicDell", "SoftyOffee", "Joidaskin", "WhowerHotsnap", "PassionateLasiste", "ProbseVinDiesel", "ForessiKisses", "DawbufBunrose", "JudensPendulum", "DayeSaySay", "Watertitur", "AntilkMilkman", "Magaltyea", "Houstsibl", "IngheoAngon", "Byribibeg", "Gingentray", "Hichicapho", "ResoluteAntardso", "Andivedyngstims", "BeautifulToldif", "HostilityBustay", "IngiShinyGaze", "Anytimple", "NowSnookie", "WereituAtum", "Gortaitic", "ImposingVelsical", "Witionsips", "WhiteyWhati", "Grabourch", "ToastyImpaspen", "SensibleAlsem", "Enendscandspip", "Itycomplandshor", "VictoriousWousi", "OfteOfficeboy", "Phoodyeang", "BeneficentTocen", "ItisBityarani", "Hourabony", "Autooligue", "IngenScrooge", "YoulloDulhaniya", "CoolguySkinqu", "Itiattive", "CambessCupcakes", "Oferbelogr", "Ofewposicu", "JockyAckn", "HumptyImpelic", "ComptsBaldyDom", "Whaviatte", "SoftOffel", "Werediand", "RegralPlegasus", "ReacPokerface", "OffingeCoffy", "Beedaltyo", "ConsistentOffortsi", "AstoundingEst", "Onquentabliate", "AwesomeTomostur", "DullDozyLemodu", "EsionlyGillygum", "OptimisticPtinknew", "VoluntaryRary", "SublimeItsubi", "ModestEctoormo", "AnglysSilly", "AmetionMinion", "MentMedusa", "Rompleseral", "AxiomaticMantr", "Arsecritom", "WarleffBuffalo", "YieldingForier", "Maternize", "PerfectWeregife", "Beganiateds", "EvesevStSteve", "InsibilWinkyDink", "OndoingDomino", "ProgetcBucket", "SairaciElais", "RectProject", "ObservantLarbsedi", "EthicalPriametr", "Nowerstope", "OutitiTooti", "BeautifulFoutes", "MilwaspChiliPepper", "FessoPissant", "SedoFirebred", "WasedlaTiddles", "AliveKelichap", "PuringiTinyBoo", "LincystColestah", "CentoodDoobie", "ScratchyScra", "Ityretuddynt", "Offeckert", "GymGuyMgbil", "FireBerryBethindi", "CrankyBanc", "Shitislonesp", "Whowediff", "WervidVivitar", "CarthaHatred", "EminentKinteeni", "Phystudeat", "Aneumenctr", "DiplomaticBerat", "ItyansSugarBuns", "ZealousMovereat", "MelodicOloodpor", "Fookeyedep", "BooBooKittyRettlyst", "BeirstHairBall", "IngmerRhino", "Gelsouldi", "Ingdpoici", "Ingledible", "PrettyProessi", "WherviKicker", "DalikTikku", "IninFeint", "Aestudireastal", "LumpyNemples", "SmokeyMorsiall", "Founititag", "FrownyTownswe", "AntionFunTime", "Keestingko", "AltruisticFaric", "MyonlyDestrion", "Herrionati", "Adyintred", "DevoutItlereve", "IngshiDingo", "Wormserld", "OfficeboyFillan", "PositiveNovermal", "UldfuBaldman", "Diedinsto", "CosseaPoppyseed", "Meashichem", "EtionSeatides", "KissableDontrisd", "WaysidKidSister", "AborTurboMan", "Encipansoncla", "BlueJayJaimingi", "Hissiodustomer", "Eponesibadedge", "SincereAnce", "Forightse", "Peraddiesphic", "MookyPorPooh", "Paideliti", "UnpunUnoShoten", "Elegirionvedr", "InguDerange", "Offermang", "TorClaymore", "VengefulPentse", "PrincenHitchen", "Medeconlyme", "『sʜʀᴋ』•ᴮᴬᴰʙᴏʏツ", "꧁༺₦Ї₦ℑ₳༻꧂", "༄ᶦᶰᵈ᭄✿Gᴀᴍᴇʀ࿐", "×͜×", "Sᴋ᭄Sᴀʙɪʀᴮᴼˢˢ", "亗", "꧁༒☬sunny☬༒꧂", "𝓑𝓻𝓸𝓴𝓮𝓷 𝓗𝓮𝓪𝓻𝓽♡", "༄ᶦᶰᵈ᭄✿Gᴀᴍᴇʀ࿐", "×͜×ㅤ𝙰𝙻𝙾𝙽𝙴ㅤ𝙱𝙾𝚈", "꧁▪ ＲคᎥនтαʀ ࿐", "꧁༒☬ᤂℌ໔ℜ؏ৡ☬༒꧂", "Ⓥ", "メ", "꧁༺J꙰O꙰K꙰E꙰R꙰༻꧂", "░B░O░S░S░", "Sᴋ᭄Sᴀʙɪʀᴮᴼˢˢ", "꧁༺ ₦Ї₦ℑ₳ ƤℜɆĐ₳₮Øℜ ༻꧂", "✿ • Q U E E N✿ᴳᴵᴿᴸ࿐", "🅑🅛🅐🅒🅚🅟🅐🅝🅣🅗🅔🅡", "༺Leͥgeͣnͫd༻ᴳᵒᵈ", "🌻ｓｕｎｆｌｏｗｅｒ🌻", "꧁ঔৣ☬✞𝓓𝖔𝖓✞☬ঔৣ꧂", "꧁☬⋆ТᎻᎬ༒ᏦᎥᏁᏳ⋆☬꧂", "ᴹᴿメY a h M a t i ☂️", "꧁༒Ǥ₳₦ǤֆƬᏋЯ༒꧂", "ϟ", "༄ᶦᶰᵈ᭄✿Gᴀᴍᴇʀ࿐", "ꨄ", "𝕯𝖆𝖗𝖐 𝕬𝖓𝖌𝖊𝖑", "꧁⁣༒𓆩₦ł₦ℑ₳𓆪༒꧂", "Sᴋ᭄Sᴀʙɪʀᴮᴼˢˢ", "꧁༒☬ᤂℌ໔ℜ؏ৡ☬༒꧂", "Dɪᴏ፝֟sᴀღ᭄", "⸙", "ＦＺㅤＯＦＩＣＩＡＬ亗", "Aɴᴋᴜsʜ ᶠᶠ", "Lixツ", "♔〘Ł€Ꮆ€ŇĐ〙♔", "꧁H҉A҉C҉K҉E҉R҉꧂", "OPㅤㅤVICENZO√", "𖣘ᴰᵃʳᴋ᭄ꮯꮎᏼꭱꭺ🐲࿐", "『sᴛʀᴋ』ᴷᴺᴵᴳᴴᵀ༒࿐", "ꔪ", "『ƬƘ』 ƬƦΘレ乇メ", "Ꭺɴᴋᴜꜱʜㅤᶠᶠ", "꧁☯ℙ么ℕⅅ么☯꧂\ufeff", "Ꭵ°᭄ᶫᵒᵛᵉᵧₒᵤ࿐♥", "•`🍓Valerie xavier axelelyn🍥", "αиgєℓ _ℓιfє ❤️🥀", "ㅤㅤㅤㅤㅤ", "ᴛᴜʀᴜ ᴅᴇκ友", "━━╬٨ـﮩﮩ❤٨ـﮩﮩـ╬━❤️❥❥═══👑ľøvē👑 ═", "×͜×ㅤ𝙰𝙻𝙾𝙽𝙴ㅤ𝙱𝙾𝚈", "ᴛᴜʀᴜ ᴅᴇκ友", "『sʜʀᴋ』•ᴮᴬᴰʙᴏʏツ", "ᴶᴬᴳᴼᴬᴺ・𝙀𝙢𝙖𝙠友", "BSK・L E G E N Dᵀᵒᴾ", "亗", "꧁ঔৣ☬✞𝓓𝖔𝖓✞☬ঔৣ꧂", "BSK・L i e e Eᵀᵒᴾ", "BSK • ＫＩＬＬＥＲ亗", "ᴶᴬᴳᴼᴬᴺ 𝚃𝚞𝚛𝚞友", "🍎", "꧁༺༒〖°ⓅⓇⓄ°〗༒༻꧂", "꧁༺₦Ї₦ℑ₳༻꧂", "ᴶᴬᴳᴼᴬᴺ・Bocil 友", "꧁☆☬κɪɴɢ☬☆꧂", "꧁༺nickname༻꧂", "★彡[ᴅᴇᴀᴅ ᴋɪʟʟᴇʀ]彡★", "『Ѕʜʀ』• ℑℴƙℯℛᴾᴿᴼシ", "☯︎Ꭱ Ｏ Ƴ Ꭺ Ꮮ 亗 ×͜×", "", "matao", "kkkkkkkkkkkkkkkkkkkk", "Hiiiiiiiiiiiiiiiiiiii", "Emmett", "spencer", "copy my tank", "all i know 2x", "RATATATATATATATATATATA", "Thisislie", "jungleman", "austinz", "Austinz", "ur nub", "why yall so bad", "mi(mobile)", "awesome soccer(pog)", "2377285 auto triangle", "THE NEW BOSS", "hawaii", "M.", "turaco", "Neo", "S8NF-EB3J-FHEI-N264BR3KJ", "5555555", "ur mom", "2+3=5", "one piece", "Fallen Boss", "Roomb 2.0", "earth = sphere", "Roomba 2.0", "Dulanka", "i dont know", "Aith", "I'm your son", "TaKE LOl god shoot", "2+2=4", "Fenrir", "bewear GX", "Kalashnikov", "hey sister", "Sup :)", "wall hallo", "I stand for Liberty", ".", "OliwierQ Chojnacki", "MetatronXY", "Arcturus", "OP", "teste", "ink sans", "ropell", "PLL", "Solaris", ":v", "OBL", "teach me", "-_____________-", "rwegwerg", "n to level up", "thiago", "FAST", "This is far", "jojo", "Anak why u solo", "Lunatic", "sin", "nate", "popa peg", "Sssssssssssss", "Meepet", "hose man", "Beast", "angel", "}{eonyao", "minty fresh", "Evil }{eonyao", "Tango", "pet :3", "knbg", "underverse delta sans", "fallen booster", "COMMAND.Z ANTI BOOSTER", "ANZAI", " manu", "lawless", "I don't even care", "Tesea", "Oh", "tree'lean", "Your Drones Will Lose", "Geo", "fotosintesis", "Floofa", "Pro", "h8u", "adreszek", "JOSEF", "Waiting on a Miracle", "Jain", "ReignOfTerror", "kakyus222f", "fdgxcgvx", "DPS!!", "Sentry :3", "oh im noob", "Math you", "twilight", "Soccer", "ikandoit", "RopeSteel", "no-one", "omni", "kkk", "putre", "value1", "Fart", "REEEEEEE", "{AI} Bot", "xdnha", "Ni", "sheild", "CrAsH", "play", "Shadow closer", "Fire", "Actual Pro", "ATK_X", "Unravel", "PSYCHO", "Yrneh!", "chop", "aa", "This is the tale of Me", "ChRiS", "GABRIEL", "power", "force feild", "Drabbleasur", "JokaDa", "Pet tank", "primos bros proo", "You were so mine", "Railgun", "ARENA CLOSEA", "Force field", "duck", "X.ALEXANDER.X", "Wolfgang", "baited!?!", "PERU", "force field", "Aespa", "oni-chan~?", "copy my tank pls", "ns", "64M3R_999", "Fartington", "Yimo", "Stand For Ukraine", "hi.", "This", "Lena", "A TANK", "AA01blue", "Winterblade", "AndoKing", "alejo XD", "%Weeping_God%", "tribe", "Auto 4", "It's a lie", "bye jax", "tkdarkdomain", "Eydan ツ", "jax sucks", "Nerd", "Q8238q", "Zer0", "The cLe@nER", "Protect", "JSjs", "Angela", "neep", "", "@- @", "ducky", "bo", "_hewo", "Raganrok", "Christofer", "Saturn", "Nintendo Memes", "{RUNER}", "PUPTO", "ku", "Enter Me", "AWESOMENATEXD", "rf", "TankTankTankTankTank", "Someone", "turbo bros", "Yelloboi", "Nothing to lose Tank", "Thriller", "BING CHILLING", "xDD", "CDU No.30", "lenin12", "junhu", ",,", "super stinker", "Base", "pro", "oreo", "ggking", "GiGa LEN", "PH|Player!", "Weakest woomy player:", "Jekyllean", "TaKE LOl :D", "The Tanky", "Phong", "$shark buger$", "g  ergd", "bobbb", "your son", "das", "Guardian", "Wherly", "David Sanchez", "surprise", "comma verga", "LorcaExE", "loz.", "Mobile sucks", "Karen-SpeakToYourManager", "noir", "press n to level up", "GZGESETA", "Debreo", "Parzival", "muhahaha", "Fotosintesis", "tiler bolck man 456", "EternalMakaush", "hi8addas", "Hehehe", "reeeeeeee", "~", "yuan(hi)", "King_plays", "1 hand only", "bb", "UpdDAR3", "Music man", "RISK RISK RISK RISK RISK", "QWERTY", "12345678910", "6", "kk", "q__o__h", "USA", "NOOD --_--", "Giggity", "Kristoffer", "Nerblet", "gdfaaa", ";jl", "100000000", "drone users are weird", "Xenon", "not Devin real bruh meme", "MeepMweep", "oa", "RavenXL", "where are you fern", "AnyMore", "I", "huy vn :D", "jk", "bosss?", "Loop", "farmer's tan", "Until next time", "KK", "Ultra", "?????", "Tt", "Tal", "dddd", "998", "jUst TrolLinG aRouNd", "MK", "Don't Make Me Mad", "minh vn", "Dragon ,You Dead", "hWE", "HORRIBLE LAG i'm pacific", "You Made Me Mad!", "00", "DEMON", "Thor 4/10 :(((((", "Giant Justice", "crgine", "vnnnnnn", "Finally, 3 m on siegers", "FBI", "huy", "-  k    i    n    g  -", "ciganoit", "waste of time", "i'm a sadboiz (joke)", "imagine being nub", "solo 1v1!!!!!", "leonardo YT", "nobodynoticedyouweregone", "jack.vn", "Evan", "(:", "Astral Java", "Me n You", " hihihihuhihihihhiihhihi", "hara", "B", "Nooby", "EZ", "MrYoungSir", "manne", "Ragnarok", "Truchenco", "m", "LEGEND", "SINBADX", "let me farm alone", "Friendly /j", "bye error i gtg", "Pollo", "7/11/22", "jimmy", "Guilherme", "meb", "victor", "I use handphone", "PEGA(SUS)", "owo", "Mort", "the j", "yang", "go", "Very dangerous", "I'm harmless! -Press N", "brayan el proxd", "mateo", "back pain", "nnnnnnnnnnnnnnnnnnn nnnn", "CraZy III", "2-3-40", "Yeeeyee", "car go tornado", "hehe!", "taco", "@@@", ".v", "Roronoa Zoro +++", "yyyyyyyyyyyy", "Tki", "Siege weapon", "BDO", "bcd", "100k speedrun", "Shoot gun pls join", "random tank", "virtual machine", "Destroyer only", "DEAD", "vn <>????", "Ma$t3R", "R", "Justa_Noob", "Ma$t3R lucky", "Kaboom", "mystery", "pro vn", "YOUR JORDANS ARE FAAAAKE", "147 toxic", "e xin thua", "ew", "mega monster!", "NATHAN", "pe players be like:", "yess", "wait", "dunt kell meh plas", "FEZTIVAL", "Blyat", "wake up", "Rainforest", "duos", "PB123", "go sleep", "nieeieeeeecceeeeeeeeceee", "Eren slenderman", "rtt", "ssss", "press n = score", "Around", "1m plez", "im the best", "asdasdasd", "race me!!!!!!!!!!!!!!!!!", "lp lithium", "queue", "ttjjl", "heyy!!", "Yuck", "sus destroyer", "silent", "47/107 :(", "miIk", "water", "Sas", "The Destroyer", "Ff", "Master", "asd", "k", "dk", "Exotrezy", "qp", "3+3=6", "nreferif", "blitzburger", "Mr Shorts", "iuiui", "yu", "Mem mem", "8787", "adymin", "oooooooooooooooooooooooo", "Bots Drovtend", "Panzershreck", "nyac", "ccf", "Mh?", "joshs", "beep", "hsg is sb", "404 Not Found", "Michael", "thinh", "ABC", "ggwz", "Indo", "uwu", "THE King", "Nagi", "Pato Lime", "aaeaeae", "BUGEN", "Area closer", "Unbalanced Build", "//", "nnw'", "Door", "Matias", "ky", ";", "Gavin", "Lucy", "Kitzuneko", "This is the tale ofn", "Hank", "hiiiiiii", "^---------^", "screw", "LSV-005", "Hiary", "jonh real", "Nothing overlord", "Portaun", "20240123", "ggs you are good drone", "NoU", "mcbeef", "sg ez", "Chase", "it's a lie it's a lie", "qwertyqwerty", "LEGENDARY (VN)", "NATH", "backrooms", "Daffa", "MATHUEL", "vn luffy", "HAHAHAHAHAHA", "Oofed", "Hung dayy", "noob vn", "Sensor", "Marco the great", "Ghgft", "unscientific", "EnemyTracker (LookAtMap)", "yeey", "oh, dear", "Anderson", ":> hi", "redhood", "Volderet", "Harry Styles", "WINNER", "r u dangewus", "odo", "maksim", "Im uwu", "eryweufhw8r46yq3782edtqf", "Katya", "Unlucky", "Maga", "BASE MAKER", "td", "sure sure sure", "Zarma", "octavo", "evan", "U  N  K  N  O  W  N", "jbc", "exc (real)", "sonick12", "exc (fake)", "~A~", "shadow", "Yoriichi Tsugikuni", "p1", "Hanumanumani", "bob the builder", "BLITZKRIEG STRAT", "sus", "India", "Oof", "kiyo", "Toopy&Binoo", "I'm Innocent", "GujiGuji", "SANS", "LoSTcar", "UNGA BUNGA", "add me", "Meeps", "afafafafafaffalafel", "........................", "Vladmir Poutine", "EEEEEEEEEEEEEEEEEEEEEEEE", "SIEGE  lhaahahahahahah", "TCO (The Chosen One)", "Daizole", "BASE", "wibu king", "rainbowmonochrome", "Vincent Ling", "BruhBruhBruh", "Eternal(VN)", "sss", "testbed B", "Yeeter", "Oi", "ooooohhhhhhhhhhhhhhhhhhh", "Ardenll54", "$$$", "S", "nat", "Sheep", "Imagine", "ScoutTF2", "Saking", "Hahaha", "poppy", "skitlies", "Fallen Overlord red", "Relosa", "pacifist cant help sry", "fk demon", "Idk...", "D=EMON$ do u know?", "sinx (fk demon)", "Fruits", "Hehe", "Fallen Overlord", "Faster", "BulutMobile", "Awzcdr", "mega", "Giang~Mweo", "General", "Winner", "=)))))", "..............", "DEFEND", "Hiary4", "Eye", "Merdka!", "Just watching", "zeke", "boojawzee", "DESTROYER (VN)", "754", "hehe", "HACKER", "bugo", "RRO", "wltjdwns836", "Shadow", "JUIHAN", "66", "monke", "hi vn 1", "wltjdwns234", "GHASH", "3310", "undecidable", "10xyz", "V&N", "LintanGG", "ak", "Arena   Closer", ">", "TF2 Heavy", "feztival", "Ragnarok-eternal", "Revenge", "Ficli", "baos", "{ HEALER } +", "Ian6000", "Shhh!", "loxc", "Banned from seige?", "1457", "666", "deezs", "nn", "Use me as a shield", "Yocto To Yotta", "Dorcelessness.", "3+4=6", "superium.", "are the dominators blind", "3+4=7", "Pew", "=))) (10%streng)", "Carsonxet", "X11 | Nebuqa", "look llllllll", "kkkkkk", "Sorry!", "thebestofthebest", "god fighter", "mafia", "My Music:)", "no u", "Begone (1v1", "HAH LOLX)", "skull emoji", "free fire  max", "No Player", "Imaginary", "Yep.", "| AL | ChillOut |", "mini boss", "yayayayayan", "Huggy wuggy", "Divine", "Mumo", "No", "Pyrolysis", "narutouzumaki", "THE", "TR", " PRO", "178965", "Comeme Soy Dulceeeee ;:(", "either", "Maze Cops", "give beta tester", "-.......", "i need score", " pimp <3", "nm00{", "you are my father", "DDDDDD", "6666666666666666666666", "AUTO 555", "me best", "Crozo", "longest run", "blood for the blood god", "i m a protector", "q", ":(eu tou triste", "Sheeps", "i asia so 300ms", "not an easy target", "MyLittlePony", "little one", "oo", "cool kid", " BUB", "TTroll", "Onyx, The Fall of Hero's", "ツ", "ba", "Josh", "revenge:(", "La meilleure", "The leader", "n level up", "}{ello", " vikas", "Alpha Fart", "Matt", "fisch", "guy", "Cozy.", "Preku", "stuff", "friend to all", "Inverse", "no ;)", "Souper?", "):)                  ???", "Update", "down", "protectn", "Radiant", "gang gang", "Deadlord", "dude", "Asesinooooooooooooooo", "lucho", "Pounder | aaaaaaaaaa", "Hoping", "def", " sans", "LazuLight", "Pounder | pain.", "WHERED MY RELOAD GO", "eh", "RP", "wat?", "ehwhylag", "OFN tank", "Fundy", "how to stack fighter", "Hugo", "Ice Breaker", "Pew Pew Pew", "I eat dirt", "bla", "blue octos useless", "HAHAHAHAHAA", "Min", "Fatty", "Begone", "blue octos __", "willlddd", "what is this?", "Aleph", "Demon", "Error 505", "Horizon", "The Tale Of Tanks", "1+1=3", "sdddd", "ven", "Yujin_05", "99999999", "dead", "Flight", "ma ta", "anime", "cyan", "wreck", "senti <3", "Uh what", "Nya~", "APE", "Through the Rain", "no pew and paw here", "idol askib", "2...00++++", "jjjjj", "firework", "Jacob gomez _ Jadenian", "I'M CHILLIN", "yoavmal", "eternal.exe", "Bye :)", "no plz", "REVEnGE__+=!!!!!!!!!!!!!", "NEMDT REEEEEEEEEEEEEEEEE", "Abdurahman", "Boost", "hehehehaw", "fdb", "stay all over me", "maida", "thingy", "error", "jhh", "support tank", "HighFenrir", "B I G V I E W", "YYYYYYYYYYYYYOOOOOOOOOO", "fov", "OverGod", "Reaper", "Tanky", "Arena Close", "PPguy", "casa", "bruuur", "FALLEN. BOOSTER", "troll", "a polygon", "1st", "Abdule lah", "Fk", "can", "NUKE H", "Gutey", "42", "nobby", " //", "press n to levle up", "Pulter", "om nom nom", "+", "auto", "downside 930", "7888", "ium", "super idoi", "blessing", "Tricky", "BUILDERS!!", "Barry", "sandbox", "Y U NO?", "Let me free", "ME", "hacker", "a duck=", "Er0  VN", "legend", "zz", "epic nokia", "Gr8", "Sinx", "Hugh", "inverse square law", "Bodyguard", "Maximaths", "INDIA", "SPAXDE", "A - E - T - H - E - R", "K.I.L.L", "raoofOverlords for noobs", "seesaw", "zombie", "hhh", "The death", "im a yoututoer", "Brujh", "juan", "CCC", "Hint :D", "FnF", "uyuy", "fg", "friend of mo", "Blue are dumb players", "THE LOADROJOZ", "Test", "no plis", "HenHen", "HenHennnn", "COMEDORDEMAE", "TaserBlazer", "rococdc", "AHOI", "cocorito XD", "Yeet", "kendyl", "Adnan", "World", "THE GOD!++", "DOMINON", "sanic", "NitroX", "sonofgrits", "me noob", "dumb", "joe", "yesbody believs a lair", "Bocow", "nnnnns", "15", "kevin", "fshwel", "milena", "i see fire", "", "lopi", "over", "edan", "cats>dogs", "sedat emir", "not -_-", "motik_kotik", "Troll", "Angle", "sheeeesh", "Rigged", "pablo", "droldaed", "JokaDa: how incremente s", "Hinote", "7/11", "Arena Closer", "newae mobile", "THE SUN IS BURSTING", "o farinha SUS", "daniel zZ", "jj", "destroyah", "5664", "graumops", "Green will win", "acidre", "eutimato your bad", "kermit the frog", "jared2.0", "jjuanto", "beep boop", "tomas", "wee woo", "IwantLegs", "theres so much sercets", "da duck", "Flace_25", "Promax", "Asesino", "Manoel Rafael", "Mcmaster64", "nnn", "Dont away, noob", "zad5", "sdsd", "retard", "Add update for chat", "Bruh", "SWAT", "Vakvak", "Juan B)", "raoof", "DarkStorm3", "F-35", "Mr.Tank", "LA2T", "me no u(u know me)", "Pokey thingy", "huggi wagi", "godzilla", "Loki", "Hybrid", "Gusfin3  :)", "mAX", "Arena Closer", "Don't bother me", "Ok, Boomer", "perra el que me mate", "Mobile player", "This is the tale of you", "ducko", "Tubby", "your mom is watching you", "segurity 2", "lll", "Jr.Greeen", "Dddd", "rid", "aaaaargh", "stegosaurus", "Free Points? Nuh-Uh!", "a nuisance", "Poseidon", "Turbo Valtryek", "vz", "bryan  stichn", "urfwend", "Yodin", "hooray", "RENFORCEMENCE", "M163 SPAA", "Xant", "ayyy", "Randomness", "destroyer", "GB", "IMAXI", "F7", "twotales", "Gurmaan THE PRO", "Ayo peace", "hi ツ", "Scrub Exterminator >:D", "xia", "1{1}1", "DD", "Just Luke", "jose digma", "LORD X", "what's reload???", "AL|Air", "non't", "TryMe: DodgeBot2.0", "HexaDecagon(I grind)", "TryMe:360NoScope", "Error 404", "EDP445", "rsn.", "GEESER", "help me", "rotten punk", "solo vs 3", "all monsters", "ari", "Lore", "&__.._._:-:-:-.&", "Kalijia", "Rusty", "GUGUn", "hi :)", "truper", "goofy ah single", "ServentOfDeath", "J.L", "THUGGER", "ARKE:D", "The beep  duo", ">>>", "im bad", "Qscxz5", "CSDulce  Legend stop ._.", "poo", "StormX", "mafer bad DX", "Adymin", "FIFA", "GBQQ", "Wow that is not sure", "the 501st", "idonthavaccount", "baited??!", "Orn20", "theCityCR", "healersruseless", "Sin (watch my videos).", "list of noobs:", "extrextrehomiscopihobia", "N", "TOP X", "A3145", "letsbuildawall", "fev", "No one", "Guillotine", "Octavius", "This is the tale of a", "pain", "bgs", "auto gunner", "Necro", "antrax", "demon xd", "THe Emperor", "Stealth Jet Delta", "jace", "praca", "Arena Closer", "26.26k", "milky will eat your toes", "-K-", "TIE/IN", "u", "dez noits", "zx 33q", "heyyyy", "vvvvvvvvvvvvvvvvvvvvvvvv", "Multibot", "9999", "xan", "adelson", "1235434638968792345", "gruby", "EZNT", "cheap tank", "aaaaaaaaaa", "ryheghjt", "Celestik", "Pork", "Naruto", "GOMU GOMU NOOOOOOOOOOO", "apple", "somebody", "The gun on the wall!!!", "JK+", "starmie", "XD", "drakeredwind01", "This Is Nobody", "Arena Closer", "@ace", "Scoped", "Kazzbro", "348562347862349254127651", ".....", "NO MORE OVERLORDS!!!!!!!", "no c-", "Buzzy", "mom", "Chekks", "HAHA HEHE HUHU MOBILE", "bert", "leader Slayer", "na", "ZACHARY", " Iv", "Dogs On Mars", "Aquiner_ouo", "Thinh", "gas", "lautaro", "I also helping blue", "pet(XD)", "wow", "hj", "CraZy II", "laranon br", "XDDDDDDDDDdDDDDDDDDDDDDD", "eaeaeaeaeaeaeaeaeaeaeaea", "You", "zero to hero", ":3", "Lux", "magic_cheese", "good morning", "HAHA HEHE HUHU", "Red is best", "JK", "not onyxd", "help", "But you keep on breaking", "huttutu", "jjj", "hansith", "mds", "goofytank", "Korone Chan", "el pendejo", "razenezyou", "voltic", "qoh", "nya~~", "KL", " jeje", "asdfjkl", "Daisy", "zarity", "NobleSkele", "shhhhhhhhhhhhhhheeeeeesh", "kevynz", "Pewpew", "Star Ender", "Copy my tank ok pls", "JOIN THE PENTA PARTY", "bob AT", "basic", "jesus proooooooooooooooo", "um", "q00000", "adljsaknckjas", "OOOOOOOOOOOOOOOOOOOOOOOF", "TallStop", "Ops...", "underated tank?", "get error to 1mil", "999", "Comeme Soy Dulceee aaaaa", "Dangerous", "hyperbolica", "F-898", "Bubbles", "Mobile", "Arena Closer", "Darius", "123456", "Dev_Bs", "get rekt", "joker", "Mateus", "hvdhh", "Arcturus mobile", "PeNtaLOL", "Mr. Porridge", "go jax!", "E?", "Pew!", "BLAST", "level", "Vunda = Mythical", "Hi Levi!", "Hi Travis!", "Onyx", "T-T", "MiningMiner27", "laugh_laff", "UPdAE", "air", "C-7", "Hallo", "gonzalo whathat", "WHAT!", "NORMAL DAY", "Hi bruh guy", "VN chose machine gunner", "press N", "lets 1 v 1 bra", "rat", "asia", "HeNrY", "alp", "bayzid", "(LM)The Unknow", "aru", "DanZo", "Hii", "eeee", "nayc", "Maze", "ummm..... ok", "~Real_K~", "phong", "Support", "<1.5 is not enough", "=Z~", "Ban she", "comm ander", "Sei", "vcl", "Dapa", "T.Khang", "maikesito", "hihihi", "Dyaranhi", "W a t e r", "Fluffy", "223", "!ARNA LOSER !", "leave me alone!", "i use hacks", "EEEEEEEEE", "Always not alway kid", "GX .ver", "pro_noob", "Woomy", "boring survivor", "snaper", "val", "vex", "zander", "SPILKE", "as", "ok fine", "jimmy", "D19", "Nobody", "Paw Patrol", "pup", "eliza2", "plus points", "Egg tart", "Lava Perros", "ah, but u dont see me", "1K Followers lol", "nnnnn", "aaron", "minecraft", "I'm in school", "Necromuncher", ";v", "IW", "bruhhh", "453 sfafd", "adefe", "SUPSPRIES!!!", "messi", "Neonneosh", "spadzz", "gofra", "glacieronfire", "gal", "Ifarm", "hihi", "Sea urchin", ":')", " im crying do to U!", "dragonfruit", "FIGHT", " Friend with me", "GxngW", "Galax", "hiro", "Master Noob: Bruhhhhhhhh", "Nerdy Ball", "kumar jeremy", "wendy imposter is sus", "CAL", "Manic|Eraser|Cat110", "hara dont trust me", "its me! the", "sinx", "Dr.Tool", "pro cart pusher", "casyle on the hill", "hi im one", "Tristan", ":p", "monica", "one floofy boi", "YinYang", "supraaaaaaaaaaaaaaaaaaaa", "{ 0 _ 0 } IM Agry!!!!!!", "lena<3", "Jolo", "antontrygubO_o", "Leo hacker", "lakalaka", "1nFerN0 - 1 mil?", "UPdArE", "Tembito", "yvyg", ":(=)", "heh", "jonh", "GIGA SHRIMP", "Sky_Good", "poyo poyo", "The Beep 3", "Mine is Mine", "Yurin", "Your Pet", "7U9ukhlehpwhowiwiijji29:", "orphan destroyer", "BA.2.75 Omicron", "Astagfirulla", "Fallen Spiddy", "lee77", "ghg", "PretendToBeANoob", "zuesa", "The Void", "rdagonfruit icy", "time too tryhard", "democrats SUCK", "erro 1mil im so bad:(", " {}?{}{}{}{}{}{}{}{}{}{}", "get error to 1m", "why is anni overrated", "kakyus222", "Have you seen me", "Arena Closer", "hiiiiiiiiiiiiii", "im noob", "Tattletale", " GoodLuck", "bazooka", "FFOx", "wellerman", "dont trust anyone", "eng pa", "Summoner boss", "kostas friends ? greece", "V:", "CorruptedSpectro", "hohohoimsanta", "1M ????", "BOOSTER AIRSTRIKE ORELSE", "nashe", "Algi", "(vn) go with me pls", "FPT", "2020 im new", "Player", "jkhhgg", "Cody", "Eiffel Tower", "BEST", "EVERYONE BE DESTROYER", "Pray for Ukrainian ppl", "prb", "Attacker", "RACE", "Yael", "Q Checked These Names", "(W!) Solo w!", "111111111111111111111", "GiantJustice-", "Nate", "Can pls be your friend", "Cxrrupted", "yourself", "you(VN)", "khoa fake:)))", "1VS2?", "IDK", "plplpl", "minh7cvn", "hehe boi vn", "Sinbadx", "One.", "Q is Awesome.", "laco", "RPs", "meris", "Harder Demon", "Florentino", "Well", "jerry", "Hut", "Pet bird (eat triangles)", "mustfarm", "I bet you never", "FeZTivAL", "Kid", "ABC", "PH", "Starlight", "MOONLIGHT", "STARLIGHT", "drift", "vilad", "MURIQI 03", "The Light", "cat", "DRUNK DRIFTER", "WHy", "mmm", "arR", "FINz'D", "aaaaaaaaaaaaaaaaaaaaaaaa", "biba338", ".chao", "HNY", "$$$$", "cat o' nine tails", "Block Craft 3D", "BRUH", "-vn-", "Azra", "bin huhu", "00123", "CN Tower", "t143", "Te", "Gun", "Sans", "Fggf8ytr ftrfbtruf7rtfru", "Ryuu", "overlord king x", "emir", "empire", "Player 1", "NAtZac1424", "BOT-342465", "Hdujdb", "We_peace_farm", "tuan", "A1D2J3", "323f", "MYJ", "bbebebebe", "T", "peace_farm", "hoang118", "lol2", "lol1", "gtegnugnbdbdtui", "the guy", "sang", "/SUP Maths", "_-zErO_-", " Gaurdian", "5C", "DJT", "silvally 1v1 me pls", "Arena Closer", ">:))", "valer", "G,bdx m", "|A", "No Ski||s", "Etz", "The Comeback of 0800", "sinbadx", "QWEr", "I need 3 1m more", "Njayy", "NOBDY w", "Sh |             _", "xs", "Jet(pet)", "INDIAN", "The Immune System", "TATICAL NUKE INCOMING!!!", "bigmac", "jjjj", "woi", "protecter_of_free", "bye", "WZ_120", "let me protect u my lord", "IMAGINE DRONE IN TDM", "wewewe", "Max", "Nothin", "uh", "Ancient", "NNNNNNNNNNNNNNNNNNNNNNNN", "MAXICHIBROS", "Belowaver", "trboo", "T^2", "Carpyular", "e04", "turbo", "Sei GF:3", "trbo trbo trbo", "Hymness", "red sun in the sky", "maze goblin", "Wojak R FuNNy", "Cloudless", "Hey!", "stacked", "sudu", "Launchers no buff no gg", "Sh | cc_", "Xentnya~", "Xjso", "Void", "nobody", "Pop", ":) cavite", "ja", "THEIA CELESTIAL RULE 34", "2 0 2 2", "i Saw LimeinSoccer penta", "WatchMeDestroyYou", "the new era", "osuer", "NOOB VN", "aleph", "cjccsqb", "lusy", "uudsibfhb", "ssdd", "trying out factory", "bo ckick R", ":b", "DarkHeart", "sd", "Bi", "ax", "23", "Ht", "rest area", "korne", "Around Calm", "duo octo", "Know", "Bruh player", "huh", "LintanR", "all my friends are cool", "lth", "Ilikefarming", "mie", "yo racingboi", "Kylaura", "HI!", "Leonard", "None", "ya", "Evaden K", "AZU", "Eating Fighter ^Silvy^", "Jeff", "elecgance", "667ifjfjijfo", "Necromancer Pet", "Vakst", "Forgor", "The Sliding Door Com", "Nest Keeper", "ka boom", "niitrooooooooooooooooooo", "mada fking", "Inside Out!", "healer", "Average DPS enjoyer", "i'm friendly", "Pablo", "Necromancer", "saffy", "Manager", "nmnmn", "Leon", "(vn)TTT", "NucelAR", "benni", "-1", "proo..", "chicken wing", "Zasriel", "Ground", "Fairy", "='))", "KSA", "DOMINATOR", "packy", "rrrrrrr", "xyz", "Gianan", "=", "VEISEL", "space", "bibi a", ":3 s", "600k is how far ive got", "u POO", "dfhdhgsdgf", "pighati", "BT_O", "3w3f9", "@@@@@@@@@@@@@@@@@@@@@@@@", "rain and fezti", "Arena Closer", "Sara", "b b/", "MG Post", "Rock", "The Truth Untold", "FireStorm", "chew 5 gum", "EreN0", "", "AI", "netherlands", "la couronne", "stone", "bello", "SUS", " OVERLORD HEROBRINE", "Chaini", "nhi015042012", "meo & sup", "tomnguha123", "uoivhhfgrryttyhj", "tyty", "taem?", "Nividimmka", "I use underrated tanks", "u stupid", "ferrari", "", "thearch.hmmmm it lurks", "i won't let it end", "college sucks", "color", "l7er max", "Duy Lee", "ugok", "Booster race :D", "im a joke", "ms tang", "ssssssssusssssssssssssss", "Elson", "BILL WIN", "Root", "el pogero momento", "I'm Friendly", "huggy wuggy 2", "wibu", "Griffy", "solo1 -1", "Like crashers", "wispy", "nice", "BUB", "X-BOX", "Gregoryelproo", "NEYONSTANK", "Closeyoureyes", "Utilisateur", "1% Power...", "SillyPantalones", "over 'GOD'", "First Time Play", "Arena Closer", "BoW", "Data Expunged", "Sped demon", "JOKER", "SIRENHEADYTs lost pet", "ggs", "hfski", "Taklao", "hack", "hi!", "karol43", "Aaa", "My struggle", "Italok", "Ghi", "Phycron", "fkdla", "dinogis", "HxD", "Battle Tank", "rt", "kral kaan", "leo!", "ndn", "222222222222222222222222", "leo! hel", "lumity", "kha", "552", "V VAG", "Windows 8.1", "'>'", "888", "mwr_csqb", "ANTI OCTO TANK", "mwrtql", "2022 SUPORT UKRANIE(2)", "thomas tank engine meme", "johnrobin", "Lostvayne", "ck to la roseanne", "Guard", "Bartek", "ww3", "doomsday bunker", "Hydra", "REVIVAL:", "Gggg", "Rick Astley", " HEROBRINE", "AFK", "BaLu...", "fux", "yes", "Raul39", " Sinbadx", "SAENG", "LittleBana<3", "TAIWAN protector", "bird said the n word", "me(duh)", "19$ fortnite card", "use this tank with me", "got 3m og save cant use", "sheesh", "Override", "Xiggy", "Saika", "jeb", "sant the sant the sant t", "uYu", "Panzer", "steeg", "Arena Closer", "i go UP and DOWN", "i like walls:3", "azuris lol", "HMMMMMMMMMMM you are L", "Murdock", "Optimus Prime", "Sleak Override", "ridah", "ballistic 2.0 fnf", "pulp", "u really like to hide", "ltbc", "when the", "Gangsters_Paradise", "Cochon", "Just Having Fun", "kavin", "Good Job Chicken", "0____0", "25m", "im poppin' off", "koral", "peace :D", "Medium tank", "dark:)", "kiet", "The One", "tilvlad", "Superchad factory", "meids", "the ruler of eveything", "GetRekt", "Nothing", "h1h4", "FOLLOW ME TO VICTORY!", "ciken", "this is the tale of", "Lera", "-heix-", "insta: 'brn.o.z'", "lena", "Ur4ny4n", "Byakugan!", "Lx1000000000000000000000", "turtle", "what tis going on here??", "Comeme Soy Dulceeeee xd", "Arena Closer ", "uirouri", "bruno", "Kaiju spacegodzilla", "haiw", "Heandy", "78d", "S. Liza Yt", "I don't need a Partner.", "CS Dulce oh ok -_-", "ninja", "CS Dulce i some tired-_-", "| AL | ChillOut | WWS++", "dragonfruit icy 1212 X4", "CS Dulce u no are friend", "i like cheese too", "Don't touch me", "look llllllll kkkkkkkkkk", "Dogs On Mars | no N", "box", "super", "CSDulce  .      _      .", "hope i dont dc", "A A A", "im your pet", "venom", "Hlp my ky r brokn", "ok la :)", "ffdf", "soccer", "(-)", "Mikasa Ackerman", "peasant", "get better bozo", "CARELESS(I care less)", "xz", "MARY", "DVS|| BuiltKIDD", "|AL|ChillOut|", "jajajaj", "Yimo (Friendly forces)", "HECool", "Just Spinning", "KermitHasAGlock", "AL| JustICE-theresaclone", "Sean", "ezzzezezezezezeze", "-Corrupt3d-", "Greg the Hunter", "hypertone", "eRAnnnnnnnnnnnnnnnnnnnnn", "mafer im sad 3<", "Nageron", "Eric.  The. Unstoppable", "Earth is Super Cool", "annoying tank", "ovMasted", "Turt Talks to Much.", "tanvik", "Here Were Dragons", "Cheese and Perfect RNG", "Mega :)", "Betelguese is Super", "error error error error", "Boomer Humor", "Violin is Interesting.", "Elite Celestial", "PROFIN try's 1m scores", "Big Poppa", "BUGEN+", "Saika/Na2/500ms+", "devil", "JACKSON", "Masher", "shuna no 6m", "YOU NAAASTY", "yahhhh", "Zephr is Mod???", "$1,000,000", "Rk", "1010", "idrk", "Calob", "It's all okay.", "fr0z3n", "TRASH", "Abrar", "c@rt3r", "pwease?", "thearchy", "Zort", "pwease lemme get 1m :D", "shush cat", "Mr lord have mercy on me", "xDer", "tennis", "ZEN", "multibxersin2tdm", "Bisax", "hhhhhhhhhhhhhhhhhhhhhhhh", "Arena Opener", "This is a Laser tank", "GOTTA SWEEP SWEEP SWEEP", "167", "Rusher", "bcj8721yt", "awa", "Ron_scratch", "Ahmad", "highh", "(O.<)b", "Op", "Tenzo", "Xlemargg", "hghg", "Legend", "PewPew", "Auto factory 19187944889", "Taha and Sardar", "Cc", "Wheaple the great", "VT", "LEGENDARY BEST", "Rd h", "GX", "maxi", "Doanh: basic win vn :)??", "bb8", "breaden", "1 cannon only chall", "Kino", "quang", "FRIENDS TO ENEMY", "NB", "hoang", "Inevitable X", "say cheese", "Anken", "gun boll", "soy sauce", "PUNSIHMENT", "Domain YT mobile player", "badog", "longvn racing boiz", "nicola", "race", "RJ", "eloxus", "kjiegu835946793", "Level  fun", "Purple2", "Hmm", "vicrouss", "GIGA CHAD", "Auto factory 37448936323", "NO ONE", "cai chua", "Spring Bonnie", "ALPHA CHAD OF CHADISTAN", "ajajajjaja", "dustnine22", "let's begin....", "DuckBatmann", "125   mn", "giraia", "Shoot double", "Spawner > Factory", "Fade", "Pat", "Kol", "max", "njs", "1+1+1+1=4 OK!!!!!", "POU 2", "morbius", "Sven.", "Prm", "Arena Closer", "no teem", "forest", "Im friendri your order", "(Tank) snowy! (Tank)", "Ur momma's", "rowan", "boknoy", "Shide", "redrealm", "lor", "-CN-", "yup", "Ahmet", "-CN- ", "JUMP ROPE 10 TIME IN ROW", "YOTTA CHAD", ".ium expanDeR!", "elecgance4", "fix performanz, devz plz", "UrBadLOL", "suffer", "Destroyer", "ZZZ", "IM AWESOME", "tHE great king", "Nafi", "micsodaaaaaaaaaaa", "Raid", "W1lleZz", "saibou", "That_Thing", "hexagonal", "Panda <3 FFA", "Koala", "NEVER GONNA GIVE YOU UP", "simba", "Crush Limit", "No pp for u", "Arthur", "kiriloid", "AZERBAYCAN  TURK", "Arena Closer", "thien5011", "Raymond bince", "not  tifo", "THE FAT RAT", "greedy", "lightz squad", "64t", "Tri Angel-Booster", "sanesytp", "wasd", "Ryland", "Fallen", "PUSH ME", "dgfdgr", "Booster join", "Dorcelessness", "obed", "soy noob :,(", "Triangle Gang", "Dont pee on the floor", "Good!", "Andy", "ccc", "Gee, thanks", "WHATS UP BOI", "aronnax", "Person", "Annie", "Mellow", "TU VIEJA", "ace", "WoW", "friendn", "kirilloid", "meme", "sacapak", "Ethad", "Da boss", "XLF", "abominacja", "doge", "I'm Real", "sprotto", "Polandbanner oo", "brazen", "QUESO Y TORTILLA", "EDI", "A tank", "bvaietd?!?!", "eda", "I don't know", "badda", "threuagnduirx 1234567890", "gabi", "pastry king", "Ball", "gab", "Catalyst", "sssssssssssssuuuuuussss", "Healer", "put Factory", "Funky Fresh", "XRECS", "mlk", "3-D Julie Cat", "Elite Crasher", "Nina", "One Floofy Boi", "Tailred", "raindog", "SPEEEEEEEED", "unikit", "adrik", "Fallen Factory", "OWO", "Caca", "orange", "Cj", "carlitos pro", "ghostly_zsh", "poly :/", "imagine spinning", "kom", "austo asa", "0 helpful blues lol", "Sandwich", "The Influence", "F for Froot Loops", "Machine Gun", "Director", "ChEeSe", "Mud Muppet", "RSN", "5th base = best base", "A Poisonous Egg", "'CADO ON THE 'BOARD", "blue suck XD", "lumos - kms", "blue suck so bad XD", "Lifeless..", "igh", "<<< Saved by Grace >>>", "agdgdgdr", "youencounterHIM!yourDEAD", "dinmor", "Jess", "La-BareTTA", "Aim(^-^)Bot", "78d pounder op", "Update me", "Comeme Soy Dulce wateer", "mafer  <3<3<3<3<3<3<3<3", "Ainnim Loof", ":)           (:", "Windows8.1 Pro Build9600", "a spinner", "FAIRY", "Better Than U", "Eesti", "sssss", "Friendly Elite Crasher", "MAICK", "EIDOLON", "cx", "YO what? bro im out...", "Rest", "TheHero383", "Swohmee", "Swohmee: HowDidIDoThat!?", "pet brick", "houses", "SIUUUUUUUUUUUUUU", "S45vn steel op", "Astrageldon", "ijklmnop", "afk leave me alone", "Anti-Hax", "protec me pls", "Gonials > Bird", "Jachris", "Aj is dumb", "code master", "MONTER", "kase", "JaredUwU", "devon", "kase is good", "spider .,,.", "lily the pad", "Arena Closer", "Gorilla gang", "Alejandro 22", "botanical torture", "Egg Spawner", "ghhhhhhhhhhhtoast", "Chungus B.", "Maksim", "Enderian Overlord", "eef freefzz", "Little Timmy", "Flashbacks", "dread", "ffa till 1m!!!", "wuzz buzz chuzz", "percy", "Space", "kraken", "BR PARADO", "Sry m8", "Chobblesome", "yee", "gtrr56e4e5eerer", "ELITE", "Krystal110607", "Survivalist", "Kalijia GG", "Kalijia Let's Peace", "eeeeeeeeeeeeeeeeeeeeeehh", "coriander", "Mat (Bocow)", "SIUUU", "bro doesnt have a life", "your tail", "eeeeeee", "<call me", "Numb The Pain", "hi ;)", "pierre", "the quiet kid", "nom nomnomonm", "ggggg", "Adventure", "notable", "777 ////. ./. /./-.---77", "PowerPoint", "FALLEN BOOSTER", "Ecxel", "ye", "LIBE", "bukaka", "notlazar", "errora", "ManiaC", "NobodyIsReaching500K>:(", "pescah", "fvha", "pesca", "Innkeeper Worm", "Blarg", "=ZZZ Bannanas Are Yuky =", "GRRR", "Try Thalasin Today!", "Thalasin OH GOD HELP NO", "SILIKA", "Fallen Auto-Tank", "SYSTEM", "is op on siege mode", "G vytvyv", "guardian", "ya mom", "Lorain", "A br stranded", "matew", "matatoe", "dante", "Maize", "Arena Closer", "Ouake", "khe", "i only farm", "DESTRUYE SQUADS", "let's go!", "no pressure", "Manoso G", "Indeed", "Lets be frands", "Bunzo", "vyn", "ok so...", "haha", "cooooooooool", "Ye boi", "Quest", "GOAT", "kool", "8hu", "bryan", "Aadhy", "Basic", "Eleanor", "OXZ", "speed", "az", "ura bot", "78d 714k bruh", "Partisan", "eli", "fwen -w-", "Death", "Hewwo :3", "Stalk Is Actual Pain", "fdfdf", "extreme hapiness noise", "begone", "Apex", "Wynder", "oof", "im watching you", "chill", "p", "-heix-", "Savage xD discord?", "crocty gets 1M first", "iv vs 3", "im bored", "ERROR windows xp", "(B) Wehrmacht", "FRNDL", "Lonely :/", "The N2R", "qqqqqqqqqqqqqqqqqqqqqqqq", "sven", "phi", "Uwu", "P", "Mushroom", "1MiL", "stinky/ gg jax!", "bay sorry.", "ツSpazeツ", "Mine craft", "nob", "/:", "Legendary", "vinh", "Moragull is JOHN CENA", "A-K 8000", "CorruptedPenguin", "C@t has C@p", "Stealth Tank Delta (STD)", "I WANT A HIGH SCORE", "tim", "UltraOmega", "PPPIIIGGG", "shark bait", "nek minet", "g'day mate :)", ":_:mx", ">=<", "run", "fire exe", "The Best Player", "susicoi", "Nerdy Ball :)", "cor", "Defender", "SlowKnife", "1+1=11", "my", "HUNG", "Deep", "Emilnines", "lol:):):):)", "Orca", "the legend hero", "/donotello/raider/", "YT=GLITCHER TM", "Jagdtiger", "On mobile", "The General Lee 01", "TeSt", "The Palidin Tank", "DaRk", "0jgojettreedew089", "ghost", "213", "twan", "Spectator:)", "uywu", "{}{}ALEX{}{}", "daniel", "Sol Blaze", "poly gone :D", "im 100 years old", "Re Fachero", "Blumin", "jhonny", "supreme", "D0M1NAT1NG++", "SAS", "Nailguns HELP!!!!!!!!!!!", "Arena Closer", "darwin", "djbd65", "JustLurkin", "im sorry", "race with me!", "on de xd", "Paladin-Celestial", "russia", "CHN fed", "sj", "13isaluckynumber", "i suck", "ah, but u cant see me", "a mongoose", "rae", "Z", "323f54", "lev", "Ultimate Dominator", "WWZZX", "Goku drill", "laffy taffy", "good luck", "EpsiCron", "Eye Of The Sahara = City", "Shields and Guns", "Tester BT", "outrun my gun", "invincible man", "Necromonkey", "HENRY      ANOS7", "TailQZ", "PPANG", "Tester", "a sentilen", "Jhon the nub", "arrowz", "Annihilhator bravo 1m po", "just boone", "hybrid", "gg gmzin", "we do i little trolling", "Jorge", "NgocAnVNA", "Sh l", "DUO MONETER", "Coapc", "timi po", "Why Buff Factory?It's OP", "Storm King", "Enter to the Dungeon", "frrrrrr????", "shutgun", "debris", "NOE BODY", "Dr pizza eyes", "Protect me", "How to get you", "sit", "Caracal", "trashmxnn", "Cat", "Angel", "baLu is kinda cool", "Tanky's 30th 1mil?", "i need a pee", "josh", "ggs (1m!)", "fed", "(Ai) bot", "hijo de su putisima madr", "slowpoke", "NO IDEA", ">_>O_O<_<3456", "hi saya", "ryuuddddddd", "Random Guy", "vn nha", "Just a Spectre", "manoso", "joshkidkid", "sg", "TON | 618", "mogerath", "vc landmine", "worst impact", "Ma$t3R=No Ski||s", "aajlrtgtrtty", "korea no academy", "Behemoth", "VN TOXIC", "dh_hniV", "no vn", "bruhhh (vn)", "1M=100M", "frrrrrrr???", "ggh", "lakf", "imscared", "Wow", "(<(:)>)", "STOP", "Tale", "Leo", "!^_^D0M1N4T1NG^_^!", "vortex", "blue", "Sr. GT", "eat my bullet", "fudgg", "RATA INSANA :3", "Find Me", "PHRENTINO", "bro follow me", "Xyx Wdtcfgzezgk", "fencer add me on disc", "super shock", "GGui", "Rafael", "moblie 1.37m siege woo!", "Surprise Surprise", "king pug", "Emily", "Hm", "Marchin Through Georgia", "Aha!", "huff", "jummer", "bixent boo", "Bao", "AAAAAAAA2A22222222222222", "uhyi", "press u", "HI Yoou", "aaaaaaa1", "LMGshooter", "1922", "-KONZ-", "Waloh", ":(((((((((((((((((((((((", "obyness", "BaLu", "Zod", "spin=friend", "Ashes", "the UNTIMATE DESTROYERb", "MYLEFTBALLHURTS", "Xh", "ravi", "sorry sorry", "ZasrielDreemurr", ": )", ":?", "TaKE LOl EPIC auto 4", "Shankerith", "Hunker down", "!!!", "being afk", "TienBach", "fun.", "Zzz", "Annoying", "Juna", "new player", "Xander", "duda", "ppoppoppo", "One of your pets", "kolibri", "panzershreck", "EwE", "Deus ex Machina", "Pilav", "berd", "NO your mom", "1e+999", "Cristay", "nuiw", "UHF", "OwO", "PandaNa", "nnnnnnn", "Energized", "Cirrus5707", "Ferge", "not boster", "shuna wakuwaku", "Rongomatane", "press n to level up", "bubble shooter", "Turret", "super pro prot 4 you", "45453", "Despair", "Ho Ho Ho", "Y.S", "Arena Closer", "john", "96", "Auto's power", "2 Booster = Fun :D", "Press C+E: Octotank", "you were so mad", "Sky", "need protector", "Great Bydgoszcz Reich", "superman", "ridge", "hahaha!!!", "HELO GUYS", "vyey", "Vinaphone", "hiiii", "ZERO", "el epepep", "T   W   I   N", "5252525", "121", "iar", "avex", "Taboo", "since 1986", "meow", "AUUUUUUGH!", "xtrw", "On Mobile", "PRO123123123123123123123", "Kira", "gray", "eeeeeeeeeeeeeeeeeeeeeeee", "StUfFy_ChEeZe", "????????", "4th Form", ": ) ha ha", "OL Impossible On Mobile", "1v1", "BBoRRaBBiDDo", "hu", "pp", "slow but friendly", "vn", "loler", "Atumkj.", "fast boi", "MYRIGHTBALLHURTS", "1111WW", "odszdc", "Withering", "eafscx", "eeeee", "Sudu", " sub to", "T-Chan 13", "|^Robo-Birb^|^Silvy^|", "Korea :D", "Sidewinder-firebolt", "asdasd", "Agent Sauce", "vinud", "1 + 1 =1", "Xqaris", "WatchMeDestroyYou ol 1v1", "builder", "nnnnncaptiann", "Gawr Gura", "WatsonKong", "yx", "aewrsd", "Mmmm", "...VN", "REVENGE", "Mwoon", "turbo bro", "Hiu VN", "FF9JesT", "Fallen E", "hgdgt", "Fallen Hybrid", "SORRY..I'M..(vn)im so :(", "yaaaaaaaaaaaaaaaaaaaaaa", "supperlenny123", "The Underspeeder", "Anime", "AntsAreCool", "king of ...", "ghgh", "arslan", "I see", "chicken", "dkd", "777", "Engineering", "Push me for barrier", "oop zeros", "Mini moving safe zone", "goku", "fgg", "Jagdpanzer IV", "()UTi6", "zaq", "USSR(Russian)", "Stocxk_", "the things we do to surv", "asd fake", "HHH", "Swooper", "ayo", "hara ...", "ya YYYYYYEEEEEEEETTTTT", "Kyrie o.O", "Updog. Dying Breath. 2", "WHYANDWHY     Y_N_Y", "hara )))=", "I'm Q", "-Monster-", "Anak", "Mine says hi fake anak", "the sky", "Master Noobpet", "Viva", "maze", "oompa loompa", "Egg'in", "f(x)=k", "go to 10 mil record", "Trying to be peaceful", "Tunnel Wanderer", "Boop skdoo bep", "The Beep MAD>:(", "Speeedrun 200k plss", "The Boop", "Kaiju you", "dragon sleep no brakezzz", "kracc bacc", "24686872678", ":", "OnovonO", "Arena Defender", "Arena Closer", "naga", "asdfasdfasdfasdfasdfasdf", "Ace", "Pkao", "insta 'brn.o.z'", "aswon", "sodbazar", "The Hybrid", "aswon(ur bad)", "Troller", " nothing", "IKEA Box", "Vaskrano", "Si", "A+", "the beep !!!", "A+ Yeah spin", "Dr J.I.D eyer", "xijinping", "shheshhh", "pRo LiFe", "AZERBAYCAN  TURKIYE", "Just Existing", "3.14, 1.61, 1.41", "Ozymandias", "ok i pull up", "funnylemon", "TURK", "1212", "Learn with pibby", "LUKI", "happy mafer <3<3<3<3<3<3", "Seer", "mkZZZ", "niwa niwa", "nhan", "1223332111111111112321", "Arahana", "The Robot Kid", "vokki8skand", "Turret LV 1", "AQEEL", "AnA", "yahya", "ninjin", "Soulless", "EMO", "1010971", "pokemon", "VN 3", "alright buddy", "FR|Fajro", "Walorried-TR", "abuk", "Dead server", "Arena Closer", "zae", "zeraora", "imnew", "elecgance404", "heck", "Tomi", "SPAS-12", "tran duc hieu", "GGuisa", "viwpo", "BERD", "Blocker", "bcr", "come with me guys", "ehehe", "rule.txt", "big chungus", "t. food bc why", "lk;k", "SERIES 113 JAPAN", "sir bobybop", "G1019_t", "grendel", "andria", "VousyX", "LAINofLAIN", "ferge", "vilad pro!!!!!! :)", "Ali", "xzxz", "This is the tale of FFA", "MIKKEL ", "knjbfhiu", "Raknar", "free fire", "The Unknown", "Motar2K", "drifting", "OrangeCat", "Ddddd", "hi long tri", "some random oreo", "WEEEEEEEEEEEEEE", "speedrun", "DatBoi", "Michel", "71", "jacquie", "Exendern", "Jack Daniel", "Bob le bricoleur", "=W=W==", "ft. Karmatoken", "Arena Closer", "stfutduy", "vaboski", "HAAAAAAAAAAAAAAAAAAAAAAA", "alsterercrak", "The Big One", "Sorry", "JzF", "ZZZ ZZZ ZZZ!", "hey moskau!! moskau !!", "EL TRUENO PRO", "<3 Doreen~", "tokar6", "nho", "Dusk Defender", "ooooooooooooiygf,fss';", "Wa Sans ashinenguna!", "aeaea", "nothing's", "the  best PEOPLE IN THE", "4/4/6/6/6/6/5/4/1/0", "Kazakhstan", "starlight!thunder!", "Mr D", "protected", "Uncle Iroh", "><II  gg", "dssfb sk", "Roly poly player", "jonyy0814", "KOREA", "1 min", "Winter", "zaid x", "Will join me?", " lucas", "MATI", "xDer MY FiRST 1M", "Seig", "oopsie", "nhat", "DAN GYUL", "Claire", "567", "stalker", "kotetsu", "124", "DraXsaurus", "My 10th life", "bhosdike", "sjw", "Karthik", "hhhh53535", "ciao", "sumoga", "brrrrrrrrrrrrrrrrrrrrruh", "jony0814", "rubyslime", "Yuvyyuy vyu", "Sppooky", "THIS IS INSANE!", "Bozo", "hex", "EJIT", "+S", "RENGAR!!!", "Nelly", "sadf", "UNKNOWN LEGEND(UL)", "hi im friendly :)", "llllllm", "Jekyll Why", "AL | 2 Week No Play", "Protector", "{o} Liza <3", "toothpaste", "sasukeuchiha", "ricegrain", "Deed", "vikitor", "fIrEbOt", "Machine gunOP", "mini", "Nice~", "quant2345677", "Oxylit", "totie", "hhhhh", "scx", "Ayrton", "LETS GOO", "Izumi-san (VN)", "Panther", "meckazAN", "men treibe", "never gonna give u up", "never gonna let you down", "never gonna turn around", "Arena Closer", "never gonna let u down", "yeahs", "Ruan=_= ", "Panzerfaust", "emp", "Tiny", "THE BIG ONE", "The Ranger", "DuckBatman", "Hatsune Miku", "ara ara...", "Basic Enjoyers", "hhfggddfdf", "The Mind Flayer", "Dance", "Ar 15", "XSET", "Milton Friedman", "Mr KaRbS", "Duong 20712", "playeur", "<======Lasi======>", "Mardi 1", "Ethan", "fellen 0", "Venom", "-_-Aigle Royal 72-_-", "Alt+f4", "swrmur op", "Bean Man", "atomic", "Annoying drones", "Colors all around me", "okey", "GIANNIS ANTETOKUMPP", "it's a lie", "hy", "pc", "mustard the rohirrim!", "Kingdom Hearts", "Mebh", "Dr. Eggman", "Choose otto we stronger", "protectsage", "pov:u need 5 prot for 1m", "TR Angela", "MadCroc", "sage", "robo cop", " weirdo", "Shiny Triangle!?!?!?!?!?", "Gem!?!?!?!?!?!?!?!?!?!?!", "blon td siix", ":: Saved by Grace ::", "maze runner", "MadCroc 1.21mToday", "be free", "Carry", "I JUST SUCK", "gemgemgemgemgemgemgemgem", "ur all bAAAAAAAAD", "Spin = Free Protector", "HELPE ME FOR HELP YOU", "Rosenrotteneggs", "Mr. Lord", "PFC|| KEVYNZ", "Hybalixa", "hows your day", "b I protected u before", "awootube", "there", "Julia", "seve", "Arena Closer", "hguyuthg", "hop", "i go high", "the return of chewy pie", "Jerry", "mf yeezys", "King Hans", "sven drop", "I Voyage Around Map", "biggest noob", "dog", "IM SUPER RETARDED!!!!!!!", "The End!", "Engineer Army", "lolnub", "Salt", "MOAR OCTO TANKS!", "KN-23", "nothing", "sonic", "Nirviar", "asw", "dom is easz", "sghhgsfhgsfghsffhshg", "Jerry - LOL", "server", "D4C", "BigBrain Time", "player 8483", "Turkey", "Deve", "LintanG", "STPSPMMNGSNPR 64M3R_999", "PaX|A1ma|YT", "kaan", "afes", "ly", "ulan", "Purple", "Hahahahahahahahaha", "fahrradsattel", ":('", "he", "NoSpeak", " lu", "Fugitivo BR", "Crossboi", "Noob", "Gabriel8", "pinkie pie", "Wowkoks", "Zweilous", "oui oui", "asian kid", "top mozis xd", "Kofolka", "AcidRain", "a shield", "glitch tale", "Crong crong crong", "!!!!!!really happy!!!!?", "(vn) :p", "udhe7f", "phil", "Mort (pc)", "askib", "jygghhjj", "Last remote", "tttttttttttttttttttttttt", "asddasda", "LIGHTNING DRAGON X 96", "Minimal", "jelly", "Your Mom", "Peaceful", "respect women", "Darius_575Pro", "csabi", "7859", "tenk", "rayyan", "Fei", "Pango", "eeebot", "giranha", "spirit of the forest", "dark", "pro player", "Yeat", " %<AzEr<%", "notPickle", "Reflex", "Me", "Stalker Army", "Qin", "Predator Army", "NYADRA'ZATHA", "Roaster and Toaster", "CSDulce im boring :=", "Szymon", "es ta la vida que toca", "@RAFAEI  PR0", "$:$gc", "Suomi", "spankthemonkey", "KANG OF WAKANDA", "Ark", "tiny ones my friends", "op xd", "fence", "III", "GPA", "Bonaventure", "witherrrr", "mahiru shiina??", "(B) THE RISE OF THE FALL", "mahiru", "May I Fuq You?", "ID", "trying for world record", "75882310770", "PressNToLevelUp", "Dont TaLk 2 mE", "Do Not Disturb (oops)", "Wyd_Josh", "Pentagon protector", "tri-angle is paccific", "Good", "Do Not Touch Im AFK", "WiFi-Kun", "Bullet Bill", "pentagon protector", "%<AzEr<%", "PROOO", "ice tea for free", "Waiting", "busco pareja7w7", "agabaga", "SOLO AGO MI TRABAJO", "necro pet", "Kael", "Trash Anni", "Sev", "wypk", "G.A.P(MG)", "nokia", "Twin-Twin", "bronzzy", "Guy", "Ytt", "Ayman", "Zyiad", "Ahmed", "the general lee", "a littl' bad", "Bonk?", "SEBASTIAN.", "aIIan y sonic", "bigchad", "N05O7G", "Tengen Uzui", "Prees N", "tree", "SPILL THE BEANS BRO", "Escort Carrier", "HEEHEE", "X_DROP", "XboxUser", "55564", "porscheHUB", "Tenth Circle", "Spectator (dont attack)", "summoner2", "sentry", "The Covenant", "Storm", "itachi", "Only 1 Factory Can Stand", "TOBI MARCH", "Come Back Here!", "Spider cochon", "Crash And Burn-Dayseeker", "Clearing shapes...", "BOONE!!!", "tr ndxd", "lurker", "SONIC GO FAST!!!!!!!!!!!", "Covid 19", "tar tar teha tar sal-t", "Ray of doom!!!!!!!!!!!!!", "lautayo", "Herobrine", "let u know", "Peace and Unity", "kelly", "wingarr", "aIIan", "SEBASTIAN", "Sonic.EXE", "fghjijb", "the all seeing eye", "blitzburger is pro", "trust me do this", "Beans", "qwerty", "lucas", "Domb", "Kronos - Eternal", "45a,i", "unavaliable", "happe", "Racing?", "Buyandeho", "Mobile Not As GOod", "Arena Closer", "Ok Ur Done.", "alex", "Siren", "Defenders of The south.", "Ok Ur Done. Again", "ssad", "SAGAGH", "dwada", "Says Overlord in Green", "Wolf272", "Sry had to go afk", "WerestLuck", "press t", "corner base trust me", "nah i", "FIGHTONTHEHIGHTS", "jaxon", "Dark Pheonix", "porfavor venganxcadddddd", "Toxic", "iurgitues", "lolstar", "harnesto", "koby", "Shiny Beta Pentagon!?!?!", "Everyone Go MachGunner", ":3 hi", "GREEN Barricade", "oo i m friend", "ASKED", "Xtrem", "NopeTurtle", "porfavor vengan", "Chompy610", "Drones are gae", "Penta takeover", "one of the players", "Avenger!", "Sleeping Quadrilith", "dewfew", "king bob", "one of the newbies", "Spectator", "Fistandantilus 39 AC", "BIG POPPA", "diana <pleayr>", "Really:D", "Kenobi!!!!", "arias", "Arkaic", "i have sponks :)", "jor", "Arena CloserSinx :)", "ALL GO BENT", "Evades 2", "freee", "76...", "rigeeS", "Arena Closer", "ZEB", "koten-", "green", "little one :D", "Factory Takeover", "PRODIGGY", "Scratch", "1% Power", "Thank you", "OTD", "pet lvl 30", "world's best anni", " DONCRAK", "gnghfiukfhfj", "MASTER", "mi(moblie)", "let be friend", "defenders", "father landmine", "overlord takeover", "Bloop", "ayy", "Fighter", "W.A.R", "robococ", "TEQUILA!", "As lc", "ezz", "xQD", "AGUST-D", "USS Enterprise", "Visitor", "Wolfy_11_BR", "jonas", "Takeover", "Fall Guys", "momo", "ChickyNuggyCat", "today is christmas", "NotThebest", "NO ONE", "secks", "Overdrive", "Seb", "Machine Gunner =best", "Yevery1BetrayME:(", "Nathan_1", "Tickflung", "323f54", "boone", "ALAN PAPI", "Jikang", "lenin pro", "hydro", "Toxic sugar", "M.D", "gart", "wall", "Arena Closer", "grandmas ashes", "Eat my Doritos!", "No no!", "mr.cola", "Tundra cat", "AR", "david", "nnnnnnnnnnn", "study yo orgo (chem)", "Death Is inevitable", "Stuck", "dragon", "droplet", "HI  you mom is here", "Zeezees", "necro", "luchi", "rp - on mobile", "bored rn", "Pandrian.", "master", "Lightning", "CLEAN", "arisen", "raaaaaaaaaaaaaaaaaaaaa", "3k", "qusimocho", "Trolling Me :(", "weak tank", "HunggVn", "Touriat", "use adblock please", "Q", "Arena Closer", "I'm_Chris", "fvdr5", "bman", "skrill", "royce", "Star", "QQQ", "MONDAY", "armtumroom", "Ssunseer", "duji", "ryy", "sanggggggg", "hai", "oty", "148 toxic", "no mouse", "232523", "h..hi :S", "vvn", "sire soral", "frost", "btw", "lqkf", "Senator Armstrong", "Vn hi", "Fake.Fake.Fake", "molkin", "lEFF", "notsudon", "korean", "Henrystickcmans", "crongemaster", " dyllan", "A Goat", "TaKE LOl EPIC factory", "TaKE LOl EPIC machinegun", "Tiny Celestel", "asdfasdf", "BF An", "cooper", "Unwelcome School", "EtRNInja", "supernintendo meme", "15 fps player", "Day, day, da-da-da-da-", "i will download osu", "asdfasdfasdf", ".jpg", "Arena Closer", "kkj", "pet XD", "matias", "MAY BE HAPPEN", "heeeeeeelo", "BIG BRAIN TIME", "Koronoe Chan", "BOOOOOOOOOOOOOOOOOMM", "not the guy you just saw", "shark", "The Ghost", "get in wall", "o.o", "hara vi", " ElguerreroHastaElfinal", "literally the changelog", "top", "Minul", "Trutch", "Eternal Guardian", "JOSHUA", "End", "TANK", "531714", "senbonzakura kageyoshi", "minhhihi", "LUMBRE", "HEy Im frendly ;)", "just joe", "BonaventureVT", " i look into ur soul", "Teddybear", "Overload King", "alone", "peter", "Russo-Baltique Vodka", "Don't Let's Start", "nice one", "I Will Give U My Points", "toeless_monkey", "GANG", "0=IQ", "super booster", "seperate", "Prograde", "what does reload do", "Kevin Heckart", "CAVE- CE", "happy day", "Void Fighter", "race me?=Support <3 Bop!", "I'm protecting you! Sort", "hara- XDDDD", "Peacekeeper", "stares into ur soul", "Can I help you today?", "fdf", "Friend", "AYOOO", "odin <:)20", "Arena Closer", "Respect", "DontJudgeABookByItsCover", "OAO", "3vs2Ol", "Trinity", "yuan(A PENTAGON DDDDD:<)", "NO TIMMING", "wait in doing some work", "New", "Spin=peace", "retnuH", "Wall Protecter", "MUSTAFA/TR", "the deep", "CAN", "definitely not mq", "imbad", "Huy ;-;", "Gosu General", "Klair", "Ugly Beautifulness", "Dexter playz", "All Dead", "run  {ANGRY}", "VN.HM", "555 }{", "foon", "WHERE ARE THE DOORS", "toilet destroyer jordan", "No doors no fun", "Rico", "Giann", "SSS", "floppa", "Dominador", "ttttaaa", "ltester2000", "roberto", "Directors are Overused", "OverBrain", "Celestial", "HUH?", "Deepr", "Steve", "mathias", "1410065404", "ShinyG", "miguel", "yoyo", "subin", "Pega(SUS)", "cracked", "Arena Closer", "NO BAD WORDS", "PORT", "tale", "triangle drones = nolife", "TargetLocked", "Directors Are Overused", "(GG)", "qwe", "DUMB", "crocty poo", "creeper", "i just want shiny shapes", "Tommy Gun", "Your Mom is overused", "Overused Vibes", " jeje.2", "SONIC.EXE", "Planet", "-.-Razoix+?>", "Happe", "exc", "seensan", "cronge", "overused is overused", "Give Me Underused Vibes", "Extreme Speed", "j bert", "PARA", "Alan", "Friends?", "git gud", "Giant Justice YT", "yOU HAD YOUR CHANCE", "Jacob gomez_Jadenian", "mega monster", "Giant Justice YT - GG", "schrodinger = loser", "reaper of souls", "111111111111111111111111", "hostile", "ryuudddddddddwdw", "nononononononononononono", "Rocket shooter", "TTCBernard", "you deserve this", "raku", "why me???", "Rose", "top 1", "-KhangWasBroken-", "Uouuuuaju", "Fighter tank", "Solar Fighter", "sqrt_-1", "(<(?)>)", "du hund", "Ben", "A polygon", "AVIRA", "A.T. Beerful", "QER", ".exe", "GHHGR'986452|", "ck to la roseannenn.", "Orxan487", "zzx", "Clink", "popoi", "reicardo avocasde", "Doraemon", "Bandu", "oofoomode", "Sneaky annileatter", "Lofi", "Cancel Those Directors", "LeaderboardAllDirectors.", "1M + StormMachinegunner", "DR. BEEEEEEEESSSS!!!!!!!", "BH_FireFreezer", "frjhjhvt", "The Beast", "S u p e r", "Nice:))", "kdk", "Legacy", "jz", "ded", "yuco", "like", "rei", "atleast spare me till 1m", "Arena Closer", "Burning eye ;(", "Petsalt VN :)", "~|{boss fight}|~", "Reb", "mahluktakkasatmata", "EEEEEEEEEEE", "LowKey", "Praying for Winter", "tinh vn", "Phat", "AditGA", "cats nya nya ;)", "On the day you left me", "into my head", "CThanhYT", "NgontoL", "spin = friends", "Expand: 8(5y+88)", "Baroydroyd", "fewillos", "poper", "149 toxic", "The _________", "rsg23", "mwmwmwmwmwmwmwmwmmwmwmwm", "msalqm", "thx ", "150 toxic", "crescent", "dark karma link:wc2100", "NobleCrafter3219", "O K A Y ( ^ 3 ^ )", "egvda", "dark karma link:wc2118", "Gemma", "link ...", "DANGG", "This is the tale off", "Heeh", "The Fire Club", "c.ew.11.1.11.1.11.1.1.11", "pro is nood", "Random Tank", ":P", "Super Sonic", "Thai dark", "dfdfdf", "syron!!!", "strong tank", "main menu", "oblitereight 1000 ms", "its me pekola", "plungebob", ":(:(:(:(:(:(:(:(:((:(:(:", "ssd", ";kooo", "Kozuki Momonosuke", "SDASD", "Ha...Get Rekt", "be", "Wew", "321", "}{ex", "via", "Save The J'S", "ms. cold person", "FwgKing", "AnythonJS", "Theo", "BOB", "Mustafa", "dm", "Cgfsd", "Help", "{CHICK}", ",mnji", "<op>1", "SharkBuger$", "ATM", "Nining", "NEO ROY NEYEAH NAH", "Haunted", "Fireworks!?!?!?!?!?!?!?!", "Minhaaal", "Bobro", "YUU", "bob xllnnnnn", "Ailoki", "exu boi", "XYZ", "sus.", "star kirby", "Machine Gunners, unite!", "5min+5 overdrive", "Newsletter", "Meletiscool/", "allmyfriend.aretoxic VN", "Pet", "ivoree", "Twin Pro 3/3/4/7/7/7/7/4", "ka yawa", "SIUUUUUUUUUUUUUUUUUUUUUU", "ClosePro 2/2/4/7/8/7/6/6", "Snap ( Peace)", "???(vn)", "noob123", "Militant", "Banana", "fffffftt", "Hoi", "Ready For Another?", "Bossy", "ewltjdwns3673", "sa", "Don't worry I'm harmless", "freakshow :)", "aeaeae", "falc", "king4a", "ddt", "bangladesh", "Exterminate", "vIVIVgREYdOVE", "105050", "HI Youvn", "how? what? why?", "sdasda", "PYTHON", "lo hoc hanh", "who want race", "Arena Closer", "Xiao-Ling", "top 1000s", "A_C_L", "A flower tank", "Jash", "KRYZ", "Speed Build", "Tia", "Ha!Get Rekt", "hiboiXD", "Pro of ............", "vvv", "Rare", "draco", "Disaew", "Let's work together!", "iar chary", "Aqua", "Tgvy", "Ihv2010", "ASDUA", "Arena Closer", "chase him", "Nothing here", "Schwerer Gustav", "Dedeeeee", "Firnas", "yolo", "Psychic", "PLSSSSS FA", "mercy pls", "ur Being Fed", "FedEx Box", " not anak", "spinnnn", "proo...", "nn0", "the drones do not hurt", "Evil AliExpress Box", "Police Divo <3 XD", "pls Im friendly :)", "ldldl", "Like dat", "ytwjeit6tty", "UrBoringTbhLikeWhatsUrPt", "B(sian)", "bandit", "UnKnOwN", "TechnoBlade", "alien", "1934", "YoXieO", "why maze", "/donotello/", "Corrupt and dead.", "MAUS THE LEGEND", "WHYANDWHY     Y_N_Y", "GET MORE PEOPLE", "Bong Bong won't help you", "Pock", "CROSSIANT", "piece treaty with newbie", "too fast dident even get", "D A N I E L  bad...", " ryh'lrfh", "LEOPARD 1 WILD", "ya nos cargo la chingada", "Rainbow", "sssssssssssssssssssola", "lol darth vader noob", "AL| JustICE- sry luna", "Social Experiment Part 1", "Mercy", "take your time", "HI GONIALS", "i see who you are", "Cz Player", "Jap", "yeah yeah yeah yeah yeah", "Red Just Bled", "pounder", "eagle T", "Pet :D", "here to make friends :D", "Derniere Danse", "(Huggy wuggy) im nice", "PT5 | 03-04", "A Cat", "Skull", "PANZER VIII MAUS", "super perfect hexagon", "Rice", "protect perfert heha gon", "erf", "cable!!!", "PT5 | Tezerr", "Hi ._.", "WAAAAAAAAAAAAAAAAAAAAAA!", "xtrem", "eben", "1354", "far", "SOOOOKA", "alcatras", "mini boss spawner", "Arena Closer", "Eauletemps", "Aik", "BLITZ", "sinbadzx :)))))", "press n", "boom", "le tank", "dc yok bend", "Shay", "Solo :>", "Thunder", "best sentry", "dumdum", "Patterns", "R M", "FGDERTY", ":>PTM...''", "melee is better", "tmi 88>:?", "oooooooooo", "ffhfghu", "uuuu", "Acheron", "llol", "(vn)", "Zombie", "jellybEab", "4TDM", "pet", "ae vn", "Green Defender", "COME TO PLAY FLORR", "kr", "da", "dai", "USS Vella Gulf", "No One", "hus", "Let's work together!  N", "UNKNOW", "w r e c k", "Pobbrose", "belal abbasi", "Charles 18th", "Sir Theodore", "Arena Closer", "Hey What Happened?", "Mr.sod", "Graziani", "Ricsae", "'/;", "Anti celestial tank", "quandle dingle", "Eren noob you", "have fun crying eren hah", "MaiLotVNN", "A  l X back!!!!!", "np", "eeeeeeeee", "KHOA", "(:cai chua:)", "yulzzang", "boop", "Crazy", "MEGA MSC", "lyxn", "KarmaToken", "youssef", "LazerLOL", "HI  Five", "vvva", "GoGe", "Skawich", "Pixeljumper", "GALAXY", "Ppp", "crasher", "Min ye", "Arena Closer", "zen keon", "nzhtl1477777777", "Be Sidewinder press khh", "Indo Kok gk pro", "_blank_", "7151", "just", "tjplayz", "halo", "e5 y5gcv", "ds", "sdasdsssssssssssssssssss", "super tank", "BJ", "||H|E|L|L|O||", "swwsH", "||P|L|A|S|M|A||", "Blob", "Destructor92A", "catch me", "Coke cola espuma", "t. this green is glitch", "nhatbun", "You saw nothin", "cool dude", "Mr King", "THE PHONG", "Peace Dog", "DARRREN1407", ";D", "trust me", "2345678", "Apfel Saft", "new up :D", "Minerva", "12iiw", "Just aj", "UBER_TANK", "patata", "Minecraft", "Master of dying", "mommy long legsq", "Eauletemps why?=(", "sfdgfsgsfg", "U.A", "ze", "Eauletemps 4V1=noobs", "Qwerty", "doublade better", "sunkee", "MINI ON A LAPTOP", "snorp", "TOGESH", "GWiz", "sinx7", "Mon A", "Kartoffel", "t. green is glitch", "Nxoh", "Michael Jordan", "technically octo tank", "thick", ":cai chua:)", "Gabe Itches", "you can't see me", "TOXIC", "neph", "honesty Spectator", "Injoro", "E1", "your mum", "everyone sucks", "Charge with me/defender", "try me", "pheo", "uwj", "floofa", "Getnoobed", "test septa", "", "Pizza", "U Only Run To Ur Base?", "seb", "Maddog", "huy vn :D nhu loz", "Arena Closer", "Chicken KenChicken ken", ",l,l,l", "Comet", "Zhynt", "christopher", "The Mandalorian", "TomaToh", "tntman", "Tim", "spayer time", "piffermon", "Spectactor", "yyyyyyyyyyyyn", "left for dead", "iiiiiiiiiiiiiiiiiiiiiiii", "Pog", "BV", "burh", "ralsei with a BLUNT", "PROFIN 1000", "my guy", "Life is good", "pe11", "qqwqe", "0-=", "opp", "Panz3r of the Lake", "train", "furan", "Flawless_", "Oni-chan UwU", "Es3et", "Clorat suotn", "UNKNOWN LEGEND (UL)", "DEFENSE", "Rykav", "TYRONE GONZALEZ", "KarMaN", "urgh", "deffer in tanks", "rick astley", "BERSER", "WHY ARE YOU RUNNING", "booo", "WEST SLAVA UKRAINIA", "yups", "DEMIAN932", "THEBESTPLAYER", "8man", "Use machinegunner to win", "26317125   gff", "Joe Biden", "Nv Proxy", "Ethan david fernandez", "kbshlong", "wren", "(Very) Dangerous Pet", "police", "NEMDT playing shmart", "HEXDECA", "run.", "W", "sad", "try harder", " -_-", "a little bit of fun :)", "kendyl 1", "Ar-15", "Ha Ha Boo", "zay", "Rrennitten", "Monsia", "agus", "you dumb", "dino run", "Blood // Water", "Paradisal", ":O", "gulbos gulbos gulbos", "Dernier Danse", "La Espada", "Into the Light", "Planetoid", "...    ????", "swimsuit", "HEYYYYYYYYYYYYYYYYYYYYYY", "Q_us", "nom", "sentry strats", "josh how play?", "TheMadLad", "TheMadLad dylan strats", "THE LEADER GOES OUTSIDE?", "Eauletemps spin=screen", "Out of the Dark", "Lotus", "defender V2", "mmmmmmmmmmmmmmm", "TImmy", "ICBM", "animal", "Tezer", "Zver", "sindBax", "U2882JHS", "781", "Zorroooo", "I'm not bad", "IM WITH STUPID =>", "Miggy?", "sophia :)", "ImNew", "YoXieO_YX", "a pet", "TBB", "AICIAGOGH", "YANLUI", "facts", "XL", "DragonGOD64", "eys", "To Bee Keep", "VENOM", "pvto si lo lees", "grace.", "Speed", "289j", "A player", "cocomelon :P", "build wall :)", "Deino", "9902774653772", "Timmy, do your homework!", "elite basic lvl. 45", "MSI", "Make circle with Tri twi", "Message: Friendly uwu", "M4a1", "heist3", "Big Beep", "i like cheese", "Im weakest tank", "utifi", "jsohi", "cheese the best", "DOG", "cope", "F  A  M  I", "Little one <3", "Zoro", "DarthBader", "Mr.W", "Darth Vader's Slave", "Chroma", "demon xd:alone in life:(", "Luffy", "DOOR nr.1", "pancake", "TTroll_NEW MOUSE", "ubad", "NO MERCY", "peaceful farmer", "kokun", "This is the tale of:", "Best", "Square generator", "Corrupt Z", "angry?", "Aaaaa revenge", "DEFENDER AL FRIENDS", "partially illiterate", "Napoleon", "i destroy destroyers", "not pro", "Mr.Chaos", "~~ima try to protect U~~", "god is good", "Homing_Pigeon", "MazeDominator", "PM4037", "hehe car go vroom vroom", "gg partially you loser!", "'~Darkfiren~'", "La CFE me quito la luz", "nub7155 (Mobile)", "Chalicocerate - hu", "pew pew Gun", "yuma che3", "THOMAS crowded saturado", "TvT{ Thanh }TvT", "pentagon clean-up", "Go to Church", "Emi 10 ra ge hatag", "Im a landmine pls nohurt", "weird", "sorry Cheese", "dumpdump", "Rust", "Godzilla", "MEGAPIX", "demon:solo protejomihijo", "Your Bad :(", "a sweaty no lifer", "protecter crocty", "Caballo - horse", "my fists...", "playing from month", "trfhgyjhuiju8765t", "!emergencia!-!emergency!", "SIREN HEAD", "Yang", "pacific islander", "lucky", "MARK", "ALAN PAP", "nnnnnn", "dn", "Speedrun", "tre", "rocket", "B1 battle droid", "0,01%", "B2 super battle droid", "Your mum", "Goubekson", "Meti", "Wasap Papa", "tatut h", "LEADER = BANNED PLAYER", "shield", "afk ~30mins - stalker", "UHS23", "AlexDav", "!Hi!", "LOL ONYXD", "manager is just better", "Flying", "- - - - - - - - - - - -", "Roy", "Dank", "CrownPrincennnnn", "Gudmman", "CHAARGE", "GO TO DA TARGET STOEEE", "migel  papi", "Se", "PineapplEJuice", "lorain", "delta", "Jonk", "Endoy", "yeffri1", "luis daniel el pro", "Qpling", "An Endless Rise", "nerf", "8w329h", "Newb", "thicc", "just duo", "hahaa u noob", ";o", "xddd", "OSJJSJ", "Prime Chalicocerate - hu", "ilikemen", "IvanGG", "Ruwen", "moises", "jordan(:", "igoty", "vn exe", "TOGESH TOGESH", "Aprendo.en casa", "i only spectate", "DI", "deez", "Devourer Of Gods", "murt", "cocomelon- r u AA", "Polyhex", "KING OF DRONES", "POUNDER UPGRADER", "z54", "trees", "You show the lights", "Kirbo", "Turbo Bros", "stop me turn to stone", "Senseless", "You show the lights that", "T U R R E T", "uma delicia", "dohownik", "DESTINY PRO", "jory", "LITTLE GUY", "THE TERMINATOR", "hub", "GRAY STILL PLAYS", "Supsup", "Tedd", "Sup", "JUIDNDI", "ewres", "turu", "ffffffffffffffffffffffff", "soy susanaoria", "happy!", "Avarice", "im a cat", "protect me for 1m maby", "KEMUEL667", "Flowey723", "The shadow of none", "mebic", "Wsai12", "ALO", "oooo", "Hurricane", "i suck at bosses", "cv v", "ch.m", "Ovalsun", "rays", "naydanang bale!!!!!!! 1m", "poo face", "Akira bck!!!", "Arena Closer", "i believe in jesus", "SOFIA", "Yyfk", "Gigachad", "BANZAI", ">:v", "SUPRISE", "G l i t c h e d", "el mujahideen", "Soundwave", "torry", "AscendedCataBath", "The King", "Zac is best", "WBL", "Wait What?", "allmyfriend.aretoxic", "FNF Thorns", "L4r9", "Zzz Zzz Zzz:-)", "No Disturbing", "go away", "db", "P-Nice", "Duo", "nova", "hey vn;d", "DANCE", ":D hi", "dr.ninja", "Susana Oria", "arg", "7131", "Arena Closer", "SkuTsu\t", "Oh no Pathetic", "xeno", "y=ax+b", "Robleis", "Info?", "%t is the worst tank", "i hate %t", "%t sucks", "fallen %t", "Fallen %t", "%t", "%t is OP", "%t moment", "buff %t", "buff %t please", "nerf %t", "nerf %t please", "pet %t", "i looove %t", "green sunfish", "noew", "Dogatorix", "Charlemagne", "Drako Hyena", "long nameeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "mald seethe cope harder", "plz dont kill me i have a family and a wife and 2 kids", "IM TRYHARDER HAHAHAHAH", "The Average Noiseform Experience"];
            const randomRange = (min, max) => {
                    return Math.random() * (max - min) + min;
                }
            const gauss = (mean, deviation) => {
                    let x1, x2, w;
                    let i = 5;
                    do {
                        x1 = 2 * Math.random() - 1;
                        x2 = 2 * Math.random() - 1;
                        w = x1 * x1 + x2 * x2;
                        i--;
                    } while ((0 == w || w >= 1) && i > 0);
                
                    w = Math.sqrt(-2 * Math.log(w) / w);
                    return mean + deviation * x1 * w;
                }
            const random = x => {
                    return x * Math.random();
                }
            const irandom = i => {
                    let max = Math.floor(i);
                    return Math.floor(Math.random() * (max + 1)); //Inclusive
                }
            const fy = (a,b,c,d) => {
                    c = a.length;
                    while (c) {
                        b = Math.random() * (--c + 1) | 0;
                        d = a[c];
                        a[c] = a[b];
                        a[b] = d;
                    }
                }
            const chooseN = (arr, n) => {
                    let o = [];
                    for (let i = 0; i < n; i++) {
                        o.push(arr.splice(irandom(arr.length - 1), 1)[0]);
                    }
                    return o;
                }
            const choose = arr => {
                    return arr[irandom(arr.length - 1)];
                }
            return {
                random: random,

                randomAngle: () => {
                    return Math.PI * 2 * Math.random();
                },

                randomRange: randomRange,
                biasedRandomRange: (min, max, bias) => {
                    let mix = Math.random() * bias;
                    return randomRange(min, max) * (1 - mix) + max * mix;
                },

                irandom: irandom,

                irandomRange: (min, max) => {
                    min = Math.ceil(min);
                    max = Math.floor(max);
                    return Math.floor(Math.random() * (max - min + 1)) + min; //Inclusive
                },

                gauss: gauss,

                gaussInverse: (min, max, clustering) => {
                    let range = max - min;
                    let output = gauss(0, range / clustering);
                    let i = 3;
                    while (output < 0 && i > 0) {
                        output += range;
                        i--;
                    }
                    i = 3;
                    while (output > range && i > 0) {
                        output -= range;
                        i--;
                    }
                
                    return output + min;
                },

                gaussRing: (radius, clustering) => {
                    let r = random(Math.PI * 2);
                    let d = gauss(radius, radius * clustering);
                    return {
                        x: d * Math.cos(r),
                        y: d * Math.sin(r),
                    };
                },

                chance: prob => {
                    return random(1) < prob;
                },

                dice: sides => {
                    return random(sides) < 1;
                },

                choose: choose,

                chooseN: chooseN,

                chooseChance: (...arg) => {
                    let totalProb = 0;
                    arg.forEach(function (value) { totalProb += value; });
                    let answer = random(totalProb);
                    for (let i = 0; i < arg.length; i++) {
                        if (answer < arg[i]) return i;
                        answer -= arg[i];
                    }
                },

                fy: fy,

                chooseBotName: (function () {
                    let q = [];
                    return () => {
                        if (!q.length) {
                            fy(names);
                            q = [...names];
                        };
                        return q.shift();
                    };
                })(),

                chooseBossName: (code, n) => {
                    switch (code) {
                        case 'a':
                            return chooseN([
                                "Archimedes",
                                "Akilina",
                                "Anastasios",
                                "Athena",
                                "Alkaios",
                                "Amyntas",
                                "Aniketos",
                                "Artemis",
                                "Anaxagoras",
                                "Apollo",
                                "Pewdiepie",
                                "Ares",
                                "Helios",
                                "Hades",
                                "Alastor",
                                "Bruh Moment",
                                "Shrek",
                                "Geofridus",
                                "Guillermo",
                                "Tephania",
                                "Christaire",
                                "Galileo",
                                "Newton",
                                "Herschel",
                                "Eratosthenes",
                                "Maxwell",
                                "Lavoisier",
                                "Maynard"
                            ], n);
                        case 'sassafras':
                            return chooseN([
                                "Sassafras",
                                "Sassafras",
                                "Hemisphere"
                            ], n);
                        case 'castle':
                            return chooseN([
                                "Berezhany",
                                "Lutsk",
                                "Dobromyl",
                                "Akkerman",
                                "Palanok",
                                "Zolochiv",
                                "Palanok",
                                "Mangup",
                                "Olseko",
                                "Brody",
                                "Isiaslav",
                                "Kaffa",
                                "Bilhorod",
                                "Cheese Block",
                                "Ganondorf",
                                "Weiss",
                                "Spiegel",
                                "Hasselhoff",
                                "Konstanze",
                                "Callum",
                                "Maleficum",
                                "Droukar",
                                "Astradhur",
                                "Saulazar",
                                "Gervaise",
                                "Reimund",
                                "Nothing",
                                "Kohntarkosz"
                            ], n);
                        case 'radioactive':
                            return chooseN([
                                "Akkshiel",
                                "Arbatross",
                                "Entrelestend",
                                "Arkolan",
                                "Artchocked",
                                "Atlaltica",
                                "Rigeflate",
                                "Aslat",
                                "Mixefricated",
                                "Raah Moment",
                                "Aodh",
                                "Cyatrocaplizz",
                                "Decayer",
                                "I Will Melt Your Soul",
                                "Entropy",
                                "Hexafluorine Diacetate",
                                "Offputting Scent",
                                "Go Out With a Sizzle and Bubbling"
                            ], n);
                        case 'all':
                            return chooseN([
                                "Archimedes",
                                "Akilina",
                                "Anastasios",
                                "Athena",
                                "Alkaios",
                                "Amyntas",
                                "Aniketos",
                                "Artemis",
                                "Anaxagoras",
                                "Apollo",
                                "Pewdiepie",
                                "Ares",
                                "Helios",
                                "Hades",
                                "Alastor",
                                "Bruh Moment",
                                "Shrek",
                                "Geofridus",
                                "Guillermo",
                                "Tephania",
                                "Christaire",
                                "Galileo",
                                "Newton",
                                "Herschel",
                                "Eratosthenes",
                                "Maxwell",
                                "Lavoisier",
                                "Maynard",
                                "Berezhany",
                                "Lutsk",
                                "Dobromyl",
                                "Akkerman",
                                "Palanok",
                                "Zolochiv",
                                "Palanok",
                                "Mangup",
                                "Olseko",
                                "Brody",
                                "Isiaslav",
                                "Kaffa",
                                "Bilhorod",
                                "Cheese Block",
                                "Ganondorf",
                                "Weiss",
                                "Spiegel",
                                "Hasselhoff",
                                "Konstanze",
                                "Callum",
                                "Maleficum",
                                "Droukar",
                                "Astradhur",
                                "Saulazar",
                                "Gervaise",
                                "Reimund",
                                "Nothing",
                                "Kohntarkosz",
                                "Akkshiel",
                                "Arbatross",
                                "Entrelestend",
                                "Arkolan",
                                "Artchocked",
                                "Atlaltica",
                                "Rigeflate",
                                "Aslat",
                                "Mixefricated",
                                "Raah Moment",
                                "Aodh",
                                "Cyatrocaplizz",
                                "Decayer",
                                "I Will Melt Your Soul",
                                "Entropy",
                                "Hexafluorine Diacetate",
                                "Offputting Scent",
                                "Go Out With a Sizzle and Bubbling"
                            ], n);
                        default: return ['God'];
                    }
                },

                randomLore: function() {
                    return choose([
                        "3 + 9 = 4 * 3 = 12",
                        "You are inside of a time loop.",
                        "There are six major wars.",
                        "You are inside of the 6th major war.",
                        "AWP-39 was re-assembled into the Redistributor.",
                        "The world quakes when the Destroyers assemble.",
                        "Certain polygons can pull you away from the world you know.",
                        "Diamond crashers were crashers armored with an unknown, non-crystalline material.",
                        "The only way to break out of the eternal time loop is to break away from the world you know.",
                        "The Flak Gun is a Titan in disguise."
                    ]);
                }
            }
        break;
        case "./lib/LZString":
            return (function () {
                // private property
                var f = String.fromCharCode;
                var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
                var baseReverseDic = {};

                function getBaseValue(alphabet, character) {
                    if (!baseReverseDic[alphabet]) {
                        baseReverseDic[alphabet] = {};
                        for (var i = 0; i < alphabet.length; i++) {
                            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                        }
                    }
                    return baseReverseDic[alphabet][character];
                }
            
                var LZString = {
                    compressToBase64: function (input) {
                        if (input == null) return "";
                        var res = LZString._compress(input, 6, function (a) { return keyStrBase64.charAt(a); });
                        switch (res.length % 4) { // To produce valid Base64
                            default: // When could this happen ?
                            case 0: return res;
                            case 1: return res + "===";
                            case 2: return res + "==";
                            case 3: return res + "=";
                        }
                    },
                
                    decompressFromBase64: function (input) {
                        if (input == null) return "";
                        if (input == "") return null;
                        return LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
                    },
                
                    compressToUTF16: function (input) {
                        if (input == null) return "";
                        return LZString._compress(input, 15, function (a) { return f(a + 32); }) + " ";
                    },
                
                    decompressFromUTF16: function (compressed) {
                        if (compressed == null) return "";
                        if (compressed == "") return null;
                        return LZString._decompress(compressed.length, 16384, function (index) { return compressed.charCodeAt(index) - 32; });
                    },
                
                    //compress into uint8array (UCS-2 big endian format)
                    compressToUint8Array: function (uncompressed) {
                        var compressed = LZString.compress(uncompressed);
                        var buf = new Uint8Array(compressed.length * 2); // 2 bytes per character
                    
                        for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
                            var current_value = compressed.charCodeAt(i);
                            buf[i * 2] = current_value >>> 8;
                            buf[i * 2 + 1] = current_value % 256;
                        }
                        return buf;
                    },
                
                    //decompress from uint8array (UCS-2 big endian format)
                    decompressFromUint8Array: function (compressed) {
                        if (compressed === null || compressed === undefined) {
                            return LZString.decompress(compressed);
                        } else {
                            var buf = new Array(compressed.length / 2); // 2 bytes per character
                            for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                                buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
                            }
                        
                            var result = [];
                            buf.forEach(function (c) {
                                result.push(f(c));
                            });
                            return LZString.decompress(result.join(''));
                        
                        }
                    
                    },
                
                
                    //compress into a string that is already URI encoded
                    compressToEncodedURIComponent: function (input) {
                        if (input == null) return "";
                        return LZString._compress(input, 6, function (a) { return keyStrUriSafe.charAt(a); });
                    },
                
                    //decompress from an output of compressToEncodedURIComponent
                    decompressFromEncodedURIComponent: function (input) {
                        if (input == null) return "";
                        if (input == "") return null;
                        input = input.replace(/ /g, "+");
                        return LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
                    },
                
                    compress: function (uncompressed) {
                        return LZString._compress(uncompressed, 16, function (a) { return f(a); });
                    },
                    _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
                        if (uncompressed == null) return "";
                        var i, value,
                            context_dictionary = {},
                            context_dictionaryToCreate = {},
                            context_c = "",
                            context_wc = "",
                            context_w = "",
                            context_enlargeIn = 2, // Compensate for the first entry which should not count
                            context_dictSize = 3,
                            context_numBits = 2,
                            context_data = [],
                            context_data_val = 0,
                            context_data_position = 0,
                            ii;
                    
                        for (ii = 0; ii < uncompressed.length; ii += 1) {
                            context_c = uncompressed.charAt(ii);
                            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                                context_dictionary[context_c] = context_dictSize++;
                                context_dictionaryToCreate[context_c] = true;
                            }
                        
                            context_wc = context_w + context_c;
                            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                                context_w = context_wc;
                            } else {
                                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                                    if (context_w.charCodeAt(0) < 256) {
                                        for (i = 0; i < context_numBits; i++) {
                                            context_data_val = (context_data_val << 1);
                                            if (context_data_position == bitsPerChar - 1) {
                                                context_data_position = 0;
                                                context_data.push(getCharFromInt(context_data_val));
                                                context_data_val = 0;
                                            } else {
                                                context_data_position++;
                                            }
                                        }
                                        value = context_w.charCodeAt(0);
                                        for (i = 0; i < 8; i++) {
                                            context_data_val = (context_data_val << 1) | (value & 1);
                                            if (context_data_position == bitsPerChar - 1) {
                                                context_data_position = 0;
                                                context_data.push(getCharFromInt(context_data_val));
                                                context_data_val = 0;
                                            } else {
                                                context_data_position++;
                                            }
                                            value = value >> 1;
                                        }
                                    } else {
                                        value = 1;
                                        for (i = 0; i < context_numBits; i++) {
                                            context_data_val = (context_data_val << 1) | value;
                                            if (context_data_position == bitsPerChar - 1) {
                                                context_data_position = 0;
                                                context_data.push(getCharFromInt(context_data_val));
                                                context_data_val = 0;
                                            } else {
                                                context_data_position++;
                                            }
                                            value = 0;
                                        }
                                        value = context_w.charCodeAt(0);
                                        for (i = 0; i < 16; i++) {
                                            context_data_val = (context_data_val << 1) | (value & 1);
                                            if (context_data_position == bitsPerChar - 1) {
                                                context_data_position = 0;
                                                context_data.push(getCharFromInt(context_data_val));
                                                context_data_val = 0;
                                            } else {
                                                context_data_position++;
                                            }
                                            value = value >> 1;
                                        }
                                    }
                                    context_enlargeIn--;
                                    if (context_enlargeIn == 0) {
                                        context_enlargeIn = Math.pow(2, context_numBits);
                                        context_numBits++;
                                    }
                                    delete context_dictionaryToCreate[context_w];
                                } else {
                                    value = context_dictionary[context_w];
                                    for (i = 0; i < context_numBits; i++) {
                                        context_data_val = (context_data_val << 1) | (value & 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = value >> 1;
                                    }
                                
                                
                                }
                                context_enlargeIn--;
                                if (context_enlargeIn == 0) {
                                    context_enlargeIn = Math.pow(2, context_numBits);
                                    context_numBits++;
                                }
                                // Add wc to the dictionary.
                                context_dictionary[context_wc] = context_dictSize++;
                                context_w = String(context_c);
                            }
                        }
                    
                        // Output the code for w.
                        if (context_w !== "") {
                            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                                if (context_w.charCodeAt(0) < 256) {
                                    for (i = 0; i < context_numBits; i++) {
                                        context_data_val = (context_data_val << 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                    }
                                    value = context_w.charCodeAt(0);
                                    for (i = 0; i < 8; i++) {
                                        context_data_val = (context_data_val << 1) | (value & 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = value >> 1;
                                    }
                                } else {
                                    value = 1;
                                    for (i = 0; i < context_numBits; i++) {
                                        context_data_val = (context_data_val << 1) | value;
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = 0;
                                    }
                                    value = context_w.charCodeAt(0);
                                    for (i = 0; i < 16; i++) {
                                        context_data_val = (context_data_val << 1) | (value & 1);
                                        if (context_data_position == bitsPerChar - 1) {
                                            context_data_position = 0;
                                            context_data.push(getCharFromInt(context_data_val));
                                            context_data_val = 0;
                                        } else {
                                            context_data_position++;
                                        }
                                        value = value >> 1;
                                    }
                                }
                                context_enlargeIn--;
                                if (context_enlargeIn == 0) {
                                    context_enlargeIn = Math.pow(2, context_numBits);
                                    context_numBits++;
                                }
                                delete context_dictionaryToCreate[context_w];
                            } else {
                                value = context_dictionary[context_w];
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    } else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            
                            
                            }
                            context_enlargeIn--;
                            if (context_enlargeIn == 0) {
                                context_enlargeIn = Math.pow(2, context_numBits);
                                context_numBits++;
                            }
                        }
                    
                        // Mark the end of the stream
                        value = 2;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    
                        // Flush the last char
                        while (true) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data.push(getCharFromInt(context_data_val));
                                break;
                            }
                            else context_data_position++;
                        }
                        return context_data.join('');
                    },
                
                    decompress: function (compressed) {
                        if (compressed == null) return "";
                        if (compressed == "") return null;
                        return LZString._decompress(compressed.length, 32768, function (index) { return compressed.charCodeAt(index); });
                    },
                
                    _decompress: function (length, resetValue, getNextValue) {
                        var dictionary = [],
                            next,
                            enlargeIn = 4,
                            dictSize = 4,
                            numBits = 3,
                            entry = "",
                            result = [],
                            i,
                            w,
                            bits, resb, maxpower, power,
                            c,
                            data = { val: getNextValue(0), position: resetValue, index: 1 };
                    
                        for (i = 0; i < 3; i += 1) {
                            dictionary[i] = i;
                        }
                    
                        bits = 0;
                        maxpower = Math.pow(2, 2);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                    
                        switch (next = bits) {
                            case 0:
                                bits = 0;
                                maxpower = Math.pow(2, 8);
                                power = 1;
                                while (power != maxpower) {
                                    resb = data.val & data.position;
                                    data.position >>= 1;
                                    if (data.position == 0) {
                                        data.position = resetValue;
                                        data.val = getNextValue(data.index++);
                                    }
                                    bits |= (resb > 0 ? 1 : 0) * power;
                                    power <<= 1;
                                }
                                c = f(bits);
                                break;
                            case 1:
                                bits = 0;
                                maxpower = Math.pow(2, 16);
                                power = 1;
                                while (power != maxpower) {
                                    resb = data.val & data.position;
                                    data.position >>= 1;
                                    if (data.position == 0) {
                                        data.position = resetValue;
                                        data.val = getNextValue(data.index++);
                                    }
                                    bits |= (resb > 0 ? 1 : 0) * power;
                                    power <<= 1;
                                }
                                c = f(bits);
                                break;
                            case 2:
                                return "";
                        }
                        dictionary[3] = c;
                        w = c;
                        result.push(c);
                        while (true) {
                            if (data.index > length) {
                                return "";
                            }
                        
                            bits = 0;
                            maxpower = Math.pow(2, numBits);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                        
                            switch (c = bits) {
                                case 0:
                                    bits = 0;
                                    maxpower = Math.pow(2, 8);
                                    power = 1;
                                    while (power != maxpower) {
                                        resb = data.val & data.position;
                                        data.position >>= 1;
                                        if (data.position == 0) {
                                            data.position = resetValue;
                                            data.val = getNextValue(data.index++);
                                        }
                                        bits |= (resb > 0 ? 1 : 0) * power;
                                        power <<= 1;
                                    }
                                
                                    dictionary[dictSize++] = f(bits);
                                    c = dictSize - 1;
                                    enlargeIn--;
                                    break;
                                case 1:
                                    bits = 0;
                                    maxpower = Math.pow(2, 16);
                                    power = 1;
                                    while (power != maxpower) {
                                        resb = data.val & data.position;
                                        data.position >>= 1;
                                        if (data.position == 0) {
                                            data.position = resetValue;
                                            data.val = getNextValue(data.index++);
                                        }
                                        bits |= (resb > 0 ? 1 : 0) * power;
                                        power <<= 1;
                                    }
                                    dictionary[dictSize++] = f(bits);
                                    c = dictSize - 1;
                                    enlargeIn--;
                                    break;
                                case 2:
                                    return result.join('');
                            }
                        
                            if (enlargeIn == 0) {
                                enlargeIn = Math.pow(2, numBits);
                                numBits++;
                            }
                        
                            if (dictionary[c]) {
                                entry = dictionary[c];
                            } else {
                                if (c === dictSize) {
                                    entry = w + w.charAt(0);
                                } else {
                                    return null;
                                }
                            }
                            result.push(entry);
                        
                            // Add w+entry[0] to the dictionary.
                            dictionary[dictSize++] = w + entry.charAt(0);
                            enlargeIn--;
                        
                            w = entry;
                        
                            if (enlargeIn == 0) {
                                enlargeIn = Math.pow(2, numBits);
                                numBits++;
                            }
                        
                        }
                    }
                };
                return LZString;
            })()
        break;
        case "./lib/generateEvalCode.js":
            function lowestDivisor(number, starting = 2) {
                while (number / starting !== Math.floor(number / starting)) {
                    starting ++;
                }
                return starting;
            }

            function encodef(string) {
                string = string.split("").reverse();
                return string.map(char => {
                    let charCode = char.charCodeAt(0),
                        divisor = lowestDivisor(charCode);
                    return `|0${(divisor % 2) * 1}x0${divisor.toString(divisor % 2 ? 4 : 2)}x0${charCode / divisor}`;
                }).join("");
            }

            let mainExpressions = Object.entries({
                "typeof window": "'object'",
                "typeof Window": "'function'",
                "window instanceof Window": true,
                "typeof global": "'undefined'",
                "'open' in window": true,
                "typeof module": "'undefined'",
                "typeof exports": "'undefined'",
                "typeof window.document": "'object'",
                "typeof process": "'undefined'",
                "typeof localStorage": "'object'",
                "'WebSocket' in window": true,
                "'require' in window": false,
                "'process' in window": false,
                "'global' in window": false
            });

            mainExpressions = mainExpressions.map(entry => encodef(`(${entry[0]} == ${entry[1]})`));

            const variableGenerator = (function() {
                let variables = [];
                function generate() {
                    let variable;
                    while (variable = `_0x${((Math.random() * 8999999 | 0) + 1000000).toString(16).split("").map(char => Math.random() > .5 ? char.toUpperCase() : char.toLowerCase()).join("")}`, variables.includes(variable)) {}
                    variables.push(variable);
                    return variable;
                }
                return {
                    generate,
                    reset: () => variables = []
                }
            })();

            function generateNodeTest(generator) {
                let PROCESS = generator.generate(),
                    GLOBAL = generator.generate(),
                    REQUIRE = generator.generate(),
                    isNode = generator.generate();
                const nodeTests = [
                    ["fs", "util", "os", "http"].map(packageName => `${REQUIRE}('${packageName}');`),
                    `(Object.prototype.toString.call(${GLOBAL}.process) === '[object process]') && ${PROCESS}.exit();`,
                    `${PROCESS}.exit();`,
                    `${PROCESS}.kill(${PROCESS}.pid, 'SIGINT');`,
                    "Buffer.from('stop scripting');",
                    //"Buffer.from('Message above is from oblivion lmao')",
                    //"Buffer.from('Hey, this is drako, if you are seeing this, contact me Ill help you get around this jazz and you can come work with us.')"
                ].flat().sort(() => .5 - Math.random());
                nodeTests.length = Math.ceil(nodeTests.length * ((Math.random() * .3) + .3));
                return `(() => {let ${isNode}=true;try{let ${PROCESS}=process,${GLOBAL}=global,${REQUIRE}=require;${nodeTests.join("")}}catch(${generator.generate()}){${isNode}=false;}return ${isNode}})()`;
            }

            function obfuscateCheckFunction(generator) {
                let thrownError = generator.generate(),
                    userscriptDetected = generator.generate(),
                    _substring = generator.generate(),
                    _substr = generator.generate(),
                    _indexOf = generator.generate(),
                    _replace = generator.generate(),
                    ws = generator.generate(),
                    error = generator.generate(),
                    defineProperty = generator.generate();
                return `function () {
                    let ${thrownError} = false,
                        ${userscriptDetected} = false;
                    ${[
                        `const ${_substring} = String.prototype.substring;`,
                        `const ${_substr} = String.prototype.substr;`,
                        `const ${_indexOf} = String.prototype.indexOf;`,
                        `const ${_replace} = String.prototype.replace;`,
                        `const ${defineProperty} = Object.defineProperty;`
                    ].sort(() => .5 - Math.random()).join("")}
                    ${[
                        `delete String.prototype.substring;`,
                        `delete String.prototype.substr;`,
                        `delete String.prototype.indexOf;`,
                        `delete String.prototype.replace;`,
                        `delete Object.defineProperty;`
                    ].sort(() => .5 - Math.random()).join("")}
                    try {
                        let ${ws} = new WebSocket(10);
                        ${ws}.send("hi");
                    } catch (${error}) {
                        ${thrownError} = true;
                        ${userscriptDetected} = /user-?script|user\.js|multibox/i.test(${error}.stack) || ${error}.stack.includes("userscript.html");
                    }
                    ${[
                        `String.prototype.substring = ${_substring};`,
                        `String.prototype.substr = ${_substr};`,
                        `String.prototype.indexOf = ${_indexOf};`,
                        `String.prototype.replace = ${_replace};`,
                        `Object.defineProperty = ${defineProperty};`
                    ].sort(() => .5 - Math.random()).join("")}
                    return ${userscriptDetected} || !${thrownError};
                }`.trim().split("\n").map(r => r.trim()).join("").replace(/ = /g, "=");
            }

            function generateEvalPacket(keys) {
                variableGenerator.reset();
                // VARIABLE NAMES
                let count = variableGenerator.generate(),
                    decode = variableGenerator.generate(),
                    string = variableGenerator.generate(),
                    parseInteger = variableGenerator.generate(),
                    entry = variableGenerator.generate(),
                    charCode = variableGenerator.generate(),
                    evaluate = variableGenerator.generate(),
                    placeholderInput = variableGenerator.generate(),
                    expressionVariable = variableGenerator.generate();
                // END VARIABLE NAMES
                let expressions = mainExpressions.map(r => r).sort(() => .5 - Math.random());
                expressions.length = Math.floor(mainExpressions.length / (1 + Math.random() * .75));
                let baseExpressions = expressions.map(r => r);
                baseExpressions.length = Math.floor(baseExpressions.length / 2);
                let output = `return (${placeholderInput} => {let ${count}=0,${evaluate}=eval,${parseInteger}=parseInt,${expressionVariable}=${JSON.stringify(baseExpressions)}.concat(${placeholderInput});if((${obfuscateCheckFunction(variableGenerator)})()){return 0;}function ${decode}(${string}) {return ${string}.split("|0").slice(1).map(${entry}=>(${entry}=${entry}.split("x0"),${parseInteger}(${entry}[1],${entry}[0]==1?4:2)*${entry}[2])).map(${charCode}=>String.fromCharCode(${charCode})).reverse().join("");}`.trim(),
                    flag = 1 + Math.random() * 25 | 0,
                    result = 0,
                    checks = [];
                for (let i = 0, amount = expressions.length; i < amount; i++) {
                    checks.push({
                        code: Math.random() > .95 ? `"${expressions[i]}"` : `${expressionVariable}[${parseInteger}('${i.toString([2, 4, 8, 16][i % 4])}', ${[2, 4, 8, 16][i % 4]})]`,
                        flag: flag
                    });
                    result += flag;
                    flag = 1 + Math.random() * 25 | 0;
                }
                output += `if (${generateNodeTest(variableGenerator)}){return 0}`;
                for (let check of checks.sort(() => .5 - Math.random())) {
                    if (Math.random() > .334) {
                        output += `${count}+=${evaluate}(${decode}(${check.code}))*${parseInteger}("${check.flag.toString([2, 4, 16][check.flag % 3])}",${[2, 4, 16][check.flag % 3]});`
                    } else if (Math.random() > .5) {
                        output += `${evaluate}(${decode}(${check.code}))&&(${count}+=${parseInteger}("${check.flag.toString([2, 4, 16][check.flag % 3])}",${[2, 4, 16][check.flag % 3]}));`;
                        if (Math.random() > .5) {
                            output += `${evaluate}(${decode}(${check.code}))||(()=>{debugger})();`;
                        }
                        output += `if (${generateNodeTest(variableGenerator)}){return 0}`;
                    } else {
                        let variable = variableGenerator.generate();
                        output += `let ${variable};if(${variable}=${evaluate}(${decode}(${check.code})),+${variable}){${count}+=${parseInteger}("${check.flag.toString([2, 4, 16][check.flag % 3])}",${[2, 4, 16][check.flag % 3]});}`;
                        if (Math.random() > .5) {
                            output += `else{debugger}`;
                        }
                    }
                    if (Math.random() > .9) {
                        output += `if(${generateNodeTest(variableGenerator)}){return 0}`;
                    }
                }
                output += `if ('${JSON.stringify(keys)}' !== JSON.stringify({a:window._$a,b:window._$b,c:window._$c,d:window._$d,e:window._$e})){return ${Math.random() * result - 3 | 0};}`;
                output += `return ${count};})(${JSON.stringify(expressions.slice(baseExpressions.length))});`;
                return {
                    code: output,
                    result: result
                };
            }
            return generateEvalPacket
        break;
        case "./lib/fasttalk":
            const u32 = new Uint32Array(1),
                c32 = new Uint8Array(u32.buffer),
                f32 = new Float32Array(u32.buffer),
                u16 = new Uint16Array(1),
                c16 = new Uint8Array(u16.buffer);
            let encode = function(message) {
                let headers = [],
                    headerCodes = [],
                    contentSize = 0,
                    lastTypeCode = 0b1111,
                    repeatTypeCount = 0;
                for (let block of message) {
                    let typeCode = 0;
                    if (block === 0 || block === false) typeCode = 0b0000;
                    else if (block === 1 || block === true) typeCode = 0b0001;
                    else if (typeof block === "number") {
                        if (!Number.isInteger(block) || block < -0x100000000 || block >= 0x100000000) {
                            typeCode = 0b1000;
                            contentSize += 4;
                        } else if (block >= 0) {
                            if (block < 0x100) {
                                typeCode = 0b0010;
                                contentSize++;
                            } else if (block < 0x10000) {
                                typeCode = 0b0100;
                                contentSize += 2;
                            } else if (block < 0x100000000) {
                                typeCode = 0b0110;
                                contentSize += 4;
                            }
                        } else {
                            if (block >= -0x100) {
                                typeCode = 0b0011;
                                contentSize++;
                            } else if (block >= -0x10000) {
                                typeCode = 0b0101;
                                contentSize += 2;
                            } else if (block >= -0x100000000) {
                                typeCode = 0b0111;
                                contentSize += 4;
                            }
                        }
                    } else if (typeof block === "string") {
                        let hasUnicode = false;
                        for (let i = 0; i < block.length; i++) {
                            if (block.charAt(i) > "\xff") hasUnicode = true;
                            else if (block.charAt(i) === "\x00") {
                                console.error("Null containing string!", block);
                                throw new Error("Null containing string!");
                            }
                        }
                        if (!hasUnicode && block.length <= 1) {
                            typeCode = 0b1001;
                            contentSize++;
                        } else if (hasUnicode) {
                            typeCode = 0b1011;
                            contentSize += block.length * 2 + 2;
                        } else {
                            typeCode = 0b1010;
                            contentSize += block.length + 1;
                        }
                    } else {
                        console.error("Unencodable data type!", block);
                        console.log(JSON.stringify(message), message.indexOf(block))
                        throw new Error("Unencodable data type!");
                    }
                    headers.push(typeCode);
                    if (typeCode === lastTypeCode) repeatTypeCount++;
                    else {
                        headerCodes.push(lastTypeCode);
                        if (repeatTypeCount >= 1) {
                            while (repeatTypeCount > 19) {
                                headerCodes.push(0b1110);
                                headerCodes.push(15);
                                repeatTypeCount -= 19;
                            }
                            if (repeatTypeCount === 1) headerCodes.push(lastTypeCode);
                            else if (repeatTypeCount === 2) headerCodes.push(0b1100);
                            else if (repeatTypeCount === 3) headerCodes.push(0b1101);
                            else if (repeatTypeCount < 20) {
                                headerCodes.push(0b1110);
                                headerCodes.push(repeatTypeCount - 4);
                            }
                        }
                        repeatTypeCount = 0;
                        lastTypeCode = typeCode;
                    }
                }
                headerCodes.push(lastTypeCode);
                if (repeatTypeCount >= 1) {
                    while (repeatTypeCount > 19) {
                        headerCodes.push(0b1110);
                        headerCodes.push(15);
                        repeatTypeCount -= 19;
                    }
                    if (repeatTypeCount === 1) headerCodes.push(lastTypeCode);
                    else if (repeatTypeCount === 2) headerCodes.push(0b1100);
                    else if (repeatTypeCount === 3) headerCodes.push(0b1101);
                    else if (repeatTypeCount < 20) {
                        headerCodes.push(0b1110);
                        headerCodes.push(repeatTypeCount - 4);
                    }
                }
                headerCodes.push(0b1111);
                if (headerCodes.length % 2 === 1) headerCodes.push(0b1111);
                let output = new Uint8Array((headerCodes.length >> 1) + contentSize);
                for (let i = 0; i < headerCodes.length; i += 2) {
                    let upper = headerCodes[i],
                        lower = headerCodes[i + 1];
                    output[i >> 1] = (upper << 4) | lower;
                }
                let index = headerCodes.length >> 1;
                for (let i = 0; i < headers.length; i++) {
                    let block = message[i];
                    switch (headers[i]) {
                        case 0b0000:
                        case 0b0001:
                            break;
                        case 0b0010:
                        case 0b0011:
                            output[index++] = block;
                            break;
                        case 0b0100:
                        case 0b0101:
                            u16[0] = block;
                            output.set(c16, index);
                            index += 2;
                            break;
                        case 0b0110:
                        case 0b0111:
                            u32[0] = block;
                            output.set(c32, index);
                            index += 4;
                            break;
                        case 0b1000:
                            f32[0] = block;
                            output.set(c32, index);
                            index += 4;
                            break;
                        case 0b1001: {
                            let byte = block.length === 0 ? 0 : block.charCodeAt(0);
                            output[index++] = byte;
                        }
                        break;
                        case 0b1010:
                            for (let i = 0; i < block.length; i++) output[index++] = block.charCodeAt(i);
                            output[index++] = 0;
                            break;
                        case 0b1011:
                            for (let i = 0; i < block.length; i++) {
                                let charCode = block.charCodeAt(i);
                                output[index++] = charCode & 0xff;
                                output[index++] = charCode >> 8;
                            }
                            output[index++] = 0;
                            output[index++] = 0;
                            break;
                    }
                }
                return output;
            };
            let decode = function(packet) {
                let data = new Uint8Array(packet);
                if (data[0] >> 4 !== 0b1111) return null;
                let headers = [],
                    lastTypeCode = 0b1111,
                    index = 0,
                    consumedHalf = true;
                while (true) {
                    if (index >= data.length) return null;
                    let typeCode = data[index];
                    if (consumedHalf) {
                        typeCode &= 0b1111;
                        index++;
                    } else typeCode >>= 4;
                    consumedHalf = !consumedHalf;
                    if ((typeCode & 0b1100) === 0b1100) {
                        if (typeCode === 0b1111) {
                            if (consumedHalf) index++;
                            break;
                        }
                        let repeat = typeCode - 10;
                        if (typeCode === 0b1110) {
                            if (index >= data.length) return null;
                            let repeatCode = data[index];
                            if (consumedHalf) {
                                repeatCode &= 0b1111;
                                index++;
                            } else repeatCode >>= 4;
                            consumedHalf = !consumedHalf;
                            repeat += repeatCode;
                        }
                        for (let i = 0; i < repeat; i++) headers.push(lastTypeCode);
                    } else {
                        headers.push(typeCode);
                        lastTypeCode = typeCode;
                    }
                }
                let output = [];
                for (let header of headers) {
                    switch (header) {
                        case 0b0000:
                            output.push(0);
                            break;
                        case 0b0001:
                            output.push(1);
                            break;
                        case 0b0010:
                            output.push(data[index++]);
                            break;
                        case 0b0011:
                            output.push(data[index++] - 0x100);
                            break;
                        case 0b0100:
                            c16[0] = data[index++];
                            c16[1] = data[index++];
                            output.push(u16[0]);
                            break;
                        case 0b0101:
                            c16[0] = data[index++];
                            c16[1] = data[index++];
                            output.push(u16[0] - 0x10000);
                            break;
                        case 0b0110:
                            c32[0] = data[index++];
                            c32[1] = data[index++];
                            c32[2] = data[index++];
                            c32[3] = data[index++];
                            output.push(u32[0]);
                            break;
                        case 0b0111:
                            c32[0] = data[index++];
                            c32[1] = data[index++];
                            c32[2] = data[index++];
                            c32[3] = data[index++];
                            output.push(u32[0] - 0x100000000);
                            break;
                        case 0b1000:
                            c32[0] = data[index++];
                            c32[1] = data[index++];
                            c32[2] = data[index++];
                            c32[3] = data[index++];
                            output.push(f32[0]);
                            break;
                        case 0b1001: {
                            let byte = data[index++];
                            output.push(byte === 0 ? "" : String.fromCharCode(byte));
                        }
                        break;
                        case 0b1010: {
                            let string = "",
                                byte = 0;
                            while ((byte = data[index++])) string += String.fromCharCode(byte);
                            output.push(string);
                        }
                        break;
                        case 0b1011: {
                            let string = "",
                                byte = 0;
                            while ((byte = data[index++] | (data[index++] << 8))) string += String.fromCharCode(byte);
                            output.push(string);
                        }
                        break;
                    }
                }
                return output;
            };
            return {
                encode,
                decode
            }
        break;
    }
}