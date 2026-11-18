window.global = window

global.utility = {
    log: (e)=>{console.log("[LOG]",e)}
}

window.process = {
    env: {},
    argv: []
}

async function loadNames() {
    try {
        const response = await fetch("./resources/names.json");
        global.nameList = (await response.json()).names;
    } catch(e) {
        console.error("Error with names.json:" + e);
    }
}
loadNames();

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
            const names = global.nameList;
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