global.confirmed = false
window.startServer = async function(configSuffix){
/*jslint node: true */
/*jshint -W061 */
/*global Map*/
// TO CONSIDER: Tweak how entity physics work (IE: When two entities collide, they push out from the center. This would allow stuff like "bullet ghosting" to happen, making certain UP tanks viable.)
// TO DO: Give bosses name colors via a NAME_COLOR attribute and/or colored broadcasts, fix this.usesAltFire, fix bugs with zoom cooldown, fix FFA_RED overriding custom bullet colors
// Basic defaults in case of error
// glitch fix ur dang editor or die.
var performance = performance || Date;
let entries = []

// Rivet
let rivetToken = process.env.RIVET_TOKEN ? process.env.RIVET_TOKEN : process.env.RIVET_DEV_TOKEN

/*const Rivet = require("@rivet-gg/api")
let rivet = new Rivet.RivetClient({
    token: rivetToken
})*/
if (process.env.RIVET_TOKEN) {
    global.isVPS = true
}

if(global.isVPS) rivet.matchmaker.lobbies.ready().catch((e) => { console.log(e); console.log("Rivet matchmaker not ready, exiting.."); process.exit(1) });


// Maintain Global.ServerStats
global.serverStats = {
    cpu: 0,
    mem: 0
}
  
// Modify "Map" to improve it for our needs.
Map.prototype.filter = function (callback) {
    let output = [];
    this.forEach((object, index) => {
        if (callback(object, index)) {
            output.push(object);
        }
    });
    return output;
}

Map.prototype.find = function (callback) {
    let output;
    for (let [key, value] of this) {
        if (callback(value, key)) {
            output = value;
            break;
        }
    }
    return output;
}
Math.floor = function (val) {
    return val | 0
}

const HashGrid = class Grid {
    constructor() {
        this.grid = new Map();
        this.currentQuery = 0;
    }

    clear() {
        this.grid.clear();
        this.currentQuery = 0;
    }

    insert(object) {
        const startX = object._AABB.x1 >> 9;
        const startY = object._AABB.y1 >> 9;
        const endX = object._AABB.x2 >> 9;
        const endY = object._AABB.y2 >> 9;
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const key = x | (y << 16);
                if (!this.grid.has(key)) this.grid.set(key, [object]);
                else this.grid.get(key).push(object);
            }
        }
    }

    getCollisions(object) {
        const result = [];
        const startX = object._AABB.x1 >> 9;
        const startY = object._AABB.y1 >> 9;
        const endX = object._AABB.x2 >> 9;
        const endY = object._AABB.y2 >> 9;
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const key = x | (y << 16);
                if (!this.grid.has(key)) continue;

                const cell = this.grid.get(key);
                for (let i = 0; i < cell.length; i++) {
                    if (cell[i]._AABB.currentQuery != this.currentQuery) {
                        cell[i]._AABB.currentQuery = this.currentQuery;
                        if (cell[i].hash !== 0) result.push(cell[i]);
                    }
                }
            }
        }
        
        this.currentQuery = (this.currentQuery + 1) >>> 0;
        return result.filter(other => object.id !== other.id && this.hitDetection(object, other));
    }

    hitDetection(object, other) {
        return !(object._AABB.x1>other._AABB.x2 || object._AABB.y1>other._AABB.y2 || object._AABB.x2 < other._AABB.x1 || object._AABB.y2 < other._AABB.y1);
    }

    getAABB(object) {
        const size = object.realSize || object.size || object.radius || 1;
        const width = (object.width || 1) * size;
        const height = (object.height || 1) * size;
        return {
            x1: object.x - width,
            y1: object.y - height,
            x2: object.x + width,
            y2: object.y + height,
            currentQuery: -1
        };
    }
};
let tokendata = {};

const webhooks = (function () {
    const https = require("https");
    let private = {
        keys: {
            // USA
            "a": "/api/webhooks/1018582651147403284/pPuQBkSl7hSF5M3L9mBefvQf7ahDyi85kz2KGIuQm8FhS3FrjxYk9kuqLrCuheDL7Elk",
            "b": "/api/webhooks/1018583149820793012/2TnWYuqkDY6A7BuwNyjSK0em3TKeAh66lqkvDASjv1gyCv5dX11WkpPMP8gL0zSVjIAD",
            "c": "/api/webhooks/1018583275696042104/5I9n1nMk4eX5s0em4_agAIAC6LvDTX48SEzdHr2pzgtuanEbIhLaF0ZnGKWrV8RBcvON",
            "d": "/api/webhooks/1018583494131204117/j_I04EKhk9GcsBOEzYAXa9wQpgi9wQYCaXLLKMpnzD5VdynBPu9GJ9Pu_RXwEPt055QW",
            // Europe
            "e": "/api/webhooks/1018584313496862812/S8n17RJAa0NCgCTT-8IznuxRLtBbHthi3nAwEk1Kuo3JLrCzIsTBGIlD1IrBP55toX2u",
            "f": "/api/webhooks/1018584491591225355/hBvJrFWvKzMIAMUznSbL2DL4HtYD_1aEokJQW_PUfgpES8q0gUlpOvfgabacfP1h26KU",
            "g": "/api/webhooks/1018584955988742144/sfS1STjH5u5kIdwfVpdrVAk8tEXTKMuBjOS6fDNaZ4JfaqJDAzN3wWDRtOMuen5Wdreg",
            "h": "/api/webhooks/1018585088872693820/17Ns87ftXylRrL9GinGWxp-1Ka-0WhmZaFvePq3GQQdccjvz2E6-KxyQoK8Lnhb5Lryv",
            // ASIA
            "j": "/api/webhooks/1018588607017123950/xoF2920rrUXlcIJawiLETDwCrM6WZPs0EZxfTVvbu0fXsJ_7N_vQ5Gpjsqnm7PiMKX1y",
            "v": "/api/webhooks/1018588802668838963/lpjrCg7P2M9HvCuH0LfExb0qPe7f9K1G7QdXUugZDhp8dsGtZwuY0-xew9_dFZIaJ_uw",
            "w": "/api/webhooks/1018585281869393992/0aNkN6KQZUGZud31Wq50NeXRbkUeRAcMDx6qX-bxpV7yZa8DDOcE1wi1ZLbRC_P5pKHR",
            "x": "/api/webhooks/1018585430146433095/6xZNBJOPnQmf1vDXsaP292JAMya6Qa2H08sSss2fh4DTX9y1lK3iAIgBfJ_4lgUsERJJ",
            // Alternate
            "y": "/api/webhooks/1018585598749065286/WmKkHdcFxD4QYjNxAV43khqk71ld4jtuKShaOjcF6AUj8X00WjSUaEp5yEjga8K646QO",

            // Localhost
            "z": "/api/webhooks/1018585818631250111/1gxDTNmkivDgA-oeK4K31PlYtNvuV4aKM1ahT82hZob4PXQfqQ8TllwkSluouldPROvD",
            // Fallback
            "default": "/api/webhooks/1018587345747984424/5289v5gyzDtRrYCZzP7XYNsOiTyxovIdvFwCFqf7ZsR0Hz8A9L9XDoFjkyywDKwX2yRB"
        },
        buffer: '',
        queue: [],
        lastSend: 0,
        send(data) {
            let path = private.keys[process.env.HASH || "z"] || private.keys.default;
            let req = https.request({
                hostname: 'discordapp.com',
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, () => { });
            req.write(JSON.stringify({
                content: data.trim()
            }));
            req.end();
        },
        publish(force) {
            let output = "";
            if (private.queue.length < 3 && Date.now() - private.lastSend < 10000 && !force) {
                return;
            }
            private.lastSend = Date.now();
            while (private.queue.length > 0) {
                if (output + "\n" + private.queue[0] > 2000) {
                    private.send(output);
                    return;
                }
                output += "\n" + private.queue.shift();
            }
            private.send(output);
        },
        log(data, force) {
            data = data + "";
            data = data.replace("@", "🤓");
            data = data.trim();
            if (data.length > 2000) {
                while (data.length) {
                    private.send(data.slice(0, 2000).trim());
                    data = data.slice(2000).trim();
                }
                return;
            }
            private.queue.push(data);
            if (force) {
                private.publish(true);
            }
        }
    };
    //setInterval(private.publish, 5000);
    return {
        log: (data, force) => {
            //private.log('[' + util.getLogTime() + ']: ' + data, force);
        }
    }
})();
const util = require("./lib/util");
function Chainf() {
    this.chain = {};
    this.length = 0;
}

Chainf.prototype.set = function (key, value) {
    this.chain[key] = value;
    this.length++;
}

Chainf.prototype.get = function (key) {
    return this.chain[key];
}

Chainf.prototype.has = function (key) {
    return this.chain.hasOwnProperty(key);
}

Chainf.prototype.delete = function (key) {
    delete this.chain[key];
    this.length--;
}

Chainf.prototype.clear = function () {
    this.chain = {};
    this.length = 0;
}

Chainf.prototype.forEach = function (callback) {
    let i = 0;
    for (const key in this.chain) {
        callback(this.chain[key], key, i++);
    }
}

Chainf.prototype.map = function (callback) {
    const result = [];

    for (const value of this) {
        result.push(callback(value));
    }

    return result;
}

Chainf.prototype.mapToChain = function (callback) {
    for (const key in this.chain) {
        this.chain[key] = callback(this.chain[key], key);
    }

    return this;
}

Chainf.prototype.filter = function (callback) {
    const result = [];

    for (const value of this) {
        if (callback(value)) {
            result.push(value);
        }
    }

    return result;
}

Chainf.prototype.filterToChain = function (callback) {
    for (const key in this.chain) {
        if (!callback(this.chain[key], key)) {
            delete this.chain[key];
            this.length--;
        }
    }
    
    return this;
}

Chainf.prototype[Symbol.iterator] = function () {
    let i = 0;
    const chain = this.chain;
    const keys = Object.keys(chain);
    const length = keys.length;

    return {
        next: function () {
            if (i < length) {
                return {
                    value: chain[keys[i++]],
                    done: false
                };
            } else {
                return {
                    done: true
                };
            }
        }
    };
}
const Chain = Chainf;
for (let key of ["log", "warn", "info", "spawn", "error"]) {
    const _oldUtilLog = util[key];
    util[key] = function (text, force) {
        webhooks.log(text, force);
        return _oldUtilLog(text);
    }
}
/*function loadWASM() {
    const Module = require("./wasm.js");
    return new Promise((resolve) => {
        let e = setInterval(function () {
            if (Module.ready) {
                clearInterval(e);
                resolve(Module);
            }
        }, 5);
    });
}*/
global.utility = util;
global.minifyModules = true;
function getApiJazz(){
    let apiEvent = {on:()=>{}}
    let apiConnection;
    async function connectToApi(c) {
        apiConnection = {talk:()=>{}}//new WebSocket(`${c.api_ws_url}/${process.env.API_CONNECTION_KEY}`)
        return {
            apiConnection, apiEvent
        }
    }
    function getApiStuff(){
        return {
            apiConnection,
            apiEvent
        }
    }
    return {
        connectToApi,
        getApiStuff
    }
}

let apiJs = getApiJazz();
const fuzzysort = ((r,e)=>{"function"==typeof define&&define.amd?define([],e):"object"==typeof module&&module.exports?module.exports=e():r.fuzzysort=e()})(this,r=>{"use strict";var i,o,e,a,f=r=>{var e=v(r="string"!=typeof r?"":r);return{target:r,t:e.i,o:e.v,u:N,l:e.g,score:N,_:[0],obj:N}},t=r=>{r=(r="string"!=typeof r?"":r).trim();var e=v(r),a=[];if(e.p)for(var f,t=r.split(/\s+/),t=[...new Set(t)],n=0;n<t.length;n++)""!==t[n]&&(f=v(t[n]),a.push({v:f.v,i:t[n].toLowerCase(),p:!1}));return{v:e.v,g:e.g,p:e.p,i:e.i,h:a}},M=r=>{var e;return 999<r.length?f(r):(void 0===(e=n.get(r))&&(e=f(r),n.set(r,e)),e)},q=r=>{var e;return 999<r.length?t(r):(void 0===(e=s.get(r))&&(e=t(r),s.set(r,e)),e)},D=(r,e,a=!1)=>{if(!1===a&&r.p)return j(r,e);for(var a=r.i,f=r.v,t=f[0],n=e.o,i=f.length,o=n.length,v=0,s=0,u=0;;){if(t===n[s]){if(C[u++]=s,++v===i)break;t=f[v]}if(o<=++s)return N}var v=0,l=!1,g=0,d=e.u,c=(d===N&&(d=e.u=k(e.target)),s=0===C[0]?0:d[C[0]-1],0);if(s!==o)for(;;)if(o<=s){if(v<=0)break;if(200<++c)break;--v;s=d[L[--g]]}else if(f[v]===n[s]){if(L[g++]=s,++v===i){l=!0;break}++s}else s=d[s];var w=e.t.indexOf(a,C[0]),r=~w;if(r&&!l)for(var _=0;_<u;++_)C[_]=w+_;a=!1;r&&(a=e.u[w-1]===w);p=l?(b=L,g):(b=C,u);for(var b,p,x=0,h=0,_=1;_<i;++_)b[_]-b[_-1]!=1&&(x-=b[_],++h);if(x-=(12+(b[i-1]-b[0]-(i-1)))*h,0!==b[0]&&(x-=b[0]*b[0]*.2),l){for(var y=1,_=d[0];_<o;_=d[_])++y;24<y&&(x*=10*(y-24))}else x*=1e3;r&&(x/=1+i*i*1),a&&(x/=1+i*i*1),e.score=x-=o-i;for(_=0;_<p;++_)e._[_]=b[_];return e._.j=p,e},j=(r,e)=>{for(var a=new Set,f=0,t=N,n=0,i=r.h,o=0;o<i.length;++o){var v=i[o];if((t=D(v,e))===N)return N;f+=t.score,t._[0]<n&&(f-=n-t._[0]);for(var n=t._[0],s=0;s<t._.j;++s)a.add(t._[s])}r=D(r,e,!0);if(r!==N&&r.score>f)return r;t.score=f;var u,o=0;for(u of a)t._[o++]=u;return t._.j=o,t},v=r=>{for(var e=r.length,a=r.toLowerCase(),f=[],t=0,n=!1,i=0;i<e;++i){var o=f[i]=a.charCodeAt(i);32===o?n=!0:t|=1<<(97<=o&&o<=122?o-97:48<=o&&o<=57?26:o<=127?30:31)}return{v:f,g:t,p:n,i:a}},k=r=>{for(var e=r.length,a=(r=>{for(var e=r.length,a=[],f=0,t=!1,n=!1,i=0;i<e;++i){var o=r.charCodeAt(i),v=65<=o&&o<=90,o=v||97<=o&&o<=122||48<=o&&o<=57,s=v&&!t||!n||!o,t=v,n=o;s&&(a[f++]=i)}return a})(r),f=[],t=a[0],n=0,i=0;i<e;++i)i<t?f[i]=t:(t=a[++n],f[i]=void 0===t?e:t);return f},n=new Map,s=new Map,C=[],L=[],E=r=>{for(var e=J,a=r.length,f=0;f<a;++f){var t=r[f];t!==N&&e<(t=t.score)&&(e=t)}return e===J?N:e},F=(r,e)=>{var a=r[e];if(void 0!==a)return a;for(var f=e,t=(f=Array.isArray(e)?f:e.split(".")).length,n=-1;r&&++n<t;)r=r[f[n]];return r},G=r=>"object"==typeof r,H=1/0,J=-H,K=[],N=null,O=(i=[],o=K.total=0,a=r=>{for(var e=i[t=0],a=1;a<o;){var f=a+1,t=a;f<o&&i[f].score<i[a].score&&(t=f),i[t-1>>1]=i[t],a=1+(t<<1)}for(var n=t-1>>1;0<t&&e.score<i[n].score;n=(t=n)-1>>1)i[t]=i[n];i[t]=e},(e={}).add=r=>{var e=o;i[o++]=r;for(var a=e-1>>1;0<e&&r.score<i[a].score;a=(e=a)-1>>1)i[e]=i[a];i[e]=r},e.k=r=>{var e;if(0!==o)return e=i[0],i[0]=i[--o],a(),e},e.C=r=>{if(0!==o)return i[0]},e.L=r=>{i[0]=r,a()},e);return{single:(r,e)=>{var a;return"farzher"==r?{target:"farzher was here (^-^*)/",score:0,_:[0]}:!r||!e||(r=q(r),G(e)||(e=M(e)),((a=r.g)&e.l)!==a)?N:D(r,e)},go:(r,e,a)=>{if("farzher"==r)return[{target:"farzher was here (^-^*)/",score:0,_:[0],obj:e?e[0]:N}];if(!r)if(a&&a.all){var f=e;var t=a;var n=[],i=(n.total=f.length,t&&t.limit||H);if(t&&t.key)for(var o=0;o<f.length;o++){var v=f[o];var s=F(v,t.key);if(!s)continue;if(!G(s))s=M(s);s.score=J;s._.j=0;var u=s;u={target:u.target,t:"",o:N,u:N,l:0,score:s.score,_:N,obj:v};n.push(u);if(n.length>=i)return n}else if(t&&t.keys)for(o=0;o<f.length;o++){v=f[o];var l=new Array(t.keys.length);for(var g=t.keys.length-1;g>=0;--g){s=F(v,t.keys[g]);if(!s){l[g]=N;continue}if(!G(s))s=M(s);s.score=J;s._.j=0;l[g]=s}l.obj=v;l.score=J;n.push(l);if(n.length>=i)return n}else for(o=0;o<f.length;o++){s=f[o];if(!s)continue;if(!G(s))s=M(s);s.score=J;s._.j=0;n.push(s);if(n.length>=i)return n}return n;return}else return K;var d=q(r),c=d.g,w=(d.p,a&&a.threshold||J),_=a&&a.limit||H,b=0,p=0,x=e.length;if(a&&a.key)for(var h=a.key,y=0;y<x;++y){var j=e[y];!(m=F(j,h))||(c&(m=G(m)?m:M(m)).l)!==c||(B=D(d,m))===N||B.score<w||(B={target:B.target,t:"",o:N,u:N,l:0,score:B.score,_:B._,obj:j},b<_?(O.add(B),++b):(++p,B.score>O.C().score&&O.L(B)))}else if(a&&a.keys)for(var k=a.scoreFn||E,C=a.keys,L=C.length,y=0;y<x;++y){for(var j=e[y],S=new Array(L),z=0;z<L;++z){h=C[z];(m=F(j,h))?(c&(m=G(m)?m:M(m)).l)!==c?S[z]=N:S[z]=D(d,m):S[z]=N}S.obj=j;var A=k(S);A===N||A<w||(S.score=A,b<_?(O.add(S),++b):(++p,A>O.C().score&&O.L(S)))}else for(var m,B,y=0;y<x;++y)!(m=e[y])||(c&(m=G(m)?m:M(m)).l)!==c||(B=D(d,m))===N||B.score<w||(b<_?(O.add(B),++b):(++p,B.score>O.C().score&&O.L(B)));if(0===b)return K;for(var I=new Array(b),y=b-1;0<=y;--y)I[y]=O.k();return I.total=b+p,I},highlight:(r,e,a)=>{if("function"==typeof e){var f=e;if((l=r)===N)return N;for(var t=l.target,n=t.length,i=(i=l._).slice(0,i.j).sort((r,e)=>r-e),o="",v=0,s=0,u=!1,l=[],g=0;g<n;++g){var d=t[g];if(i[s]===g){if(++s,u||(u=!0,l.push(o),o=""),s===i.length){o+=d,l.push(f(o,v++)),o="",l.push(t.substr(g+1));break}}else u&&(u=!1,l.push(f(o,v++)),o="");o+=d}return l}if(r===N)return N;void 0===e&&(e="<b>"),void 0===a&&(a="</b>");for(var c="",w=0,_=!1,b=r.target,p=b.length,x=(x=r._).slice(0,x.j).sort((r,e)=>r-e),h=0;h<p;++h){var y=b[h];if(x[w]===h){if(_||(_=!0,c+=e),++w===x.length){c+=y+a+b.substr(h+1);break}}else _&&(_=!1,c+=a);c+=y}return c},prepare:f,indexes:r=>r._.slice(0,r._.j).sort((r,e)=>r-e),cleanup:()=>{n.clear(),s.clear(),C=[],L=[]}}});
let api = apiJs.getApiStuff()
let forcedProfile = false;
api.apiEvent.on("forcedProfile", (data) => {
    forcedProfile = data.data
})
async function getForcedProfile() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (forcedProfile !== false) {
                clearInterval(interval);
                resolve();
            }
        });
    });
}

api.apiEvent.on("tokenData", (data) => {
    tokendata = data.data
});

(async () => {
    //const WASMModule = await loadWASM();

    //"use strict";
    let serverPrefix;
    //global.c = require("./configs/sterilize.js")(`config`),
    api = await apiJs.connectToApi(/*c*/)
    if (process.argv[2]) {
        serverPrefix = configSuffix
        console.log(`Forcing server prefix to ${configSuffix}`)
    } else {
        try {
            console.log("Server is supposed to be online. Loading profile", configSuffix);
            serverPrefix = `-${configSuffix}`;
        } catch (e) {
            console.error(e)
            console.log("Couldn't load from API. Terminating.");
            if (global.isVPS) process.exit();
        }
    }

    let baseConfig = {
        "host": "0.0.0.0",
        "api_url": "https://woomy-api.glitch.me",
        "api_ws_url": "wss://woomy-api.glitch.me",
        "servesStatic": true,
        "mockupChunkLength": 200,
        "port": 3001,
        "restarts": {
            "enabled": true,
            "interval": 14401
        },
        "networkUpdateFactor": 24,
        "socketWarningLimit": 5,
        "tabLimit": 1,
        "strictSingleTab": true,
        "maxPlayers": 999,
        "BETA": 0,
        "networkFrontlog": 1,
        "networkFallbackTime": 150,
        "visibleListInterval": 75,
        "gameSpeed": 1.25,
        "runSpeed": 1.75,
        "maxHeartbeatInterval": 1000,
        "verbose": true,
        "WIDTH": 6500,
        "HEIGHT": 6500,
        "connectionLimit": 999,
        "MODE": "ffa",
        "serverName": "Free For All",
        "MUSIC_MODE": "default",
        "MUSIC_DELAY": [1000, 5000], // MIN/MAX TIME BETWEEN MUSIC, TIME IS IN 1000 PER SECOND
        "TEAM_AMOUNT": 2,
        "RANDOM_COLORS": false,
        "BOSS_SPAWN_TIMER": 760,
        "PORTALS": {
            "ENABLED": false,
            "TANK_FORCE": 3000,
            "TANK_DAMP": 4000,
            "BOSS_FORCE": 12500,
            "DIVIDER_1": {
                "ENABLED": true,
                "LEFT": 2979,
                "RIGHT": 3521
            },
            "DIVIDER_2": {
                "ENABLED": true,
                "TOP": 2979,
                "BOTTOM": 3521
            }
        },
        "MAZE": {
            "ENABLED": false,
            "cellSize": 150,
            "stepOneSpacing": 3,
            "fillChance": 0.33,
            "sparedChance": 0.65,
            "cavey": false,
            "lineAmount": false,
            "margin": 0,
            "posMulti": 0.25
        },
        "BANNED_CHARACTER_REGEX": "/[\uFDFD\u200E\u0000]/gi",
        "ROOM_SETUP": [
            ["roid", "norm", "norm", "norm", "rock", "norm", "norm", "norm", "rock", "rock", "norm", "norm", "norm", "rock", "norm", "norm", "norm", "roid"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "rock", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "rock", "norm", "norm", "norm"],
            ["rock", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "rock"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "nest", "nest", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "roid", "nest", "nest", "nest", "nest", "roid", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "nest", "nest", "nest", "nest", "nest", "nest", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["rock", "norm", "norm", "norm", "norm", "nest", "nest", "nest", "roid", "roid", "nest", "nest", "nest", "norm", "norm", "norm", "norm", "rock"],
            ["rock", "norm", "norm", "norm", "norm", "nest", "nest", "nest", "roid", "roid", "nest", "nest", "nest", "norm", "norm", "norm", "norm", "rock"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "nest", "nest", "nest", "nest", "nest", "nest", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "roid", "nest", "nest", "nest", "nest", "roid", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "nest", "nest", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["rock", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "rock"],
            ["norm", "norm", "norm", "rock", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "rock", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm", "norm"],
            ["roid", "norm", "norm", "norm", "rock", "norm", "norm", "norm", "rock", "rock", "norm", "norm", "norm", "rock", "norm", "norm", "norm", "roid"]
        ],
        "X_GRID": 18,
        "Y_GRID": 18,
        "DAMAGE_CONSTANT": 0.75,
        "KNOCKBACK_CONSTANT": 1.8,
        "BORDER_FORCE": 0.025,
        "OUTSIDE_ROOM_DAMAGE": 0,
        "MAX_SKILL": 9,
        "SOFT_MAX_SKILL": 0.59,
        "REGEN_MULTIPLIER": 0.45,
        "TIER_1": 15,
        "TIER_2": 30,
        "TIER_3": 45,
        "TIER_4": 60,
        "LEVEL_ZERO_UPGRADES": false,
        "SKILL_CAP": 60,
        "SKILL_SOFT_CAP": 0,
        "SKILL_CHEAT_CAP": 60,
        "SKILL_LEAK": 0,
        "STEALTH": 4,
        "MIN_SPEED": 0.001,
        "MIN_DAMAGE": 0,
        "MAX_FOOD": 400,
        "MAX_NEST_FOOD": 40,
        "MAX_CRASHERS": 38,
        "MAX_SANCS": 2,
        "TIME_BETWEEN_SANCS": 900000,
        "EVOLVE_TIME": 90000,
        "EVOLVE_TIME_RAN_ADDER": 210000,
        "EVOLVE_HALT_CHANCE": 0.25,
        "SHINY_CHANCE": 0.00001,
        "SKILL_BOOST": 5,
        "BOTS": 20,
        "GLASS_HEALTH_FACTOR": 1.8,
        "DO_BASE_DAMAGE": true,
        "liveTankEditor": false,
        "SIEGE": false,
        "DISABLE_LEADERBOARD": false,
        "GAMEMODE_JS": ""
    }

    let sterilize = file => {
        try {
            let data = file;
            for (let key in data) {
                baseConfig[key] = data[key];
            }
        } catch (e) {
            console.log("Failed to load the config using defaults instead...");
        }
        return baseConfig;
    }

    let gamemodeConfig = {};
    let res = await fetch("./configs/config-"+configSuffix)
    if(configSuffix.includes(".json")){
        gamemodeConfig = await res.json()
    }else if(configSuffix.includes(".js")){
        gamemodeConfig = eval(await res.text())
    }else{
        alert("Invalid gamemode file type "+configSuffix)
    }
    global.c = sterilize(gamemodeConfig);
    if(c.GAMEMODE_JS){
function getCrptFunction(){
    const CONFIG = {
        usedTanks: 5, // Number of tanks used per generated tank
        maxChildren: 8, // The overall max children a singluar tank can have
        labelLength: 32, // The random amount of label per tank to use
        gunsPerTank: 5, // The max amount of guns to use from each tank
        turretsPerTank: 3, // The max amount of turrets to use from each tank
        propsPerTank: 3, // The max amount of props to use from each tank
    }

    let defs = window.defExports
    defs = Object.entries(defs)

    let maxDefLength = defs.length
    for(let arr of defs){
        arr[1].MAX_CHILDREN = CONFIG.maxChildren
        arr[1].ON_TICK = function(me){
            let children = 0;
            if (me.childrenMap.size) {
                let entries = [...me.childrenMap.entries()].reverse()
                for (let v of entries) {
                    children++
                    if (children > CONFIG.maxChildren) {
                        v[1].kill()
                        me.childrenMap.delete(v[0])
                    }
                }
            }
        }
        if(arr[1].GUNS != null){
            for(let gun of arr[1].GUNS){
                if(gun.PROPERTIES != null){
                    gun.PROPERTIES.MAX_CHILDREN = CONFIG.maxChildren
                    gun.PROPERTIES.DESTROY_OLDEST_CHILD = true
                }
            }
        }
    }

    return function(){
        let finalTank = defs[Math.random() * defs.length | 0][1]
        finalTank.GUNS = []
        finalTank.TURRETS = []
        finalTank.LASERS = []
        finalTank.PROPS = []
        let tankDonors = rnd(2,CONFIG.usedTanks)
        let labelLengths = CONFIG.labelLength
        let GPT = rnd(1,CONFIG.gunsPerTank)
        let TPT = rnd(1,CONFIG.turretsPerTank)
        let PPT = rnd(1,CONFIG.propsPerTank)
        let MC = rnd(1,CONFIG.maxChildren)
        let label = "CT-" + rnd(0,10000) + "-"
        let initlength = label.length
        for(let i = 0; i < tankDonors || label.length < initlength; i++){
            let entity = defs[(Math.random() * maxDefLength | 0)][1]

            if(entity.LABEL){
                let end = Math.random()*entity.LABEL.length|0
                if(label.length+end < labelLengths){
                    label += entity.LABEL.substring(0, end)
                }
            } else {
                
            }

            if(entity.GUNS){
                for(let a = 0; a < GPT; a++){
                    let gun = entity.GUNS[(Math.random() * entity.GUNS.length | 0)]
                    if(!gun) continue;
                    if(gun.PROPERTIES){

                    }
                    finalTank.GUNS.push(gun)
                }
            }

            if (entity.TURRETS) {
                for (let a = 0; a < TPT; a++) {
                    let turret = entity.TURRETS[(Math.random() * entity.TURRETS.length | 0)]
                    if (!turret) continue;
                    turret.MAX_CHILDREN = MC
                    if (turret.GUNS != null) {
                        for (let gun of turret.GUNS) {
                            if (gun.PROPERTIES != null) {
                                gun.PROPERTIES.MAX_CHILDREN = MC
                                gun.PROPERTIES.DESTROY_OLDEST_CHILD = true
                            }
                        }
                    }
                    finalTank.TURRETS.push(turret)
                }
            }

            if (entity.PROPS) {
                for (let a = 0; a < PPT; a++) {
                    let prop = entity.PROPS[(Math.random() * entity.PROPS.length | 0)]
                    if (!prop) continue;
                    finalTank.PROPS.push(prop)
                }
            }
        }

        finalTank.LABEL = label
        if(finalTank?.PARENT?.length)finalTank.PARENT[0].CONTROLLERS = []
        finalTank.CONTROLLERS = []
        finalTank.TYPE = "tank"
        finalTank.DIE_AT_LOW_SPEED = false
        finalTank.DIE_AT_RANGE = false
        finalTank.INDEPENDANT = true
        finalTank.HAS_NO_MASTER = true
        finalTank.ACCEPTS_SCORE = true
        finalTank.CAN_BE_ON_LEADERBOARD = true
        finalTank.GOD_MODE = false
        finalTank.IS_ARENA_CLOSER = false
        finalTank.PASSIVE = false
        finalTank.STAT_NAMES = 6 // generic
        finalTank.SKILL_CAP = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
        finalTank.AI = {}
        //finalTank.MOTION_TYPE = 'motor'
        //finalTank.FACING_TYPE = 'toTarget'
        finalTank.SANCTUARY_TYPE = 'None'
        finalTank.BOSS_TYPE = 'None'
        finalTank.RANDOM_TYPE = 'None'
        finalTank.MISC_IDENTIFIER = "None"
        finalTank.MAX_CHILDREN = (CONFIG.usedTanks*CONFIG.gunsPerTank*CONFIG.maxChildren)*0.5

        let exportName = `${Date.now()}-${Math.random()}`
        global.addNewClass(exportName, finalTank)
        return exportName
    }
}
        global.gamemodeCode = {generateNewTank: getCrptFunction()}
    }
    webhooks.log("Server initializing!");
    const defsPrefix = "";//process.argv[3] || "";
    const ran = require("./lib/random");
    const LZString = require("./lib/LZString");
    global.sandboxRooms = [];
    Array.prototype.remove = index => {
        if (index === this.length - 1) return this.pop();
        else {
            let r = this[index];
            this[index] = this.pop();
            return r;
        }
    };

    let rankedRoomTicker = 0, rankedRooms = {};
    function* chunkar(array, int) {
        for (let i = 0; i < array.length; i += int) {
            yield array.slice(i, i + int);
        }
    };

    class RankedRoom {
        constructor(clients) {
            this.clients = clients;
            this.id = rankedRoomTicker++;
            this.timer = 46;
            this.timeout = null;
            this.forEach((socket) => {
                socket.roomId = this.id;
                socket.battleRoom = this;
                socket.talk("w", true);
            });
            this.battleStarted = false;
            this.loop();
            this.createMap();
            rankedRooms[this.id] = this;
        }
        createMap() {
            switch (Math.random() * 3 | 0) {
                case 0: {
                    const types = [Class.babyObstacle, Class.obstacle, Class.megaObstacle];
                    const count = (room.width / 100) * (Math.random() + .75);
                    for (let i = 0; i < count; i++) {
                        setTimeout(() => {
                            let type = ran.choose(types);
                            let x = 0,
                                position;
                            do {
                                position = room.randomType("norm");
                                x++;
                                if (x > 200) {
                                    util.warn("Failed to place obstacles!");
                                    return 0;
                                }
                            } while (dirtyCheck(position, 10 + type.SIZE));
                            let o = new Entity(position);
                            o.define(type);
                            o.team = -101;
                            o.facing = ran.randomAngle();
                            o.protect();
                            o.life();
                            o.roomId = this.id;
                        }, i * 250);
                    }
                } break;
                case 1: {
                    global.generateMaze(this.id);
                } break;
            }
        }
        broadcast(message, color = "") {
            this.forEach((socket) => {
                socket.talk("m", message, color);
            });
        }
        forEach(callback) {
            for (let i = 0; i < this.clients.length; i++) {
                callback(this.clients[i], this.clients[i].player ? this.clients[i].player.body : null, i);
            }
        }
        loop() { // 1s loop
            if (this.clients.filter(client => client.readyState === client.OPEN).length < 2) {
                this.forEach((socket, instance) => {
                    socket.talk("w", "results", 2, "The other party has disconnected");
                    socket.roomId = "ready";
                    if (instance) {
                        instance.onDead = () => { };
                        instance.kill();
                    }
                });
                entities.forEach(o => {
                    if (o.roomId === this.id) {
                        o.kill();
                    }
                });
                delete rankedRooms[this.id];
                return;
            }
            this.timer--;
            let stop = false;
            if (!this.battleStarted) { // Pre battle
                if (!this.timer) {
                    this.battleStarted = true;
                    this.timer = 181;
                    this.broadcast("The match has started! Good luck!");
                    entities.forEach(o => {
                        if (o.roomId === this.id) {
                            o.passive = false;
                        }
                    });
                    this.forEach((_, body) => {
                        if (body) {
                            body.passive = false;
                            body.invuln = false;
                            body.upgrades = [];
                            body.onDead = () => {
                                this.forEach((socket, instance) => {
                                    socket.talk("w", "results", socket.id !== body.socket.id, `1v1 Ranked Battle ${this.clients.map(client => `[${client.name}]`).join(" vs. ")}`);
                                    socket.roomId = "ready";
                                    if (socket.betaData.discordID !== -1) {
                                    }
                                    if (instance) {
                                        instance.onDead = () => { };
                                        instance.kill();
                                    }
                                });
                                entities.forEach(o => {
                                    if (o.roomId === this.id) {
                                        o.kill();
                                    }
                                });
                                clearTimeout(this.timeout);
                                delete rankedRooms[this.id];
                            }
                        }
                    });
                    this.timeout = setTimeout(() => this.loop(), 1000);
                    return;
                }
                this.forEach((_, body, i) => {
                    if (body) {
                        body.roomId = this.id;
                        body.passive = true;
                        body.x = i ? room.width : 0;
                        body.y = i ? room.height : 0;
                        body.onDead = () => {
                            this.forEach((socket, instance) => {
                                socket.talk("w", "results", 2, "The other party has disconnected");
                                socket.roomId = "ready";
                                if (instance) {
                                    instance.onDead = () => { };
                                    instance.kill();
                                }
                            });
                            entities.forEach(o => {
                                if (o.roomId === this.id) {
                                    o.kill();
                                }
                            });
                            clearTimeout(this.timeout);
                            delete rankedRooms[this.id];
                        }
                    } else if (this.timer <= 40) {
                        this.forEach((socket, instance) => {
                            socket.talk("w", "results", 2, "The other party has disconnected");
                            socket.roomId = "ready";
                            if (instance) {
                                instance.onDead = () => { };
                                instance.kill();
                            }
                        });
                        entities.forEach(o => {
                            if (o.roomId === this.id) {
                                o.kill();
                            }
                        });
                        clearTimeout(this.timeout);
                        delete rankedRooms[this.id];
                    }
                });
                if (this.timer < 10 || this.timer % 5 === 0) {
                    this.broadcast(this.timer + "s until start!");
                }
            } else {
                if (!this.timer) {
                    this.forEach((socket, instance) => {
                        socket.talk("w", "results", 2, "Time has expired");
                        socket.roomId = "ready";
                        if (instance) {
                            instance.onDead = () => { };
                            instance.kill();
                        }
                    });
                    entities.forEach(o => {
                        if (o.roomId === this.id) {
                            o.kill();
                        }
                    });
                    delete rankedRooms[this.id];
                    return;
                }
                if (this.timer < 10 || this.timer % (this.timer <= 30 ? 5 : 10) === 0) {
                    this.broadcast(this.timer + "s until the match is over!");
                }
            }
            if (stop) {
                return;
            }
            this.timeout = setTimeout(() => this.loop(), 1000);
        }
        get leaderboard() {
            let entries = this.clients.filter(client => client.player && client.player.body).map(client => {
                let body = client.player.body;
                return [
                    body.id,
                    Math.round(body.skill.score),
                    this.battleStarted ? body.index : Class.rankedBattle.index,
                    body.name,
                    body.color,
                    100 + Date.now() * 0.001 % 85 | 0,
                    body.nameColor,
                    body.labelOverride || 0
                ];
            });
            return [entries.length, ...entries].flat();
        }
        get minimap() {
            let entries = entities.filter(entity => entity.roomId === this.id && (entity.type === 'wall' || entity.type === "mazeWall") && entity.alpha > 0.2).map(my => {
                return [
                    my.id,
                    (my.type === 'wall' || my.type === "mazeWall") ? my.shape === 4 ? 2 : 1 : 0,
                    util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                    util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                    my.color,
                    Math.round(my.SIZE),
                    my.width || 1,
                    my.height || 1
                ]
            });
            return [entries.length, ...entries].flat();
        }
    }
    class Room {
        constructor(config) {

            if (!global.isVPS) {
                c.tabLimit = 1e5;
            }

            this.config = config;
            this.width = config.WIDTH;
            this.height = config.HEIGHT;
            this.setup = config.ROOM_SETUP;
            this.xgrid = this.setup[0].length;
            this.ygrid = this.setup.length;
            this.xgridWidth = this.width / this.xgrid;
            this.ygridHeight = this.height / this.ygrid;
            this.lastCycle = undefined;
            this.cycleSpeed = 1000 / c.gameSpeed / 30;
            this.gameMode = config.MODE;
            this.testingMode = c.testingMode;
            this.speed = c.gameSpeed;
            this.timeUntilRestart = c.restarts.interval;
            this.maxBots = c.BOTS;
            this.maxFood = config.MAX_FOOD;
            this.maxNestFood = config.MAX_NEST_FOOD;
            this.maxCrashers = config.MAX_CRASHERS;
            this.maxSancs = config.MAX_SANCS;
            this.skillBoost = config.SKILL_BOOST;
            this.topPlayerID = -1;
            this.arenaClosed = false;
            this.teamAmount = c.TEAM_AMOUNT;
            this.modelMode = c.modelMode;
            this.bossRushOver = false;
            this.bossRushWave = 0;
            this.bossString = "";
            this.motherships = [];
            this.nextTagBotTeam = [];
            this.defeatedTeams = [];
            this.wallCollisions = [];
            this.cardinals = [
                ["NW", "Northern", "NE"],
                ["Western", "Center", "Eastern"],
                ["SW", "Southern", "SE"]
            ];
            this.cellTypes = (() => {
                const output = ["nest", "norm", "rock", "roid", "port", "wall", "door", "edge", "domi", "outb", "door", "boss", "bosp"];
                for (let i = 1; i <= 8; i++) {
                    output.push("bas" + i);
                    output.push("bad" + i);
                    output.push("n_b" + i);
                    output.push("dom" + i);
                    output.push("mot" + i);
                    output.push("spn" + i);
                }
                for (let i = 0; i < this.ygrid; i++) {
                    for (let j = 0; j < this.xgrid; j++) {
                        if (!output.includes(this.setup[i][j])) {
                            output.push(this.setup[i][j]);
                        }
                    }
                }
                return output;
            })();
            for (let type of this.cellTypes) {
                this.findType(type);
            }
            this.partyHash = Array(config.TEAM_AMOUNT || 0).fill().map((_, i) => 1000 * (i + 1) + Math.floor(1000 * Math.random()));
            this.blackHoles = [];
            this.scale = {
                square: this.width * this.height / 100000000,
                linear: Math.sqrt(c.WIDTH * c.HEIGHT / 100000000)
            };
            this.rankedRoomTicker = 0;
            this.rankedRooms = [];
            this.tagMode = c.serverName.includes("Tag");
            this.mapPoints = [];
            if (c.ARENA_TYPE === 3) {
                let dist = this.width / 4;
                for (let i = 0; i < 3; i++) {
                    let angle = (Math.PI * 2 / 3 * i) + Math.PI / 2,
                        x = dist * Math.cos(angle) + this.width / 2,
                        y = dist * Math.sin(angle) + this.width / 2;
                    this.mapPoints.push({ x, y, angle });
                }
            }
        }
        isInRoom(location) {
            return location.x >= 0 && location.x <= this.width && location.y >= 0 && location.y <= this.height;
        }
        findType(type) {
            const output = [];
            for (let i = 0, l = this.setup.length; i < l; i++) {
                for (let j = 0, k = this.setup[i].length; j < k; j++) {
                    if (this.setup[i][j] === type) {
                        output.push({
                            x: (j + 0.5) * this.width / this.xgrid,
                            y: (i + 0.5) * this.height / this.ygrid,
                            id: j * this.xgrid + i
                        });
                    }
                }
            }
            this[type] = output;
        }
        setType(type, location) {
            if (!this.isInRoom(location)) {
                return false;
            }
            const a = ((location.y * this.ygrid) / this.height) | 0;
            const b = ((location.x * this.xgrid) / this.width) | 0;
            const oldType = this.setup[a][b];
            this.setup[a][b] = type;
            this.findType(type);
            this.findType(oldType);
            sockets.broadcastRoom();
        }
        random() {
            return {
                x: ran.irandom(this.width),
                y: ran.irandom(this.height)
            }
        }
        near(position, radius) {
            return {
                x: position.x + ((Math.random() * (radius * 2) | 0) - radius),
                y: position.y + ((Math.random() * (radius * 2) | 0) - radius)
            }
        }
        randomType(type) {
            if (!this[type] || !this[type].length) {
                return this.random();
            }
            const selection = this[type][Math.random() * this[type].length | 0];
            return {
                x: ran.irandom(this.width / this.xgrid) + selection.x - (.5 * this.width / this.xgrid),
                y: ran.irandom(this.height / this.ygrid) + selection.y - (.5 * this.width / this.xgrid),
            }
        }
        isIn(type, location) {
            if (!this.isInRoom(location)) {
                return false;
            }
            const a = (location.y * this.ygrid / this.height) | 0;
            const b = (location.x * this.xgrid / this.width) | 0;
            if (!this.setup[a] || !this.setup[a][b]) {
                return false;
            }
            return type === this.setup[a][b];
        }
        at(location) {
            if (!this.isInRoom(location)) {
                return "fuck";
            }
            const a = (location.y * this.ygrid / this.height) | 0;
            const b = (location.x * this.xgrid / this.width) | 0;
            if (!this.setup[a] || !this.setup[a][b]) {
                return "fuck";
            }
            return this.setup[a][b];
        }
        isAt(location) {
            if (!this.isInRoom(location)) {
                return false;
            }
            const x = (location.x * this.xgrid / this.width) | 0;
            const y = (location.y * this.ygrid / this.height) | 0;
            return {
                x: (x + .5) / this.xgrid * this.width,
                y: (y + .5) / this.ygrid * this.height,
                id: x * this.xgrid + y
            }
        }
        isInNorm(location) {
            if (!this.isInRoom(location)) {
                return false;
            }
            const a = (location.y * this.ygrid / this.height) | 0;
            const b = (location.x * this.xgrid / this.width) | 0;
            if (!this.setup[a] || !this.setup[a][b]) {
                return false;
            }
            const v = this.setup[a][b];
            return v !== 'norm' && v !== 'roid' && v !== 'rock' && v !== 'wall' && v !== 'edge';
        }
        gauss(clustering) {
            let output,
                i = 5;
            do {
                output = {
                    x: ran.gauss(this.width / 2, this.height / clustering),
                    y: ran.gauss(this.width / 2, this.height / clustering),
                };
                i--;
            } while (!this.isInRoom(output) && i > 0);
            return output;
        }
        gaussInverse(clustering) {
            let output,
                i = 5;
            do {
                output = {
                    x: ran.gaussInverse(0, this.width, clustering),
                    y: ran.gaussInverse(0, this.height, clustering),
                };
                i--;
            } while (!this.isInRoom(output), i > 0);
            return output;
        }
        gaussRing(radius, clustering) {
            let output,
                i = 5;
            do {
                output = ran.gaussRing(this.width * radius, clustering);
                output = {
                    x: output.x + this.width / 2,
                    y: output.y + this.height / 2,
                };
                i--;
            } while (!this.isInRoom(output) && i > 0);
            return output;
        }
        gaussType(type, clustering) {
            if (!this[type] || !this[type].length) {
                return this.random();
            }
            const selection = this[type][Math.random() * this[type].length | 0];
            let location = {},
                i = 5;
            do {
                location = {
                    x: ran.gauss(selection.x, this.width / this.xgrid / clustering),
                    y: ran.gauss(selection.y, this.height / this.ygrid / clustering),
                };
                i--;
            } while (!this.isIn(type, location) && i > 0);
            return location;
        }
        regenerateObstacles() {
            entities.forEach(entity => (entity.type === "wall" || entity.type === "mazeWall") && entity.kill());
            if (c.MAZE.ENABLED) {
                global.generateMaze(c.MAZE);
            } else {
                global.placeObstacles();
            }
        }
        init() {
            if (c.ROOM_SETUP.length !== c.Y_GRID) {
                util.warn("c.Y_GRID (" + c.ROOM_SETUP.length + ") has conflicts with the current room setup. Please check these configs and relaunch.");
                process.exit();
            }
            let fail = false;
            for (let i = 0; i < c.ROOM_SETUP.length; i++)
                if (c.ROOM_SETUP[i].length !== c.X_GRID) fail = true;
            if (fail) {
                util.warn("c.X_GRID has conflicts with the current room setup. Please check these configs and relaunch.");
                process.exit();
            }
            util.log(this.width + " x " + this.height + " room initalized. Max food: " + this.maxFood + ". Max nest food: " + this.maxNestFood + ". Max crashers: " + this.maxCrashers + ".");
            if (c.restarts.enabled) {
                let totalTime = c.restarts.interval;
                setTimeout(() => util.log("Automatic server restarting is enabled. Time until restart: " + this.timeUntilRestart / 7200 + " hours."), 340);
                setInterval(() => {
                    this.timeUntilRestart--;
                    if (this.timeUntilRestart === 1800 || this.timeUntilRestart === 900 || this.timeUntilRestart === 600 || this.timeUntilRestart === 300) {
                        if (c.serverName.includes("Boss")) sockets.broadcast(`WARNING: Tanks have ${this.timeUntilRestart / 60} minutes to defeat the boss rush!`, "#FFE46B");
                        else sockets.broadcast(`WARNING: The server will automatically restart in ${this.timeUntilRestart / 60} minutes!`, "#FFE46B");
                        util.warn(`Automatic restart will occur in ${this.timeUntilRestart / 60} minutes.`);
                    }
                    if (!this.timeUntilRestart) {
                        let reason = c.serverName.includes("Boss") ? "Reason: The tanks could only defeat " + this.bossRushWave + "/75 waves" : "Reason: Uptime has reached " + totalTime / 60 / 60 + " hours";
                        util.warn("Automatic server restart initialized! Closing arena...");
                        let toAdd = c.serverName.includes("Boss") ? "Tanks have run out of time to kill the bosses!" : c.serverName.includes("Domination") ? "No team has managed to capture all of the Dominators! " : c.serverName.includes("Mothership") ? "No team's Mothership has managed to become the last Mothership standing! " : "";
                        sockets.broadcast(toAdd + "Automatic server restart initializing...", "#FFE46B");
                        setTimeout(() => closeArena(), 2500);
                        if (c.serverName.includes("Boss")) this.bossRushOver = true;
                    }
                }, 1000);
            }
            if (c.PORTALS.ENABLED) util.log("Portal mode is enabled.");
            if (this.modelMode) util.warn("Model mode is enabled. This will only allow for you to make and see tank models. No shapes or bosses will spawn, and Basic is the only tank.");
        }
        resize(width, height) {
            this.width = width;
            this.height = height;
            for (let type of this.cellTypes) {
                this.findType(type);
            }
            this.regenerateObstacles();
            sockets.broadcastRoom();
        }
    }

    if (typeof c["KILL_SCORE_FORMULA"] === "string") {
        util.getJackpot = eval(`x => ${c["KILL_SCORE_FORMULA"]}`);
    }
    const room = new Room(c);

    class Vector {
        constructor(x, y) {
            this.X = x;
            this.Y = y;
        }
        get x() {
            if (isNaN(this.X)) this.X = c.MIN_SPEED;
            return this.X;
        }
        get y() {
            if (isNaN(this.Y)) this.Y = c.MIN_SPEED;
            return this.Y;
        }
        set x(value) {
            this.X = value;
        }
        set y(value) {
            this.Y = value;
        }
        null() {
            this.X = 0;
            this.Y = 0;
        }
        update() {
            this.len = this.length;
            this.dir = this.direction;
        }
        isShorterThan(d) {
            return this.x * this.x + this.y * this.y <= d * d;
        }
        unit() {
            let length = this.length;
            if (length === 0) return new Vector(1, 0);
            return new Vector(this.x / length, this.y / length);
        }
        get length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        get direction() {
            return Math.atan2(this.y, this.x);
        }
    }

    function newMockups(){
    
    // Defaults
    // Applied to every mockup, adds the value if its missing
    const defaults = {
        x: 0,
        y: 0,
        color: 16,
        shape: 0,
        size: 1,
        realSize: 1,
        facing: 0,
        layer: 0,
        statnames: 0,
        defaultArrayLength: 0,
        aspect: 1,
        skin: 0,
        colorUnmix: 0,
        angle: 0
    };
    
    function applyDefaults(mockup) {
        for (const key in mockup) {
            if (defaults[key] != null) {
                if (mockup[key] == defaults[key] || mockup[key] == null) {
                    delete mockup[key];
                }
            } else if (Array.isArray(mockup[key]) && mockup[key].length === defaults.defaultArrayLength) {
                delete mockup[key];
            }
        }
        (mockup.guns || []).forEach(gun => {
            for (const key in gun) {
                if (defaults[key] != null) {
                    if (gun[key] == defaults[key] || gun[key] == null) {
                        delete gun[key];
                    }
                } else if (Array.isArray(mockup[key]) && gun[key].length === defaults.defaultArrayLength) {
                    delete gun[key];
                }
            }
        });
        return mockup;
    }
    
    
    // Parsing
    // Parses the mockups
    class PriorityQueue {
        constructor() {
            this.clear();
        }
        clear() {
            this.array = [];
            this.sorted = true;
        }
        enqueue(priority, to) {
            this.array.push([priority, to]);
            this.sorted = false;
        }
        dequeue() {
            if (!this.sorted) {
                this.array.sort((a, b) => b[0] - a[0]);
                this.sorted = true;
            }
            return this.array.pop()[1];
        }
        getCount() {
            return this.array.length;
        }
    }
    function rounder(val) {
        if (Math.abs(val) < 0.001) val = 0;
        return +val.toPrecision(3);
    }
    const parseMockup = (e, p) => {
        return {
            index: e.index,
            name: e.label,
            x: rounder(e.x),
            y: rounder(e.y),
            color: e.color,
            shape: e.shapeData || 0,
            size: rounder(e.size),
            realSize: rounder(e.realSize),
            facing: rounder(e.facing),
            layer: e.layer,
            statnames: e.settings.skillNames,
            position: p,
            upgrades: e.upgrades.map(r => ({
                tier: r.tier,
                index: r.index
            })),
            guns: e.guns.map(g => {
                return {
                    offset: rounder(g.offset),
                    direction: rounder(g.direction),
                    length: rounder(g.length),
                    width: rounder(g.width),
                    aspect: rounder(g.aspect),
                    angle: rounder(g.angle),
                    color: rounder(g.color),
                    skin: rounder(g.skin),
                    color_unmix: rounder(g.color_unmix),
                    alpha: g.alpha
                };
            }),
            turrets: e.turrets.map(t => {
                let out = parseMockup(t, {});
                out.sizeFactor = rounder(t.bound.size);
                out.offset = rounder(t.bound.offset);
                out.direction = rounder(t.bound.direction);
                out.layer = rounder(t.bound.layer);
                out.angle = rounder(t.bound.angle);
                return applyDefaults(out);
            }),
            lasers: e.lasers.map(l => {
                return {
                    offset: rounder(l.offset),
                    direction: rounder(l.direction),
                    length: rounder(l.length),
                    width: rounder(l.width),
                    aspect: rounder(l.aspect),
                    angle: rounder(l.angle),
                    color: rounder(l.color),
                    laserWidth: rounder(l.laserWidth)
                };
            }),
            props: e.props.map(p => {
                return {
                    size: rounder(p.size),
                    x: rounder(p.x),
                    y: rounder(p.y),
                    angle: rounder(p.angle),
                    layer: rounder(p.layer),
                    color: rounder(p.color),
                    shape: p.shape,
                    fill: p.fill,
                    loop: p.loop,
                    isAura: p.isAura,
                    rpm: p.rpm,
                    specific: p.specific,
                    dip: p.dip,
                    ring: p.ring,
                    arclen: p.arclen
                };
            })
        };
    };
    
    // Unknown
    // I think this is what generates the upgrade icon data although im not sure
    const lazyRealSizes = (() => {
        let o = [1, 1, 1];
        for (let i = 3; i < 17; i++) {
            // We say that the real size of a 0-gon, 1-gon, 2-gon is one, then push the real sizes of triangles, squares, etc...
            o.push(Math.sqrt((2 * Math.PI / i) * (1 / Math.sin(2 * Math.PI / i))));
        }
        return o;
    })();
    function getDimensions(entities) {
        let endpoints = [];
        let pointDisplay = [];
        let pushEndpoints = function (model, scale, focus = {
            x: 0,
            y: 0
        }, rot = 0) {
            let s = Math.abs(model.shape);
            let z = (Math.abs(s) > lazyRealSizes.length) ? 1 : lazyRealSizes[Math.abs(s)];
            if (z === 1) { // Body (octagon if circle)
                for (let i = 0; i < 2; i += 0.5) {
                    endpoints.push({
                        x: focus.x + scale * Math.cos(i * Math.PI),
                        y: focus.y + scale * Math.sin(i * Math.PI)
                    });
                }
            } else { // Body (otherwise vertices)
                for (let i = (s % 2) ? 0 : Math.PI / s; i < s; i++) {
                    let theta = (i / s) * 2 * Math.PI;
                    endpoints.push({
                        x: focus.x + scale * z * Math.cos(theta),
                        y: focus.y + scale * z * Math.sin(theta)
                    });
                }
            }
            for (let i = 0; i < model.guns.length; i++) {
                let gun = model.guns[i];
                let h = gun.aspect > 0 ? ((scale * gun.width) / 2) * gun.aspect : (scale * gun.width) / 2;
                let r = Math.atan2(h, scale * gun.length) + rot;
                let l = Math.sqrt(scale * scale * gun.length * gun.length + h * h);
                let x = focus.x + scale * gun.offset * Math.cos(gun.direction + gun.angle + rot);
                let y = focus.y + scale * gun.offset * Math.sin(gun.direction + gun.angle + rot);
                endpoints.push({
                    x: x + l * Math.cos(gun.angle + r),
                    y: y + l * Math.sin(gun.angle + r)
                });
                endpoints.push({
                    x: x + l * Math.cos(gun.angle - r),
                    y: y + l * Math.sin(gun.angle - r)
                });
                pointDisplay.push({
                    x: x + l * Math.cos(gun.angle + r),
                    y: y + l * Math.sin(gun.angle + r)
                });
                pointDisplay.push({
                    x: x + l * Math.cos(gun.angle - r),
                    y: y + l * Math.sin(gun.angle - r)
                });
            }
            for (let i = 0; i < model.turrets.length; i++) {
                let turret = model.turrets[i];
                pushEndpoints(turret, turret.bound.size, {
                    x: turret.bound.offset * Math.cos(turret.bound.angle),
                    y: turret.bound.offset * Math.sin(turret.bound.angle)
                }, turret.bound.angle);
            }
        };
        pushEndpoints(entities, 1);
        // 2) Find their mass center
        let massCenter = {
            x: 0,
            y: 0
        };
        // 3) Choose three different points (hopefully ones very far from each other)
        let chooseFurthestAndRemove = function (furthestFrom) {
            let index = 0;
            if (furthestFrom != -1) {
                let list = new PriorityQueue();
                let d;
                for (let i = 0; i < endpoints.length; i++) {
                    let thisPoint = endpoints[i];
                    d = Math.pow(thisPoint.x - furthestFrom.x, 2) + Math.pow(thisPoint.y - furthestFrom.y, 2) + 1;
                    list.enqueue(1 / d, i);
                }
                index = list.dequeue();
            }
            let output = endpoints[index];
            endpoints.splice(index, 1);
            return output;
        };
        let point1 = chooseFurthestAndRemove(massCenter);
        let point2 = chooseFurthestAndRemove(point1);
        let chooseBiggestTriangleAndRemove = function (point1, point2) {
            let list = new PriorityQueue();
            let index = 0;
            let a;
            for (let i = 0; i < endpoints.length; i++) {
                let thisPoint = endpoints[i];
                a = Math.pow(thisPoint.x - point1.x, 2) + Math.pow(thisPoint.y - point1.y, 2) + Math.pow(thisPoint.x - point2.x, 2) + Math.pow(thisPoint.y - point2.y, 2);
                list.enqueue(1 / a, i);
            }
            index = list.dequeue();
            let output = endpoints[index];
            endpoints.splice(index, 1);
            return output;
        };
        let point3 = chooseBiggestTriangleAndRemove(point1, point2);
        // 4) Define our first enclosing circle as the one which seperates these three furthest points
        function circleOfThreePoints(p1, p2, p3) {
            let x1 = p1.x;
            let y1 = p1.y;
            let x2 = p2.x;
            let y2 = p2.y;
            let x3 = p3.x;
            let y3 = p3.y;
            let denom = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
            let xy1 = x1 * x1 + y1 * y1;
            let xy2 = x2 * x2 + y2 * y2;
            let xy3 = x3 * x3 + y3 * y3;
            let x = (xy1 * (y2 - y3) + xy2 * (y3 - y1) + xy3 * (y1 - y2)) / (2 * denom);
            let y = (xy1 * (x3 - x2) + xy2 * (x1 - x3) + xy3 * (x2 - x1)) / (2 * denom);
            let r = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
            let r2 = Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
            let r3 = Math.sqrt(Math.pow(x - x3, 2) + Math.pow(y - y3, 2));
            //if (r != r2 || r != r3) util.log("Something is up with the mockups generation!");
            return {
                x: isNaN(x) ? 0 : x,
                y: isNaN(y) ? 0 : y,
                radius: isNaN(r) ? 1 : r
            };
        }
        let c = circleOfThreePoints(point1, point2, point3);
        pointDisplay = [{
            x: rounder(point1.x),
            y: rounder(point1.y),
        }, {
            x: rounder(point2.x),
            y: rounder(point2.y),
        }, {
            x: rounder(point3.x),
            y: rounder(point3.y),
        }];
        let centerOfCircle = {
            x: c.x,
            y: c.y
        };
        let radiusOfCircle = c.radius;
        // 5) Check to see if we enclosed everything
        function checkingFunction() {
            for (let i = endpoints.length; i > 0; i--) {
                // Select the one furthest from the center of our circle and remove it
                point1 = chooseFurthestAndRemove(centerOfCircle);
                let vectorFromPointToCircleCenter = new Vector(centerOfCircle.x - point1.x, centerOfCircle.y - point1.y);
                // 6) If we're still outside of this circle build a new circle which encloses the old circle and the new point
                if (vectorFromPointToCircleCenter.length > radiusOfCircle) {
                    pointDisplay.push({
                        x: rounder(point1.x),
                        y: rounder(point1.y)
                    });
                    // Define our new point as the far side of the cirle
                    let dir = vectorFromPointToCircleCenter.direction;
                    point2 = {
                        x: centerOfCircle.x + radiusOfCircle * Math.cos(dir),
                        y: centerOfCircle.y + radiusOfCircle * Math.sin(dir)
                    };
                    break;
                }
            }
            // False if we checked everything, true if we didn't
            return !!endpoints.length;
        }
        while (checkingFunction()) { // 7) Repeat until we enclose everything
            centerOfCircle = {
                x: (point1.x + point2.x) / 2,
                y: (point1.y + point2.y) / 2,
            };
            radiusOfCircle = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)) / 2;
        }
        // 8) Since this algorithm isn't perfect but we know our shapes are bilaterally symmetrical, we bind this circle along the x-axis to make it behave better
        return {
            middle: {
                x: rounder(centerOfCircle.x),
                y: 0
            },
            axis: rounder(radiusOfCircle * 2),
            points: pointDisplay,
        };
    }
    
    // Mockup Generator
    // Generates the actual mockup info
    let cachedMockups = new Map()
    return {
        getMockup: function (entityIndex, skipCacheCheck) {
            // If we already made the mockup return the cached version
            if(!skipCacheCheck){
                let cachedValue = cachedMockups.get(entityIndex)
                if (cachedValue) {
                    return cachedValue
                }
            }
        
            // Make the mockup
            let classString = `${entityIndex} (entity index)`;
            try {
                classString = exportNames[entityIndex]
                if (!classString) {
                    return ""
                }
                let o = new Entity({
                    x: 0,
                    y: 0
                });
                let temp = Class[classString];
            
                o.upgrades = [];
                o.settings.skillNames = null;
                o.minimalReset();
                o.minimalDefine(temp);
                o.name = temp.LABEL;
                temp.mockup = {
                    body: o.camera(true),
                    position: getDimensions(o)
                };
                temp.mockup.body.position = temp.mockup.position;
                let mockup = applyDefaults(parseMockup(o, temp.mockup.position));
                cachedMockups.set(entityIndex, mockup)
                o.destroy();
                purgeEntities();
                return mockup
            } catch (err) {
                console.error("ERROR WHILE GENERATING MOCKUP: " + classString)
                console.error(err)
            }
        }
    }
}
    global.mockups = newMockups()

    global.exportNames = []
    global.Class = (() => {
        let def = window.defExports
        for (let k in def) {
            // Checks
            if (!def.hasOwnProperty(k)){
                continue;
            };

            // Add it
            def[k].index = global.exportNames.length;
            global.exportNames[def[k].index] = k
        }
        return def;
    })();
    function updateClassDatas(exportName, data){
        Class[exportName] = data
        Class[exportName].index = global.exportNames.length
        global.exportNames.push(exportName)
        return Class[exportName]
    }
    // These two are seperate for error catching reasons, you might not mean to overwrite mockups if you do the first but you mean to if you do the second
    global.addNewClass = (exportName, data) => {
        if(Class[exportName]){
            throw new Error(`Trying to add existing mockup "${exportName}"`);
        }
        updateClassDatas(exportName, data)
        sockets.talkToAll("mu", Class[exportName].index, JSON.stringify(mockups.getMockup(Class[exportName].index, true/*skip cache chcek*/)))
    }
    global.updateClass = (exportName, data) =>{
        if (!Class[exportName]) {
            throw new Error(`Trying to update nonexistent mockup "${exportName}"`);
        }
        updateClassDatas(exportName, data)
        sockets.talkToAll("mu", Class[exportName].index, JSON.stringify(mockups.getMockup(Class[exportName].index, true/*skip cache chcek*/)))
    }

    function nearest(array, location, test) {
        if (!array.length) return;
        let priority = Infinity,
            lowest;
        if (test) {
            for (let i = 0, l = array.length; i < l; i++) {
                let x = array[i].x - location.x,
                    y = array[i].y - location.y,
                    d = x * x + y * y;
                if (d < priority && test(array[i], d)) {
                    priority = d;
                    lowest = array[i];
                }
            }
        } else {
            for (let i = 0, l = array.length; i < l; i++) {
                let x = array[i].x - location.x,
                    y = array[i].y - location.y,
                    d = x * x + y * y;
                if (d < priority) {
                    priority = d;
                    lowest = array[i];
                }
            }
        }
        return lowest;
    }

    function timeOfImpact(p, v, s) {
        // Requires relative position and velocity to aiming point
        let a = s * s - (v.x * v.x + v.y * v.y),
            b = p.x * v.x + p.y * v.y,
            c = p.x * p.x + p.y * p.y,
            d = b * b + a * c,
            t = 0;
        if (d >= 0) {
            t = Math.max(0, (b + Math.sqrt(d)) / a);
        }
        return t * 0.9;
    }

    const sendRecordValid = (data) => {
        api.apiConnection.talk({
            type: "record",
            data: {
                gamemode: c.serverName,
                tank: data.tank,
                score: data.score,
                timeAlive: data.timeAlive,
                totalKills: data.totalKills,
                discord: typeof data.discord === "string" ? `<@${data.discord}>` : data.name
            }
        })
    };

    const teamNames = ["BLUE", "RED", "GREEN", "PURPLE", "TEAL", "LIME", "ORANGE", "GREY"];
    const teamColors = [10, 12, 11, 15, 0, 1, 2, 6];

    function getTeamColor(team) {
        if (Math.abs(team) - 1 >= teamNames.length) {
            return 13;
        }
        return teamColors[Math.abs(team) - 1];
    }

    function getTeam(type = 0) { // 0 - Bots only, 1 - Players only, 2 - all
        const teamData = {};
        for (let i = 0; i < room.teamAmount; i++) teamData[i + 1] = 0;
        if (type !== 1) {
            /*entities.forEach(o => {
                if ((o.isBot) && (-o.team > 0 && -o.team <= room.teamAmount)) {
                    teamData[-o.team]++;
                }
            });*/

            for (let o of entities) {
                if (o.isBot && -o.team > 0 && -o.team <= room.teamAmount) {
                    teamData[-o.team]++;
                }
            }
        }
        if (type !== 0) {
            for (let socket of clients) {
                if (socket.rememberedTeam > 0 && socket.rememberedTeam <= room.teamAmount) {
                    teamData[socket.rememberedTeam]++;
                }
            }
        }
        const toSort = Object.keys(teamData).map(key => [key, teamData[key]]).filter(entry => !room.defeatedTeams.includes(-entry[0])).sort((a, b) => a[1] - b[1]);
        return toSort.length === 0 ? ((Math.random() * room.teamAmount | 0) + 1) : toSort[0][0];
    }

    let botTanks = (function () {
        let output = [];
        function add(my, skipAdding = false) {
            if (output.includes(my)) {
                return;
            }
            if (!skipAdding) {
                output.push(my);
            }
            for (let key in my) {
                if (key.startsWith("UPGRADES_TIER")) {
                    my[key].forEach(add);
                    flag = 1;
                }
            }
        }
        switch (c.serverName) {
            case "Squidward's Tiki Land":
                add(Class.playableAC);
                break;
            case "Bounce":
                add(Class.bouncer);
                break;
            default:
                add(Class.basic);
        };
        return output;
    })();

    const spawnBot = (loc = null) => {
        let position = loc,
            max = 100;
        if (!loc) {
            do position = room.randomType(c.serverName === "Infiltration" ? "edge" : "norm");
            while (dirtyCheck(position, 400) && max-- > 0);
        }
        let o = new Entity(position);
        o.color = 12;
        if (room.gameMode === "tdm") {
            let team = c.serverName === "Infiltration" ? 20 : room.nextTagBotTeam.shift() || getTeam(0);
            o.team = -team;
            o.color = team === 20 ? 17 : [10, 12, 11, 15, 3, 35, 36, 0][team - 1];
        }
        // Reload, Pen, Bullet Health, Bullet Damage, Bullet Speed, Capacity, Body Damage, Max Health, Regen, Speed
        let tank = c.serverName === "Infiltration" ? Class[ran.choose(["infiltrator", "infiltratorFortress", "infiltratorTurrates"])] : ran.choose(botTanks),
            botType = (tank.IS_SMASHER || tank.IS_LANCER) ? "bot2" : "bot",
            skillSet = tank.IS_LANCER ? ran.choose([
                [0, 0, 3, 8, 8, 8, 6, 8, 0, 0],
                [1, 5, 1, 7, 7, 9, 2, 7, 0, 3],
                [0, 0, 0, 6, 9, 9, 9, 9, 0, 0],
            ]) : tank.IS_SMASHER && !tank.IS_BOUNCER ? ran.choose([
                [12, 12, 11, 11, 11, 11, 0, 12, 0, 6],
                [10, 12, 11, 11, 11, 11, 0, 10, 3, 7],
                [9, 11, 11, 11, 11, 11, 4, 8, 1, 5],
            ]) : tank.IS_BOUNCER ? ran.choose([
                [12, 12, 0, 0, 3, 0, 0, 6, 0, 12],
                [12, 0, 0, 0, 3, 0, 9, 8, 3, 6],
                [12, 6, 0, 0, 3, 0, 3, 8, 3, 0],
                [0, 12, 0, 0, 0, 0, 3, 8, 3, 4]
            ]) : ran.choose([ // Dupes act as a weight system lo
                [0, 0, 4, 8, 8, 9, 8, 5, 0, 0],
                [0, 0, 5, 9, 9, 9, 9, 1, 0, 0],
                [0, 0, 8, 7, 7, 8, 5, 7, 0, 0],
                [2, 4, 2, 7, 6, 9, 6, 5, 0, 1],
                [0, 0, 8, 9, 9, 9, 0, 7, 0, 0],
                [0, 0, 4, 8, 8, 9, 8, 5, 0, 0],
                [0, 0, 5, 9, 9, 9, 9, 1, 0, 0],
                [0, 0, 8, 7, 7, 8, 5, 7, 0, 0],
                [0, 0, 5, 9, 9, 9, 9, 1, 0, 0],
                [0, 0, 8, 7, 7, 8, 5, 7, 0, 0],
                [2, 4, 2, 7, 6, 9, 6, 5, 0, 1],
                [0, 0, 8, 9, 9, 9, 0, 7, 0, 0],
                [0, 0, 8, 9, 9, 9, 0, 7, 0, 0],
                [4, 4, 2, 7, 7, 7, 3, 8, 0, 0],
            ]);
        o.isBot = true;
        o.define(Class[botType]);
        o.tank = tank;
        o.define(tank);
        o.name = "[AI] " + ran.chooseBotName().replaceAll("%t", o.label);
        o.nameColor = o.name.includes("Bee") ? "#FFF782" : o.name.includes("Honey Bee") ? "#FCCF3B" : o.name.includes("Fallen") ? "#CCCCCC" : "#C1CAFF";
        o.autoOverride = true;
        o.invuln = true;
        o.skill.score = 26302 + Math.floor(10000 * Math.random());
        o.fov *= 0.85
        setTimeout(() => {
            o.invuln = false;
            o.autoOverride = false;
            o.skill.maintain();
            o.refreshBodyAttributes();
            o.skill.set([skillSet[6], skillSet[4], skillSet[3], skillSet[5], skillSet[2], skillSet[9], skillSet[0], skillSet[1], skillSet[8], skillSet[7]].map(value => {
                if (value < 9 && Math.random() > 0.85) value += 1;
                return value
            }));
            o.controllers.push(new ioTypes.roamWhenIdle(o));
        }, 7500);
        if (room.maxBots > 0) bots.push(o);
        return o;
    };

    const closeArena = () => {
        if (c.serverName.includes("Boss")) room.bossRushOver = true;
        room.arenaClosed = true;
        //if (c.enableBot) editStatusMessage("Offline");
        sockets.broadcast("Arena Closed: No players can join.", "#FF0000");
        for (let socket of clients) socket.talk("P", "The arena has closed. Please try again later once the server restarts.", ran.randomLore());
        util.log("The arena has closed!", true);
        if (room.modelMode || c.SANDBOX) {
            util.warn("Closing server...");
            return setTimeout(() => process.exit(), 750);
        }
        let closers = [
            Class.arenaCloserAI,
            Class.arenaCloser5AI,
            Class.machCloserAI,
            Class.boostCloserAI,
            Class.rediShotgunAI,
            Class.bigChungusAI,
            Class.sniperCloserAI,
            Class.hotwheelsAI,
            Class.absoluteCyanideAI,
            Class.arenaSummonerAI,
            Class.trapperCloserAI,
            Class.borerCloserAI,
            Class.hybridCloserAI,
            Class.acCeptionAI,
            Class.minishotCloserAI,
            Class.octoArenaCloserAI,
            Class.spreadCloserAI,
            Class.ac3ai,
            Class.cruiserCloserAI
        ],
            positions = [{
                x: room.width * .25,
                y: room.height * -.25
            }, {
                x: room.width * .25,
                y: room.height * 1.25
            }, {
                x: room.width * -.25,
                y: room.height * .25
            }, {
                x: room.width * 1.25,
                y: room.height * .25
            }, {
                x: room.width * .75,
                y: room.height * -.25
            }, {
                x: room.width * 1.25,
                y: room.height * 1.25
            }, {
                x: room.width * -.25,
                y: room.height * .75
            }, {
                x: room.width * 1.25,
                y: room.height * .75
            }];
        for (let i = 0; i < 8; i++) {
            let o = new Entity(positions[i]);
            o.define(ran.choose(closers));
            o.team = -100;
            o.alwaysActive = true;
            //o.facing += ran.randomRange(.5 * Math.PI, Math.PI); // Does nothing
        }
        for (let body of bots) body.kill();
        let completed = false;
        let interval = setInterval(() => {
            let alivePlayers = players.filter(player => player.body != null && player.body.isAlive() && player.body.type === "tank");
            for (let player of alivePlayers) {
                let body = player.body;
                body.passive = body.invuln = body.godmode = false;
                entities.forEach(o => {
                    if (o.master.id === body.id && o.id !== body.id) o.passive = false;
                });
                body.dangerValue = 7;
            }
            if (!alivePlayers.length && !completed) {
                completed = true;
                clearInterval(interval);
                setTimeout(() => {
                    util.log("All players are dead! Ending process...", true);
                    setTimeout(process.exit, 500);
                }, 1000);
            }
        }, 100);
        setTimeout(() => {
            completed = true;
            util.log("Arena Closers took too long! Ending process...", true);
            setTimeout(process.exit, 500);
        }, 6e4);
    };

    function countPlayers() {
        let teams = [];
        for (let i = 1; i < c.TEAM_AMOUNT + 1; i++) teams.push([-i, 0]);
        let all = 0;
        /*entities.forEach(o => {
            if (o.isPlayer || o.isBot) {
                if ([-1, -2, -3, -4, -5, -6, -7, -8].includes(o.team)) {
                    teams.find(entry => entry[0] === o.team)[1]++;
                    all++;
                };
            }
        });*/
        for (let o of entities) {
            if (o.isPlayer || o.isBot) {
                if ([-1, -2, -3, -4, -5, -6, -7, -8].includes(o.team)) {
                    teams.find(entry => entry[0] === o.team)[1]++;
                    all++;
                };
            }
        }
        let team = teams.find(entry => entry[1] === all);
        if (team) winner(-team[0] - 1);
    };

    let won = false;

    function winner(teamId) {
        if (won) return;
        won = true;
        let team = ["BLUE", "RED", "GREEN", "PURPLE"][teamId];
        sockets.broadcast(team + " has won the game!", ["#00B0E1", "#F04F54", "#00E06C", "#BE7FF5", "#FFEB8E", "F37C20", "#E85DDF", "#8EFFFB"][teamId]);
        setTimeout(closeArena, 3e3);
    };

    function tagDeathEvent(instance) {
        let killers = [];
        for (let entry of instance.collisionArray)
            if (entry.team > -9 && entry.team < 0 && instance.team !== entry.team) killers.push(entry);
        if (!killers.length) return;
        let killer = ran.choose(killers);
        if (instance.socket) instance.socket.rememberedTeam = -killer.team;
        if (instance.isBot) room.nextTagBotTeam.push(-killer.team);
        setTimeout(countPlayers, 1000);
    }

    const smoke = (timeout, x, y) => {
        let smokeSpawner = new Entity({
            x: x,
            y: y
        });
        smokeSpawner.define(Class.smokeSpawner);
        smokeSpawner.passive = true;
        setTimeout(() => smokeSpawner.kill(), timeout);
    };

    class Domination {
        constructor() {
            this.takenDominators = (new Array(room.teamAmount)).fill(0);
            this.amountOfDominators = room.domi.length;
        }

        init() {
            for (let location of room.domi) {
                let dominator = new Entity(location);
                dominator.define([
                    Class.destroyerDominatorAI,
                    Class.gunnerDominatorAI,
                    Class.trapperDominatorAI,
                    Class.crockettDominatorAI,
                    Class.steamrollDominatorAI,
                    Class.autoDominatorAI
                ][ran.chooseChance(35, 35, 10, 8, 10, 10)]);

                dominator.alwaysActive = true;
                dominator.color = 13;
                dominator.FOV = .5;
                dominator.isDominator = true;
                dominator.miscIdentifier = "appearOnMinimap";
                dominator.settings.hitsOwnType = "pushOnlyTeam";
                dominator.SIZE = 70;
                dominator.team = -100;

                dominator.onDead = () => {
                    // Cheeky lil workabout so we don't have to redefine a dominator
                    dominator.health.amount = dominator.health.max;
                    dominator.isGhost = false;
                    dominator.hasDoneOnDead = false;

                    // Get the people who murdered the dominator
                    let killers = [];
                    for (let instance of dominator.collisionArray) {
                        if (instance.team >= -room.teamAmount && instance.team <= -1) {
                            killers.push(instance.team);
                        }
                    }

                    let killTeam = killers.length ? ran.choose(killers) : 0,
                        team = ["INVALID", "BLUE", "RED", "GREEN", "PURPLE", "YELLOW", "ORANGE", "PINK", "TEAL"][-killTeam],
                        teamColor = ["#000000", "#00B0E1", "#F04F54", "#00E06C", "#BE7FF5", "#FFEB8E", "#F37C20", "#E85DDF", "#8EFFFB"][-killTeam];

                    // If the dominator is taken, make it contested
                    if (dominator.team !== -100) {
                        this.takenDominators[-dominator.team] -= 1;
                        killTeam = 0;
                        sockets.broadcast(`The ${room.cardinals[Math.floor(3 * location.y / room.height)][Math.floor(3 * location.x / room.height)]} Dominator is being contested!`, "#FFE46B");
                    } else { // If a contested dominator is taken...
                        this.takenDominators[-killTeam] += 1;
                        sockets.broadcast(`The ${room.cardinals[Math.floor(3 * location.y / room.height)][Math.floor(3 * location.x / room.height)]} Dominator is now captured by ${team}!`, teamColor);

                        entities.forEach(body => {
                            if (body.team === killTeam && body.type === "tank" && !body.underControl) {
                                body.sendMessage("Press H to control the Dominator!");
                            }
                        });
                    }

                    // Set area type based off of team
                    room.setType(`dom${-killTeam || "i"}`, location);

                    // Set dominator team
                    dominator.team = killTeam || -100;
                    dominator.color = [13, 10, 12, 11, 15, 3, 35, 36, 0][-killTeam];

                    // If all dominators are taken by the same team, close the arena
                    if (this.takenDominators.includes(this.amountOfDominators) && killTeam && !room.arenaClosed) {
                        util.warn(`${team} has won the game! Closing arena...`);
                        setTimeout(() => sockets.broadcast(`${team} has won the game!`, teamColor), 2e3);
                        setTimeout(() => closeArena(), 5e3);
                    }
                };
            }
        }
    }

    const mothershipLoop = (loc, team) => {
        let o = new Entity(loc),
            teams = ["BLUE", "RED", "GREEN", "PURPLE", "YELLOW", "ORANGE", "PINK", "TEAL"],
            teamColors = ["#00B0E1", "#F04F54", "#00E06C", "#BE7FF5", "#FFEB8E", "#F37C20", "#E85DDF", "#8EFFFB"];
        o.define(Class.mothership);
        o.isMothership = true;
        o.miscIdentifier = "appearOnMinimap";
        o.alwaysActive = true;
        o.team = -team;
        o.controllers.push(new ioTypes.nearestDifferentMaster(o), new ioTypes.mapTargetToGoal(o), new ioTypes.roamWhenIdle(o));
        o.color = [10, 12, 11, 15, 3, 35, 36, 0][team - 1];
        o.nameColor = teamColors[team - 1];
        o.settings.hitsOwnType = "pushOnlyTeam";
        o.name = "Mothership";
        o.onDead = () => {
            room.defeatedTeams.push(o.team);
            sockets.broadcast(teams[team - 1] + "'s Mothership has been killed!", teamColors[team - 1]);
            if (room.motherships.length !== 1) util.remove(room.motherships, room.motherships.indexOf(o));
            entities.forEach(n => {
                if (n.team === o.team && (n.isBot || n.isPlayer)) {
                    n.sendMessage("Your team has been defeated!");
                    n.kill();
                }
            });
            if (room.arenaClosed || room.motherships.length !== 1) return;
            util.warn(teams[-room.motherships[0].team - 1] + " has won the game! Closing arena...");
            setTimeout(() => sockets.broadcast(teams[-room.motherships[0].team - 1] + " has won the game!", teamColors[-room.motherships[0].team - 1]), 2e3);
            setTimeout(() => closeArena(), 5e3);
        };
        room.motherships.push(o);
    };

    let soccer = {
        scoreboard: [0, 0],
        timer: 60,
        spawnBall: function () {
            let o = new Entity({
                x: room.width / 2,
                y: room.height / 2
            });
            o.define(Class.soccerBall);
            o.miscIdentifier = "appearOnMinimap";
            o.settings.noNameplate = true;
            o.settings.acceptsScore = false;
            o.team = -100;
            o.alwaysActive = true;
            o.modeDead = () => {
                let cell = o.myCell.slice(3);
                if (cell == 1) {
                    soccer.scoreboard[1]++;
                    sockets.broadcast("RED Scored!");
                }
                if (cell == 2) {
                    soccer.scoreboard[0]++;
                    sockets.broadcast("BLUE Scored!");
                }
                setTimeout(soccer.spawnBall, 1500);
            }
        },
        update: function () {
            soccer.timer--;
            if (soccer.timer <= 0) {
                if (soccer.scoreboard[0] > soccer.scoreboard[1]) {
                    sockets.broadcast("BLUE has won!");
                    setTimeout(closeArena, 2500);
                    return;
                } else if (soccer.scoreboard[0] < soccer.scoreboard[1]) {
                    sockets.broadcast("RED has won!");
                    setTimeout(closeArena, 2500);
                    return;
                } else {
                    sockets.broadcast("It was a tie!");
                    soccer.timer += 3;
                    setTimeout(() => sockets.broadcast("3 Minutes have been added to the clock!"), 1500);
                }
            }
            if (soccer.timer % 2 === 0) sockets.broadcast(soccer.timer + " minutes until the match is over!");
            setTimeout(soccer.update, 60000);
        },
        init: function () {
            soccer.spawnBall();
            setTimeout(soccer.update, 60000);
        }
    };
    const bossRushLoop = (function () {
        const bosses = [
            Class.eggQueenTier1AI, Class.eggQueenTier2AI, Class.eggQueenTier3AI, Class.AWP_1AI, Class.AWP_14AI,
            Class.AWP_24AI, Class.AWP_cos5AI, Class.AWP_psAI, Class.AWP_11AI, Class.AWP_8AI,
            Class.AWP_21AI, Class.AWP_28AI, Class.eliteRifleAI, Class.RK_1AI, Class.hexashipAI, Class.eliteDestroyerAI,
            Class.eliteGunnerAI, Class.eliteSprayerAI, Class.eliteTwinAI, Class.eliteMachineAI, Class.eliteTrapAI,
            Class.eliteBorerAI, Class.eliteSniperAI, Class.eliteBasicAI, Class.eliteInfernoAI, Class.fallenBoosterAI,
            Class.fallenOverlordAI, Class.fallenPistonAI, Class.fallenAutoTankAI, Class.fallenCavalcadeAI,
            Class.fallenFighterAI, Class.reanimFarmerAI, Class.reanimHeptaTrapAI, Class.reanimUziAI, Class.palisadeAI,
            Class.skimBossAI, Class.leviathanAI, Class.ultMultitoolAI, Class.nailerAI, Class.gravibusAI, Class.cometAI,
            Class.brownCometAI, Class.orangicusAI, Class.atriumAI, Class.constructionistAI, Class.dropshipAI,
            Class.armySentrySwarmAI, Class.armySentryGunAI, Class.armySentryTrapAI, Class.armySentryRangerAI, Class.armySentryBlastAI,
            Class.armySentrySwarmAI, Class.armySentryGunAI, Class.armySentryTrapAI, Class.armySentryRangerAI, Class.armySentryBlastAI,
            Class.derogatorAI, Class.hexadecagorAI, Class.blitzkriegAI, Class.demolisherAI, Class.octogeddonAI,
            Class.octagronAI, Class.ultimateAI, Class.cutterAI, Class.alphaSentryAI, Class.asteroidAI,
            Class.trapeFighterAI, Class.visUltimaAI, Class.gunshipAI, Class.messengerAI, Class.pulsarAI,
            Class.colliderAI, Class.deltrabladeAI, Class.aquamarineAI, Class.kioskAI, Class.vanguardAI,
            Class.magnetarAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.xyvAI,
            Class.conquistadorAI, Class.sassafrasAI, Class.constAI, Class.bowAI, Class.snowflakeAI, Class.greenGuardianAI, Class.lavenderGuardianAI,
            Class.eggSpiritTier1AI, Class.eggSpiritTier2AI, Class.eggSpiritTier3AI, Class.eggBossTier1AI, Class.eggBossTier2AI,
            Class.EK_3AI, Class.at4_bwAI, Class.confidentialAI, Class.s2_22AI, Class.hb3_37AI, Class.sacredCrasherAI, Class.legendaryCrasherAI,
            Class.iconsagonaAI, Class.hexagonBossAI, Class.heptagonBossAI, Class.ultraPuntAI, Class.vulcanShipAI, Class.trapDwellerAI,
            Class.astraAI, Class.eliteSidewindAI, Class.swarmSquareAI, Class.vacuoleAI, Class.lamperAI, Class.mk1AI, Class.mk2AI,
            Class.mk3AI, Class.tk1AI, Class.tk2AI, Class.tk3AI, Class.greendeltrabladeAI, Class.icecolliderAI, Class.neutronStarAI,
            Class.quasarAI, Class.icemessengerAI, Class.sorcererAI, Class.enchantressAI, Class.exorcistorAI, Class.triguardAI,
            Class.applicusAI, Class.lemonicusAI, Class.fallenDrifterAI, Class.RK_2AI, Class.RK_3AI, Class.rs1AI,
            Class.rs2AI, Class.rs3AI, Class.bluestarAI, Class.sliderAI, Class.splitterSummoner, Class.rogueMothershipAI,
            Class.streakAI, Class.goldenStreakAI, Class.curveplexAI, Class.orbitalspaceAI, Class.leshyAI, Class.leshyAIred,
            Class.eliteMinesweeperAI, Class.ascendedSquare, Class.ascendedTriangle, Class.ascendedPentagonAI, Class.lavendicusAI,
            Class.AWPOrchestra1AI, Class.AWPOrchestra2AI, Class.moonShardAAI, Class.moonShardBAI, Class.awpOrchestratan33AI,
            Class.AWPOrchestra4AI, Class.acedixAI, Class.nitriceAI, Class.cupidAI, Class.fallenCrasherAI
        ].filter(o => o != null);
        const waveAss = {
            25: [
                Class.lucrehulkAI, Class.lucrehulkCarrierAI, Class.lucrehulkBattleshipAI, Class.eggBossTier4AI,
                Class.eggSpiritTier4AI, Class.eggQueenTier4AI, Class.heptahedronAI, Class.LQMAI, Class.RK_4AI, 
                Class.frigateShipAI, Class.destroyerShipAI, Class.mk4AI, Class.tk4AI, Class.superSplitterSummoner,
                Class.odinAI, Class.athenaAI, Class.caelusAI, Class.demeterAI, Class.hermesAI
            ],
            30: [
                Class.minosAI, Class.sisyphusAI, Class.bidenAI, Class.grudgeAIWeaker, Class.redistributionAI
            ],
            50: [
                Class.boreasAI, Class.worldDestroyerAIWeaker, Class.mythicalCrasherAIWeaker, Class.sassafrasSupremeAIWeaker,
                Class.tetraplexAIWeaker, Class.squarefortAI, Class.voidPentagonAIWeaker, Class.clockAIWeaker, Class.RK_5AI,
                Class.rs4AIWeaker
            ]
        };
        for (const key in waveAss) {
            waveAss[key] = waveAss[key].filter(o => o != null);
        }
        const waveOverrides = {
            10: [
                [Class.treasuryAI, Class.fueronAI, Class.morningstarAI]
            ],
            20: [
                [Class.clockAI, Class.voidPentagonAI, Class.rs4AI, Class.grudgeAI]
            ],
            30: [
                [Class.mythicalCrasherAI, Class.sassafrasSupremeAI]
            ],
            40: [
                [Class.tetraplexAI, Class.worldDestroyer, Class.eggBossTier5AI]
            ],
            50: [
                [Class.moonAI, Class.es5AI]
            ],
            60: [
                [Class.legacyACAI, Class.PDKAI]
            ],
            /// THE GAUNTLET ///
            70: [
                [Class.sunkingAI, Class.awp30AI]
            ],
            71: [
                [Class.eggBossTier5AI, Class.boreasAI],
                [Class.eggBossTier5AI, Class.boreasAI],
                Class.cometAI,
                Class.cometAI,
                [Class.splitterSummoner, Class.fueronAI, Class.treasuryAI],
                [7, [Class.armySentryGunAI, Class.armySentryRangerAI, Class.armySentrySwarmAI, Class.armySentryTrapAI, Class.armySentryBlastAI]]
            ],
            72: [
                [Class.RK_5AI, Class.awp30AI, Class.sunkingAI],
                [Class.worldDestroyer, Class.tetraplexAI],
                [Class.legendaryCrasherAI, Class.clockAI],
                [Class.sacredCrasherAI, Class.confidentialAI],
                Class.neutronStarAI,
                [Class.eggQueenTier4AI, Class.eggBossTier4AI, Class.eggSpiritTier4AI],
                [7, [Class.armySentryGunAI, Class.armySentryRangerAI, Class.armySentrySwarmAI, Class.armySentryTrapAI, Class.armySentryBlastAI]]
            ],
            73: [
                [Class.triguardAI, Class.triguardAI, Class.quintetAI],
                [Class.lucrehulkCarrierAI, Class.lucrehulkBattleshipAI, Class.lucrehulkAI],
                Class.triguardAI,
                [Class.cranberryGaurdianAI, Class.greenGuardianAI, Class.lavenderGuardianAI, Class.s2_22AI, Class.at4_bwAI],
                [5, Class.polyamorousAI],
                [4, [Class.armySentryGunAI, Class.armySentryRangerAI, Class.armySentrySwarmAI, Class.armySentryTrapAI, Class.armySentryBlastAI]]
            ],
            74: [
                [Class.torchmorningstarAI, Class.PDKAI],
                [Class.quintetAI, Class.triguardAI, Class.pentaguardianAI],
                [2, [Class.minosAI, Class.sisyphusAI, Class.bidenAI]],
                [Class.AWP_28AI, Class.AWP_1AI, Class.AWP_psAI],
                [Class.mk5AI, Class.tk5AI, Class.eggBossTier5AI],
                [Class.frigateShipAI, Class.destroyerShipAI],
                [Class.mythicalCrasherAI, Class.sassafrasSupremeAI, Class.voidPentagonAI],
                [Class.RK_4AI, Class.tk4AI, Class.mk4AI],
                [Class.polyamorousAI, Class.quintetAI],
                [Class.squarefortAI, Class.heptahedronAI, Class.RK_3AI]
            ],
            75: [
                Class.eggBossTier6AI
            ],
        }
        for (let i = 0; i < bosses.length; i++) {
            if (bosses[i] != null) continue;
            console.warn(`[WARN] Boss at index "${i}" was null.`);
            bosses.splice(i, 1);
        }
        let bossesAlive;
        function entityModeDead() {
            bossesAlive--;
            if (bossesAlive <= 0) {
                if (room.bossRushWave === 75) {
                    sockets.broadcast("The tanks have beaten the boss rush!");
                    players.forEach(player => player.body != null && instance.body.rewardManager(-1, "victory_of_the_4th_war"));
                    setTimeout(closeArena, 2500);
                } else {
                    sockets.broadcast("The next wave will arrive in 10 seconds!");
                    setTimeout(bossRushLoop, 10000);
                }
            } else {
                sockets.broadcast(`${bossesAlive} Boss${bossesAlive > 1 ? "es" : ""} left!`);
            }
        };
        function spawnBoss(class_) {
            const o = new Entity(room.randomType("bosp"));
            o.team = -100;
            o.define(class_);
            o.modeDead = entityModeDead;
            bossesAlive++;
        }
        return function () {
            room.bossRushWave++;
            let amount = Math.round(Math.random() * 16 + 4 /*20 + 20*/);
            switch (room.bossRushWave) {
                case 10:
                case 20:
                case 30:
                case 40:
                case 50:
                case 60:
                case 70:
                case 75:
                    amount = 1;
                    break;
                case 71:
                case 72:
                case 73:
                case 74:
                    amount = 12;
                    break;
            }
            bossesAlive = 0;
            sockets.broadcast(`Wave ${room.bossRushWave} has arrived!`);
            if (waveAss[room.bossRushWave] != null) {
                const assertion = waveAss[room.bossRushWave];
                for (let i = 0; i < assertion.length; i++) {
                    bosses.push(assertion[i]);
                }
            }
            bosses.sort(() => 0.5 - Math.random());
            if (waveOverrides[room.bossRushWave] == null) {
                for (let i = 0; i < amount; i++) {
                    spawnBoss(bosses[i % bosses.length]);
                }
            } else {
                const override = waveOverrides[room.bossRushWave];
                for (let i = 0; i < override.length; i++) {
                    const entry = override[i];
                    if (Array.isArray(entry)) {
                        if (typeof entry[0] === "number") {
                            for (let j = 0; j < entry[0]; j++) {
                                if (Array.isArray(entry[1])) {
                                    spawnBoss(ran.choose(entry[1]));
                                } else {
                                    spawnBoss(entry[1]);
                                }
                            }
                        } else {
                            spawnBoss(ran.choose(entry));
                        }
                    } else {
                        spawnBoss(entry);
                    }
                }
            }
            sockets.broadcast(`${bossesAlive} Boss${bossesAlive > 1 ? "es" : ""} to kill!`);
        }
    })();

    const voidwalkers = (function () {
        // MAP SET UP //
        const doors = [];
        let buttons = [];
        function makeDoor(loc, team = -101) {
            const door = new Entity(loc);
            door.define(Class.mazeObstacle);
            door.team = team;
            door.SIZE = (room.width / room.xgrid) / 2;
            door.protect();
            door.life();
            door.color = 45;
            doors.push(door);
            const doorID = doors.indexOf(door);
            door.onDead = function () {
                for (const button of buttons) {
                    if (button.doorID === doorID) {
                        button.ignoreButtonKill = 2;
                        button.kill();
                    }
                }
            }
        }
        function makeButton(loc, open, doorID) {
            const button = new Entity(loc);
            button.define(Class.button);
            button.pushability = button.PUSHABILITY = 0;
            button.team = -101;
            button.doorID = doorID;
            button.color = (open ? 12 : 11);
            button.onDead = function () {
                buttons = buttons.filter(instance => instance.id !== button.id);
                if (!button.ignoreButtonKill) {
                    const door = doors[button.doorID];
                    if (open) {
                        door.alpha = 0.2;
                        door.passive = true;
                        if (door.isAlive() && door.alpha === .2 && door.passive) {
                            let toKill = buttons.find(newButton => newButton.doorID === button.doorID);
                            if (toKill) {
                                toKill.kill();
                            }
                        }
                    } else {
                        door.alpha = 1;
                        door.passive = false;
                    }
                    for (const other of buttons) {
                        if (button !== other && button.doorID === other.doorID) {
                            other.ignoreButtonKill = true;
                            other.kill();
                        }
                    }
                }
                if (button.ignoreButtonKill !== 2) {
                    setTimeout(() => {
                        makeButton(loc, !open, doorID);
                    }, 2500)
                }
            }
            buttons.push(button);
        }
        function makeButtons() {
            buttonLocs = [
            ]
            let i = 0;
            for (const loc of room.door) {
                makeDoor(loc);
                switch (i++) {
                    case 0:
                        buttonLocs.push({
                            x: loc.x,
                            y: loc.y + (room.height / room.ygrid) / 1.5
                        })
                        break;
                    case 1:
                        buttonLocs.push({
                            x: loc.x + (room.width / room.xgrid) / 1.5,
                            y: loc.y
                        })
                        break;
                    case 2:
                        buttonLocs.push({
                            x: loc.x - (room.width / room.xgrid) / 1.5,
                            y: loc.y
                        })
                        break;
                    case 3:
                        buttonLocs.push({
                            x: loc.x,
                            y: loc.y - (room.height / room.ygrid) / 1.5
                        })
                        break;
                }
            }
            i = 0
            for (const loc of buttonLocs) {
                makeButton(loc, 1, i++);
            }
        }
        makeButtons();
        function spawnDominator(location, team, type) {
            const o = new Entity(location);
            o.define(Class[type]);
            o.team = team;
            o.color = getTeamColor(team);
            o.name = "Outpost Guardian";
            o.isDominator = true;
            o.alwaysActive = true;
            o.settings.hitsOwnType = "pushOnlyTeam";
            o.FOV = .5;
        }
        spawnDominator(room["domm"][0], -1, "outpostGuardian");

        // DIFFICULTY INCREASING LOOP //
        setInterval(() => {
            for (let player of players) {
                // Setup any new players
                if (!player.body || (player.body && !player.body.isAlive())) {
                    if (player.vw.crasherArray) {
                        while (player.vw.crasherArray.length) {
                            player.vw.crasherArray.shift().destroy()
                        }
                    }
                    if (player.vw.sentryArray) {
                        while (player.vw.sentryArray.length) {
                            player.vw.sentryArray.shift().destroy()
                        }
                    }
                    if (player.vw.bossArray) {
                        while (player.vw.bossArray.length) {
                            player.vw.bossArray.shift().destroy()
                        }
                    }
                    continue
                }
                if (!player.vw) {
                    player.vw = {
                        crasherArray: [],
                        sentryArray: [],
                        bossArray: [],
                    }
                    player.body.skill.level = 60
                    player.body.skill.points = 42
                    player.body.refreshBodyAttributes()
                }
                player.body.scoped = false
                player.body.settings.leaderboardable = true

                // Adjust caps based on difficulty
                player.body.skill.score = player.vw.distanceFromOutpost = util.getDistance(player.body, room["domm"][0])
                player.vw.difficulty = Math.min(1, player.vw.distanceFromOutpost / 75_000) // 100000 being the farthest till difficulty stays the same
                player.vw.crasherAmount = Math.round(185 * player.vw.difficulty)
                player.vw.sentryAmount = Math.round(26 * player.vw.difficulty)
                player.vw.bossAmount = Math.round(5 * player.vw.difficulty)

                // Adjust enemies based on the caps
                // CRASHERS //
                for (let i = 0; i < player.vw.crasherArray.length; i++) {
                    let crasher = player.vw.crasherArray[i]
                    if (util.getDistance(player.body, crasher) > 2000) {
                        player.vw.crasherArray.splice(i, 1)
                        crasher.destroy()
                    }
                }
                while (player.vw.crasherArray.length > player.vw.crasherAmount) {
                    let crasher = player.vw.crasherArray.shift()
                    crasher.destroy()
                }
                let crasherList = getCrasherList(player.vw.difficulty)
                while (player.vw.crasherArray.length < player.vw.crasherAmount) {
                    if (!crasherList.length) {
                        break;
                    }
                    let crasher = summonCrasher(player, crasherList)
                    targetableEntities.push(crasher)
                    player.vw.crasherArray.push(crasher)
                }

                // SENTERIES //
                for (let i = 0; i < player.vw.sentryArray.length; i++) {
                    let sentry = player.vw.sentryArray[i]
                    if (util.getDistance(player.body, sentry) > 2000) {
                        player.vw.sentryArray.splice(i, 1)
                        sentry.destroy()
                    }
                }
                while (player.vw.sentryArray.length > player.vw.sentryAmount) {
                    let sentry = player.vw.sentryArray.shift()
                    sentry.destroy()
                }
                let sentryList = getSentryList(player.vw.difficulty)
                while (player.vw.sentryArray.length < player.vw.sentryAmount) {
                    if (!sentryList.length) {
                        break;
                    }
                    let sentry = summonSentry(player, sentryList)
                    targetableEntities.push(sentry)
                    player.vw.sentryArray.push(sentry)
                }

                // BOSSES // 
                for (let i = 0; i < player.vw.bossArray.length; i++) {
                    let boss = player.vw.bossArray[i]
                    if (util.getDistance(player.body, boss) > 2000) {
                        player.vw.bossArray.splice(i, 1)
                        boss.destroy()
                    }
                }
                while (player.vw.bossArray.length > player.vw.bossAmount) {
                    let boss = player.vw.bossArray.shift()
                    boss.destroy()
                }
                let bossList = getBossList(player.vw.difficulty)
                while (player.vw.bossArray.length < player.vw.bossAmount) {
                    if (!bossList.length) {
                        break;
                    }
                    let boss = summonBoss(player, bossList)
                    targetableEntities.push(boss)
                    player.vw.bossArray.push(boss)
                }
            }
        }, 1000)

        // DIFFICULTY INCREASING LOOP FUNCTIONS //
        const buffer = 1000 + ran.randomRange(-100, 100)
        let crasherDifficultyList = {
            "0.01": [
                "crasher",
                "longCrasher",
                "invisoCrasher",
                "minesweepCrasher",
                "walletCrasher",
                "eggCrasher",
                "dacaeInactive"
            ],
            "0.05": [
                "bladeCrasher",
                "semiCrushCrasher",
                "semiCrushCrasher0",
                "semiCrushCrasher14",
                "fastCrasher",
                "summonerSquare",
                "diamondCrasher1",
                "grouperCrasher"
            ],
            "0.15": [
                "redRunner1",
                "curvyBoy",
                "poisonBlades",
                "triangleCrasher",
                "wraithCrash"
            ],
            "0.20": [
                "visDestructia",
                "destroyCrasher",
                "kamikazeCrasher",
                "orbitcrasher",
                "busterCrasher",
                "crushCrasher",
                "pentagonCrasher",
                "tetraBlades",
                "ghoulCrash",
                "hivemindCrasher"
            ],
            "0.25": [
                "iceCrusher",
                "torchKamikaze",
                "redRunner2",
                "diamondCrasher2"
            ],
            "0.3": [
                "megaCrushCrasher",
                "prismarineCrash",
                "hexagonCrasher",
                "dacaeActive"
            ],
            "0.4": [
                "boomCrasher",
                "asteroidCrasher",
                "clasherCrasher",
                "diamondCrasher3",
                "sapphireCrash",
                "heartCrasher",
                "heptagonCrasher"
            ],
            "0.45": [
                "blueRunner"
            ],
            "0.5": [
                "redRunner3",
                "redRunner4",
                "wallerCrasher",
                "wallesCrasher",
                "diamondCrasher4",
                "visOccultatum"
            ]
        }
        function getCrasherList(diff) {
            let list = []
            for (let val in crasherDifficultyList) {
                if (Number(val) > diff) {
                    return list
                }
                list = list.concat(crasherDifficultyList[val])
            }
            return list
        }
        function summonCrasher(player, crasherList) {
            const angle = Math.PI * 2 * Math.random();
            let spawnPos = {
                x: player.body.x + Math.cos(angle) * buffer,
                y: player.body.y + Math.sin(angle) * buffer
            }
            let crasher = new Entity(spawnPos)
            let type = ran.choose(crasherList)
            crasher.define(Class[type])
            crasher.team = -2
            if (ran.chance(0.5)) {
                crasher.seeInvisible = true
            }
            crasher.settings.leaderboardable = false
            return crasher
        }

        let sentryDifficultyList = {
            "0.05": [
                "sentrySwarmAI",
                "sentryTrapAI",
            ],
            "0.15": [
                "sentryGunAI",
                "sentryRangerAI",
            ],
            "0.20": [
                "flashSentryAI",
                "semiCrushSentryAI",
                "scorcherSentryAI",
                "crasherHive"
            ],
            "0.25": [
                "crushSentryAI",
                "bladeSentryAI",
                "skimSentryAI",
            ],
            "0.40": [
                "squareSwarmerAI",
            ],
            "0.45": [
                "summonerLiteAI",
            ],
            "0.50": [
                "squareGunSentry",
                "crusaderCrash",
                "kamikazeCrasherLite",
                "diamondSentryAI",
                "conjLiteAI",
                "triangleGunSentryAI"
            ],
            "0.55": [
                "greenSentrySwarmAI"
            ],
            "0.65": [
                "awp39SentryAI",
                "varpAI"
            ],
            "0.7": [
                "flashGunnerAI"
            ]
        }
        function getSentryList(diff) {
            let list = []
            for (let val in sentryDifficultyList) {
                if (Number(val) > diff) {
                    return list
                }
                list = list.concat(sentryDifficultyList[val])
            }
            return list
        }
        function summonSentry(player, sentryList) {
            const angle = Math.PI * 2 * Math.random();
            let spawnPos = {
                x: player.body.x + Math.cos(angle) * buffer,
                y: player.body.y + Math.sin(angle) * buffer
            }
            let sentry = new Entity(spawnPos)
            let type = ran.choose(sentryList)
            sentry.define(Class[type])
            sentry.team = -2
            if (ran.chance(0.75)) {
                sentry.seeInvisible = true
            }
            sentry.settings.leaderboardable = false
            return sentry
        }

        let bossDifficultyList = {
            "0.3": [
                "trapperzoidAI",
                "sliderAI",
                "deltrabladeAI"
            ],
            "0.4": [
                "trapeFighterAI",
                "messengerAI",
                "acedixAI"
            ],
            "0.5": [
                "pulsarAI",
                "gunshipAI"
            ],
            "0.6": [
                "visUltimaAI",
                "colliderAI"
            ],
            "0.7": [
                "alphaSentryAI",
                "constructionistAI"
            ],
            "0.8": [
                "vanguardAI",
                "magnetarAI"
            ],
            "0.9": [
                "kioskAI",
                "aquamarineAI"
            ],
            "0.99": [
                "blitzkriegAI"
            ],
        }
        function getBossList(diff) {
            let list = []
            for (let val in bossDifficultyList) {
                if (Number(val) > diff) {
                    return list
                }
                list = list.concat(bossDifficultyList[val])
            }
            return list
        }
        function summonBoss(player, bossList) {
            const angle = Math.PI * 2 * Math.random();
            let spawnPos = {
                x: player.body.x + Math.cos(angle) * buffer,
                y: player.body.y + Math.sin(angle) * buffer
            }
            let boss = new Entity(spawnPos)
            let type = ran.choose(bossList)
            boss.define(Class[type])
            boss.team = -2
            boss.seeInvisible = true
            boss.settings.leaderboardable = false
            return boss
        }
    });

    const getEntity = id => entities.get(id);

    const trimName = name => (name || "").replace("‮", "").trim() || "An unnamed player";
    const quickCombine = stats => {
        if (stats == null) return "Please input a valid array of gun settings.";
        if (stats.length === 13) return "Please make sure to place the gun settings in an array.";
        let data = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        for (let value of stats)
            for (let i = 0; i < data.length; ++i) data[i] *= value[i];
        return data;
    };

    room.init();
    class IO {
        constructor(b) {
            this.body = b;
            this.acceptsFromTop = true;
        }
        think() {
            return {
                target: null,
                goal: null,
                fire: null,
                main: null,
                alt: null,
                power: null
            };
        }
    }
    const ioTypes = {};
    ioTypes.bossRushAI = class extends IO {
        constructor(body) {
            super(body);
            this.enabled = true;
            this.goal = room.randomType("nest");
        }
        think(input) {
            if (room.isIn("nest", this.body)) {
                this.enabled = false;
            }
            if (room.isIn("boss", this.body)) {
                this.enabled = true;
            }
            if (this.enabled) {
                return {
                    main: false,
                    fire: false,
                    alt: false,
                    goal: this.goal
                }
            } else if (!input.main && !input.alt) {
                if (room["bas1"] && room["bas1"].length) {
                    this.goal = room["bas1"][0];
                    return {
                        main: false,
                        fire: false,
                        alt: false,
                        goal: this.goal
                    }
                }
            }
        }
    }
    ioTypes.doNothing = class extends IO {
        constructor(b) {
            super(b);
            this.acceptsFromTop = false;
        }
        think() {
            return {
                goal: {
                    x: this.body.x,
                    y: this.body.y
                },
                main: false,
                alt: false,
                fire: false
            };
        }
    }
    ioTypes.droneTrap = class extends IO {
        constructor(b) {
            super(b);
            this.done = false;
        }
        think(input) {
            if (input.alt && !this.done) {
                this.done = true;
                this.body.define(Class.droneTrapTrap);
            }
        }
    }
    const quartPI = Math.PI / 4;
    ioTypes.moveInCircles = class extends IO {
        constructor(b) {
            super(b);
            this.acceptsFromTop = false;
            this.timer = ran.irandom(10) + 3;
            this.goal = {
                x: this.body.x + 7.5 * Math.cos(-this.body.facing),
                y: this.body.y + 7.5 * Math.sin(-this.body.facing)
            };
        }
        think() {
            if (!(this.timer--)) {
                this.timer = 10;
                this.goal = {
                    x: this.body.x + 7.5 * Math.cos(-this.body.facing),
                    y: this.body.y + 7.5 * Math.sin(-this.body.facing)
                };
            }
            return {
                goal: this.goal
            };
        }
    }
    ioTypes.listenToPlayer = class extends IO {
        constructor(b, p) {
            super(b);
            this.player = p;
            this.acceptsFromTop = false;
        }
        think() {
            let targ = {
                x: this.player.target.x,
                y: this.player.target.y
            };
            if (this.body.invuln && (this.player.command.right || this.player.command.left || this.player.command.up || this.player.command.down || this.player.command.lmb)) this.body.invuln = false;
            this.body.autoOverride = this.body.passive || this.player.command.override;
            if (this.body.aiSettings.isDigger) {
                let av = Math.sqrt(targ.x * targ.x, targ.y * targ.y);
                let x = targ.x /= av - 1;
                let y = targ.y /= av - 1;
                let p;
                if (!this.body.invuln) {
                    if (this.player.command.lmb) {
                        if (this.body.health.display() > 0.1) {
                            this.body.health.amount -= 1.5;
                            p = 1.75;
                        }
                    } else if (this.player.command.rmb) {
                        this.body.health.amount += 0.75;
                        p = 0.5;
                    } else p = 1;
                }
                if (p === 1) this.body.width = 1;
                else if (p > 1) this.body.width = 2;
                else this.body.width = 3;
                return {
                    target: {
                        x: x, y: y
                    },
                    _target: {
                        x: x, y: y
                    },
                    goal: {
                        x: this.body.x + x * !this.body.invuln,
                        y: this.body.y + y * !this.body.invuln
                    },
                    fire: this.player.command.lmb || this.player.command.autofire,
                    main: this.player.command.lmb || this.player.command.autospin || this.player.command.autofire,
                    alt: this.player.command.rmb,
                    power: p,
                }
            }
            if (this.player.command.autospin) {
                let kk = Math.atan2(this.body.control.target.y, this.body.control.target.x) + this.body.spinSpeed;
                targ = {
                    x: 275 * Math.cos(kk),
                    y: 275 * Math.sin(kk)
                };
            }
            return {
                target: targ,
                _target: targ,
                goal: {
                    x: this.body.x + (this.player.command.right - this.player.command.left),
                    y: this.body.y + (this.player.command.down - this.player.command.up)
                },
                fire: this.player.command.lmb || this.player.command.autofire,
                main: this.player.command.lmb || this.player.command.autospin || this.player.command.autofire,
                alt: this.player.command.rmb
            };
        }
    }
    ioTypes.listenToPlayerStatic = class extends IO {
        constructor(b, p) {
            super(b);
            this.player = p;
            this.acceptsFromTop = false;
        }
        think() {
            let targ = {
                x: this.player.target.x,
                y: this.player.target.y
            };
            if (this.player.command.autospin) {
                let kk = Math.atan2(this.body.control.target.y, this.body.control.target.x) + .02;
                targ = {
                    x: 275 * Math.cos(kk),
                    y: 275 * Math.sin(kk)
                };
            }
            if (this.body.invuln && (this.player.command.right || this.player.command.left || this.player.command.up || this.player.command.down || this.player.command.lmb)) this.body.invuln = false;
            this.body.autoOverride = this.body.passive || this.player.command.override;
            return {
                target: targ,
                fire: this.player.command.lmb || this.player.command.autofire,
                main: this.player.command.lmb || this.player.command.autospin || this.player.command.autofire,
                alt: this.player.command.rmb
            };
        }
    }
    ioTypes.mapTargetToGoal = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            if (input.main || input.alt) return {
                goal: {
                    x: input.target.x + this.body.x,
                    y: input.target.y + this.body.y
                },
                power: 1
            };
        }
    }
    ioTypes.guidedAlwaysTarget = class extends IO {
        constructor(b) {
            super(b);
            this.master = b.master
        }
        think(input) {
            return {
                target: {
                    x: this.master.control.target.x + this.master.x - this.body.x,
                    y: this.master.control.target.y + this.master.y - this.body.y
                },
                power: 1
            };
        }
    }
    ioTypes.guided = class extends IO {
        constructor(b) {
            super(b);
            this.master = b.master
        }
        think(input) {
            this.body.isGuided = true
            let main = undefined;
            for(let [key, child] of this.master.childrenMap){
                if(!child.isGuided) continue;
                main = child;
                break;
            }
            if (!main || !this.master.socket) {
                return
            }
            this.master.altCameraSource = [main.x, main.y]
        }
    }
    ioTypes.boomerang = class extends IO {
        constructor(b) {
            super(b);
            this.r = 0;
            this.b = b;
            this.m = b.master;
            this.turnover = false;
            this.myGoal = {
                x: 3 * b.master.control.target.x + b.master.x,
                y: 3 * b.master.control.target.y + b.master.y
            };
        }
        think(input) {
            if (this.b.range > this.r) this.r = this.b.range;
            let t = 1;
            if (!this.turnover) {
                if (this.r && this.b.range < this.r * .5) this.turnover = true;
                return {
                    goal: this.myGoal,
                    power: t
                };
            } else return {
                goal: {
                    x: this.m.x,
                    y: this.m.y
                },
                power: t
            };
        }
    }
    ioTypes.goToMasterTarget = class extends IO {
        constructor(body) {
            super(body);
            this.myGoal = {
                x: body.master.control.target.x + body.master.x,
                y: body.master.control.target.y + body.master.y
            };
            this.countdown = 5;
        }
        think() {
            if (this.countdown) {
                if (util.getDistance(this.body, this.myGoal) < 1) {
                    this.countdown--;
                }
                return {
                    goal: {
                        x: this.myGoal.x,
                        y: this.myGoal.y
                    }
                };
            }
        }
    }
    ioTypes.goAwayFromMasterTarget = class extends IO {
        constructor(body) {
            super(body);
            this.myGoal = {
                x: -body.master.control.target.x + body.master.x,
                y: -body.master.control.target.y + body.master.y
            };
            this.countdown = 5;
        }
        think() {
            if (this.countdown) {
                if (util.getDistance(this.body, this.myGoal) < 1) {
                    this.countdown--;
                }
                return {
                    goal: {
                        x: this.myGoal.x,
                        y: this.myGoal.y
                    }
                };
            }
        }
    }
    ioTypes.block = class extends IO {
        constructor(body) {
            super(body);
            this.blockAngle = Math.atan2(body.y - body.master.y, body.x - body.master.x) - Math.atan2(body.master.control.target.y, body.master.control.target.x);
            if (Math.abs(this.blockAngle) === Infinity) this.blockAngle = 0;
            this.myGoal = {
                x: body.master.control.target.x * Math.cos(this.blockAngle) - body.master.control.target.y * Math.sin(this.blockAngle) + body.master.x,
                y: body.master.control.target.x * Math.sin(this.blockAngle) + body.master.control.target.y * Math.cos(this.blockAngle) + body.master.y
            };
            this.countdown = 5;
        }
        think() {
            if (this.countdown) {
                if (util.getDistance(this.body, this.myGoal) < 1) {
                    this.countdown--;
                }
                return {
                    goal: {
                        x: this.myGoal.x,
                        y: this.myGoal.y
                    }
                };
            }
        }
    }
    ioTypes.portal2 = class extends IO {
        constructor(body) {
            super(body); this.portalAngle = Math.atan2(body.y - body.master.y, body.x - body.master.x) - Math.atan2(body.master.control.target.y, body.master.control.target.x);
            if (Math.abs(this.portalAngle) === Infinity) this.portalAngle = 0;
            this.myGoal = {
                x: body.master.control.target.x * Math.cos(this.portalAngle) - body.master.control.target.y * Math.sin(this.portalAngle) + body.master.x,
                y: body.master.control.target.x * Math.sin(this.portalAngle) + body.master.control.target.y * Math.cos(this.portalAngle) + body.master.y
        } 
    };
        think() {
            this.body.x = this.myGoal.x;
            this.body.y = this.myGoal.y;
            return {
                goal: {
                    x: this.myGoal.x,
                    y: this.myGoal.y
                }
            };
        }
    }
    ioTypes.triBoomerang = class extends IO {
        constructor(b) {
            super(b);
            this.r = 0;
            this.b = b;
            this.m = b.master;
            this.turnover = false;
            this.boomAngle = Math.atan2(b.y - b.master.y, b.x - b.master.x) - Math.atan2(b.master.control.target.y, b.master.control.target.x);
            if (Math.abs(this.boomAngle) === Infinity) this.boomAngle = 0;
            this.myGoal = {
                x: 3 * b.master.control.target.x * Math.cos(this.boomAngle) - 3 * b.master.control.target.y * Math.sin(this.boomAngle) + b.master.x,
                y: 3 * b.master.control.target.x * Math.sin(this.boomAngle) + 3 * b.master.control.target.y * Math.cos(this.boomAngle) + b.master.y,
            };
        }
        think(input) {
            if (this.b.range > this.r) this.r = this.b.range;
            let t = 1;
            if (!this.turnover) {
                if (this.r && this.b.range < this.r * .5) this.turnover = true;
                return {
                    goal: this.myGoal,
                    power: t
                };
            } else return {
                goal: {
                    x: this.m.x,
                    y: this.m.y
                },
                power: t
            };
        }
    }
    ioTypes.canRepel = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            if (input.alt && input.target && (util.getDistance(this.body, this.body.master) < this.body.master.fov / 1.5)) return {
                target: {
                    x: -input.target.x,
                    y: -input.target.y
                },
                main: true
            };
        }
    }
    ioTypes.mixedNumber = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            if (input.alt) {
                this.body.define(Class.mixedNumberTrap);
            }
        }
    }
    ioTypes.fireGunsOnAlt = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            if (input.alt) {
                for (let i = 0; i < this.body.guns.length; i++) {
                    let gun = this.body.guns[i];
                    let gx = gun.offset * Math.cos(gun.direction + gun.angle + gun.body.facing) + (1.35 * gun.length - gun.width * gun.settings.size / 2) * Math.cos(gun.angle + this.body.facing),
                        gy = gun.offset * Math.sin(gun.direction + gun.angle + gun.body.facing) + (1.35 * gun.length - gun.width * gun.settings.size / 2) * Math.sin(gun.angle + this.body.facing);
                    gun.fire(gx, gy, this.body.skill);
                }
                this.body.kill();
                let gun = this.body.master.guns[this.body.gunIndex];
                if (gun.countsOwnKids) gun.children = gun.children.filter(instance => instance == this);
            }
        }
    }
    ioTypes.killOnAlt = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            if (input.alt) {
                this.body.kill();
            }
        }
    }
    ioTypes.alwaysFire = class extends IO {
        constructor(body) {
            super(body);
        }
        think() {
            return {
                fire: true
            };
        }
    }
    ioTypes.targetSelf = class extends IO {
        constructor(body) {
            super(body);
        }
        think() {
            return {
                main: true,
                target: {
                    x: 0,
                    y: 0
                }
            };
        }
    }
    ioTypes.mapAltToFire = class extends IO {
        constructor(body) {
            super(body);
        }
        think(input) {
            if (input.alt) return {
                fire: true
            };
        }
    }
    ioTypes.onlyAcceptInArc = class extends IO {
        constructor(body) {
            super(body);
        }
        think(input) {
            if (input.target && this.body.firingArc != null && (Math.abs(util.angleDifference(Math.atan2(input.target.y, input.target.x), this.body.firingArc[0])) >= this.body.firingArc[1])) return {
                fire: false,
                alt: false,
                main: false
            };
        }
    }
    ioTypes.onlyFireWhenInRange = class extends IO {
        constructor(body) {
            super(body);
        }
        think(input) {
            if (input.target && this.body.firingArc != null) {
                if (Math.abs(util.angleDifference(Math.atan2(input.target.y, input.target.x), this.body.facing)) >= .0334) {
                    return {
                        fire: false,
                        altOverride: true
                    };
                }
            }
        }
    }
    ioTypes.battleshipTurret = class extends IO {
        constructor(body) {
            super(body);
        }
        think(input) {
            if (input.target) {
                if (Math.abs(util.angleDifference(Math.atan2(input.target.y, input.target.x), this.body.facing)) >= .015) {
                    return {
                        fire: false,
                        altOverride: true
                    };
                }
            }
        }
    }
    ioTypes.skipBomb = class extends IO {
        constructor(body) {
            super(body);
            this.time = 15;
            this.initialAngle = body.velocity.direction;
        }
        think(input) {
            this.time--;
            if (this.time <= 0) {
                this.time = 15;
                let angle = this.initialAngle + (Math.random() * (Math.PI / 2) - (Math.PI / 4));
                this.body.velocity = new Vector(Math.cos(angle) * this.body.initialBulletSpeed, Math.sin(angle) * this.body.initialBulletSpeed);
            }
        }
    }
    ioTypes.nearestDifferentMaster = class extends IO {
        // this is a bit of a hack, but it works
        constructor(body) {
            super(body);
            this.target = null;
            this.tick = 0;
            this.lead = 0;
            this.validTargets = [];
            this.oldHealth = body.health.display();
        }
        findTargets(range) {
            newLogs.buildList.start();
            let highestDanger = 0,
                output = [],
                myPos = {
                    x: this.body.x,
                    y: this.body.y
                },
                masterPos = {
                    x: this.body.master.master.x,
                    y: this.body.master.master.y
                },
                sqrRange = range * range,
                sqrRangeMaster = range * range * 4 / 3;
            /*let targetable = targetingGrid.queryForCollisionPairs({
                id: this.body.id,
                _AABB: targetingGrid.getAABB({
                    x: myPos.x,
                    y: myPos.y,
                    size: sqrRange
                })
            });*/
            for (let i = 0, l = targetableEntities.length; i < l; i++) {
                let entity = targetableEntities[i];
                if (
                    (
                        entity.master.master.team !== this.body.master.master.team &&
                        (this.body.aiSettings.farm || entity.dangerValue >= highestDanger) &&
                        (!c.RANKED_BATTLE || (entity.roomId === this.body.roomId)) &&
                        (!c.SANDBOX || (entity.sandboxId === this.body.sandboxId)) &&
                        (this.body.seeInvisible || this.body.isArenaCloser || entity.alpha > 0.5) &&
                        (this.body.settings.targetPlanes ? (entity.isPlane && (entity.type === "drone" || entity.type === "minion")) : (entity.type === "miniboss" || entity.type === "tank" || entity.type === "crasher" || (!this.body.aiSettings.IGNORE_SHAPES && entity.type === 'food'))) &&
                        (this.body.aiSettings.BLIND || ((entity.x - myPos.x) * (entity.x - myPos.x) < sqrRange && (entity.y - myPos.y) * (entity.y - myPos.y) < sqrRange)) &&
                        (this.body.aiSettings.SKYNET || ((entity.x - masterPos.x) * (entity.x - masterPos.x) < sqrRangeMaster && (entity.y - masterPos.y) * (entity.y - masterPos.y) < sqrRangeMaster))
                    ) && (
                        this.body.firingArc == null ||
                        this.body.aiSettings.view360 ||
                        Math.abs(util.angleDifference(util.getDirection(this.body, entity), this.body.firingArc[0])) < this.body.firingArc[1]
                    )
                ) {
                    highestDanger = entity.dangerValue;
                    output.push(entity);
                    if (this.targetLock && entity.id === this.targetLock.id) {
                        break;
                    }
                }
            }
            newLogs.buildList.stop();
            return output;
        }
        think(input) {
            if (input.main || input.alt || this.body.master.autoOverride || this.body.master.master.passive || this.body.master.master.invuln) {
                this.targetLock = undefined;
                return {};
            }
            newLogs.targeting.start();
            let tracking = this.body.topSpeed,
                range = this.body.fov;
            for (let i = 0, l = this.body.guns.length; i < l; i++) {
                if (this.body.guns[i].canShoot) {
                    let v = this.body.guns[i].getTracking();
                    tracking = v.speed;
                    if (this.isBot) {
                        if (this.body.fov < range) {
                            range = this.body.fov;
                        }
                    } else {
                        let fuck = (v.speed || 1.5) * (v.range < (this.body.size * 2) ? this.body.fov : v.range);
                        if (fuck < range) {
                            range = fuck;
                        }
                    }
                    break;
                }
            }
            if (range < this.body.size || !Number.isFinite(range)) {
                range = this.body.fov;
            }
            !Number.isFinite(tracking) && (tracking = this.body.topSpeed);
            // OK, now let's try reprocessing the targets!
            this.tick++;
            if (this.tick > 10) {
                this.tick = 0;
                newLogs.targeting.stop();
                this.validTargets = this.findTargets((this.body.isBot || this.body.isMothership) ? range * .65 : range);
                newLogs.targeting.start();
                if (this.targetLock && this.validTargets.indexOf(this.targetLock) === -1) {
                    this.targetLock = undefined;
                }
                if (this.targetLock == null && this.validTargets.length) {
                    this.targetLock = (this.validTargets.length === 1) ? this.validTargets[0] : nearest(this.validTargets, {
                        x: this.body.x,
                        y: this.body.y
                    });
                    this.tick = -5;
                }
            }
            if (this.body.isBot) {
                let damageRef = this.body.bond || this.body;
                if (damageRef.collisionArray.length && damageRef.health.display() < this.oldHealth) {
                    this.oldHealth = damageRef.health.display();
                    if (this.validTargets.indexOf(damageRef.collisionArray[0]) === -1) {
                        this.targetLock = damageRef.collisionArray[0].master.id === -1 ? damageRef.collisionArray[0].source : damageRef.collisionArray[0].master;
                    }
                }
            }
            if (this.targetLock != null) {
                let radial = this.targetLock.velocity,
                    diff = {
                        x: this.targetLock.x - this.body.x,
                        y: this.targetLock.y - this.body.y,
                    };
                if (this.tick % 2 === 0) {
                    this.lead = 0;
                    if (!this.body.aiSettings.CHASE) {
                        let toi = timeOfImpact(diff, radial, tracking);
                        this.lead = toi;
                    }
                }
                if (!Number.isFinite(this.lead)) {
                    this.lead = 0;
                }
                newLogs.targeting.stop();
                return {
                    target: {
                        x: diff.x + this.lead * radial.x,
                        y: diff.y + this.lead * radial.y,
                    },
                    fire: true,
                    main: true
                };
            }
            newLogs.targeting.stop();
            return {};
        }
    }
    ioTypes.roamWhenIdle = class extends IO {
        constructor(body) {
            super(body);
            this.goal = room.randomType("norm");;
        }
        think(input) {
            if (input.main || input.alt || this.body.master.autoOverride) {
                return {};
            }
            while (util.getDistance(this.goal, this.body) < this.body.SIZE * 2) {
                this.goal = room.randomType(Math.random() > .8 ? "nest" : "norm");
            }
            if (this.body.aiSettings.isDigger) return {
                goal: this.goal, target: {
                    x: -(this.body.x - this.goal.x),
                    y: -(this.body.y - this.goal.y)
                }
            };
            else return {
                goal: this.goal
            };
        }
    }
    ioTypes.minion = class extends IO {
        constructor(body) {
            super(body);
            this.turnwise = 1;
        }
        think(input) {
            if (input.target != null && (input.alt || input.main)) {
                let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE),
                    leash = 60 * sizeFactor,
                    orbit = 120 * sizeFactor,
                    repel = 135 * sizeFactor,
                    goal,
                    power = 1,
                    target = new Vector(input.target.x, input.target.y);
                if (input.alt) {
                    if (target.length < leash) goal = {
                        x: this.body.x + target.x,
                        y: this.body.y + target.y
                    };
                    else if (target.length < repel) {
                        let dir = -this.turnwise * target.direction + Math.PI / 5;
                        goal = {
                            x: this.body.x + Math.cos(dir),
                            y: this.body.y + Math.sin(dir)
                        };
                    } else goal = {
                        x: this.body.x - target.x,
                        y: this.body.y - target.y
                    };
                } else if (input.main) {
                    let dir = this.turnwise * target.direction + .01;
                    goal = {
                        x: this.body.x + target.x - orbit * Math.cos(dir),
                        y: this.body.y + target.y - orbit * Math.sin(dir)
                    };
                    if (Math.abs(target.length - orbit) < this.body.size * 2) power = .7;
                }
                return {
                    goal: goal,
                    power: power
                };
            }
        }
    }
    ioTypes.minionNoRepel = class extends IO {
        constructor(body) {
            super(body);
            this.turnwise = 1;
        }
        think(input) {
            if (input.target != null && input.main) {
                let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE),
                    orbit = 120 * sizeFactor,
                    goal,
                    power = 1,
                    target = new Vector(input.target.x, input.target.y);
                if (input.main) {
                    let dir = this.turnwise * target.direction + .01;
                    goal = {
                        x: this.body.x + target.x - orbit * Math.cos(dir),
                        y: this.body.y + target.y - orbit * Math.sin(dir)
                    };
                    if (Math.abs(target.length - orbit) < this.body.size * 2) power = .7;
                }
                return {
                    goal: goal,
                    power: power
                };
            }
        }
    }
    ioTypes.hangOutNearMaster = class extends IO {
        constructor(body) {
            super(body);
            this.acceptsFromTop = false;
            this.orbit = 30;
            this.currentGoal = {
                x: this.body.source.x,
                y: this.body.source.y
            };
            this.timer = 0;
        }
        think(input) {
            if (this.body.source !== this.body) {
                let bound1 = this.orbit * .8 + this.body.source.size + this.body.size,
                    bound2 = this.orbit * 1.5 + this.body.source.size + this.body.size,
                    dist = util.getDistance(this.body, this.body.source) + Math.PI / 8,
                    output = {
                        target: {
                            x: this.body.velocity.x,
                            y: this.body.velocity.y
                        },
                        goal: this.currentGoal,
                        power: undefined
                    };
                if (dist > bound2 || this.timer > 30) {
                    this.timer = 0;
                    let dir = util.getDirection(this.body, this.body.source) + Math.PI * ran.random(.5),
                        len = ran.randomRange(bound1, bound2),
                        x = this.body.source.x - len * Math.cos(dir),
                        y = this.body.source.y - len * Math.sin(dir);
                    this.currentGoal = {
                        x: x,
                        y: y
                    };
                }
                if (dist < bound2) {
                    output.power = .15;
                    if (ran.chance(.3)) this.timer++;
                }
                return output;
            }
        }
    }
    ioTypes.wayPoint = class extends IO {
        constructor(body, wayPoints) {
            super(body);
            this.wayPointIndex = 0
            this.wayPoints = wayPoints
        }
        think(input) {
            let x = this.wayPoints[this.wayPointIndex]
            let y = this.wayPoints[this.wayPointIndex + 1]
            let output = {
                target: {
                    x: x,
                    y: y
                },
                goal: { x, y },
                power: 1
            };

            if (util.getDistance(this, { x, y }) < 3) {
                if (this.wayPointIndex + 2 >= this.wayPoints.length) {
                    this.wayPointIndex = 0
                } else {
                    this.wayPointIndex += 2
                }
            }
            return output
        }
    }
    ioTypes.orbitAroundPlayer = class extends IO {
        constructor(body) {
            super(body);
            this.direction = this.body.velocity.direction;
        }
        think(input) {
            let rad = 4;
            if (this.body.source.control.main) rad += 2;
            else if (this.body.source.control.alt) rad -= 2;
            this.orbit = this.body.source.size * (rad);
            let target = new Vector(this.body.source.x, this.body.source.y);
            let dir = (this.direction += 0.15);
            return {
                goal: {
                    x: target.x - this.orbit * Math.cos(dir),
                    y: target.y - this.orbit * Math.sin(dir),
                },
                power: 15,
            };
        }
    }
    ioTypes.circleTarget = class extends IO {
        constructor(body) {
            super(body);
        }

        think(input) {
            if (input.target != null && (input.alt || input.main)) {
                let orbit = 280;
                let goal;
                let power = 5;
                let target = new Vector(input.target.x, input.target.y);
                let dir = target.direction + power;
                if (input.alt) {
                    orbit /= 2
                    this.body.range -= 0.5
                }
                // Orbit point
                goal = {
                    x: this.body.x + target.x - orbit * Math.cos(dir),
                    y: this.body.y + target.y - orbit * Math.sin(dir),
                };
                return {
                    goal: goal,
                    power: power,
                };
            }
        }
    }
    ioTypes.spin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a += .05;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.slowSpin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a += .025;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.slowSpineeeee = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a += .0025;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.slowSpinReverse = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a -= .025;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.slowSpinReverse2 = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a -= .01;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.slowSpin2 = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            this.body.facing += .00375;
            return {
                target: {
                    x: Math.cos(this.body.facing),
                    y: Math.sin(this.body.facing)
                },
                main: true
            };
        }
    }
    ioTypes.fastSpin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a += .072;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.heliSpin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a += Math.PI / 5.5;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.reverseSpin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a -= .05;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.reverseFastSpin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a -= .072;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.reverseHeliSpin = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            this.a -= Math.PI / 5.5;
            let offset = 0;
            if (this.body.bond != null) offset = this.body.bound.angle;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset)
                },
                main: true
            };
        }
    }
    ioTypes.dontTurn = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            return {
                target: {
                    x: 1,
                    y: 0
                },
                main: true
            };
        }
    }
    ioTypes.dontTurn2 = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            return {
                target: {
                    x: 0,
                    y: 1
                },
                main: true
            };
        }
    }
    ioTypes.spinWhileIdle = class extends IO {
        constructor(b) {
            super(b);
            this.a = 0;
        }
        think(input) {
            if (input.target) {
                this.a = Math.atan2(input.target.y, input.target.x);
                return input;
            }
            this.a += .015;
            return {
                target: {
                    x: Math.cos(this.a),
                    y: Math.sin(this.a)
                },
                main: true
            };
        }
    }
    ioTypes.fleeAtLowHealth = class extends IO {
        constructor(b) {
            super(b);
            this.fear = util.clamp(ran.gauss(.7, .15), .1, .9) * .75;
        }
        think(input) {
            if (input.fire && input.target != null && this.body.health.amount < this.body.health.max * this.fear) return {
                goal: {
                    x: this.body.x - input.target.x,
                    y: this.body.y - input.target.y
                }
            };
        }
    }
    ioTypes.fleeAtLowHealth2 = class extends IO {
        constructor(b) {
            super(b);
            this.fear = util.clamp(ran.gauss(.7, .15), .1, .9) * .45;
        }
        think(input) {
            if (input.fire && input.target != null && this.body.health.amount < this.body.health.max * this.fear) return {
                goal: {
                    x: this.body.x - input.target.x,
                    y: this.body.y - input.target.y
                },
                target: {
                    x: this.body.velocity.x,
                    y: this.body.velocity.y
                }
            };
        }
    }
    ioTypes.orion = class extends IO {
        constructor(b) {
            super(b);
            this.turnwise = 1;
            this.r = 0;
            this.turnover = false;
        }
        think(input) {
            let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE),
                orbit = 45 * sizeFactor,
                power = 1;
            this.body.x += this.body.source.velocity.x;
            this.body.y += this.body.source.velocity.y;
            let dir = this.turnwise * util.getDirection(this.body, this.body.source) + .01,
                goal = {
                    x: this.body.source.x - orbit * Math.cos(dir),
                    y: this.body.source.y - orbit * Math.sin(dir)
                };
            return {
                goal: goal,
                power: power
            };
        }
    }
    ioTypes.orion2 = class extends IO {
        constructor(b) {
            super(b);
            this.turnwise = 1;
            this.r = 0;
            this.turnover = false;
        }
        think(input) {
            let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE),
                orbit = 15 * sizeFactor,
                power = 1;
            this.body.x += this.body.source.velocity.x;
            this.body.y += this.body.source.velocity.y;
            let dir = this.turnwise * util.getDirection(this.body, this.body.source),
                goal = {
                    x: this.body.source.x - orbit * Math.cos(dir) + 50,
                    y: this.body.source.y - orbit * Math.sin(dir) + 50
                };
            return {
                goal: goal,
                power: power
            };
        }
    }
    ioTypes.sizething = class extends IO {
        constructor(b) {
            super(b);
            this.div = 20;
            this.origS = 230;
            this.time = this.div;
        }
        think(input) {
            this.body.SIZE = this.time * this.origS * (1 / this.div);
            if (this.body.SIZE <= 0) this.body.kill();
            this.time--;
        }
    }
    ioTypes.rlyfastspin2 = class extends IO {
        constructor(b) {
            super(b);
            this.a = 360 * Math.random();
            this.b = 31 * (Math.sin(Math.PI * Math.round(-1 + Math.random()) + Math.PI / 2));
        }
        think(input) {
            this.a += this.b * Math.PI / 180;
            let offset = 0;
            if (this.body.bond != null) offset = 0;
            return {
                target: {
                    x: Math.cos(this.a + offset),
                    y: Math.sin(this.a + offset),
                },
                main: true,
            };
        }
    }
    ioTypes.mRot = class extends IO {
        constructor(b) {
            super(b);
        }
        think(input) {
            return {
                target: {
                    x: this.body.master.control.target.x,
                    y: this.body.master.control.target.y,
                },
                main: true,
            };
        }
    }
    ioTypes.sineA = class extends IO {
        constructor(b) {
            super(b);
            this.phase = 5;
            this.wo = this.body.master.facing;
        }
        think(input) {
            this.phase += .5;
            this.body.x += this.phase * Math.cos(this.wo) - 10 * Math.cos(this.phase) * Math.sin(this.wo);
            this.body.y += this.phase * Math.sin(this.wo) + 10 * Math.cos(this.phase) * Math.cos(this.wo);
            return {
                power: 1
            };
        }
    }
    ioTypes.sineB = class extends IO {
        constructor(b) {
            super(b);
            this.phase = 5;
            this.wo = this.body.master.facing;
        }
        think(input) {
            this.phase += .5;
            this.body.x += this.phase * Math.cos(this.wo) + 10 * Math.cos(this.phase) * Math.sin(this.wo);
            this.body.y += this.phase * Math.sin(this.wo) - 10 * Math.cos(this.phase) * Math.cos(this.wo);
        }
    }
    ioTypes.sineC = class extends IO {
        constructor(b) {
            super(b);
            this.phase = -5;
            this.wo = this.body.master.facing;
        }
        think(input) {
            this.phase -= .5;
            this.body.x += this.phase * Math.cos(this.wo) + 10 * Math.cos(this.phase) * Math.sin(this.wo);
            this.body.y += this.phase * Math.sin(this.wo) - 10 * Math.cos(this.phase) * Math.cos(this.wo);
            return {
                power: 1
            };
        }
    }
    ioTypes.sineD = class extends IO {
        constructor(b) {
            super(b);
            this.phase = -5;
            this.wo = this.body.master.facing;
        }
        think(input) {
            this.phase -= .5;
            this.body.x += this.phase * Math.cos(this.wo) - 10 * Math.cos(this.phase) * Math.sin(this.wo);
            this.body.y += this.phase * Math.sin(this.wo) + 10 * Math.cos(this.phase) * Math.cos(this.wo);
        }
    }
    ioTypes.portal = class extends IO {
        constructor(body) {
            super(body);
            this.myGoal = {
                x: body.master.control.target.x + body.master.x,
                y: body.master.control.target.y + body.master.y
            };
        }
        think() {
            this.body.x = this.myGoal.x;
            this.body.y = this.myGoal.y;
            return {
                goal: {
                    x: this.myGoal.x,
                    y: this.myGoal.y
                }
            };
        }
    }
    const skcnv = {
        rld: 0,
        pen: 1,
        str: 2,
        dam: 3,
        spd: 4,
        shi: 5,
        atk: 6,
        hlt: 7,
        rgn: 8,
        mob: 9
    };
    const levelers = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
        13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
        23, 24, 25, 26, 27, 28, 29, 30, 32, 34,
        36, 38, 40, 42, 44, 46, 48, 50, 55, 60
    ];
    const curve = (() => {
        const make = x => Math.log(4 * x + 1) / Math.log(5);
        let a = [];
        for (let i = 0; i < c.MAX_SKILL * 2; i++) a.push(make(i / c.MAX_SKILL));
        return x => a[x * c.MAX_SKILL];
    })();
    const apply = (f, x) => x < 0 ? 1 / (1 - x * f) : f * x + 1;
    class Skill {
        constructor(inital = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) {
            this.raw = inital;
            this.caps = [];
            this.setCaps([c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL]);
            this.name = ["Reload", "Bullet Penetration", "Bullet Health", "Bullet Damage", "Bullet Speed", "Shield Capacity", "Body Damage", "Max Health", "Shield Regeneration", "Movement Speed"];
            this.atk = 0;
            this.hlt = 0;
            this.spd = 0;
            this.str = 0;
            this.pen = 0;
            this.dam = 0;
            this.rld = 0;
            this.mob = 0;
            this.rgn = 0;
            this.shi = 0;
            this.rst = 0;
            this.brst = 0;
            this.ghost = 0;
            this.acl = 0;
            this.reset();
        }
        reset() {
            this.points = 0;
            this.score = 0;
            this.deduction = 0;
            this.level = 0;
            this.update();
            this.maintain();
        }
        update() {
            for (let i = 0; i < 10; i++)
                if (this.raw[i] > this.caps[i]) {
                    this.points += this.raw[i] - this.caps[i];
                    this.raw[i] = this.caps[i];
                }
            let attrib = [];
            for (let i = 0; i < 5; i++)
                for (let j = 0; j < 2; j++) attrib[i + 5 * j] = curve((this.raw[i + 5 * j] + this.bleed(i, j)) / c.MAX_SKILL);
            this.rld = Math.pow(.5, attrib[skcnv.rld]);
            this.pen = apply(2.7, attrib[skcnv.pen]);
            this.str = apply(2.4, attrib[skcnv.str]);
            this.dam = apply(3.3, attrib[skcnv.dam]);
            this.spd = .5 + apply(1.485, attrib[skcnv.spd]);
            this.acl = apply(.5, attrib[skcnv.rld]);
            this.rst = .5 * attrib[skcnv.str] + 2.5 * attrib[skcnv.pen];
            this.ghost = attrib[skcnv.pen];
            this.shi = apply(.585, attrib[skcnv.shi]);
            this.atk = apply(.024, attrib[skcnv.atk]);
            this.hlt = apply(.1, attrib[skcnv.hlt]);
            this.mob = apply(.3, attrib[skcnv.mob]);
            this.rgn = apply(8, attrib[skcnv.rgn]);
            this.brst = .3 * (.5 * attrib[skcnv.atk] + .5 * attrib[skcnv.hlt] + attrib[skcnv.rgn]);
        }
        set(thing) {
            this.raw[0] = thing[0];
            this.raw[1] = thing[1];
            this.raw[2] = thing[2];
            this.raw[3] = thing[3];
            this.raw[4] = thing[4];
            this.raw[5] = thing[5];
            this.raw[6] = thing[6];
            this.raw[7] = thing[7];
            this.raw[8] = thing[8];
            this.raw[9] = thing[9];
            this.update();
        }
        setCaps(thing) {
            this.caps[0] = thing[0];
            this.caps[1] = thing[1];
            this.caps[2] = thing[2];
            this.caps[3] = thing[3];
            this.caps[4] = thing[4];
            this.caps[5] = thing[5];
            this.caps[6] = thing[6];
            this.caps[7] = thing[7];
            this.caps[8] = thing[8];
            this.caps[9] = thing[9];
            this.update();
        }
        maintain() {
            if (this.level < c.SKILL_CAP && this.score - this.deduction >= this.levelScore) {
                this.deduction += this.levelScore;
                this.level += 1;
                this.points += this.levelPoints;
                this.update();
                return true;
            }
            return false;
        }
        get levelScore() {
            return Math.ceil(1.8 * Math.pow(this.level + 1, 1.8) - 2 * this.level + 1);
        }
        get progress() {
            return this.levelScore ? (this.score - this.deduction) / this.levelScore : 0;
        }
        get levelPoints() {
            if ((c.serverName === "Squidward's Tiki Land" && this.level <= 90) || levelers.indexOf(this.level) !== -1) return 1;
            return 0;
        }
        cap(skill, real = false) {
            if (!real && this.level < c.SKILL_SOFT_CAP) return Math.round(this.caps[skcnv[skill]] * c.SOFT_MAX_SKILL);
            return this.caps[skcnv[skill]];
        }
        bleed(i, j) {
            let a = (i + 2) % 5 + 5 * j,
                b = (i + (j === 1 ? 1 : 4)) % 5 + 5 * j,
                value = 0,
                denom = Math.max(c.MAX_SKILL, this.caps[i + 5 * j]);
            value += (1 - Math.pow(this.raw[a] / denom - 1, 2)) * this.raw[a] * c.SKILL_LEAK;
            value -= Math.pow(this.raw[b] / denom, 2) * this.raw[b] * c.SKILL_LEAK;
            return value;
        }
        upgrade(stat) {
            if (this.points && this.amount(stat) < this.cap(stat)) {
                this.change(stat, 1);
                this.points -= 1;
                return true;
            }
            return false;
        }
        title(stat) {
            return this.name[skcnv[stat]];
        }
        amount(skill) {
            return this.raw[skcnv[skill]];
        }
        change(skill, levels) {
            this.raw[skcnv[skill]] += levels;
            this.update();
        }
    }
    const realSizes = (() => {
        let o = [1, 1, 1];
        for (let i = 3; i < 17; i++) o.push(Math.sqrt((2 * Math.PI / i) * (1 / Math.sin(2 * Math.PI / i))));
        return o;
    })();
    class Gun {
        constructor(body, info, gunIndex) {
            this.lastShot = {
                time: 0,
                power: 0
            };
            this.body = body;
            this.master = body.source;
            this.gunIndex = gunIndex;
            this.label = "";
            this.labelOverride = "";
            this.controllers = [];
            this.children = [];
            this.control = {
                target: new Vector(0, 0),
                _target: new Vector(0, 0),
                goal: new Vector(0, 0),
                main: false,
                alt: false,
                fire: false
            };
            this.canShoot = false;
            this.skin = 0;
            this.color_unmix = 0;
            this.color = 16;
            this.colorOverride = null;
            this.shootOnDeath = false;
            let PROPERTIES = info.PROPERTIES;
            if (PROPERTIES != null && PROPERTIES.TYPE != null) {
                this.canShoot = true;
                this.shootOnce = PROPERTIES.SHOOT_ONCE;
                this.label = PROPERTIES.LABEL || "";
                if (Array.isArray(PROPERTIES.TYPE)) {
                    this.bulletTypes = PROPERTIES.TYPE;
                    this.natural = PROPERTIES.TYPE.BODY;
                } else this.bulletTypes = [PROPERTIES.TYPE];
                let natural = {};
                const setNatural = type => {
                    if (type.PARENT != null)
                        for (let i = 0; i < type.PARENT.length; i++) setNatural(type.PARENT[i]);
                    if (type.BODY != null)
                        for (let index in type.BODY) natural[index] = type.BODY[index];
                };
                for (let type of this.bulletTypes) setNatural(type);
                this.natural = natural;
                this.autofire = PROPERTIES.AUTOFIRE == null ? false : PROPERTIES.AUTOFIRE;
                this.altFire = PROPERTIES.ALT_FIRE == null ? false : PROPERTIES.ALT_FIRE;
                this.duoFire = PROPERTIES.DUO_FIRE == null ? false : PROPERTIES.DUO_FIRE;
                this.settings = PROPERTIES.SHOOT_SETTINGS || [];
                this.settings2 = (info.PROPERTIES.SHOOT_SETTINGS2 == null) ? [] : info.PROPERTIES.SHOOT_SETTINGS2;
                this.settings3 = (info.PROPERTIES.SHOOT_SETTINGS3 == null) ? [] : info.PROPERTIES.SHOOT_SETTINGS3;
                this.onShoot = PROPERTIES.ON_SHOOT;
                this.onFire = PROPERTIES.ON_FIRE;
                this.timesToFire = PROPERTIES.TIMES_TO_FIRE || 1;
                this.calculator = PROPERTIES.STAT_CALCULATOR || "default";
                this.waitToCycle = PROPERTIES.WAIT_TO_CYCLE == null ? false : PROPERTIES.WAIT_TO_CYCLE;
                this.countsOwnKids = PROPERTIES.COUNTS_OWN_KIDS != null ? PROPERTIES.COUNTS_OWN_KIDS : PROPERTIES.MAX_CHILDREN == null ? false : PROPERTIES.MAX_CHILDREN;
                this.syncsSkills = PROPERTIES.SYNCS_SKILLS == null ? false : PROPERTIES.SYNCS_SKILLS;
                this.useHealthStats = PROPERTIES.USE_HEALTH_STATS == null ? false : PROPERTIES.USE_HEALTH_STATS;
                this.negRecoil = PROPERTIES.NEGATIVE_RECOIL == null ? false : PROPERTIES.NEGATIVE_RECOIL;
                this.ammoPerShot = (info.PROPERTIES.AMMO_PER_SHOT == null) ? 0 : info.PROPERTIES.AMMO_PER_SHOT;
                this.destroyOldestChild = PROPERTIES.DESTROY_OLDEST_CHILD == null ? false : PROPERTIES.DESTROY_OLDEST_CHILD;
                this.shootOnDeath = PROPERTIES.SHOOT_ON_DEATH == null ? false : PROPERTIES.SHOOT_ON_DEATH;
                this.onDealtDamage = PROPERTIES.ON_DEALT_DAMAGE == null ? null : PROPERTIES.ON_DEALT_DAMAGE;
                if (this.shootOnDeath && !this.skipShootOnDeath) this.body.onDead = () => {
                    let self = this;
                    for (let i = 0; i < self.body.guns.length; i++) {
                        let gun = self.body.guns[i];
                        if (gun.shootOnDeath) {
                            let gx = gun.offset * Math.cos(gun.direction + gun.angle + gun.body.facing) + (1.35 * gun.length - gun.width * gun.settings.size / 2) * Math.cos(gun.angle + self.body.facing),
                                gy = gun.offset * Math.sin(gun.direction + gun.angle + gun.body.facing) + (1.35 * gun.length - gun.width * gun.settings.size / 2) * Math.sin(gun.angle + self.body.facing);
                            gun.fire(gx, gy, self.body.skill);
                        }
                    }
                };
                if (PROPERTIES.COLOR_OVERRIDE != null) this.colorOverride = PROPERTIES.COLOR_OVERRIDE;
                if (PROPERTIES.CAN_SHOOT != null) this.canShoot = PROPERTIES.CAN_SHOOT;
                this.alpha = PROPERTIES.ALPHA;
            }
            if (PROPERTIES != null && PROPERTIES.COLOR != null) this.color = PROPERTIES.COLOR;
            if (PROPERTIES != null && PROPERTIES.COLOR_UNMIX != null) this.color_unmix = PROPERTIES.COLOR_UNMIX;
            if (PROPERTIES != null && PROPERTIES.SKIN != null) this.skin = PROPERTIES.SKIN;
            let position = info.POSITION;
            this.length = position[0] / 10;
            this.width = position[1] / 10;
            this.aspect = position[2];
            let offset = new Vector(position[3], position[4]);
            this.angle = position[5] * Math.PI / 180;
            this.direction = offset.direction;
            this.offset = offset.length / 10;
            this.delay = position[6];
            this.position = 0;
            this.motion = 0;
            if (this.canShoot) {
                this.cycle = !this.waitToCycle - this.delay;
                this.destroyOldestChild = !!this.destroyOldestChild;
            }
            if(body.mockupGuns){
                this.shootOnDeath = false
                this.canShoot = false
            }
        }
        newRecoil() {
            let recoilForce = this.settings.recoil * 2 / room.speed;
            this.body.accel.x -= recoilForce * Math.cos(this.recoilDir ?? 0);
            this.body.accel.y -= recoilForce * Math.sin(this.recoilDir ?? 0);
        }
        getSkillRaw() {
            return [ // Not this one
                this.body.skill.raw[0],
                this.body.skill.raw[1],
                this.body.skill.raw[2],
                this.body.skill.raw[3],
                this.body.skill.raw[4],
                0,
                0,
                0,
                0,
                0
            ];
        }
        liveButBetter() {
            if (this.canShoot) {
                if (this.countsOwnKids + this.destroyOldestChild - 1 <= this.children.length) {
                    for (let i = 0, l = this.children.length; i < l; i++) {
                        if (this.children[i] == null || this.children[i].isGhost || this.children[i].isDead()) {
                            this.children.splice(i, 1);
                        }
                    }
                }
                if (this.destroyOldestChild) {
                    if (this.children.length > (this.countsOwnKids || this.body.maxChildren)) {
                        this.destroyOldest();
                    }
                }
                let sk = this.body.skill,
                    shootPermission = this.countsOwnKids ? (this.countsOwnKids + this.destroyOldestChild) > this.children.length * (this.calculator === 7 ? sk.rld : 1) : this.body.maxChildren ? this.body.maxChildren > this.body.children.length * (this.calculator === 7 ? sk.rld : 1) : true;
                if (this.body.master.invuln) {
                    shootPermission = false;
                }
                if ((shootPermission || !this.waitToCycle) && this.cycle < 1) {
                    this.cycle += 1 / this.settings.reload / room.speed / (this.calculator === 7 || this.calculator === 4 ? 1 : sk.rld);
                }
                if (shootPermission && (this.autofire || (this.duoFire ? this.body.control.alt || this.body.control.fire : this.altFire ? (this.body.control.alt && !this.body.control.altOverride) : this.body.control.fire))) {
                    if (this.cycle >= 1) {
                        if (this.ammoPerShot) {
                            if (this.body.master.ammo - this.ammoPerShot >= 0) {
                                this.body.master.ammo -= this.ammoPerShot;
                                if (this.body.master.displayAmmoText) {
                                    this.body.master.displayText = this.body.master.ammo + " Ammo left";
                                }
                            } else {
                                shootPermission = false;
                            }
                        }
                        let gx = this.offset * Math.cos(this.direction + this.angle + this.body.facing) + (1.35 * this.length - this.width * this.settings.size / 2) * Math.cos(this.angle + this.body.facing),
                            gy = this.offset * Math.sin(this.direction + this.angle + this.body.facing) + (1.35 * this.length - this.width * this.settings.size / 2) * Math.sin(this.angle + this.body.facing);
                        if (shootPermission && this.cycle >= 1) {
                            /*
                                * This exists, and should not be removed!!
                                * When I got around the eval packet defense, I unfortunately was able to bot woomy.
                                * In team modes, I could sit in base and spam laggy tanks without punishment!
                                * If this feature stays implemented, then I will be unable to do so.
                                * Also fuck "puppeteer"
                                */
                            if (c.DO_BASE_DAMAGE && this.body.isInMyBase()) {
                                if (this.body.childrenMap && this.body.childrenMap.size) this.body.childrenMap.forEach((k) => k.destroy())
                            } else {
                                if (!this.body.variables.emp || this.body.variables.emp == undefined || !this.body.master.variables.emp || this.body.master.variables.emp == undefined) {
                                    if (this.onFire) {
                                        this.onFire(this, [gx, gy, sk]);
                                    } else {
                                        for (let i = 0; i < this.timesToFire; i++) {
                                            this.fire(gx, gy, sk);
                                        }
                                    }
                                }
                            }
                            shootPermission = this.countsOwnKids ? (this.countsOwnKids + this.destroyOldestChild) > this.children.length : this.body.maxChildren ? this.body.maxChildren >= this.body.children.length : true;
                            this.cycle -= 1;
                        }
                    }
                } else if (this.cycle > !this.waitToCycle - this.delay) this.cycle = !this.waitToCycle - this.delay;
            }
        }
        destroyOldest() {
            this.children.shift().kill();
        }
        syncChildren() {
            if (this.syncsSkills) {
                let self = this;
                for (let o of this.children) {
                    o.define({
                        BODY: self.interpret(),
                        SKILL: self.getSkillRaw()
                    });
                    o.refreshBodyAttributes();
                }
            }
        }
        fire(gx, gy, sk) {
            if (this.shootOnce) {
                this.canShoot = false;
            }
            this.lastShot.time = util.time();
            this.lastShot.power = 3 * Math.log(Math.sqrt(sk.spd) + this.settings.recoil + 1) + 1;
            this.motion += this.lastShot.power;
            this.recoilDir = this.body.facing + this.angle;
            this.newRecoil();
            let ss = util.clamp(ran.gauss(0, Math.sqrt(this.settings.shudder, 1)), -1.5 * this.settings.shudder, 1.5 * this.settings.shudder),
                sd = util.clamp(ran.gauss(0, this.settings.spray * this.settings.shudder, 1), -.5 * this.settings.spray, .5 * this.settings.spray);
            sd *= Math.PI / 180;
            let speed = (this.negRecoil ? -1 : 1) * this.settings.speed * c.runSpeed * sk.spd * (1 + ss);
            let s = new Vector(speed * Math.cos(this.angle + this.body.facing + sd), speed * Math.sin(this.angle + this.body.facing + sd));
            if (this.body.velocity.length) {
                let extraBoost = Math.max(0, s.x * this.body.velocity.x + s.y * this.body.velocity.y) / this.body.velocity.length / s.length;
                if (extraBoost) {
                    let len = s.length;
                    s.x += this.body.velocity.length * extraBoost * s.x / len;
                    s.y += this.body.velocity.length * extraBoost * s.y / len;
                }
            }
            let o = new Entity({
                x: this.body.x + this.body.size * gx - .75 * this.length * s.x,
                y: this.body.y + this.body.size * gy - .75 * this.length * s.y
            }, this.master.master);
            o.roomId = this.body.roomId;
            o.velocity = s;
            o.initialBulletSpeed = speed;
            this.bulletInit(o);
            o.coreSize = o.SIZE;
            return o;
        }
        bulletInit(o) {
            o.source = this.body;
            o.diesToTeamBase = !this.body.master.godmode;
            o.passive = this.body.master.passive;
            if (this.colorOverride === "rainbow") o.toggleRainbow();
            for (let type of this.bulletTypes) o.define(type);
            /*
                o.define({ // Define is slow as heck
                    BODY: this.interpret(),
                    SKILL: this.getSkillRaw(),
                    SIZE: this.body.size * this.width * this.settings.size / 2,
                    LABEL: this.master.label + (this.label ? " " + this.label : "") + " " + o.label
                });*/

            // Define body
            let settings = this.interpret()
            for (let set in settings) {
                if (set === "HETERO") {
                    o.heteroMultiplier = settings[set]
                    continue;
                }
                o[set] = settings[set]
            }
            o.refreshBodyAttributes()
            // Define skills
            o.skill.set(this.getSkillRaw());
            // Define size
            o.SIZE = (this.body.size * this.width * this.settings.size * 0.5) * o.squiggle
            // Define label
            o.label = this.master.label + (this.label ? " " + this.label : "") + "" + o.label

            if (o.type === "food") {
                o.ACCELERATION = .015 / (o.size * 0.2);
            };
            if (this.onDealtDamage != null) o.onDealtDamage = this.onDealtDamage;
            if (this.colorOverride != null && !isNaN(this.colorOverride)) o.color = this.colorOverride;
            else if (this.colorOverride === "random") o.color = Math.floor(42 * Math.random());
            else o.color = this.body.master.color;
            if (this.countsOwnKids) {
                o.parent = this;
                this.children.push(o);
            } else if (this.body.maxChildren) {
                o.parent = this.body;
                this.body.children.push(o);
                this.children.push(o);
            }
            this.body.childrenMap.set(o.id, o);
            o.facing = o.velocity.direction;
            let oo = o;
            o.gunIndex = this.gunIndex;
            o.refreshBodyAttributes();
            o.life();
        }
        getTracking() {
            return {
                speed: c.runSpeed * this.body.skill.spd * this.settings.maxSpeed * this.natural.SPEED,
                range: Math.sqrt(this.body.skill.spd) * this.settings.range * this.natural.RANGE
            };
        }
        interpret(alt = false) {
            let sizeFactor = this.master.size / this.master.SIZE,
                shoot = alt ? alt : this.settings,
                sk = this.body.skill,
                out = {
                    SPEED: shoot.maxSpeed * sk.spd,
                    HEALTH: shoot.health * sk.str,
                    RESIST: shoot.resist + sk.rst,
                    DAMAGE: shoot.damage * sk.dam,
                    PENETRATION: Math.max(1, shoot.pen * sk.pen),
                    RANGE: shoot.range / Math.sqrt(sk.spd),
                    DENSITY: shoot.density * sk.pen * sk.pen / sizeFactor,
                    PUSHABILITY: 1 / sk.pen,
                    HETERO: 3 - 2.8 * sk.ghost
                };
            switch (this.calculator) {
                case 6:
                case "sustained":
                    out.RANGE = shoot.range;
                    break;
                case 8:
                case "trap":
                    out.PUSHABILITY = 1 / Math.pow(sk.pen, .5);
                    out.RANGE = shoot.range * .5;
                    break;
            }
            for (let property in out) {
                if (this.natural[property] == null || !out.hasOwnProperty(property)) continue;
                out[property] *= this.natural[property];
            }
            return out;
        }
    }
    class Laser {
        constructor(body, info) {
            // basic info y'know
            this.body = body;
            this.master = body.source;
            this.control = {
                target: new Vector(0, 0),
                goal: new Vector(0, 0),
                main: false,
                alt: false,
                fire: false
            };
            // dimensions, basically ripped from guns
            let position = info.POSITION;
            this.length = position[0] / 10;
            this.width = position[1] / 10;
            this.aspect = position[2];
            let offset = new Vector(position[3], position[4]);
            this.angle = position[5] * Math.PI / 180;
            this.direction = offset.direction;
            this.offset = offset.length / 10;
            // if there are properties, use them
            if (info.PROPERTIES != null) {
                let props = info.PROPERTIES;
                this.color = props.COLOR;
                this.dps = props.DPS;
                this.laserWidth = props.WIDTH;
            }
        }
    }
    class Prop {
        constructor(info) {
            let pos = info.POSITION;
            this.size = pos[0];
            this.x = pos[1];
            this.y = pos[2];
            this.angle = pos[3] * Math.PI / 180;
            this.layer = pos[4];
            this.shape = info.SHAPE;
            this.color = info.COLOR || -1;
            this.fill = info.FILL == undefined ? true : false;
            this.loop = info.LOOP == undefined ? true : false;
            this.isAura = info.IS_AURA == undefined ? false : true;
            this.ring = info.RING;
            this.arclen = info.ARCLEN == undefined ? 1 : info.ARCLEN;
            this.rpm = info.RPM;
            this.specific = info.SPECIFIC == undefined ? 0 : info.SPECIFIC;
            this.dip = info.DIP === undefined ? 1 : info.DIP;
        }
    }
    let views = [],
        bots = [],
        entitiesToAvoid = [],
        entities = new Chain(),
        targetableEntities = [],
        bot = null,
        players = [],
        clients = [],
        multitabIDs = [],
        connectedIPs = [],
        entitiesIdLog = 1,
        startingTank = c.serverName.includes("Testbed Event") ? "event_bed" : ran.chance(1 / 25000) ? "tonk" : "basic",
        blockedNames = [ // I have a much longer list, across alot of languages. Might add it
            "fuck",
            "bitch",
            "cunt",
            "shit",
            "pussy",
            "penis",
            "nigg",
            "penis",
            "dick",
            "whore",
            "dumbass",
            "fag"
        ],
        bannedPhrases = [
            "fag",
            "nigg",
            "trann",
            "troon"
        ]
    sanctuaries = [];
    let grid = new HashGrid(75);/*new QuadTree({
        x: 0,
        y: 0,
        width: room.width,
        height: room.height
    }, 16, 16, 0),
        targetingGrid = new QuadTree({
            x: 0,
            y: 0,
            width: room.width,
            height: room.height
        }, 16, 16, 0);//new hshg.HSHG();*/

    const dirtyCheck = (p, r) => entitiesToAvoid.some(e => Math.abs(p.x - e.x) < r + e.size && Math.abs(p.y - e.y) < r + e.size);

    /*const purgeEntities = () => entities = entities.filter(e => {
        if (e.isGhost) {
            e.removeFromGrid();
            return false;
        }
        return true;
    });*/

    const purgeEntities = () =>{
        let ghosts = 0;
        entities.filterToChain(e => {
            if (e.isGhost) {
                ghosts++
                e.removeFromGrid();
                return false;
            }
            return true;
        });
    }

    class HealthType {
        constructor(health, type, resist = 0) {
            this.max = health || .01;
            this.amount = health || .01;
            this.type = type;
            this.resist = resist;
            this.regen = 0;
            this.lastDamage = 0;
            this.rMax = health || .01;
            this.rAmount = health || .01;
        }
        get max() {
            return this.rMax;
        }
        get amount() {
            return this.rAmount;
        }
        set max(value) {
            if (Number.isFinite(value)) {
                this.rMax = value;
            }
        }
        set amount(value) {
            if (Number.isFinite(value)) {
                this.rAmount = value;
            }
        }
        set(health, regen = 0) {
            if (health <= 0) {
                health = .01;
            }
            this.amount = (this.max) ? this.amount / this.max * health : health;
            this.max = health;
            this.regen = regen;
        }
        display() {
            return this.amount / this.max;
        }
        getDamage(amount, capped = true) {
            switch (this.type) {
                case "dynamic":
                    return capped ? Math.min(amount * this.permeability, this.amount) : amount * this.permeability;
                case "static":
                    return capped ? Math.min(amount, this.amount) : amount;
            }
        }
        regenerate(boost = false) {
            boost /= 2;
            let mult = c.REGEN_MULTIPLIER;
            switch (this.type) {
                case "static":
                    if (this.amount >= this.max || !this.amount) break;
                    this.amount += mult * (this.max / 10 / 60 / 2.5 + boost);
                    break;
                case "dynamic":
                    let r = util.clamp(this.amount / this.max, 0, 1);
                    if (!r) this.amount = .0001;
                    if (r === 1) this.amount = this.max;
                    else this.amount += mult * (this.regen * Math.exp(-50 * Math.pow(Math.sqrt(.5 * r) - .4, 2)) / 3 + r * this.max / 10 / 15 + boost);
                    break;
            }
            this.amount = util.clamp(this.amount, 0, this.max);
        }
        get permeability() {
            switch (this.type) {
                case "static":
                    return 1;
                case "dynamic":
                    return this.max ? util.clamp(this.amount / this.max, 0, 1) : 0;
            }
        }
        get ratio() {
            return this.max ? util.clamp(1 - Math.pow(this.amount / this.max - 1, 4), 0, 1) : 0;
        }
    }

    class Entity {
        constructor(position, master = this) {
            this.isGhost = false;
            this.killCount = {
                solo: 0,
                assists: 0,
                bosses: 0,
                killers: []
            };
            this.creationTime = (new Date()).getTime();
            this.turretTraverseSpeed = 1;
            this.master = master;
            this.source = this;
            this.parent = this;
            this.roomId = master.roomId;
            this.control = {
                target: new Vector(0, 0),
                _target: new Vector(0, 0),
                goal: new Vector(0, 0),
                main: false,
                alt: false,
                fire: false,
                power: 0
            };
            let objectOutput = null;
            this.__defineSetter__("sandboxId", function set(value) {
                objectOutput = value;
                if (!c.SANDBOX) {
                    return;
                }
                if (!global.sandboxRooms.find(entry => entry.id === objectOutput)) {
                    if (clients.find(e => e.sandboxId === objectOutput)) {
                        global.sandboxRooms.push({
                            id: objectOutput,
                            botCap: 0,
                            bots: []
                        });
                    }
                }
            });
            this.__defineGetter__("sandboxId", function get() {
                return objectOutput;
            });
            if (this.master) {
                if (this.master.sandboxId != null) {
                    this.sandboxId = this.master.sandboxId;
                }
            }
            this.isInGrid = false;
            /*this.activation = (() => {
                let active = true,
                    timer = ran.irandom(15);
                return {
                    update: () => {
                        if (this.isDead()) {
                            this.removeFromGrid();
                            return 0;
                        }
                        if (!active) {
                            this.removeFromGrid();
                            if (this.settings.diesAtRange || this.type === "bullet" || this.type === "swarm" || this.type === "trap") {
                                this.kill();
                            }
                            if (!(timer--)) {
                                active = true;
                            }
                        } else {
                            this.addToGrid();
                            timer = 15;
                            active = this.alwaysActive || ((this.source && this.source.isPlayer) || this.isPlayer || views.some(a => a.check(this, .6)));
                        }
                    },
                    check: () => this.alwaysActive || active
                };
            })();*/
            this.invulnTime = [-1, -1];
            this.autoOverride = false;
            this.controllers = [];
            this.blend = {
                color: "#FFFFFF",
                amount: 0
            };
            this.skill = new Skill();
            this.health = new HealthType(1, "static", 0);
            this.shield = new HealthType(0, "dynamic");
            this.lastSavedHealth = {
                health: this.health.amount,
                shield: this.shield.amount
            };
            this.guns = [];
            this.turrets = [];
            this.lasers = [];
            this.props = [];
            this.upgrades = [];
            this.settings = {
                leaderboardable: true
            };
            this.aiSettings = {};
            this.children = [];
            this.childrenMap = new Map();
            this.SIZE = 1;
            this.define(Class.genericEntity);
            this.maxSpeed = 0;
            this.facing = 0;
            this.vfacing = 0;
            this.range = 0;
            this.damageReceived = 0;
            this.stepRemaining = 1;
            this.x = position.x;
            this.y = position.y;
            this.cx = position.x;
            this.cy = position.y;
            this.messages = [];
            this.velocity = new Vector(0, 0);
            this.accel = new Vector(0, 0);
            this.damp = .05;
            this.collisionArray = [];
            this.invuln = false;
            this.godmode = false;
            this.passive = false;
            this.alpha = 1;
            this.spinSpeed = .038;
            this.tierCounter = 0;
            this.killedByK = false;
            this.id = entitiesIdLog++;
            this.team = this === master ? this.id : master.team;
            this.rainbow = false;
            this.intervalID = null;
            this.rainbowLoop = this.rainbowLoop.bind(this);
            this.keyFEntity = ["square", 0, false];
            this.isActive = this.alwaysActive ||
                this.isPlayer ||
                (this.source && this.source.isPlayer) ||
                (this.master !== this && this.master.isActive) ||
                views.some(a => a.check(this, .6));
            this.activation = (() => {
                let timer = 30;
                this.isActive = this.alwaysActive ||
                    this.isPlayer ||
                    (this.source && this.source.isPlayer) ||
                    (this.master !== this && this.master.isActive) ||
                    views.some(a => a.check(this, .6));
                return () => {
                    if (this.isDead()) {
                        this.destroy();
                        return;
                    }
                    if (timer--, timer < 0 && (timer = 30)) {
                        this.isActive = this.alwaysActive ||
                            this.isPlayer ||
                            (this.source && this.source.isPlayer) ||
                            (this.master !== this && this.master.isActive) ||
                            views.some(a => a.check(this, .6));
                    }
                    if (!this.isActive && !this.isTurret && (this.settings.diesAtRange || this.type === "bullet" || this.type === "swarm" || this.type === "trap")) {
                        this.destroy();
                        return;
                    }
                };
            })();
            /*this.activation = (() => {
                let active = true,//((this.master == this) ? false : this.master.source.isActive) || this.alwaysActive || this.isPlayer || (this.source && this.source.isPlayer) || views.some(a => a.check(this, .6)),
                    tick = 25;
                return {
                    update: () => {
                        if (this.isDead()) {
                            this.removeFromGrid();
                            return;
                        }
                        if (!active) {
                            this.removeFromGrid();
                            if (!this.isTurret && (this.settings.diesAtRange || this.type === "bullet" || this.type === "swarm" || this.type === "trap")) {
                                this.kill();
                                return;
                            }
                            tick --;
                            if (tick <= 0) {
                                active = this.alwaysActive || this.isPlayer || (this.source && this.source.isPlayer) || views.some(a => a.check(this, .6));
                            }
                        } else {
                            this.addToGrid();
                            if (!this.alwaysActive && !this.isPlayer && !(this.source && this.source.isPlayer) && !views.some(a => a.check(this, .6))) {
                                active = false;
                                tick = 25;
                            }
                        }
                    },
                    check: () => true
                }
            })();*/
            this.updateAABB = () => { };
            this.tank = "basic";
            this.nameColor = "#FFFFFF";
            this.rainbowSpeed = 30;
            this.onDead = null;
            this.canUseQ = true;
            this.multibox = {
                enabled: false,
                intervalID: null,
                controlledTanks: []
            };
            this.multiboxLoop = this.multiboxLoop.bind(this);
            /*this.getAABB = (() => {
                let data = {},
                    save = {
                        x: 0,
                        y: 0,
                        size: 0,
                        width: 1,
                        height: 1
                    },
                    savedSize = 0,
                    lastCheck = this.isActive;
                this.updateAABB = active => {
                    if (
                        (this.settings.hitsOwnType !== "shield" && this.bond != null) ||
                        (!active && !(data.active = false))
                    ) {
                        lastCheck = false;
                        return;
                    }
                    if (active === lastCheck &&
                        (
                            this.x === save.x && 
                            this.y === save.y &&
                            this.realSize === save.size &&
                            this.width === save.width &&
                            this.height === save.height
                        )
                    ) {
                        return;
                    }
                    lastCheck = true;
                    save.x = this.x;
                    save.y = this.y;
                    save.size = this.realSize;
                    save.width = this.width;
                    save.height = this.height;
                    let width = this.realSize * (this.width || 1),// + 5,
                        height = this.realSize * (this.height || 1),// + 5,
                        x = this.x + this.velocity.x + this.accel.x,
                        y = this.y + this.velocity.y + this.accel.y,
                        x1 = (this.x < x ? this.x : x) - width,
                        x2 = (this.x > x ? this.x : x) + width,
                        y1 = (this.y < y ? this.y : y) - height,
                        y2 = (this.y > y ? this.y : y) + height,
                        size = util.getLongestEdge(x1, y1, x2, y1),
                        sizeDiff = savedSize / this.size;
                    data = {
                        min: [x1, y1],
                        max: [x2, y2],
                        active: true,
                        size: size
                    };
                    if (sizeDiff > Math.SQRT2 || sizeDiff < Math.SQRT1_2) {
                        this.removeFromGrid();
                        this.addToGrid();
                        savedSize = data.size;
                    }
                };
                return () => data;
            })();
            this.updateAABB(true);*/
            this.immuneToAbilities = false;
            this.sanctuaryType = "None";
            this.isMothership = false;
            this.isDominator = false;
            this.isBot = false;
            this.underControl = false;
            this.stealthMode = false;
            this.miscIdentifier = "None";
            this.switcherooID = -1;
            this.gunIndex = undefined;
            //entities.push(this);
            entities.set(this.id, this);
            for (let v of views) v.add(this);
            //this.activation.update();
            this.ableToBeInGrid = true;
        }
        get myCell() {
            return room.at({ x: this.x, y: this.y });
        }
        removeFromGrid() {
            this.ableToBeInGrid = false;
            /*if (this.isInGrid) {
                grid.removeObject(this);
                this.isInGrid = false;
            }*/
        }
        addToGrid() {
            this.ableToBeInGrid = true;
            /*if (!this.isInGrid && (this.settings.hitsOwnType === "shield" || this.bond == null)) {
                grid.addObject(this);
                this.isInGrid = true;
            }*/
        }
        life() {
            // New version of life, let's hope this fucking works
            if (this.SIZE !== this.coreSize) {
                this.coreSize = this.SIZE;
                this.refreshFOV();
            }
            let control = {
                altOverride: false
            }, faucet = {};
            if (!this.settings.independent && this.source != null && this.source !== this) {
                faucet = this.source.control;
                if (faucet.main || faucet.alt) {
                    control.target = {
                        x: faucet.target.x + this.source.x - this.x,
                        y: faucet.target.y + this.source.y - this.y
                    };
                    control.fire = faucet.fire;
                    control.main = faucet.main;
                    control.alt = faucet.alt;
                }
            }
            if (this.settings.attentionCraver && !faucet.main && this.range) {
                this.range--;
            }
            newLogs.controllers.start();
            for (let i = 0, l = this.controllers.length; i < l; i++) {
                let output = this.controllers[i].think(control);
                if (!output) {
                    continue;
                }
                if (this.controllers[i].acceptsFromTop) {
                    if (output.target != null) {
                        control.target = output.target;
                    }
                    if (output.goal != null) {
                        control.goal = output.goal;
                    }
                    if (output.fire != null) {
                        control.fire = output.fire;
                    }
                    if (output.main != null) {
                        control.main = output.main;
                    }
                    if (output.alt != null) {
                        control.alt = output.alt;
                    }
                    if (output.altOverride != null) {
                        control.altOverride = output.altOverride;
                    }
                    if (output.power != null) {
                        control.power = output.power;
                    }
                } else {
                    if (output.target != null && !control.target) {
                        control.target = output.target;
                    }
                    if (output.goal != null && !control.goal) {
                        control.goal = output.goal;
                    }
                    if (output.fire != null && !control.fire) {
                        control.fire = output.fire;
                    }
                    if (output.main != null && !control.main) {
                        control.main = output.main;
                    }
                    if (output.alt != null && !control.alt) {
                        control.alt = output.alt;
                    }
                    if (output.altOverride != null) {
                        control.altOverride = output.altOverride;
                    }
                    if (output.power != null && !control.power) {
                        control.power = output.power;
                    }
                }
            }
            this.control.target = control.target == null ? this.control.target : control.target;
            this.control.goal = control.goal;
            this.control.fire = control.fire;
            this.control.main = control.main;
            this.control.alt = control.alt;
            this.control.altOverride = control.altOverride;
            this.control.power = control.power == null ? 1 : control.power;
            newLogs.controllers.stop();
            newLogs.moveFace.start();
            this.move();
            this.face();
            newLogs.moveFace.stop();
            if (this.invuln && this.invulnTime[1] > -1) {
                if (Date.now() - this.invulnTime[0] > this.invulnTime[1]) {
                    this.invuln = false;
                    this.sendMessage("Your invulnerability has expired.");
                }
            }
            newLogs.aspects.start();
            for (let i = 0, l = this.guns.length; i < l; i++) {
                if (this.guns[i]) { // This if statement shouldn't be here. This is purely here because Meijijingu would be broken without it.
                    this.guns[i].liveButBetter();
                }
            }
            newLogs.aspects.stop();
            if (this.skill.maintain()) this.refreshBodyAttributes();
            if (this.invisible[1]) {
                this.alpha = Math.max(this.invisible[2] || 0, this.alpha - this.invisible[1]);
                if (this.damageReceived || !this.velocity.isShorterThan(0.15)) {
                    this.alpha = Math.min(1, this.alpha + this.invisible[0]);
                }
            }
            if (this.control.main && this.onMain) {
                this.onMain(this, entities);
            }
            if (!this.control.main && this.onNotMain) {
                this.onNotMain(this, entities);
            }
            if (this.control.alt && this.onAlt) {
                this.onAlt(this, entities);
            }
            if (!this.control.alt && this.onNotAlt) {
                this.onNotAlt(this, entities);
            }
            if (this.onTick) this.onTick(this);
        }
        addController(newIO) {
            if (Array.isArray(newIO)) this.controllers = newIO.concat(this.controllers);
            else this.controllers.unshift(newIO);
        }
        isInMyBase(cell = this.myCell) {
            return cell === `bas${-this.team}` || cell === `n_b${-this.team}` || cell === `bad${-this.team}`;
            /*return (room[`bas${-this.team}`] && room.isIn(`bas${-this.team}`, {
                x: this.x,
                y: this.y
            })) || (room[`n_b${-this.team}`] && room.isIn(`n_b${-this.team}`, {
                x: this.x,
                y: this.y
            })) || (room[`bad${-this.team}`] && room.isIn(`bad${-this.team}`, {
                x: this.x,
                y: this.y
            }));*/
        }
        minimalReset() {
            this.shape = 0;
            this.shapeData = 0;
            this.color = 16;
            this.guns = [];
            for (let o of this.turrets) o.destroy();
            this.turrets = [];
            this.lasers = [];
            this.props = [];
        }
        minimalDefine(set) {
            if (set.PARENT != null){
                for (let i = 0; i < set.PARENT.length; i++){
                    if(this.index === set.PARENT[i].index){
                        continue;
                    }
                    this.minimalDefine(set.PARENT[i]);
                }
            }
            this.mockupGuns = true
            if (set.TRAVERSE_SPEED != null) this.turretTraverseSpeed = set.TRAVERSE_SPEED;
            if (set.index != null) this.index = set.index;
            if (set.NAME != null) this.name = set.NAME;
            if (set.LABEL != null) this.label = set.LABEL;
            if (set.COLOR != null) this.color = set.COLOR;
            if (set.PASSIVE != null) this.passive = set.PASSIVE;
            if (set.SHAPE != null) {
                this.shape = typeof set.SHAPE === 'number' ? set.SHAPE : 0
                this.shapeData = set.SHAPE;
            }
            if (set.SIZE != null) {
                this.SIZE = set.SIZE * this.squiggle;
                if (this.coreSize == null) this.coreSize = this.SIZE;
            }
            if (set.LAYER != null) this.LAYER = set.LAYER;
            this.settings.skillNames = set.STAT_NAMES || 6;
            if (set.INDEPENDENT != null) this.settings.independent = set.INDEPENDENT;
            if (set.UPGRADES_TIER_1 != null)
                for (let e of set.UPGRADES_TIER_1) this.upgrades.push({
                    class: exportNames[e.index],
                    level: c.LEVEL_ZERO_UPGRADES ? 0 : 15,
                    index: e.index,
                    tier: 1
                });
            if (set.UPGRADES_TIER_2 != null)
                for (let e of set.UPGRADES_TIER_2) this.upgrades.push({
                    class: exportNames[e.index],
                    level: c.LEVEL_ZERO_UPGRADES ? 0 : 30,
                    index: e.index,
                    tier: 2
                });
            if (set.UPGRADES_TIER_3 != null)
                for (let e of set.UPGRADES_TIER_3) this.upgrades.push({
                    class: exportNames[e.index],
                    level: c.LEVEL_ZERO_UPGRADES ? 0 : 45,
                    index: e.index,
                    tier: 3
                });
            if (set.UPGRADES_TIER_4 != null)
                for (let e of set.UPGRADES_TIER_4) this.upgrades.push({
                    class: exportNames[e.index],
                    level: c.LEVEL_ZERO_UPGRADES ? 0 : 60,
                    index: e.index,
                    tier: 4
                });
            if (set.GUNS != null) {
                let newGuns = [];
                let i = 0;
                for (let def of set.GUNS) {
                    newGuns.push(new Gun(this, def, i));
                    i++;
                }
                this.guns = newGuns;
            };
            if (set.TURRETS != null) {
                for (let o of this.turrets) o.destroy();
                this.turrets = [];
                for (let def of set.TURRETS) {
                    let o = new Entity(this, this.master);
                    if (Array.isArray(def.TYPE)) {
                        for (let type of def.TYPE) o.minimalDefine(type);
                    } else o.minimalDefine(def.TYPE);
                    o.bindToMaster(def.POSITION, this);
                    // o.alwaysActive = this.alwaysActive;
                    if (!def.TARGETABLE_TURRET) {
                        o.dangerValue = 0;
                    }
                };
            };
            if (set.LASERS != null) {
                let newLasers = [];
                for (let def of set.LASERS) newLasers.push(new Laser(this, def));
                this.lasers = newLasers;
            }
            if (set.PROPS != null) {
                let newProps = [];
                for (let def of set.PROPS) newProps.push(new Prop(def));
                this.props = newProps;
            }
        }
        define(set, extra) {
            try {
                if (set.PARENT != null)
                    for (let i = 0; i < set.PARENT.length; i++) this.define(set.PARENT[i]);
                for (let thing in extra) this[thing] = extra[thing];
                if (set.TRAVERSE_SPEED != null) this.turretTraverseSpeed = set.TRAVERSE_SPEED;
                if (set.RIGHT_CLICK_TURRET != null) this.turretRightClick = set.RIGHT_CLICK_TURRET;
                if (set.index != null) this.index = set.index;
                if (set.NAME != null) this.name = set.NAME;
                if (set.TRANSFORM_EXPORT != null) this.transformExport = set.transformExport;
                if (set.HITS_OWN_TEAM != null) this.hitsOwnTeam = set.HITS_OWN_TEAM;
                if (set.LABEL != null) this.label = set.LABEL;
                this.labelOverride = "";
                /*let tlabel = set.label;
                if (set.TEAM == 999) this.labelOverride = 'Rogue ' + tlabel; // Add "Rogue" on name.*/
                //removed cuz it didnt work correctly when upgrading from rogue tank. it worked when upgrading to rogue tank but not when upgrading from rogue tank.
                if (set.TOOLTIP != null) this.socket?.talk("m", `${set.TOOLTIP}`, "#8cff9f");
                if (set.TYPE != null) this.type = set.TYPE;
                if (set.SHAPE != null) {
                    this.shape = typeof set.SHAPE === 'number' ? set.SHAPE : 0
                    this.shapeData = set.SHAPE;
                }
                if (set.COLOR != null) this.color = set.COLOR;
                if (set.CONTROLLERS != null) {
                    let toAdd = [];
                    for (let ioName of set.CONTROLLERS) toAdd.push(new ioTypes[ioName](this));
                    this.addController(toAdd);
                }

                if (set.NO_SPEED_CALCUATION !== null) {
                    this.settings.speedNoEffect = set.NO_SPEED_CALCUATION;
                }

                /* FYI reason i dont just have it not added in the defs is because mockups would need to be generated to change upgrades
                if (set.IS_TESTBED_REMOVED && this.socket) {
                    if (!c.IS_DEV_SERVER && !c.serverName.includes("Sandbox") && this.socket.betaData.permissions !== 3) {
                        this.sendMessage("You cannot used removed tanks outside of a testing server.");
                        this.kill();
                    }
                }*/
                if (set.MOTION_TYPE != null) this.motionType = set.MOTION_TYPE;
                if (set.FACING_TYPE != null) this.facingType = set.FACING_TYPE;
                if (set.DRAW_HEALTH != null) this.settings.drawHealth = set.DRAW_HEALTH;
                if (set.DRAW_SELF != null) this.settings.drawShape = set.DRAW_SELF;
                if (set.DAMAGE_EFFECTS != null) this.settings.damageEffects = set.DAMAGE_EFFECTS;
                if (set.RATIO_EFFECTS != null) this.settings.ratioEffects = set.RATIO_EFFECTS;
                if (set.MOTION_EFFECTS != null) this.settings.motionEffects = set.MOTION_EFFECTS;
                if (set.GIVE_KILL_MESSAGE != null) this.settings.givesKillMessage = set.GIVE_KILL_MESSAGE;
                if (set.CAN_GO_OUTSIDE_ROOM != null) this.settings.canGoOutsideRoom = set.CAN_GO_OUTSIDE_ROOM;
                if (set.HITS_OWN_TYPE != null) this.settings.hitsOwnType = set.HITS_OWN_TYPE;
                if (set.DIE_AT_LOW_SPEED != null) this.settings.diesAtLowSpeed = set.DIE_AT_LOW_SPEED;
                if (set.DIE_AT_RANGE != null) this.settings.diesAtRange = set.DIE_AT_RANGE;
                if (set.INDEPENDENT != null) this.settings.independent = set.INDEPENDENT;
                if (set.PERSISTS_AFTER_DEATH != null) this.settings.persistsAfterDeath = set.PERSISTS_AFTER_DEATH;
                if (set.CLEAR_ON_MASTER_UPGRADE != null) this.settings.clearOnMasterUpgrade = set.CLEAR_ON_MASTER_UPGRADE;
                if (set.HEALTH_WITH_LEVEL != null) this.settings.healthWithLevel = set.HEALTH_WITH_LEVEL;
                if (set.ACCEPTS_SCORE != null) this.settings.acceptsScore = set.ACCEPTS_SCORE;
                if (set.HAS_NO_RECOIL != null) this.settings.hasNoRecoil = set.HAS_NO_RECOIL;
                if (set.CRAVES_ATTENTION != null) this.settings.attentionCraver = set.CRAVES_ATTENTION;
                if (set.BROADCAST_MESSAGE != null) this.settings.broadcastMessage = set.BROADCAST_MESSAGE || undefined;
                if (set.DAMAGE_CLASS != null) this.settings.damageClass = set.DAMAGE_CLASS;
                if (set.BUFF_VS_FOOD != null) this.settings.buffVsFood = set.BUFF_VS_FOOD;
                if (set.CAN_BE_ON_LEADERBOARD != null) this.settings.leaderboardable = set.CAN_BE_ON_LEADERBOARD;
                if (set.IS_SMASHER != null) this.settings.reloadToAcceleration = set.IS_SMASHER;
                if (set.IS_DIGGER != null) this.aiSettings.isDigger = set.IS_DIGGER;
                if (set.DIES_BY_OBSTACLES != null) this.settings.diesByObstacles = set.DIES_BY_OBSTACLES;
                this.settings.isHelicopter = set.IS_HELICOPTER || null;
                if (set.GO_THRU_OBSTACLES != null) this.settings.goThruObstacle = set.GO_THRU_OBSTACLES;
                if (set.BOUNCE_ON_OBSTACLES != null) this.settings.bounceOnObstacles = set.BOUNCE_ON_OBSTACLES;
                if (set.STAT_NAMES != null) this.settings.skillNames = set.STAT_NAMES;
                if (set.HAS_ANIMATION != null) this.settings.hasAnimation = set.HAS_ANIMATION;
                if (set.INTANGIBLE != null) this.intangibility = set.INTANGIBLE;
                if (set.AI != null) this.aiSettings = set.AI;
                if (set.DANGER != null) this.dangerValue = set.DANGER;
                if (set.TARGET_PLANES != null) this.settings.targetPlanes = set.TARGET_PLANES;
                if (set.VARIES_IN_SIZE != null) {
                    this.settings.variesInSize = set.VARIES_IN_SIZE;
                    this.squiggle = this.settings.variesInSize ? ran.randomRange(.8, 1.2) : 1;
                }
                if (set.RESET_UPGRADES) this.upgrades = [];
                if (set.DIES_TO_TEAM_BASE != null) this.diesToTeamBase = set.DIES_TO_TEAM_BASE;
                if (set.GOD_MODE != null) this.godmode = set.GOD_MODE;
                if (set.PASSIVE != null) this.passive = set.PASSIVE;
                if (set.HAS_NO_SKILL_POINTS != null && set.HAS_NO_SKILL_POINTS) this.skill.points = 0;
                if (set.HAS_ALL_SKILL_POINTS != null && set.HAS_ALL_SKILL_POINTS) this.skill.points = 42;
                if (set.LAYER != null) this.LAYER = set.LAYER;
                if (set.ALPHA != null) this.alpha = set.ALPHA;
                if (set.TEAM != null && set.TEAM !== -1) this.team = set.TEAM;
                if (set.BOSS_TIER_TYPE != null) this.bossTierType = set.BOSS_TIER_TYPE;
                if (set.SYNC_TURRET_SKILLS != null) this.syncTurretSkills = set.SYNC_TURRET_SKILLS;
                if (set.INVISIBLE != null && !global.isEmptyArray(set.INVISIBLE)) {
                    if (set.INVISIBLE.length !== 3) throw ("Invalid invisibility values!");
                    this.invisible = set.INVISIBLE;
                } else this.invisible = [0, 0, 0];
                if (set.IS_PLANE != null) this.isPlane = set.IS_PLANE;
                if (set.TARGET_PLANES != null) this.settings.targetPlanes = set.TARGET_PLANES;
                if (set.SEE_INVISIBLE != null) this.seeInvisible = set.SEE_INVISIBLE;
                this.displayText = set.DISPLAY_TEXT || "";
                this.displayTextColor = set.DISPLAY_TEXT_COLOR || "#FFFFFF"
                if (set.AMMO != null) {
                    this.displayAmmoText = set.DISPLAY_AMMO_TEXT !== undefined ? set.DISPLAY_TEXT : true
                    if (this.displayAmmoText) {
                        this.displayText = `${set.AMMO} Ammo left`;
                    }
                    this.ammo = set.AMMO;
                }
                this.onCollide = set.ON_COLLIDE || null;
                this.onTick = set.ON_TICK || null;
                this.onDamaged = set.ON_DAMAGED || null;
                this.onDealtDamage = set.ON_DEALT_DAMAGE || null;
                this.onDealtDamageUniv = set.ON_DEALT_DAMAGE_UNIVERSAL || null;
                this.onKill = set.ON_KILL || null;
                this.onMain = set.ON_MAIN || null;
                this.onNotMain = set.ON_NOT_MAIN ?? null;
                this.onAlt = set.ON_ALT || null;
                this.onQ = set.ON_Q || null
                this.onNotAlt = set.ON_NOT_ALT || null;
                this.isObserver = set.IS_OBSERVER;
                this.onOverride = set.ON_OVERRIDE;
                this.isSentry = set.IS_SENTRY || null
                if (set.BOSS_TYPE !== "None") switch (set.BOSS_TYPE) {
                    case "Constellation":
                        this.onDead = () => {
                            sockets.broadcast("A Constellation boss may have been defeated, but the battle is not won yet...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("Constellation Shards have spawned to avenge the Constellation!");
                                let positions = [
                                    [x + 110, y, -110, 0],
                                    [x - 110, y, 110, 0],
                                    [x, y + 110, 0, -110],
                                    [x, y - 110, 0, 110]
                                ],
                                    names = ran.chooseBossName("a", 5);
                                for (let i = 0; i < 4; i++) {
                                    let shard = new Entity({
                                        x: positions[i][0],
                                        y: positions[i][1]
                                    });
                                    shard.team = -100;
                                    shard.control.target.x = positions[i][2];
                                    shard.control.target.y = positions[i][3];
                                    shard.define(Class.constShard);
                                    shard.name = names[i];
                                    shard.settings.broadcastMessage = "A Constellation Shard has been defeated!";
                                }
                                let core = new Entity({
                                    x: x,
                                    y: y
                                });
                                core.team = -100;
                                core.control.target.x = core.control.target.y = 100;
                                core.define(Class.constCore);
                                core.name = names[4];
                                core.settings.broadcastMessage = "A Constellation Core has been defeated!";
                            }, 7500);
                        };
                        break;
                    case "polyamorous":
                        this.onDead = () => {
                            sockets.broadcast("It will stop at nothing to seek what it came for, not even its own grave...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("The Mysticals have arrived!");
                                let positions = [
                                    [x + 110, y, -110, 0],
                                    [x - 110, y, 110, 0],
                                    [x, y + 110, 0, -110],
                                    [x, y - 110, 0, 110]
                                ];
                                for (let i = 0; i < 4; i++) {
                                    let mystical = new Entity({
                                        x: positions[i][0],
                                        y: positions[i][1]
                                    });
                                    mystical.team = this.team;
                                    mystical.control.target.x = positions[i][2];
                                    mystical.control.target.y = positions[i][3];
                                    mystical.define([Class.sorcererAI, Class.summonerAI, Class.enchantressAI, Class.exorcistorAI][i]);
                                }
                            }, 4000);
                        };
                        break;
                    case "Bow":
                        this.onDead = () => {
                            sockets.broadcast("A Bow may have been defeated, but the battle is not over yet...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("Bow Shards have spawned to avenge the Bow!");
                                let positions = [
                                    [x + 100, y, 100, 0],
                                    [x - 100, y, -100, 0]
                                ],
                                    names = ran.chooseBossName("a", 3);
                                for (let i = 0; i < 2; i++) {
                                    let shard = new Entity({
                                        x: positions[i][0],
                                        y: positions[i][1]
                                    });
                                    shard.team = -100;
                                    shard.control.target.x = positions[i][2];
                                    shard.control.target.y = positions[i][3];
                                    shard.define(Class.bowShard);
                                    shard.name = names[i];
                                    shard.settings.broadcastMessage = "A Bow Shard has been defeated!";
                                }
                                let core = new Entity({
                                    x: x,
                                    y: y
                                });
                                core.team = -100;
                                core.control.target.x = core.control.target.y = 100;
                                core.define(Class.bowCore);
                                core.name = names[2];
                                core.settings.broadcastMessage = "A Bow Core has been defeated!";
                            }, 5000);
                        };
                        break;
                    case "Bow":
                        this.onDead = () => {
                            sockets.broadcast("A Bow may have been defeated, but the battle is not over yet...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("Bow Shards have spawned to avenge the Bow!");
                                let positions = [
                                    [x + 100, y, 100, 0],
                                    [x - 100, y, -100, 0]
                                ],
                                    names = ran.chooseBossName("a", 3);
                                for (let i = 0; i < 2; i++) {
                                    let shard = new Entity({
                                        x: positions[i][0],
                                        y: positions[i][1]
                                    });
                                    shard.team = -100;
                                    shard.control.target.x = positions[i][2];
                                    shard.control.target.y = positions[i][3];
                                    shard.define(Class.bowShard);
                                    shard.name = names[i];
                                    shard.settings.broadcastMessage = "A Bow Shard has been defeated!";
                                }
                                let core = new Entity({
                                    x: x,
                                    y: y
                                });
                                core.team = -100;
                                core.control.target.x = core.control.target.y = 100;
                                core.define(Class.bowCore);
                                core.name = names[2];
                                core.settings.broadcastMessage = "A Bow Core has been defeated!";
                            }, 5000);
                        };
                        break;
                
                        case "splitterSummoner":
                            this.settings.broadcastMessage = "A Splitter Summoner has shattered!";
                            this.onDead = () => {
                                let x = this.x,
                                    y = this.y;
                                let positions = [
                                    [30, 30],
                                    [-30, -30],
                                    [30, -30],
                                    [-30, 30]
                                ],
                                    names = ran.chooseBossName("a", 4);

                                // Core
                                let core = new Entity({
                                    x: x,
                                    y: y
                                });
                                core.team = -100;
                                core.define(Class.splitSummonerCore);
                                core.name = names[4];
                                core.settings.broadcastMessage = "A Super Splitter Core has been defeated!";

                                // Summoners
                                for (let i = 0; i < 4; i++) {
                                    let shard = new Entity({
                                        x: this.x+positions[i][0],
                                        y: this.y+positions[i][1]
                                    });
                                    shard.team = -100;
                                    shard.define(Class.summonerAI);
                                    shard.name = names[i];
                                    shard.settings.broadcastMessage = "A Summoner has been defeated!";
                                    shard.onDead = () => {
                                        for (let i = 0; i < 4; i++) {
                                            let e = new Entity({x:shard.x+positions[i][0],y:shard.y+positions[i][0]})
                                            e.define(Class.splitterSplitterSquare)
                                            e.ACCELERATION = .015 / (e.size * 0.2);
                                            let max = 20
                                            let min = -20
                                            e.velocity.x = Math.floor(Math.random() * (max - min + 1)) + min;
                                            e.velocity.y = Math.floor(Math.random() * (max - min + 1)) + min;
                                            e.team = -100
                                        }
                                    }
                                }
                            }
                            break;
                
                            case "superSplitterSummoner":
                                this.settings.broadcastMessage = "A Splitter Summoner has shattered!";
                                this.onDead = () => {
                                    let x = this.x,
                                        y = this.y;
                                    let positions = [
                                        [30, 30],
                                        [-30, -30],
                                        [30, -30],
                                        [-30, 30]
                                    ],
                                        names = ran.chooseBossName("a", 4);
    
                                    // Core
                                    let core = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    core.team = -100;
                                    core.define(Class.superSplitSummonerCore);
                                    core.name = names[4];
                                    core.settings.broadcastMessage = "A Splitter Core has been defeated!";
    
                                    // Summoners
                                    for (let i = 0; i < 4; i++) {
                                        let shard = new Entity({
                                            x: this.x+positions[i][0],
                                            y: this.y+positions[i][1]
                                        });
                                        shard.team = -100;
                                        shard.define(Class.splitterSummoner);
                                        shard.name = names[i];
                                        shard.settings.broadcastMessage = "A Splitter Summoner has been defeated!";
                                    }
                                }
                                break;

                    case "Snowflake":
                        this.onDead = () => {
                            sockets.broadcast("A Snowflake may have been defeated, but the battle is not over yet...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("Snowflake Shards have spawned to avenge the Snowflake!");
                                let positions = [
                                    [x, y + 100, 0, 100],
                                    [x + 86.602, y + 50, 86.602, 50],
                                    [x + 86.602, y - 50, 86.602, -50],
                                    [x, y - 100, 0, -100],
                                    [x - 86.602, y - 50, -86.602, -50],
                                    [x - 86.602, y + 50, -86.602, 50]
                                ],
                                    names = ran.chooseBossName("a", 7);
                                for (let i = 0; i < 6; i++) {
                                    let shard = new Entity({
                                        x: positions[i][0],
                                        y: positions[i][1]
                                    });
                                    shard.team = -100;
                                    shard.control.target.x = positions[i][2];
                                    shard.control.target.y = positions[i][3];
                                    shard.define(Class.snowflakeShard);
                                    shard.name = names[i];
                                    shard.settings.broadcastMessage = "A Snowflake Shard has been defeated!";
                                }
                                let core = new Entity({
                                    x: x,
                                    y: y
                                });
                                core.team = -100;
                                core.control.target.x = core.control.target.y = 100;
                                core.define(Class.snowflakeCore);
                                core.settings.broadcastMessage = "A Snowflake Core has been defeated!";
                                core.name = names[2];
                            }, 7500);
                        };
                        break;
                    case "triguard":
                        this.onDead = () => {
                            sockets.broadcast("A Triguardian has been defeated, but the battle is not over yet...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("Answer to me these Guardians three...");
                                for (let i = 0; i < 3; i++) {
                                let boss = new Entity({
                                    x: x,
                                    y: y
                                });
                                boss.team = this.team;
                                boss.define(Class.guardianAI);
                                }
                            }, 6000);
                        };
                        break;
                    case "XYV":
                        this.onDead = () => {
                            sockets.broadcast("Xyv Wdtcfgzsezgk might have been defeated, but the battle is not over yet...");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("A Summoner, Guardian, and Defender have spawned to avenge the Xyv Wdtcfgzsezgk!");
                                let positions = [
                                    [x, y + 100, 0, 100],
                                    [x + 86.602, y - 50, 86.602, -50],
                                    [x - 86.602, y - 50, -86.602, -50]
                                ],
                                    names = ran.chooseBossName("a", 3);
                                for (let i = 0; i < 3; i++) {
                                    let boss = new Entity({
                                        x: positions[i][0],
                                        y: positions[i][1]
                                    });
                                    boss.team = -100;
                                    boss.define([Class.guardianAI, Class.summonerAI, Class.defenderAI][i]);
                                    boss.name = names[i];
                                }
                            }, 7500);
                        };
                        break;
                    case "Anti-Life":
                        this.onDead = () => {
                            sockets.broadcast("Beware the Anti-Life.");
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                                sockets.broadcast("Beware the Anti-Life eternally...");
                                for (let i = 0; i < 48; i++) {
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = this.team;
                                    boss.define([Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI, Class.guardianAI, Class.summonerAI, Class.defenderAI][i]);
                                }
                            }, 7500);
                        };
                        break;
                    case "supernova":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 12; i++) {
                                let boss = new Entity({
                                    x: x,
                                    y: y
                                });
                                boss.team = this.team;
                                boss.define([Class.quasarAI, Class.quasarAI, Class.pulsarAI, Class.magnetarAI, Class.magnetarAI, Class.magnetarAI, Class.pulsarAI, Class.magnetarAI, Class.pulsarAI, Class.magnetarAI, Class.pulsarAI, Class.magnetarAI][i]);
                            }
                        };
                        break;
                    case "quintet":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            setTimeout(() => {
                            sockets.broadcast("The Guardians have arrived.");
                            for (let i = 0; i < 6; i++) {
                                let boss = new Entity({
                                    x: x,
                                    y: y
                                });
                                boss.team = this.team;
                                boss.define([Class.guardianAI, Class.guardianAI, Class.guardianAI, Class.guardianAI, Class.guardianAI, Class.pentaguardianAI][i]);
                            }
                        }, 3000);
                    };
                    break;
                    case "pentaguardian":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                                setTimeout(() => {
                                sockets.broadcast("The Guardians have arrived.");
                                for (let i = 0; i < 5; i++) {
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = this.team;
                                    boss.define(Class.guardianAI);
                                }
                            }, 3000);
                        };
                        break;
                    case "hendecagon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                positions = [{
                                    x: x - 10,
                                    y: y - 10
                                }, {
                                    x: x - 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y - 10
                                }];
                            for (let i = 0; i < 3; i++) {
                                let o = new Entity(positions[i]);
                                o.team = this.team;
                                o.define([Class.crasher, Class.square, Class.triangle][i]);
                            }
                        };
                        break;
                    case "es5":
                        setTimeout(() => {
                            if (this.isAlive()) {
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    let boss1 = new Entity({
                                        x: x + 600,
                                        y: y
                                    });
                                    boss1.team = this.team;
                                    boss1.define(Class.eggSpiritTier1AI);
                                    let boss2 = new Entity({
                                        x: x - 600,
                                        y: y
                                    });
                                    boss2.team = this.team;
                                    boss2.define(Class.eggSpiritTier1AI);
                                    let boss3 = new Entity({
                                        x: x,
                                        y: y + 600
                                    });
                                    boss3.team = this.team;
                                    boss3.define(Class.eggSpiritTier2AI);
                                    let boss4 = new Entity({
                                        x: x,
                                        y: y - 600
                                    });
                                    boss4.team = this.team;
                                    boss4.define(Class.eggSpiritTier3AI);
                                }, 100);
                            }
                        }, 100);
                        break;
                        case "ek5":
                            setTimeout(() => {
                                if (this.isAlive()) {
                                    let x = this.x,
                                        y = this.y;
                                    setTimeout(() => {
                                        let boss1 = new Entity({
                                            x: x + 600,
                                            y: y
                                        });
                                        boss1.team = this.team;
                                        boss1.define(Class.eggBossTier1AI);
                                        let boss2 = new Entity({
                                            x: x - 600,
                                            y: y
                                        });
                                        boss2.team = this.team;
                                        boss2.define(Class.eggBossTier1AI);
                                        let boss3 = new Entity({
                                            x: x,
                                            y: y + 600
                                        });
                                        boss3.team = this.team;
                                        boss3.define(Class.eggBossTier2AI);
                                        let boss4 = new Entity({
                                            x: x,
                                            y: y - 600
                                        });
                                        boss4.team = this.team;
                                        boss4.define(Class.EK_3AI);
                                    }, 100);
                                }
                            }, 100);
                            break;
                        case "ek6":
                            setTimeout(() => {
                                if (this.isAlive()) {
                                    let x = this.x,
                                        y = this.y;
                                    setTimeout(() => {
                                        let boss1 = new Entity({
                                            x: x + 600,
                                            y: y
                                        });
                                        boss1.team = this.team;
                                        boss1.define(Class.eggBossTier1AI);
                                        let boss2 = new Entity({
                                            x: x - 600,
                                            y: y
                                        });
                                        boss2.team = this.team;
                                        boss2.define(Class.eggBossTier1AI);
                                        let boss3 = new Entity({
                                            x: x,
                                            y: y + 600
                                        });
                                        boss3.team = this.team;
                                        boss3.define(Class.eggBossTier1AI);
                                        let boss4 = new Entity({
                                            x: x,
                                            y: y - 600
                                        });
                                        boss4.team = this.team;
                                        boss4.define(Class.eggBossTier1AI);
                                        let boss5 = new Entity({
                                            x: x + 600,
                                            y: y + 600
                                        });
                                        boss5.team = this.team;
                                        boss5.define(Class.eggBossTier2AI);
                                        let boss6 = new Entity({
                                            x: x - 600,
                                            y: y - 600
                                        });
                                        boss6.team = this.team;
                                        boss6.define(Class.eggBossTier2AI);
                                        let boss7 = new Entity({
                                            x: x - 600,
                                            y: y + 600
                                        });
                                        boss7.team = this.team;
                                        boss7.define(Class.EK_3AI);
                                        let boss8 = new Entity({
                                            x: x + 600,
                                            y: y - 600
                                        });
                                        boss8.team = this.team;
                                        boss8.define(Class.eggBossTier4AI);
                                    }, 100);
                                }
                            }, 100);
                            break;
                            case "moon":
                                this.onDead = () => {
                                    let x = this.x,
                                        y = this.y;
                                    setTimeout(() => {
                                        sockets.broadcast("The remnants of the Moon have activated!");
                                        let core = new Entity({
                                            x: x,
                                            y: y
                                        });
                                        core.team = this.team;
                                        core.define(Class.moonCoreAI);
                                        let boss1 = new Entity({
                                            x: x + 600,
                                            y: y
                                        });
                                        boss1.team = this.team;
                                        boss1.define(Class.moonShardAAI);
                                        let boss2 = new Entity({
                                            x: x - 600,
                                            y: y
                                        });
                                        boss2.team = this.team;
                                        boss2.define(Class.moonShardAAI);
                                        let boss3 = new Entity({
                                            x: x,
                                            y: y + 600
                                        });
                                        boss3.team = this.team;
                                        boss3.define(Class.moonShardAAI);
                                        let boss4 = new Entity({
                                            x: x,
                                            y: y - 600
                                        });
                                        boss4.team = this.team;
                                        boss4.define(Class.moonShardAAI);
                                        let boss5 = new Entity({
                                            x: x + 600,
                                            y: y + 600
                                        });
                                        boss5.team = this.team;
                                        boss5.define(Class.moonShardBAI);
                                        let boss6 = new Entity({
                                            x: x - 600,
                                            y: y - 600
                                        });
                                        boss6.team = this.team;
                                        boss6.define(Class.moonShardBAI);
                                        let boss7 = new Entity({
                                            x: x - 600,
                                            y: y + 600
                                        });
                                        boss7.team = this.team;
                                        boss7.define(Class.moonShardBAI);
                                        let boss8 = new Entity({
                                            x: x + 600,
                                            y: y - 600
                                        });
                                        boss8.team = this.team;
                                        boss8.define(Class.moonShardBAI);
                                    }, 4900);
                                }
                            break;
                        case "eggfake":
                            this.onDead = () => {
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    let boss = new Entity({
                                        x: this.x,
                                        y: this.y
                                    });
                                    sockets.broadcast("An Ultra Cannon has arrived.");
                                    boss.team = this.team;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.ultraCannonAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss"; //kinda?
                                    boss.sandboxId = this.sandboxId;
                                }, 3000);
                            };
                            break;
                    case "crush":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;;
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.crusherShards);
                            }
                        };
                        break;
                    case "iceCrush":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.iceCrusherShards);
                            }
                        };
                        break;
                    case "collide":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = this.team;
                                crash.define(Class.messengerAI);
                            }
                        };
                        break;
                    case "coldcollide":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = this.team;
                                crash.define(Class.icemessengerAI);
                            }
                        };
                        break;
                    case "boomCrusher":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 6; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.boomCrusherShards14);
                            }
                            for (let i = 0; i < 2; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.boomCrusherShards0);
                            }
                            for (let i = 0; i < 4; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.boomCrusherShards);
                            }
                        };
                        break;
                    case "betapentaexplode":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 11; i++) {
                                let egg = new Entity({
                                    x: x,
                                    y: y
                                });
                                egg.team = this.team;
                                egg.define(Class.egggood);
                            }
                            for (let i = 0; i < 8; i++) {
                                let square = new Entity({
                                    x: x,
                                    y: y
                                });
                                square.team = this.team;
                                square.define(Class.squarebad);
                            }
                            for (let i = 0; i < 3; i++) {
                                let triangle = new Entity({
                                    x: x,
                                    y: y
                                });
                                triangle.team = this.team;
                                triangle.define(Class.triangleugly);
                            }
                            for (let i = 0; i < 1; i++) {
                                let triangle = new Entity({
                                    x: x,
                                    y: y
                                });
                                triangle.team = this.team;
                                triangle.define(Class.fuckinpentagon);
                            }
                        };
                        break;
                    case "splitHexagon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 2; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.trapezoidCrasher);
                            }
                        };
                        break;
                    case "splitPentagon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 5; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.crasher);
                            }
                        };
                        break;
                    case "crashfuck":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 50; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.crasher);
                            }
                        };
                        break;
                    case "splitBetaPentagon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 5; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.sentryAI);
                            }
                        };
                        break;
                    case "splitTriangle":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 4; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.redRunner1);
                            }
                        };
                        break;
                    case "splitTriangleBoss":
                        this.onDead = () => {
                            sockets.broadcast("A Red Burst has been defeated, but it's not over...");
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 4; i++) {
                                let boss = new Entity({
                                    x: x,
                                    y: y
                                });
                                boss.team = this.team;
                                boss.define(Class.rs1AI);
                            }
                        };
                        break;
                    case "splitSquare":
                    case "splitSquare2":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 4; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.summonerSquare);
                            }
                        };
                        break;
                    case "greensplitSquare":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 4; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = this.team;
                                crash.define(Class.greensummonerSquare);
                            }
                        };
                        break;
                    case "splitSplitSquare":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                positions = [{
                                    x: x - 10,
                                    y: y - 10
                                }, {
                                    x: x - 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y - 10
                                }];
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity(positions[i]);
                                shape.team = -100;
                                shape.define(Class.splitterSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                        };
                        break;
                    case "greensplitSplitSquare":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                positions = [{
                                    x: x - 10,
                                    y: y - 10
                                }, {
                                    x: x - 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y - 10
                                }];
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity(positions[i]);
                                shape.team = -100;
                                shape.define(Class.greensplitterSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                        };
                        /*

                        */
                        break;
                    case "ascendedsplitsquare":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                positions = [{
                                    x: x - 10,
                                    y: y - 10
                                }, {
                                    x: x - 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y + 10
                                }, {
                                    x: x + 10,
                                    y: y - 10
                                }];
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity(positions[i]);
                                shape.team = -100;
                                shape.define(Class.ascendedSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            sockets.broadcast("An Ascended Splitter Square has been destroyed!");
                        };
                    break;
                    case "splitSplitTriangle":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                positions = [{
                                    x: x - 10,
                                    y: y - 10
                                }, {
                                    x: x - 5,
                                    y: y + 5
                                }, {
                                    x: x + 10,
                                    y: y + 10
                                }];
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity(positions[i]);
                                shape.team = -100;
                                shape.define(Class.splitterTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                        };
                        break;
                    case "ribbonsplit":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                positions = [{
                                    x: x - 10,
                                    y: y - 10
                                }, {
                                    x: x,
                                    y: y
                                }, {
                                    x: x + 10,
                                    y: y + 10
                                }];
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity(positions[i]);
                                shape.team = -100;
                                shape.define([Class.stringPolygon, Class.knotPoly, Class.stringPolygon][i]);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                        };
                        break;
                        case "splitSplitPentagon":
                            this.onDead = () => {
                                let x = this.x,
                                    y = this.y,
                                    positions = [{
                                        x: x,
                                        y: y
                                    }, {
                                        x: x - 10,
                                        y: y - 10
                                    }, {
                                        x: x - 10,
                                        y: y + 10
                                    }, {
                                        x: x + 10,
                                        y: y + 10
                                    }, {
                                        x: x + 10,
                                        y: y - 10
                                    }];
                                for (let i = 0; i < 5; i++) {
                                    let shape = new Entity(positions[i]);
                                    shape.team = -100;
                                    shape.define(Class.splitterPentagon);
                                    shape.ACCELERATION = .015 / (shape.size * 0.2);
                                }
                            };
                            break;
                    case "groupers":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 4; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.grouperCrasher);
                            }
                        };
                        this.kill();
                        break;
                    case "tramplers":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < rnd(3,24); i++) {
                                let crash = new Entity({
                                    x: x+rnd(-5,5),
                                    y: y+rnd(-5,5)
                                });
                                crash.team = -100;
                                crash.define(Class.hivemindCrasher);
                            }
                        };
                        this.kill();
                        break;
                    case "convoy":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                convoys = [
                                    Class.convoySwarmAI,
                                    Class.convoyBuilderAI,
                                    Class.convoyLancerAI
                                ],
                                times = rnd(2, 6)
                            for (let i = 0; i < times; i++) {
                                let crash = new Entity({
                                    x: x + rnd(-20, 20),
                                    y: y + rnd(-20, 20),
                                });
                                crash.team = -100;
                                crash.define(convoys[rnd(0,2)]);
                            }
                        };
                        this.kill();
                        break;
                    case "defender":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(Math.random() * 6 + 1) + 2;
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = -100;
                                crash.define(Class.bladeCrasher);
                            }
                        };
                        break;
                    case "greendefender":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(Math.random() * 6 + 1) + 2;
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.poisonBlades);
                            }
                        };
                        break;
                    case "friedsummon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(Math.random() * 1000);
                            if (rand > 999) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.ascendedSquare);
                                }
                            }
                            else if (rand > 996) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.obsidianEgg);
                                }
                            }
                            else if (rand > 960) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.betaFriedEgg);
                                }
                            }
                            else if (rand > 900) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.friedEgg);
                                }
                            }
                            else if (rand > 800) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.square);
                                }
                            }
                            else if (rand > 790) { 
                              for (let i = 0; i < 10; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.egg);
                                }
                            }
                            else if (rand > 789) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.friedHardshellEgg);
                                }
                            }
                            else if (rand > 780) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.hardshellegg);
                                }
                            }
                            else if (rand > 750) { 
                              for (let i = 0; i < 5; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.egg);
                                }
                            }
                            else if (rand > 600) { 
                              for (let i = 0; i < 1; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.egg);
                                }
                            }
                            else if (rand > 590) { 
                              for (let i = 0; i < 3; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.friedEgg);
                                }
                            }
                            else if (rand > 590) { 
                              for (let i = 0; i < 3; i++) {
                                  let crash = new Entity({
                                        x: x,
                                        y: y
                                   })
                                  crash.team = this.team;
                                  crash.define(Class.friedEgg);
                                }
                            }
                        };
                        break;
                    case "ascendedsquare":
                        this.onDead = () => {
                            sockets.broadcast("An Ascended Square has been destroyed!");
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(2);
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.obsidianSquare);
                            }
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.ivorySquare);
                            }
                        };
                        break;
                    case "ascendedtriangle":
                        this.onDead = () => {
                            sockets.broadcast("+Enraged");
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(1);
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.enragedAscendedTriangle);
                            }
                        };
                        break;
                    case "enragedascendedtriangle":
                        this.onDead = () => {
                            sockets.broadcast("An Ascended Triangle has been destroyed!");
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(6);
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.redRunner4);
                            }
                        };
                        break;
                    case "enragedeye":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(1);
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.enragedEyeSentry);
                            }
                        };
                        break;
                    case "ascendedpentagon":
                        this.onDead = () => {
                            sockets.broadcast("An Ascended Pentagon has been destroyed!");
                            let x = this.x,
                                y = this.y,
                                rand = Math.floor(1);
                            for (let i = 0; i < rand; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                })
                                crash.team = this.team;
                                crash.define(Class.obsidianPentagon);
                            }
                        };
                        break;
                    case "eggColony":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 6; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 3),
                                    y: y + 200 * Math.sin(i * Math.PI / 3)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 3);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 3);
                                crash.define(Class.eggCrasher);
                            }
                            for (let i = 0; i < 20; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 10),
                                    y: y + 250 * Math.sin(i * Math.PI / 10)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 10);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 10);
                                shape.define(Class.egg);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 2),
                                    y: y + 100 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 100 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 100 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.hardshellegg);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                        };
                        this.kill();
                        break;
                    case "squareColony":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 6; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 3),
                                    y: y + 200 * Math.sin(i * Math.PI / 3)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 3);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 3);
                                crash.define(Class.summonerSquare);
                            }
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 200 * Math.sin(i * Math.PI / 1.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 1.5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 1.5);
                                crash.define(Class.cashCrash);
                            }
                            for (let i = 0; i < 2; i++) {
                                let shape = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 1),
                                    y: y + 100 * Math.sin(i * Math.PI / 1)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 100 * Math.cos(i * Math.PI / 1);
                                shape.control.target.y = 100 * Math.sin(i * Math.PI / 1);
                                shape.define(Class.splitterSplitterSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 125 * Math.cos(i * Math.PI / 2),
                                    y: y + 125 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 125 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 125 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.splitterSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 125 * Math.cos(i * Math.PI / 2),
                                    y: y + 125 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 125 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 125 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.lavenderSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 26; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 13),
                                    y: y + 400 * Math.sin(i * Math.PI / 13)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 150 * Math.cos(i * Math.PI / 13);
                                shape.control.target.y = 150 * Math.sin(i * Math.PI / 13);
                                shape.define(Class.square);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 5; i++) {
                                let shape = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 2.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 275 * Math.cos(i * Math.PI / 2.5);
                                shape.control.target.y = 275 * Math.sin(i * Math.PI / 2.5);
                                shape.define(Class.greenSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 2),
                                    y: y + 300 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 300 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 300 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.boomsquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 250 * Math.sin(i * Math.PI / 1.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 1.5);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 1.5);
                                shape.define(Class.orangeSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 1; i++) {
                                let shape = new Entity({
                                    x: x + 225 * Math.cos(i * Math.PI / 1),
                                    y: y + 225 * Math.sin(i * Math.PI / 1)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 225 * Math.cos(i * Math.PI / 1);
                                shape.control.target.y = 225 * Math.sin(i * Math.PI / 1);
                                shape.define(Class.scutiSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 2; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI),
                                    y: y + 275 * Math.sin(i * Math.PI)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI);
                                sentry.define(Class.squareGunSentry);
                            }
                            for (let i = 0; i < 1; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI),
                                    y: y
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI);
                                sentry.control.target.y = y;
                                sentry.define(Class.summonerLiteAI);
                            }
                            for (let i = 0; i < 1; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI),
                                    y: y
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI);
                                sentry.control.target.y = y;
                                sentry.define(Class.squareSwarmerAI);
                            }
                            for (let i = 0; i < 1; i++) {
                                let sentry = new Entity({
                                    x: x,
                                    y: y + 275 * Math.cos(i * Math.PI)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = x;
                                sentry.control.target.y = 275 * Math.cos(i * Math.PI);
                                sentry.define(Class.squareSwarmerAI);
                            }
                        };
                        this.kill();
                        break;
                    case "triangleColony":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 6; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 3),
                                    y: y + 200 * Math.sin(i * Math.PI / 3)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 3);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 3);
                                crash.define(Class.triangleCrasher);
                            }
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 200 * Math.sin(i * Math.PI / 1.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 1.5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 1.5);
                                crash.define(Class.poisonBlades);
                            }
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 200 * Math.sin(i * Math.PI / 1.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 200 * Math.cos(i * Math.PI / 1.5);
                                shape.control.target.y = 200 * Math.sin(i * Math.PI / 1.5);
                                shape.define(Class.lavenderTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 8; i++) {
                                let shape = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 4),
                                    y: y + 100 * Math.sin(i * Math.PI / 4)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 100 * Math.cos(i * Math.PI / 4);
                                shape.control.target.y = 100 * Math.sin(i * Math.PI / 4);
                                shape.define(Class.splitterTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 30; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 15),
                                    y: y + 400 * Math.sin(i * Math.PI / 15)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 150 * Math.cos(i * Math.PI / 15);
                                shape.control.target.y = 150 * Math.sin(i * Math.PI / 15);
                                shape.define(Class.triangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 5; i++) {
                                let shape = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 2.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 275 * Math.cos(i * Math.PI / 2.5);
                                shape.control.target.y = 275 * Math.sin(i * Math.PI / 2.5);
                                shape.define(Class.greenTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 2),
                                    y: y + 300 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 300 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 300 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.boomtriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 250 * Math.sin(i * Math.PI / 1.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 1.5);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 1.5);
                                shape.define(Class.orangeTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 1; i++) {
                                let shape = new Entity({
                                    x: x - 225 * Math.cos(i * Math.PI / 1),
                                    y: y - 225 * Math.sin(i * Math.PI / 1)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 225 * Math.cos(i * Math.PI / 1);
                                shape.control.target.y = 225 * Math.sin(i * Math.PI / 1);
                                shape.define(Class.rightTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 1; i++) {
                                let shape = new Entity({
                                    x: x + 225 * Math.cos(i * Math.PI / 1),
                                    y: y + 225 * Math.sin(i * Math.PI / 1)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 225 * Math.cos(i * Math.PI / 1);
                                shape.control.target.y = 225 * Math.sin(i * Math.PI / 1);
                                shape.define(Class.carbonFiberTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 3; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 1.5)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI / 1.5);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI / 1.5);
                                sentry.define(Class.bladeSentryAI);
                            }
                            for (let i = 0; i < 3; i++) {
                                let sentry = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 300 * Math.sin(i * Math.PI / 1.5)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 300 * Math.cos(i * Math.PI / 1.5);
                                sentry.control.target.y = 300 * Math.sin(i * Math.PI / 1.5);
                                sentry.define([Class.sentryGunAI, Class.sentryTrapAI, Class.sentrySwarmAI][i]);
                            }
                        };
                        this.kill();
                        break;
                    case "pentagonColony":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 5),
                                    y: y + 200 * Math.sin(i * Math.PI / 5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 5);
                                crash.define(Class.pentagonCrasher);
                            }
                            for (let i = 0; i < 20; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 10),
                                    y: y + 200 * Math.sin(i * Math.PI / 10)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 10);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 10);
                                crash.define(Class.crasher);
                            }
                            for (let i = 0; i < 10; i++) {
                                let shape = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 5),
                                    y: y + 100 * Math.sin(i * Math.PI / 5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 100 * Math.cos(i * Math.PI / 5);
                                shape.control.target.y = 100 * Math.sin(i * Math.PI / 5);
                                shape.define(Class.splitterPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 200 * Math.sin(i * Math.PI / 1.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 200 * Math.cos(i * Math.PI / 1.5);
                                shape.control.target.y = 200 * Math.sin(i * Math.PI / 1.5);
                                shape.define(Class.lavenderPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 1; i++) {
                                let shape = new Entity({
                                    x: x + 225 * Math.cos(i * Math.PI / 1),
                                    y: y + 225 * Math.sin(i * Math.PI / 1)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 225 * Math.cos(i * Math.PI / 1);
                                shape.control.target.y = 225 * Math.sin(i * Math.PI / 1);
                                shape.define(Class.cranberryPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 4),
                                    y: y + 100 * Math.sin(i * Math.PI / 4)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 100 * Math.cos(i * Math.PI / 4);
                                shape.control.target.y = 100 * Math.sin(i * Math.PI / 4);
                                shape.define(Class.splitterBetaPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 40; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 20),
                                    y: y + 400 * Math.sin(i * Math.PI / 20)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 150 * Math.cos(i * Math.PI / 20);
                                shape.control.target.y = 150 * Math.sin(i * Math.PI / 20);
                                shape.define(Class.pentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 10; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 5),
                                    y: y + 400 * Math.sin(i * Math.PI / 5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 150 * Math.cos(i * Math.PI / 5);
                                shape.control.target.y = 150 * Math.sin(i * Math.PI / 5);
                                shape.define(Class.betaPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 5; i++) {
                                let shape = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 2.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 275 * Math.cos(i * Math.PI / 2.5);
                                shape.control.target.y = 275 * Math.sin(i * Math.PI / 2.5);
                                shape.define([Class.greenPentagon, Class.greenPentagon, Class.greenPentagon, Class.greenBetaPentagon, Class.greenBetaPentagon][i]);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 5; i++) {
                                let shape = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 300 * Math.sin(i * Math.PI / 2.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 300 * Math.cos(i * Math.PI / 2.5);
                                shape.control.target.y = 300 * Math.sin(i * Math.PI / 2.5);
                                shape.define(Class.boompentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 3; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 250 * Math.sin(i * Math.PI / 1.5)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 1.5);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 1.5);
                                shape.define([Class.orangePentagon, Class.orangePentagon, Class.orangeBetaPentagon][i]);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 2; i++) {
                                let shape = new Entity({
                                    x: x - 225 * Math.cos(i * Math.PI / 1),
                                    y: y - 225 * Math.sin(i * Math.PI / 1)
                                });
                                shape.team = this.team;
                                shape.control.target.x = 225 * Math.cos(i * Math.PI / 1);
                                shape.control.target.y = 225 * Math.sin(i * Math.PI / 1);
                                shape.define(Class.protpentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 5; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 2.5)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI / 2.5);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI / 2.5);
                                sentry.define(Class.crusaderCrash);
                            }
                            for (let i = 0; i < 6; i++) {
                                let sentry = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 3),
                                    y: y + 300 * Math.sin(i * Math.PI / 3)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 300 * Math.cos(i * Math.PI / 3);
                                sentry.control.target.y = 300 * Math.sin(i * Math.PI / 3);
                                sentry.define([Class.sentryGunAI, Class.sentryTrapAI, Class.sentrySwarmAI, Class.sentryGunAI, Class.sentryTrapAI, Class.sentrySwarmAI][i]);
                            }
                        };
                        this.kill();
                        break;
                    case "crasherColony":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 30; i++) {
                                let crash = new Entity({
                                    x: x + 450 * Math.cos(i * Math.PI / 15),
                                    y: y + 450 * Math.sin(i * Math.PI / 15)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 450 * Math.cos(i * Math.PI / 15);
                                crash.control.target.y = 450 * Math.sin(i * Math.PI / 15);
                                crash.define(Class.redRunner1);
                            }
                            for (let i = 0; i < 20; i++) {
                                let crash = new Entity({
                                    x: x + 500 * Math.cos(i * Math.PI / 10),
                                    y: y + 500 * Math.sin(i * Math.PI / 10)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 500 * Math.cos(i * Math.PI / 10);
                                crash.control.target.y = 500 * Math.sin(i * Math.PI / 10);
                                crash.define(Class.longCrasher);
                            }
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 5),
                                    y: y + 200 * Math.sin(i * Math.PI / 5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 5);
                                crash.define(Class.pentagonCrasher);
                            }
                            for (let i = 0; i < 15; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 7.5),
                                    y: y + 200 * Math.sin(i * Math.PI / 7.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 7.5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 7.5);
                                crash.define(Class.triangleCrasher);
                            }
                            for (let i = 0; i < 20; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 10),
                                    y: y + 200 * Math.sin(i * Math.PI / 10)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 10);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 10);
                                crash.define(Class.eggCrasher);
                            }
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 5),
                                    y: y + 100 * Math.sin(i * Math.PI / 5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 100 * Math.cos(i * Math.PI / 5);
                                crash.control.target.y = 100 * Math.sin(i * Math.PI / 5);
                                crash.define(Class.boomCrasher);
                            }
                            for (let i = 0; i < 5; i++) {
                                let crash = new Entity({
                                    x: x + 100 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 100 * Math.sin(i * Math.PI / 2.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 100 * Math.cos(i * Math.PI / 2.5);
                                crash.control.target.y = 100 * Math.sin(i * Math.PI / 2.5);
                                crash.define(Class.alphacrasherbutreal);
                            }
                            for (let i = 0; i < 40; i++) {
                                let crash = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 20),
                                    y: y + 400 * Math.sin(i * Math.PI / 20)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 150 * Math.cos(i * Math.PI / 20);
                                crash.control.target.y = 150 * Math.sin(i * Math.PI / 20);
                                crash.define(Class.crasher);
                            }
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 5),
                                    y: y + 400 * Math.sin(i * Math.PI / 5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 150 * Math.cos(i * Math.PI / 5);
                                crash.control.target.y = 150 * Math.sin(i * Math.PI / 5);
                                crash.define(Class.summonerSquare);
                            }
                            for (let i = 0; i < 5; i++) {
                                let crash = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 2.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 275 * Math.cos(i * Math.PI / 2.5);
                                crash.control.target.y = 275 * Math.sin(i * Math.PI / 2.5);
                                crash.define(Class.megaCrushCrasher);
                            }
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 300 * Math.sin(i * Math.PI / 2.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 300 * Math.cos(i * Math.PI / 2.5);
                                crash.control.target.y = 300 * Math.sin(i * Math.PI / 2.5);
                                crash.define(Class.crushCrasher);
                            }
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 1.5),
                                    y: y + 250 * Math.sin(i * Math.PI / 1.5)
                                });
                                crash.team = this.team;
                                crash.control.target.x = 250 * Math.cos(i * Math.PI / 1.5);
                                crash.control.target.y = 250 * Math.sin(i * Math.PI / 1.5);
                                crash.define(Class.kamikazeCrasher);
                            }
                            for (let i = 0; i < 12; i++) {
                                let sentry = new Entity({
                                    x: x - 225 * Math.cos(i * Math.PI / 6),
                                    y: y - 225 * Math.sin(i * Math.PI / 6)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 225 * Math.cos(i * Math.PI / 6);
                                sentry.control.target.y = 225 * Math.sin(i * Math.PI / 6);
                                sentry.define(Class.sentryAI);
                            }
                            for (let i = 0; i < 5; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 275 * Math.sin(i * Math.PI / 2.5)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI / 2.5);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI / 2.5);
                                sentry.define(Class.crusaderCrash);
                            }
                            for (let i = 0; i < 9; i++) {
                                let sentry = new Entity({
                                    x: x + 300 * Math.cos(i * Math.PI / 4.5),
                                    y: y + 300 * Math.sin(i * Math.PI / 4.5)
                                });
                                sentry.team = this.team;
                                sentry.control.target.x = 300 * Math.cos(i * Math.PI / 4.5);
                                sentry.control.target.y = 300 * Math.sin(i * Math.PI / 4.5);
                                sentry.define([Class.sentryGunAI, Class.sentryTrapAI, Class.sentrySwarmAI, Class.sentryGunAI, Class.sentryTrapAI, Class.sentrySwarmAI, Class.sentryGunAI, Class.sentryTrapAI, Class.sentrySwarmAI][i]);
                            }
                        };
                        this.kill();
                        break;
                    case "squareNest":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 12; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 6),
                                    y: y + 200 * Math.sin(i * Math.PI / 6)
                                });
                                crash.team = -100;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 6);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 6);
                                crash.define(Class.summonerSquare);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 2 + Math.PI / 4),
                                    y: y + 250 * Math.sin(i * Math.PI / 2 + Math.PI / 4)
                                });
                                shape.team = -100;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 2 + Math.PI / 4);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 2 + Math.PI / 4);
                                shape.define(Class.greenSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 350 * Math.cos(i * Math.PI / 2),
                                    y: y + 350 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = -100;
                                shape.control.target.x = 350 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 350 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.splitterSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 20; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 10),
                                    y: y + 400 * Math.sin(i * Math.PI / 10)
                                });
                                shape.team = -100;
                                shape.control.target.x = 400 * Math.cos(i * Math.PI / 10);
                                shape.control.target.y = 400 * Math.sin(i * Math.PI / 10);
                                shape.define(Class.singularSquare);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 2; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI),
                                    y: y + 275 * Math.sin(i * Math.PI)
                                });
                                sentry.team = -100;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI);
                                sentry.define(Class.squareGunSentry);
                            }
                        };
                        this.kill();
                        break;
                    case "triangleNest":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 5),
                                    y: y + 200 * Math.sin(i * Math.PI / 5)
                                });
                                crash.team = -100;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 5);
                                crash.define(Class.crasher);
                            }
                            for (let i = 0; i < 4; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 2),
                                    y: y + 200 * Math.sin(i * Math.PI / 2)
                                });
                                crash.team = -100;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 2);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 2);
                                crash.define(Class.redRunner1);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 2),
                                    y: y + 250 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = -100;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.greenTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 8; i++) {
                                let crash = new Entity({
                                    x: x + 350 * Math.cos(i * Math.PI / 4),
                                    y: y + 350 * Math.sin(i * Math.PI / 4)
                                });
                                crash.team = -100;
                                crash.control.target.x = 350 * Math.cos(i * Math.PI / 4);
                                crash.control.target.y = 350 * Math.sin(i * Math.PI / 4);
                                crash.define(Class.bladeCrasher);
                            }
                            for (let i = 0; i < 20; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 10),
                                    y: y + 400 * Math.sin(i * Math.PI / 10)
                                });
                                shape.team = -100;
                                shape.control.target.x = 400 * Math.cos(i * Math.PI / 10);
                                shape.control.target.y = 400 * Math.sin(i * Math.PI / 10);
                                shape.define(Class.singularTriangle);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 2; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI),
                                    y: y + 275 * Math.sin(i * Math.PI)
                                });
                                sentry.team = -100;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI);
                                sentry.define(Class.sentryGunAI);
                            }
                        };
                        this.kill();
                        break;
                    case "pentagonNest":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 5),
                                    y: y + 200 * Math.sin(i * Math.PI / 5)
                                });
                                crash.team = -100;
                                crash.control.target.x = 200 * Math.cos(i * Math.PI / 5);
                                crash.control.target.y = 200 * Math.sin(i * Math.PI / 5);
                                crash.define(Class.semiCrushCrasher);
                            }
                            for (let i = 0; i < 5; i++) {
                                let shape = new Entity({
                                    x: x + 200 * Math.cos(i * Math.PI / 2.5),
                                    y: y + 200 * Math.sin(i * Math.PI / 2.5)
                                });
                                shape.team = -100;
                                shape.control.target.x = 200 * Math.cos(i * Math.PI / 2.5);
                                shape.control.target.y = 200 * Math.sin(i * Math.PI / 2.5);
                                shape.define(Class.splitterPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let shape = new Entity({
                                    x: x + 250 * Math.cos(i * Math.PI / 2),
                                    y: y + 250 * Math.sin(i * Math.PI / 2)
                                });
                                shape.team = -100;
                                shape.control.target.x = 250 * Math.cos(i * Math.PI / 2);
                                shape.control.target.y = 250 * Math.sin(i * Math.PI / 2);
                                shape.define(Class.greenPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 8; i++) {
                                let crash = new Entity({
                                    x: x + 350 * Math.cos(i * Math.PI / 4),
                                    y: y + 350 * Math.sin(i * Math.PI / 4)
                                });
                                crash.team = -100;
                                crash.control.target.x = 350 * Math.cos(i * Math.PI / 4);
                                crash.control.target.y = 350 * Math.sin(i * Math.PI / 4);
                                crash.define(Class.crushCrasher);
                            }
                            for (let i = 0; i < 18; i++) {
                                let shape = new Entity({
                                    x: x + 400 * Math.cos(i * Math.PI / 9),
                                    y: y + 400 * Math.sin(i * Math.PI / 9)
                                });
                                shape.team = -100;
                                shape.control.target.x = 400 * Math.cos(i * Math.PI / 9);
                                shape.control.target.y = 400 * Math.sin(i * Math.PI / 9);
                                shape.define(Class.singularPentagon);
                                shape.ACCELERATION = .015 / (shape.size * 0.2);
                            }
                            for (let i = 0; i < 4; i++) {
                                let sentry = new Entity({
                                    x: x + 275 * Math.cos(i * Math.PI / 2),
                                    y: y + 275 * Math.sin(i * Math.PI / 2)
                                });
                                sentry.team = -100;
                                sentry.control.target.x = 275 * Math.cos(i * Math.PI / 2);
                                sentry.control.target.y = 275 * Math.sin(i * Math.PI / 2);
                                sentry.define(Class.sentryGunAI);
                            }
                        };
                        this.kill();
                        break;
                    case "crusade":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                size = this.size / 1.25;
                            for (let i = 0; i < 2; i++) {
                                let crash = new Entity({
                                    x: size * Math.cos(i * Math.PI / 2) + x,
                                    y: size * Math.sin(i * Math.PI / 2) + y
                                });
                                crash.team = -100;
                                crash.define(Class.crusaderCrash);
                                crash.control.target.x = 275 * Math.cos(i * Math.PI / 2);
                                crash.control.target.y = 275 * Math.sin(i * Math.PI / 2);
                                crash.facing += i * Math.PI / 2 + Math.PI;
                            }
                        };
                        break;
                    case "longlong": // splitDecagon
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                size = this.size / 1.25;
                            for (let i = 0; i < 10; i++) {
                                let crash = new Entity({
                                    x: size * Math.cos(i * Math.PI / 5) + x,
                                    y: size * Math.sin(i * Math.PI / 5) + y
                                });
                                crash.team = -100;
                                crash.define(Class.longCrasher);
                                crash.facingType = "looseWithMotion";
                                crash.facing += i * Math.PI / 5 + Math.PI;
                            }
                        };
                        break;
                    case "destroyer":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                crash = new Entity({
                                    x: x,
                                    y: y
                                });
                            crash.team = -100;
                            crash.define(Class.summonerSquare);
                        };
                        break;
                    case "revo":
                        this.master.define(Class.baseThrowerFire)
                        this.onDead = () => {
                            if (this.master.isAlive()) this.master.define(Class.baseThrower);
                        };
                        break;
                    case "mei":
                        setTimeout(() => {
                            if (this.isAlive()) this.define(Class.mei);
                        }, 2000);
                        break;
                    case "oxy":
                        setTimeout(() => {
                            if (this.isAlive()) this.define(Class.guardianLauncher);
                        }, 2000);
                        break;
                    case "oxy2":
                        setTimeout(() => {
                            if (this.isAlive()) this.define(Class.miniGuardianLauncher);
                        }, 2000);
                        break;
                    case "secret service":
                        setTimeout(() => {
                            if (this.isAlive()) {
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    let boss1 = new Entity({
                                        x: x + 450,
                                        y: y
                                    });
                                    boss1.team = this.team;
                                    boss1.define(Class.confidentialAI);
                                    boss1.name = 'Agent';
                                    let boss2 = new Entity({
                                        x: x - 450,
                                        y: y
                                    });
                                    boss2.team = this.team;
                                    boss2.define(Class.at4_bwAI);
                                    boss2.name = 'Agent';
                                }, 100);
                            }
                        }, 100);
                        break;
                    case "oppress": 
                        if (this.isAlive()) {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 4; i++) {
                                let tank = new Entity({
                                    x: Math.cos(i * Math.PI / 5) + x,
                                    y: Math.sin(i * Math.PI / 5) + y
                                });
                                tank.team = this.team;
                                tank.define(Class.keeperAI);
                            }
                        };
                        break;
                    case "ENRAGED":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 1; i++) {
                                let enraged = new Entity({
                                    x: x,
                                    y: y
                                });
                                enraged.team = this.team;
                                enraged.define(Class.enragedmorningstarAI);
                            }
                        };
                        break;
                    case "scorchedmorn":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 1; i++) {
                                let enraged = new Entity({
                                    x: x,
                                    y: y
                                });
                                enraged.team = this.team;
                                enraged.define(Class.scorchedmorningstarAI);
                            }
                        };
                        break;
                    case "spawnPentagon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                size = this.size;
                                let crash = new Entity({
                                    x: x,
                                    y: y,
                                    size: size
                                });
                                crash.team = -100;
                                crash.define(Class.pentagon);
                            };
                        break;
                    case "goldSentry":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y,
                                size = this.size;
                                for(var i = 0; i < 3; ++i) {
                                  let crash = new Entity({
                                      x: x,
                                      y: y,
                                      size: size
                                  });
                                  crash.team = -100;
                                  crash.define(Class.flashSentryAI);
                                };
                            };
                        break;
                    case "walletCrash":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                                let avenger = new Entity({
                                    x: x,
                                    y: y
                                });
                                avenger.team = this.team;
                                avenger.define(Class.wallerCrasher);
                                let otherAvenger = new Entity({
                                    x: x,
                                    y: y
                                });
                                otherAvenger.team = this.team;
                                otherAvenger.define(Class.wallesCrasher);
                        };
                        break;
                    case "splitHeptagon":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 7; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.dacaeInactive);
                            }
                        };
                        break;
                    case "dacaeActivate":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            let crash = new Entity({
                                x: x,
                                y: y
                            });
                            crash.team = -100;
                            crash.define(Class.dacaeActive);
                        };
                        break;
                    case "splitEgg":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 3; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.eggCrasher);
                            }
                        };
                        break;
                    case "splitSplitEgg":
                        this.onDead = () => {
                            let x = this.x,
                                y = this.y;
                            for (let i = 0; i < 6; i++) {
                                let crash = new Entity({
                                    x: x,
                                    y: y
                                });
                                crash.team = -100;
                                crash.define(Class.splitterEgg);
                            }
                        };
                        break;
                    case null:
                    case undefined:
                        break;
                    default:
                        util.warn("Invalid boss type: " + set.BOSS_TYPE + "!");
                }
                if (set.SANCTUARY_TYPE != null && set.SANCTUARY_TYPE !== "None") {
                    this.sanctuaryType = set.SANCTUARY_TYPE;
                    sockets.broadcast(util.addArticle(set.SANCTUARY_TYPE, true) + " Sanctuary has spawned!");
                    this.miscIdentifier = "appearOnMinimap";
                    switch (set.SANCTUARY_TYPE) {
                        case "Egg":
                            this.onDead = () => {
                                sockets.broadcast("The Egg Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                //smoke(6000, x, y);
                                setTimeout(() => {
                                    let boss = new Entity({
                                        x: this.x,
                                        y: this.y
                                    });
                                    sockets.broadcast("An EK-1 has spawned to avenge the Egg Sanctuary!");
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.eggBossTier1AI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                    setTimeout(() => {
                                        if (boss.isAlive()) {
                                            sockets.broadcast("The EK-1's wrath has remained unhindered for too long; it appears to be evolving...");
                                            setTimeout(() => {
                                                if (boss.isAlive()) {
                                                    for (let i = 1; i < 22; i++) setTimeout(() => {
                                                        if (boss.isAlive()) {
                                                            boss.define(Class[`ekAnim${i}`]);
                                                            if (i === 21) boss.define(Class.eggBossTier2AI);
                                                        }
                                                    }, 36 * i);
                                                    boss.miscIdentifier = "Sanctuary Boss";
                                                    sockets.broadcast("The EK-1 has evolved into an EK-2!");
                                                } else sockets.broadcast("The EK-1 has been consoled just in time...");
                                            }, 6000);
                                        }
                                    }, 6e5);
                                }, 6000);
                            };
                            break;
                        case "Snowball":
                            this.onDead = () => {
                                sockets.broadcast("The Snowball Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                //smoke(6000, x, y);
                                setTimeout(() => {
                                    let boss = new Entity({
                                        x: this.x,
                                        y: this.y
                                    });
                                    sockets.broadcast("A Snowflake has spawned to avenge the Egg Sanctuary!");
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.snowflakeAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Square":
                            this.onDead = () => {
                                sockets.broadcast("The Square Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Summoner has spawned to avenge the Square Sanctuary!");
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.summonerAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Triangle":
                            this.onDead = () => {
                                sockets.broadcast("The Triangle Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Defender has spawned to avenge the Triangle Sanctuary!");
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.defenderAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Pentagon":
                            this.onDead = () => {
                                sockets.broadcast("The Pentagon Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Leviathan has spawned to avenge the Pentagon Sanctuary!");
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.leviathanAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Burnt":
                            this.onDead = () => {
                                sockets.broadcast("The Golden Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Golden Nonagon has spawned!");
                                    let poly = new Entity({
                                        x: this.x,
                                        y: this.y
                                    });
                                    poly.team = -100;
                                    poly.define(Class.burntNonagon);
                                    poly.ACCELERATION = .015 / (poly.size * 0.2);
                                    poly.miscIdentifier = "Sanctuary Boss";
                                    poly.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Bow":
                            this.onDead = () => {
                                sockets.broadcast("The Bowed Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Bow has spawned to avenge the Bowed Sanctuary!");
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.bowAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Crasher":
                            this.onDead = () => {
                                sockets.broadcast("The Crasher Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Guardian has spawned to avenge the Crasher Sanctuary!");
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = -100;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.guardianAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        case "Elite":
                            this.onDead = () => {
                                sockets.broadcast("The Elite Sanctuary seems to have left something in its demise...");
                                let x = this.x,
                                    y = this.y;
                                setTimeout(() => {
                                    sockets.broadcast("A Quintet has spawned to avenge the Elite Sanctuary!");
                                    let boss = new Entity({
                                        x: x,
                                        y: y
                                    });
                                    boss.team = this.team;
                                    boss.control.target.x = boss.control.target.y = 100;
                                    boss.define(Class.quintetAI);
                                    boss.name = ran.chooseBossName("a", 1)[0];
                                    boss.miscIdentifier = "Sanctuary Boss";
                                    boss.sandboxId = this.sandboxId;
                                }, 6000);
                            };
                            break;
                        default:
                            util.warn("Invalid sanctuary type: " + this.sanctuaryType + "!");
                            this.miscIdentifier = this.sanctuaryType = "None";
                    }
                }
                if (set.UPGRADES_TIER_1 != null)
                    for (let e of set.UPGRADES_TIER_1) this.upgrades.push({
                        class: exportNames[e.index],
                        level: c.LEVEL_ZERO_UPGRADES ? 0 : 15,
                        index: e.index,
                        tier: 1
                    });
                if (set.UPGRADES_TIER_2 != null)
                    for (let e of set.UPGRADES_TIER_2) this.upgrades.push({
                        class: exportNames[e.index],
                        level: c.LEVEL_ZERO_UPGRADES ? 0 : 30,
                        index: e.index,
                        tier: 2
                    });
                if (set.UPGRADES_TIER_3 != null)
                    for (let e of set.UPGRADES_TIER_3) this.upgrades.push({
                        class: exportNames[e.index],
                        level: c.LEVEL_ZERO_UPGRADES ? 0 : 45,
                        index: e.index,
                        tier: 3
                    });
                if (set.UPGRADES_TIER_4 != null)
                    for (let e of set.UPGRADES_TIER_4) this.upgrades.push({
                        class: exportNames[e.index],
                        level: c.LEVEL_ZERO_UPGRADES ? 0 : 60,
                        index: e.index,
                        tier: 4
                    });
                if (set.SIZE != null) {
                    this.SIZE = set.SIZE * this.squiggle;
                    if (this.coreSize == null) this.coreSize = this.SIZE;
                }
                if (set.SKILL != null && !global.isEmptyArray(set.SKILL)) {
                    if (set.SKILL.length !== 10) throw ("Invalid skill raws!");
                    this.skill.set(set.SKILL);
                }
                if (set.LEVEL != null) {
                    if (set.LEVEL === -1) this.skill.reset();
                    while (this.skill.level < c.SKILL_CHEAT_CAP && this.skill.level < set.LEVEL) {
                        this.skill.score += this.skill.levelScore;
                        this.skill.maintain();
                    }
                    this.refreshBodyAttributes();
                }
                if (set.SKILL_CAP != null && !global.isEmptyArray(set.SKILL_CAP)) {
                    if (set.SKILL_CAP.length !== 10) throw ("Invalid skill caps!");
                    this.skill.setCaps(set.SKILL_CAP);
                }
                if (set.VALUE != null) this.skill.score = Math.max(this.skill.score, set.VALUE * this.squiggle);
                if (set.SCOPED != null) this.scoped = set.SCOPED;
                this.altCameraSource = false
                if (set.GUNS != null) {
                    let newGuns = [];
                    let i = 0;
                    for (let def of set.GUNS) {
                        newGuns.push(new Gun(this, def, i));
                        i++;
                    }
                    this.guns = newGuns;
                }
                if (set.LASERS != null) {
                    let newLasers = [];
                    for (let def of set.LASERS) newLasers.push(new Laser(this, def));
                    this.lasers = newLasers;
                }
                if (set.PROPS != null) {
                    let newProps = [];
                    for (let def of set.PROPS) newProps.push(new Prop(def));
                    this.props = newProps;
                }
                if (set.MAX_CHILDREN != null) this.maxChildren = set.MAX_CHILDREN;
                if (set.COUNTS_OWN_KIDS != null) this.countsOwnKids = set.COUNTS_OWN_KIDS;
                if (set.BODY != null) {
                    if (set.BODY.ACCELERATION != null) this.ACCELERATION = set.BODY.ACCELERATION;
                    if (set.BODY.SPEED != null) this.SPEED = set.BODY.SPEED;
                    if (set.BODY.HEALTH != null) this.HEALTH = set.BODY.HEALTH;
                    if (set.BODY.RESIST != null) this.RESIST = set.BODY.RESIST;
                    if (set.BODY.SHIELD != null) this.SHIELD = set.BODY.SHIELD;
                    if (set.BODY.REGEN != null) this.REGEN = set.BODY.REGEN;
                    if (set.BODY.DAMAGE != null) this.DAMAGE = set.BODY.DAMAGE;
                    if (set.BODY.PENETRATION != null) this.PENETRATION = set.BODY.PENETRATION;
                    if (set.BODY.FOV != null) this.FOV = set.BODY.FOV;
                    if (set.BODY.RANGE != null) this.RANGE = set.BODY.RANGE;
                    if (set.BODY.SHOCK_ABSORB != null) this.SHOCK_ABSORB = set.BODY.SHOCK_ABSORB;
                    if (set.BODY.DENSITY != null) this.DENSITY = set.BODY.DENSITY;
                    if (set.BODY.STEALTH != null) this.STEALTH = set.BODY.STEALTH;
                    if (set.BODY.PUSHABILITY != null) this.PUSHABILITY = set.BODY.PUSHABILITY;
                    if (set.BODY.HETERO != null) this.heteroMultiplier = set.BODY.HETERO;
                    this.refreshBodyAttributes();
                }
                if (set.TURRETS != null) {
                    for (let o of this.turrets) o.destroy();
                    this.turrets = [];
                    for (let def of set.TURRETS) {
                        let o = new Entity(this, this.master);
                        o.roomId === this.roomId;
                        if (Array.isArray(def.TYPE)) {
                            for (let type of def.TYPE) o.define(type);
                        } else o.define(def.TYPE);
                        o.bindToMaster(def.POSITION, this);
                        if (!def.TARGETABLE_TURRET) {
                            o.dangerValue = 0;
                        } else if (def.TARGETABLE_TURRET > 0) {
                            o.dangerValue = def.TARGETABLE_TURRET;
                        }
                    }
                }
                if (set.DIES_INSTANTLY != null) this.kill();
                if (set.RANDOM_TYPE != null && set.RANDOM_TYPE !== "None") {
                    let choices = [];
                    switch (set.RANDOM_TYPE) {
                        case "Cultist":
                            choices = [Class.trapmind.hivemindID, Class.poundHivemind.hivemindID, Class.psychosisProbe, Class.machHivemind.hivemindID, Class.auto2Probe, Class.propellerHivemind.hivemindID, Class.pelletHivemind.hivemindID, Class.lancemind.hivemindID, Class.flankmind.hivemindID, Class.minishotmind.hivemindID, Class.basebridMind.hivemindID, Class.twinmind.hivemindID, Class.submind.hivemindID].filter(i => !!i);;
                            break;
                        default:
                            util.warn("Invalid RANDOM_TYPE value: " + set.RANDOM_TYPE + "!");
                    }
                    choices = choices.filter(r => !!r);
                    this.define(choices[Math.floor(Math.random() * choices.length)]);
                }
                if (set.ABILITY_IMMUNE != null) this.immuneToAbilities = set.ABILITY_IMMUNE;
                if (set.SPAWNS_DECA != null) this.define(Class.decagon);
                if (set.ALWAYS_ACTIVE != null) this.alwaysActive = set.ALWAYS_ACTIVE;
                if (set.MISC_IDENTIFIER != null) this.miscIdentifier = set.MISC_IDENTIFIER;
                if (set.SWITCHEROO_ID != null) this.switcherooID = set.SWITCHEROO_ID;
                if (set.IS_ARENA_CLOSER != null) {
                    this.isArenaCloser = set.IS_ARENA_CLOSER;
                    if (this.isArenaCloser) this.immuneToAbilities = true;
                }
                this.variables = set.VARIABLES ? JSON.parse(JSON.stringify(set.VARIABLES)) : {};
                this.animation = null
                if (this.isShiny){
                    this.color = -1
                    this.skill.score *= 3
                    this.SIZE += 2
                    this.label = "Shiny "+this.label
                    this.settings.givesKillMessage = true
                }
                if(this.evolutionTimeout) clearTimeout(this.evolutionTimeout);
                if (set.EVOLUTIONS?.length){
                    this.evolutionTimeout = setTimeout(()=>{
                        try {
                            if (!this.isAlive()) {
                                return
                            }
                            let options = [];
                            let chances = [];
                            for (let arr of set.EVOLUTIONS) {
                                options.push(arr[0])
                                chances.push(arr[1])
                            }
                            if (Math.random() < c.EVOLVE_HALT_CHANCE) {
                                return
                            }
                            this.define(Class[options[ran.chooseChance(...chances)]])
                        }catch(err){
                            util.error("Error while trying to evolve "+global.exportNames[this.index])
                        }
                    }, (c.EVOLVE_TIME + Math.random() * c.EVOLVE_TIME_RAN_ADDER) * ((this.type === "crasher" || this.isSentry)?0.5:1)) // Crashers evolve 2x as fast
                }
                if (set.ON_DEFINED) set.ON_DEFINED(this, entities, sockets);
            } catch (e) {
                if (this.isBot) console.error(this.tank);
                console.error("An error occured while trying to set " + trimName(this.name) + "'s parent entity, aborting! Index: " + this.index + "."+" Export: "+global.exportNames[this.index]);
                this.sendMessage("An error occured while trying to set your parent entity!");
                console.error(e.stack);
            }
        }
        refreshBodyAttributes() {
            let speedReduce = Math.pow(this.size / (this.coreSize || this.SIZE), 1);
            this.acceleration = c.runSpeed * this.ACCELERATION / speedReduce;
            if (this.settings.reloadToAcceleration) this.acceleration *= this.skill.acl;
            this.topSpeed = c.runSpeed * this.SPEED * this.skill.mob / speedReduce;
            if (this.settings.reloadToAcceleration) this.topSpeed /= Math.sqrt(this.skill.acl);
            this.health.set(((this.settings.healthWithLevel ? 1.5 /* 1.8 */ * this.skill.level : 0) + this.HEALTH) * (this.settings.reloadToAcceleration ? this.skill.hlt * 0.95 /*1.025*/ : this.skill.hlt));
            this.health.resist = 1 - 1 / Math.max(1, this.RESIST + this.skill.brst);
            this.shield.set(((this.settings.healthWithLevel ? .6 * this.skill.level : 0) + this.SHIELD) * this.skill.shi * (this.settings.reloadToAcceleration ? .85 : 1), Math.max(0, (((this.settings.healthWithLevel ? .006 * this.skill.level : 0) + 1) * this.REGEN) * this.skill.rgn) * (this.settings.reloadToAcceleration ? 0.9 : 1));
            this.damage = this.DAMAGE * (this.settings.reloadToAcceleration ? this.skill.atk * 1.1 /*1.1*/ /*1.25*/ : this.skill.atk);
            this.penetration = this.PENETRATION + 1.5 * (this.skill.brst + 0.8 * (this.skill.atk - 1));//this.PENETRATION + 1.5 * (this.skill.brst + .8 * (this.skill.atk - 1)) * .4;//(this.settings.reloadToAcceleration ? .1 : 1);
            this.range = this.RANGE;
            this.fov = 250 * this.FOV * Math.sqrt(this.size) * (1 + .003 * this.skill.level);
            this.density = (1 + 0.08 * this.skill.level) * this.DENSITY;//(1 + .08 * this.skill.level) * this.DENSITY * 2.334;//(this.settings.reloadToAcceleration ? 5 : 1);
            this.stealth = this.STEALTH;
            this.pushability = this.PUSHABILITY;
        }
        refreshFOV() {
            this.fov = 250 * this.FOV * Math.sqrt(this.size) * (1 + .003 * this.skill.level);
        }
        bindToMaster(position, bond) {
            this.bond = bond;
            this.source = bond;
            this.bond.turrets.push(this);
            this.skill = this.bond.skill;
            this.label = this.bond.label + " " + this.label;
            this.neverInGrid = this.settings.hitsOwnType !== "shield";
            //if (this.settings.hitsOwnType !== "shield") this.removeFromGrid();
            this.settings.drawShape = false;
            this.bound = {};
            this.bound.size = .05 * position[0];
            let offset = new Vector(position[1], position[2]);
            this.bound.angle = position[3] * Math.PI / 180;
            this.bound.direction = offset.direction;
            this.bound.offset = offset.length / 10;
            this.bound.arc = position[4] * Math.PI / 180;
            this.bound.layer = position[5];
            if (this.facingType === "toTarget") {
                this.facing = this.bond.facing + this.bound.angle;
                this.facingType = "bound";
            }
            this.motionType = "bound";
            this.move();
            this.isTurret = true;
        }
        get size() {
            //if (this.bond == null) return (this.coreSize || this.SIZE) * (1 + this.skill.level / 60);
            if (this.bond == null) return (this.coreSize || this.SIZE) * (1 + (this.skill.level > c.SKILL_CAP ? c.SKILL_CAP : this.skill.level) / 60);
            return this.bond.size * this.bound.size;
        }
        get mass() {
            return this.density * (this.size * this.size + 1);
        }
        get realSize() {
            return this.size * (Math.abs(this.shape) >= realSizes.length ? 1 : realSizes[Math.abs(this.shape)]);
        }
        get m_x() {
            return (this.velocity.x + this.accel.x) / room.speed;
        }
        get m_y() {
            return (this.velocity.y + this.accel.y) / room.speed;
        }
        camera(tur = false) {
            let out = {
                type: tur * 0x01 + this.settings.drawHealth * 0x02 + ((this.type === "tank" || this.type === "utility") && !this.settings.noNameplate) * 0x04 + this.invuln * 0x08,
                id: this.id,
                index: this.index,
                x: this.x,
                y: this.y,
                cx: this.x,
                cy: this.y,
                messages: this.messages,
                vx: this.velocity.x,
                vy: this.velocity.y,
                size: this.size,
                rsize: this.realSize,
                status: 1,
                health: this.health.display(),
                shield: this.shield.display(),
                facing: this.facing,
                vfacing: this.vfacing,
                twiggle: this.facingType !== "toTarget" || (this.facingType === "lmg" && this.control.fire), //this.facingType === "looseWithMotion" || this.facingType === "smoothWithMotion" || this.facingType === "spinSlowly" || this.facingType === "spinSlowly2" || this.facingType === "spinSlowly3" || this.facingType === "spinSlowly4" || this.facingType === "altSpin" || this.facingType === "fastSpin" || this.facingType === "autospin" || this.facingType === "autospin2" || this.facingType === "reverseAutospin" || this.facingType === "bitFastSpin" || this.facingType === "hadron" || this.facingType === "locksFacing" && this.control.alt || this.facingType === "hatchet" || this.facingType === "altLocksFacing" || this.facingType === "lmg" && this.control.fire,
                layer: this.type === "mazeWall" ? 7 : this.passive && this.LAYER !== -1 ? 1 : this.LAYER === -1 ? this.bond == null ? this.type === "wall" ? 11 : this.type === "food" ? 10 : this.type === "tank" ? 5 : this.type === "crasher" ? 8 : 0 : this.bound.layer : this.LAYER,
                color: this.color,
                name: this.name,
                score: this.skill.score,
                sizeRatio: [this.width || 1, this.height || 1],
                guns: this.guns.map(gun => gun.lastShot),
                turrets: this.turrets.map(turret => turret.camera(true)),
                alpha: this.alpha,
                seeInvisible: this.seeInvisible,
                nameColor: this.nameColor,
                label: this.labelOverride ? this.labelOverride : 0
            };
            if (this.scoped) {
                this.cx = out.cx;
                this.cy = out.cy;
                if (!this.control.alt) {
                    this.cameraShiftFacing = null;
                } else {
                    this.cameraShiftFacing = true
                    out.cx += this.fov * Math.cos(this.facing) / 3;
                    out.cy += this.fov * Math.sin(this.facing) / 3;
                }
            }
            if (this.altCameraSource && Number(this.altCameraSource[0]) && Number(this.altCameraSource[0])) {
                out.cx = this.altCameraSource[0]
                out.cy = this.altCameraSource[1]
            }
            return out;
        }
        skillUp(stat) {
            let upgrade = this.skill.upgrade(stat);
            if (upgrade) {
                this.refreshBodyAttributes();
                for (let gun of this.guns) gun.syncChildren();
            }
            return upgrade;
        }
        upgrade(number) {
            if (c.serverName.includes("Corrupted Tanks")){
                if (number == null){
                    this.define(Class[global.gamemodeCode.generateNewTank()])
                    this.skill.score = 59212
                }else{
                    this.childrenMap.forEach(c=>c.kill())
                    this.define(Class[this.upgrades[number].class])
                }
                this.upgrades = []
                for(let i = 0; i < 12; i++){
                    let newTank = Class[global.gamemodeCode.generateNewTank()]
                    this.upgrades.push({
                        class: exportNames[newTank.index],
                        level: 0,
                        index: newTank.index,
                        tier: 4
                    })
                }
                return
            }
            if (number < this.upgrades.length && this.skill.level >= this.upgrades[number].level) {
                let tank = Class[this.upgrades[number].class];
                this.upgrades = [];
                this.define(tank);
                this.tank = tank;
                if (this.switcherooID === 0 || (this.bossTierType !== -1 && this.bossTierType !== 16)) this.sendMessage("Press Q to switch tiers. There is a 1 second cooldown.");
                if (this.scoped) this.sendMessage("Right click or press shift to move the camera to your mouse.");
                if (this.facingType === "hatchet") this.sendMessage("Left click to make the tank spin quickly.");
                if (this.settings.hasAnimation === "rmb") this.sendMessage("Right click or press shift to use a special ability.");
                if (this.settings.hasAnimation === "lmb") this.sendMessage("Left click or press space to use a special ability.");
                //if (this.usesAltFire) this.sendMessage("Right click or press shift to fire other weapons.");
                this.sendMessage("You have upgraded to " + this.label + ".");
                this.childrenMap.forEach(o => {
                    if (o.settings.clearOnMasterUpgrade && o.master.id === this.id && o.id !== this.id && o !== this) {
                        o.kill();
                    }
                });
                //for (let o of entities)
                //    if (o.settings.clearOnMasterUpgrade && o.master.id === this.id && o.id !== this.id && o !== this) o.kill();
                this.skill.update();
                this.refreshBodyAttributes();
                if (this.stealthMode) {
                    this.settings.leaderboardable = this.settings.givesKillMessage = false;
                    this.alpha = this.ALPHA = 0;
                }
                if (!this.isPlayer) return 0;
                switch (this.label) {
                    case "Smasher": return void this.rewardManager(-1, "where_did_my_cannon_go");
                    case "Mothership": return void this.rewardManager(-1, "miniship");
                    case "Twin": return void this.rewardManager(-1, "fire_power");
                    case "Sniper": return void this.rewardManager(-1, "snipin");
                    case "Machine Gun": return void this.rewardManager(-1, "eat_those_bullets");
                    case "Flank Guard": return void this.rewardManager(-1, "aint_no_one_sneaking_up_on_me");
                    case "Director":
                        this.rewardManager(-1, "mmm_drones_drones_drones");
                        this.rewardManager(10, 1);
                        break;
                    case "Pounder": return void this.rewardManager(-1, "one_shot_bby");
                    case "Single": return void this.rewardManager(-1, "better_basic");
                    case "Pelleter": return void this.rewardManager(-1, "bullet_hell");
                    case "Trapper": return void this.rewardManager(-1, "build_a_wall");
                    case "Propeller": return void this.rewardManager(-1, "zoom");
                    case "Auto-2": return void this.rewardManager(-1, "cant_bother_using_both_hands_to_play");
                    case "Minishot": return void this.rewardManager(-1, "small_barrel_big_dreams");
                    case "Lancer": return void this.rewardManager(-1, "pointy");
                    case "Auto-Basic": return void this.rewardManager(-1, "automation");
                    case "Basebrid": return void this.rewardManager(-1, "wannabe_hybrid");
                    case "Subduer": return void this.rewardManager(-1, "wannabe_hunter");
                    case "Mini Grower": return void this.rewardManager(-1, "they_get_big_i_swear");
                    case "Inceptioner": return void this.rewardManager(-1, "commencement_of_the_inception");
                    case "Hivemind": return void this.rewardManager(-1, "which_one_is_me");
                    case "Switcheroo (Ba)": return void this.rewardManager(-1, "it_wasnt_worth_it");
                }
            }
        }
        upgradeTank(tank) {
            this.upgrades = [];
            this.define(tank);
            this.tank = tank;
            if (this.switcherooID === 0 || (this.bossTierType !== -1 && this.bossTierType !== 16)) this.sendMessage("Press Q to switch tiers. There is a 1 second cooldown.");
            if (this.scoped) this.sendMessage("Right click or press shift to move the camera to your mouse.");
            if (this.facingType === "hatchet") this.sendMessage("Left click to make the tank spin quickly.");
            if (this.settings.hasAnimation === "rmb") this.sendMessage("Right click or press shift to use an animation ability.");
            if (this.settings.hasAnimation === "lmb") this.sendMessage("Left click or press space to use an animation ability.");
            //if (this.usesAltFire) this.sendMessage("Right click or press shift to fire other weapons.");
            this.sendMessage("You have changed your tank to " + this.label + ".");
            this.skill.update();
            this.refreshBodyAttributes();
            this.children.forEach(o => {
                if (o.settings.clearOnMasterUpgrade && o.id !== this.id) {
                    o.kill();
                }
            });
            if (this.stealthMode) {
                this.settings.leaderboardable = this.settings.givesKillMessage = false;
                this.alpha = this.ALPHA = 0;
            }
        }
        damageMultiplier() {
            switch (this.type) {
                case "swarm":
                    return .25 + 1.5 * util.clamp(this.range / (this.RANGE + 1), 0, 1);
                default:
                    return 1;
            }
        }
        move() {
            let g = this.control.goal ? {
                x: this.control.goal.x - this.x,
                y: this.control.goal.y - this.y
            } : {
                x: 0,
                y: 0
            },
                gactive = g.x !== 0 || g.y !== 0,
                engine = {
                    x: 0,
                    y: 0
                },
                a = this.acceleration / room.speed;
            switch (this.motionType) {
                case "glide":
                    this.maxSpeed = this.topSpeed;
                    this.damp = .05;
                    break;
                case "motor":
                    this.maxSpeed = 0;
                    if (this.topSpeed) this.damp = a / this.topSpeed;
                    if (gactive) {
                        let len = Math.sqrt(g.x * g.x + g.y * g.y);
                        engine = {
                            x: a * g.x / len,
                            y: a * g.y / len
                        };
                    }
                    break;
                case "swarm":
                    this.maxSpeed = this.topSpeed;
                    let l = util.getDistance({
                        x: 0,
                        y: 0
                    }, g) + 1;
                    if (gactive && l > this.size) {
                        let desiredXSpeed = this.topSpeed * g.x / l,
                            desiredYSpeed = this.topSpeed * g.y / l,
                            turning = Math.sqrt((this.topSpeed * Math.max(1, this.range) + 1) / a);
                        engine = {
                            x: (desiredXSpeed - this.velocity.x) / Math.max(5, turning),
                            y: (desiredYSpeed - this.velocity.y) / Math.max(5, turning)
                        };
                    } else {
                        if (this.velocity.length < this.topSpeed) engine = {
                            x: this.velocity.x * a / 20,
                            y: this.velocity.y * a / 20
                        };
                    }
                    break;
                case "chase":
                    if (gactive) {
                        let l = util.getDistance({
                            x: 0,
                            y: 0
                        }, g);
                        if (l > this.size * 2) {
                            this.maxSpeed = this.topSpeed;
                            let desiredxspeed = this.topSpeed * g.x / l,
                                desiredyspeed = this.topSpeed * g.y / l;
                            engine = {
                                x: (desiredxspeed - this.velocity.x) * a,
                                y: (desiredyspeed - this.velocity.y) * a
                            };
                        } else this.maxSpeed = 0;
                    } else this.maxSpeed = 0;
                    break;
                case "drift":
                    this.maxSpeed = 0;
                    engine = {
                        x: g.x * a,
                        y: g.y * a
                    };
                    break;
                case "tokyoDrift":
                    this.maxSpeed = this.topSpeed;
                    if (this.topSpeed) this.damp = a / this.topSpeed;
                    if (gactive) {
                        this.refreshBodyAttributes()
                        let len = Math.sqrt(g.x * g.x + g.y * g.y);
                        engine = {
                            x: a * g.x / len,
                            y: a * g.y / len
                        };
                    } else {
                        this.topSpeed *= 0.9
                        this.damp = 1;
                    }
                    break;
                case "bound":
                    if(!this.bond){return}
                    let bound = this.bound,
                        ref = this.bond;
                    this.x = ref.x + ref.size * bound.offset * Math.cos(bound.direction + bound.angle + ref.facing);
                    this.y = ref.y + ref.size * bound.offset * Math.sin(bound.direction + bound.angle + ref.facing);
                    this.bond.velocity.x += bound.size * this.accel.x;
                    this.bond.velocity.y += bound.size * this.accel.y;
                    this.firingArc = [ref.facing + bound.angle, bound.arc / 2];
                    this.accel.null();
                    this.blend = ref.blend;
                    break;
                case "accelerate":
                    this.maxSpeed = this.topSpeed;
                    this.damp = -.0125;
                    this.DAMAGE -= 10; // .05, 1, 2
                    break;
                case "glideBall":
                    this.maxSpeed = this.topSpeed;
                    if (this.topSpeed) this.damp = a / this.topSpeed;
                    if (gactive) {
                        let len = Math.sqrt(g.x * g.x + g.y * g.y);
                        engine = {
                            x: a * g.x / len,
                            y: a * g.y / len
                        };
                    } else this.damp = .005;
                    break;
                case "grow":
                    this.SIZE += .175;
                    break;
                case "flamethrower":
                    this.maxSpeed = this.topSpeed;
                    this.damp = -.02;
                    this.SIZE += .175;
                    this.DAMAGE -= 2.25;
                    break;
                case "flare":
                    this.maxSpeed = this.topSpeed;
                    this.damp = -.025;
                    this.SIZE += .25;
                    this.DAMAGE -= .175;
                    break;
                case "explode":
                    this.SIZE += 10;
                    this.DAMAGE += 3;
                    break;
                case "flakGun":
                    this.SIZE += 5;
                    break;
                case "kamikaze":
                    this.SIZE += 7;
                    this.DAMAGE += 1;
                    break;
                case "crockett":
                    this.SIZE += 2;
                    this.DAMAGE += 2;
                case "snowball":
                    this.SIZE += .15;
                    this.DAMAGE += 2;
                    break;
                case "fatNuke":
                    this.SIZE += 7;
                    this.DAMAGE += 20;
                    break;
                case "miniGrower":
                    this.SIZE += .1; // + .02 * Math.random();
                    this.DAMAGE += .15;
                    this.penetration += .01;
                    if (this.velocity.x > 0) this.velocity.x -= .0035;
                    if (this.velocity.y > 0) this.velocity.y -= .0035;
                    break;
                case "grower":
                    this.SIZE += .14; // + .022 * Math.random();
                    this.DAMAGE += .175;
                    this.penetration += .02;
                    if (this.velocity.x > 0) this.velocity.x -= .004;
                    if (this.velocity.y > 0) this.velocity.y -= .004;
                    break;
                case "megaGrower":
                    this.SIZE += .17; // + .024 * Math.random();
                    this.DAMAGE += .2;
                    this.penetration += .03;
                    if (this.velocity.x > 0) this.velocity.x -= .0045;
                    if (this.velocity.y > 0) this.velocity.y -= .0045;
                    break;
                case "gigaGrower":
                    this.SIZE += .21; // + .026 * Math.random();
                    this.DAMAGE += .225;
                    this.penetration += .04;
                    if (this.velocity.x > 0) this.velocity.x -= .005;
                    if (this.velocity.y > 0) this.velocity.y -= .005;
                    break;
                case "thunder":
                    this.SIZE += 4.5;
                    break;
                /*case "gravity":
                    //this.a += 1; // Does nothing
                    this.velocity.y += a;
                    this.damp = -.005;
                    this.topSpeed = 90;
                    break;*/
                case "gravityA":
                    //this.a += 1;
                    this.velocity.y += a / 1.45;
                    this.damp = -.00125;
                    this.topSpeed = 70;
                    break;
                case "gravityB":
                    //this.a += 1;
                    this.velocity.y -= a / 1.45;
                    this.damp = -.00125;
                    this.topSpeed = 70;
                    break;
                case "gravityC":
                    this.velocity.y += a / 1.45;
                    this.damp = -.00125;
                    this.topSpeed = 70;
                    break;
                case "gravityD":
                    this.velocity.x -= a / 1.45 * Math.sin(2 * Math.PI / 3);
                    this.velocity.y += a / 1.45 * Math.cos(2 * Math.PI / 3);
                    this.damp = -.00125;
                    this.topSpeed = 70;
                    break;
                case "gravityE":
                    this.velocity.x -= a / 1.45 * Math.sin(4 * Math.PI / 3);
                    this.velocity.y += a / 1.45 * Math.cos(4 * Math.PI / 3);
                    this.damp = -.00125;
                    this.topSpeed = 70;
                    break;
                case "limitShrink":
                    this.SIZE -= .175;
                    if (this.SIZE < 2) this.SIZE = 2;
                    break;
                case "decentralize":
                    if (this.master.control.alt) this.SIZE += 1;
                    else {
                        if (this.SIZE > 25.2) this.SIZE -= 1;
                        else this.SIZE = 25.2;
                    }
                    break;
                case "plasma":
                    this.x = this.source.x;
                    this.y = this.source.y;
                    this.SIZE += 4;
                    break;
                case "colorthingy":
                    this.color = 0;
                    this.SIZE -= 1;
                    if (this.SIZE <= 1) this.kill();
                    this.maxSpeed = this.topSpeed;
                    break;
                case "colorthingynocolor":
                    this.SIZE -= 1;
                    if (this.SIZE <= 1) this.kill();
                    this.maxSpeed = this.topSpeed;
                    break;
                case "decelfast":
                    this.maxSpeed = this.topSpeed;
                    this.damp = .2;
                    break;
                case "decel":
                    this.maxSpeed = this.topSpeed;
                    this.damp = .05;
                break;
                case "colorthingy4":
                    this.color = 23;
                    this.SIZE += 5;
                    if (this.SIZE >= 40) this.SIZE = 40;
                    this.guns.color = 4;
                    this.maxSpeed = this.topSpeed;
                    break;
                case "welder":
                    this.color = 276;
                    this.SIZE += 5;
                    if (this.SIZE >= 40) this.SIZE = 40;
                    this.guns.color = 4;
                    this.maxSpeed = this.topSpeed;
                    break;
                case "ebin":
                    this.color = 22;
                    this.diesAtRange = true;
                    let mod = 120 * Math.PI / 180 * Math.sin(900 * Math.random()),
                        theta = this.facing + mod;
                    if (this.range <= 40 && this.range >= 39) {
                        this.velocity.x = 10 * Math.cos(theta);
                        this.velocity.y = 10 * Math.sin(theta);
                        mod *= -1;
                    }
                    this.maxSpeed = this.topSpeed;
                    break;
                case "bong":
                    this.SIZE += 4;
                    this.maxSpeed = this.topSpeed;
                    this.damp = .05;
                    break;
                case "oxy":
                    this.maxSpeed = this.topSpeed;
                    let oxy = util.getDistance({
                        x: 0,
                        y: 0
                    }, g) + 1;
                    if (gactive && oxy > this.size) {
                        let desiredXSpeed = this.topSpeed * g.x / oxy,
                            desiredYSpeed = this.topSpeed * g.y / oxy,
                            turning = Math.sqrt((this.topSpeed * Math.max(1, this.range) + 1) / a);
                        engine = {
                            x: (desiredXSpeed - this.velocity.x) / Math.max(5, turning),
                            y: (desiredYSpeed - this.velocity.y) / Math.max(5, turning)
                        };
                    } else {
                        if (this.velocity.length < this.topSpeed) engine = {
                            x: this.velocity.x * a / 20,
                            y: this.velocity.y * a / 20
                        };
                    }
                    this.color = 31;
                    break;
            }
            if (!this.stuck) {
                this.accel.x += engine.x * this.control.power;
                this.accel.y += engine.y * this.control.power;
            } else {
                this.facing = this.stickRD - (stickHost.facing < 180 ? 360 - (this.stickRD - stickHost.facing) : this.stickRD - stickHost.facing);
                this.x = stickHost.x + Math.sin(this.facing) * this.stickDist;
                this.y = stickHost.y + Math.cos(this.facing) * this.stickDist;
            };
        }
        face() {
            let t = this.control.target,
                oldFacing = this.facing;
            switch (this.facingType) {
                case "autospin":
                    this.facing += .02 / room.speed;
                    break;
                case "autospin2":
                    this.facing += .0125 / room.speed;
                    break;
                case "spinSlowly":
                    this.facing += .0075 / room.speed;
                    break;
                case "spinSlowly2":
                    this.facing += .004 / room.speed;
                    break;
                case "spinSlowly3":
                    this.facing += .0025 / room.speed;
                    break;
                case "spinSlowly4":
                    this.facing += .00125 / room.speed;
                    break;
                case "bitFastSpin":
                    this.facing += .035 / room.speed;
                    break;
                case "fastSpin":
                    this.facing += .075 / room.speed;
                    break;
                case "fasterSpin":
                    this.facing += .15 / room.speed;
                    break;
                case "revFastSpin":
                    this.facing -= .075 / room.speed;
                    break;
                case "altSpin":
                    this.facing += (this.master.control.alt ? -.15 : .075) / room.speed;
                    break;
                case "hadron":
                    this.facing += (this.master.control.alt ? -.035 : .035) / room.speed;
                    break;
                case "lmg":
                    if (this.master.control.fire) this.facing += .0375 / room.speed;
                    break;
                case "turnWithSpeed":
                    this.facing += this.velocity.length / 90 * Math.PI / room.speed;
                    break;
                case "turnWithSpeedFood":
                    if (!(this.id % 2)) this.facing -= this.velocity.length / 90 * Math.PI / room.speed
                    else this.facing += this.velocity.length / 90 * Math.PI / room.speed;
                    break;
                case "withMotion":
                    if (this.velocity.length > 0) this.facing = this.velocity.direction;
                    break;
                case "looseWithMotion":
                    if (!this.velocity.length) break;
                case "smoothWithMotion":
                    this.facing += util.loopSmooth(this.facing, this.velocity.direction, 4 / room.speed);
                    break;
                case "sans": //ty misfit
                    this.facing = Math.atan2(t.y, t.x); //Copied from toTarget
                    entities.forEach((instance) => {
                        if (Math.abs(this.x - instance.x) < 70 && Math.abs(this.y - instance.y) < 70 && "bullet trap swarm drone minion tank miniboss crasher food".includes(instance.type) && instance.team != this.team) { 
                        this.velocity.x += 20 * Math.sin(instance.velocity.direction + (Math.PI/2));
                        this.velocity.y += 50 * Math.cos(instance.velocity.direction + (Math.PI/2));
                        
                        this.facingType = "smoothWithMotion"; //Disables ability after dodging
                        setTimeout(() => {
                        this.facingType = "sans"; //Re-enables ability after cooldown
                        }, 1);
                        }
                    } 
                    );
                        break;
                case "dodge": //ty misfit
                    this.facing = Math.atan2(t.y, t.x); //Copied from toTarget
                    entities.forEach((instance) => {
                        if (Math.abs(this.x - instance.x) < 70 && Math.abs(this.y - instance.y) < 70 && "bullet trap swarm drone minion".includes(instance.type) && instance.team != this.team) { 
                        this.velocity.x += 50 * Math.sin(instance.velocity.direction + (Math.PI/2));
                        this.velocity.y += 50 * Math.cos(instance.velocity.direction + (Math.PI/2));
                        
                        this.facingType = "smoothWithMotion"; //Disables ability after dodging
                        setTimeout(() => {
                        this.facingType = "dodge"; //Re-enables ability after cooldown
                        }, 1500); //1.5 sec dodge cooldown
                        }
                    } 
                    );
                        break;
                case "bossdodge": //ty misfit
                    this.facing = Math.atan2(t.y, t.x); //Copied from toTarget
                    entities.forEach((instance) => {
                        if (Math.abs(this.x - instance.x) < 70 && Math.abs(this.y - instance.y) < 70 && "bullet trap swarm drone minion".includes(instance.type) && instance.team != this.team) { 
                        this.velocity.x += 150 * Math.sin(instance.velocity.direction + (Math.PI/2));
                        this.velocity.y += 150 * Math.cos(instance.velocity.direction + (Math.PI/2));
                        
                        this.facingType = "smoothWithMotion"; //Disables ability after dodging
                        setTimeout(() => {
                        this.facingType = "bossdodge"; //Re-enables ability after cooldown
                        }, 10000); //10 sec dodge cooldown
                        }
                    } 
                    );
                        break;
                case "dronedodge": //ty misfit
                    this.facing = Math.atan2(t.y, t.x); //Copied from toTarget
                    entities.forEach((instance) => {
                        if (Math.abs(this.x - instance.x) < 70 && Math.abs(this.y - instance.y) < 70 && "bullet trap swarm drone minion".includes(instance.type) && instance.team != this.team) { 
                        this.velocity.x += 50 * Math.sin(instance.velocity.direction + (Math.PI/2));
                        this.velocity.y += 50 * Math.cos(instance.velocity.direction + (Math.PI/2));
                        
                        this.facingType = "smoothWithMotion"; //Disables ability after dodging
                        setTimeout(() => {
                        this.facingType = "dronedodge"; //Re-enables ability after cooldown
                        }, 2500); //2.5 sec dodge cooldown
                        }
                    } 
                    );
                        break;
                case "toTarget":
                    this.facing = Math.atan2(t.y, t.x);
                    break;
                case "locksFacing":
                    if (!this.control.alt) this.facing = Math.atan2(t.y, t.x);
                    break;
                case "altLocksFacing":
                    if (!this.control.fire) this.facing = Math.atan2(t.y, t.x);
                    break;
                case "smoothToTarget":
                    this.facing += util.loopSmooth(this.facing, Math.atan2(t.y, t.x), 4 / room.speed);
                    break;
                case "slowToTarget":
                    this.facing += util.loopSmooth(this.facing, Math.atan2(t.y, t.x), 8 / room.speed);
                break;
                case "bound":
                    let givenAngle;
                    if (this.turretRightClick ? this.control.alt : this.control.main) {
                        givenAngle = Math.atan2(t.y, t.x);
                        let diff = util.angleDifference(givenAngle, this.firingArc[0]);
                        if (Math.abs(diff) >= this.firingArc[1]) givenAngle = this.firingArc[0];
                    } else givenAngle = this.firingArc[0];
                    this.facing += util.loopSmooth(this.facing, givenAngle, (2 / room.speed) * this.turretTraverseSpeed);
                    if (this.bond.syncTurretSkills) this.skill.set(this.bond.skill.raw);
                    break;
                case "toBound":
                    this.facing = this.bound.angle + this.bond.master.facing;
                    break;
                case "hatchet":
                    this.facing += .2 + this.skill.spd / 7;
                    break;
                case "reverseAutospin":
                    this.facing -= .02 / room.speed;
                    break;
                case "masterOnSpawn":
                    if (!this.variables.masterOnSpawnFacing) {
                        this.facing = this.master.facing
                        this.variables.masterOnSpawnFacing = 1
                    }
                    break;
            }
            let TAU = 2 * Math.PI;
            this.facing = (this.facing % TAU + TAU) % TAU;
            this.vfacing = util.angleDifference(oldFacing, this.facing) * room.speed;
        }
        takeSelfie() {
            this.flattenedPhoto = null;
            this.photo = this.settings.drawShape ? this.camera() : undefined;
        }
        physics() {
            this.velocity.x += this.accel.x;
            this.velocity.y += this.accel.y;
            this.accel.null();
            this.stepRemaining = c.ARENA_TYPE === 1 ? 1.5 : 1;
            this.x += this.stepRemaining * this.velocity.x / room.speed;
            this.y += this.stepRemaining * this.velocity.y / room.speed;
        }
        friction() {
            let motion = this.velocity.length,
                excess = (motion - this.maxSpeed) * (c.ARENA_TYPE === 1 ? 1.05 : 1);
            if (excess > 0 && this.damp) {
                let drag = excess / (this.damp / room.speed + 1),
                    finalvelocity = this.maxSpeed + drag;
                this.velocity.x = finalvelocity * this.velocity.x / motion;
                this.velocity.y = finalvelocity * this.velocity.y / motion;
            }
        }
        location() {
            if (this.isDead()) {
                return;
            }/*
            if (isNaN(this.x) || isNaN(this.y)) {
                util.error("Detected an NaN position!");
                util.error("Label: " + this.label);
                util.error("Index: " + this.index);
                util.error(`Position: (${this.x}, ${this.y})`);
                util.error(`Velocity: (${this.velocity.x}, ${this.velocity.y})`);
                util.error(`Acceleration: (${this.accel.x}, ${this.accel.y})`);
                return this.kill();
            }*/
            let loc = {
                x: this.x,
                y: this.y
            },
                myCell = this.myCell;
            if (room.outb && room.outb.length && this.diesToTeamBase && !this.godmode && !this.passive && myCell === "outb") {
                if (this.type === "miniboss" || this.type === "crasher") {
                    let pos = room.randomType(c.serverName.includes("Boss Rush") ? "bosp" : "nest");
                    this.x = pos.x;
                    this.y = pos.y;
                } else if (this.type === "tank" || this.type === "food") {
                    return this.kill();
                }
            }
            if (this.diesToTeamBase && !this.godmode && !this.passive && !this.isTurret) {
                let bas = myCell.slice(0, -1);
                if (bas === "bas" || bas === "n_b" || bas === "bad" || bas === "por" || myCell === "void") {
                    if ((bas + -this.team !== myCell && c.DO_BASE_DAMAGE && room.gameMode === "tdm") || myCell === "void") {
                        this.velocity.null();
                        this.accel.null();
                        this.kill();
                        return;
                    }
                }
                /*let isInTeamBase = false;
                for (let i = 1; i < room.teamAmount + 1; i++)
                    if (this.master.team !== -i && (room.isIn(`bas${i}`, loc) || room.isIn(`n_b${i}`, loc) || room.isIn(`bad${i}`, loc))) {
                        isInTeamBase = true;
                        break;
                    }
                if (isInTeamBase) {
                    this.velocity.null();
                    this.accel.null();
                    this.isDead = () => true;
                    return setTimeout(() => {
                        if (this.isAlive) this.kill();
                    }, 75);
                }*/
            }
            if (c.PORTALS.ENABLED) {
                if (myCell === "port" && !this.passive && !this.settings.goThruObstacle && !this.isTurret) {
                    if (this.motionType === "crockett") return this.kill();
                    if (this.settings.isHelicopter) {
                        if (!this.godmode && !this.invuln) this.health.amount -= 1;
                        return;
                    }
                    let myRoom = room.isAt(loc),
                        dx = loc.x - myRoom.x,
                        dy = loc.y - myRoom.y,
                        dist2 = dx * dx + dy * dy,
                        force = c.BORDER_FORCE;
                    if (this.type === "miniboss" || this.isMothership) {
                        this.accel.x += 1e4 * dx / dist2 * force / room.speed;
                        this.accel.y += 1e4 * dy / dist2 * force / room.speed;
                    } else if (this.type === "tank") {
                        if (dist2 <= c.PORTALS.THRESHOLD) {
                            let angle = Math.random() * Math.PI * 2,
                                ax = Math.cos(angle),
                                ay = Math.sin(angle);
                            //this.velocity.x = c.PORTALS.LAUNCH_FORCE * ax * force / room.speed;
                            //this.velocity.y = c.PORTALS.LAUNCH_FORCE * ay * force / room.speed;
                            let portTo;
                            do portTo = room["port"][Math.floor(Math.random() * room["port"].length)];
                            while (portTo.id === myRoom.id && room["port"].length > 1);
                            let rx = ax < 0 ? -room.xgridWidth / 1.8 : room.xgridWidth / 1.8,
                                ry = ay < 0 ? -room.ygridHeight / 1.8 : room.ygridHeight / 1.8;
                            this.x = portTo.x + rx;
                            this.y = portTo.y + ry;
                            if (this.isPlayer) {
                                this.invuln = true;
                                this.invulnTime = [Date.now(), 15000];
                                this.sendMessage("You will be invulnerable until you move, shoot or wait 15 seconds.");
                            }
                            //for (let o of entities)
                            entities.forEach(o => {
                                if (o.id !== this.id && o.master.id === this.id && (o.type === "drone" || o.type === "minion")) {
                                    o.x = portTo.x + 320 * ax + 30 * (Math.random() - .5);
                                    o.y = portTo.y + 320 * ay + 30 * (Math.random() - .5);
                                }
                            });
                        } else {
                            this.velocity.x -= c.PORTALS.GRAVITY * dx / dist2 * force / room.speed;
                            this.velocity.y -= c.PORTALS.GRAVITY * dy / dist2 * force / room.speed;
                        }
                    } else this.kill();
                } else if (myCell === "port" && !this.passive && this.motionType === "crockett") {
                    return this.kill();
                } else if (room[`por${-this.team}`] && myCell === `por${-this.team}` && !this.passive && !this.settings.goThruObstacle && !this.isTurret) {
                    if (this.motionType === "crockett") return this.kill();
                    if (this.settings.isHelicopter) {
                        if (!this.godmode && !this.invuln) this.health.amount -= 1;
                        return;
                    }
                    let myRoom = room.isAt(loc),
                        dx = loc.x - myRoom.x,
                        dy = loc.y - myRoom.y,
                        dist2 = dx * dx + dy * dy,
                        force = c.BORDER_FORCE;
                    if (this.type === "miniboss" || this.isMothership) {
                        this.accel.x += 1e4 * dx / dist2 * force / room.speed;
                        this.accel.y += 1e4 * dy / dist2 * force / room.speed;
                    } else if (this.type === "tank") {
                        if (dist2 <= c.PORTALS.THRESHOLD) {
                            let angle = Math.random() * Math.PI * 2,
                                ax = Math.cos(angle),
                                ay = Math.sin(angle);
                            //this.velocity.x = c.PORTALS.LAUNCH_FORCE * ax * force / room.speed;
                            //this.velocity.y = c.PORTALS.LAUNCH_FORCE * ay * force / room.speed;
                            let portTo;
                            do portTo = room[`por${-this.team}`][Math.floor(Math.random() * room[`por${-this.team}`].length)];
                            while (portTo.id === myRoom.id && room[`por${-this.team}`].length > 1);
                            let rx = ax < 0 ? -room.xgridWidth / 1.8 : room.xgridWidth / 1.8,
                                ry = ay < 0 ? -room.ygridHeight / 1.8 : room.ygridHeight / 1.8;
                            this.x = portTo.x + rx;
                            this.y = portTo.y + ry;
                            if (this.isPlayer) {
                                this.invuln = true;
                                this.invulnTime = [Date.now(), 15000];
                                this.sendMessage("You will be invulnerable until you move, shoot or wait 15 seconds.");
                            }
                            entities.forEach(o => {
                                if (o.id !== this.id && o.master.id === this.id && (o.type === "drone" || o.type === "minion")) {
                                    o.x = portTo.x + 320 * ax + 30 * (Math.random() - .5);
                                    o.y = portTo.y + 320 * ay + 30 * (Math.random() - .5);
                                }
                            });
                        } else {
                            this.velocity.x -= c.PORTALS.GRAVITY * dx / dist2 * force / room.speed;
                            this.velocity.y -= c.PORTALS.GRAVITY * dy / dist2 * force / room.speed;
                        }
                    } else this.kill();
                } else if (room[`por${-this.team}`] && myCell === `por${-this.team}` && !this.passive && this.motionType === "crockett") {
                    return this.kill();
                }
            }
            if (!this.settings.canGoOutsideRoom && !this.passive && this.motionType !== "bound") {
                /*let xx = this.x;
                let yy = this.y;
                let bounces = this.type !== "tank" && this.type !== "miniboss" && this.type !== "drone";

                this.x = Math.max(0 + this.realSize, Math.min(this.x, room.width - this.realSize));
                this.y = Math.max(0 + this.realSize, Math.min(this.y, room.height - this.realSize));

                if (this.x != xx) {
                    this.accel.x = this.x > room.width / 2 ? Math.min(this.accel.x, 0) : Math.max(this.accel.x, 0);
                    this.velocity.x = bounces ? this.velocity.x *= -0.5 : 0;
                }
                if (this.y != yy) {
                    this.accel.y = this.y > room.width / 2 ? Math.min(this.accel.x, 0) : Math.max(this.accel.x, 0);
                    this.velocity.y = bounces ? this.velocity.y *= -0.5 : 0;
                }*/
                let force = c.BORDER_FORCE;
                this.isOutsideRoom = false
                switch (c.ARENA_TYPE) {
                    case 1: // Round
                        if (this.isActive && ((this.type === "tank" && this.bound == null) || this.type === "food")) {
                            const dist = util.getDistance(this, {
                                x: room.width / 2,
                                y: room.height / 2
                            });
                            if (dist > room.width / 2) {
                                this.isOutsideRoom = true
                                let strength = Math.abs((dist - room.width / 2) * (force / room.speed)) / 1000;
                                this.x = util.lerp(this.x, room.width / 2, strength);
                                this.y = util.lerp(this.y, room.height / 2, strength);
                            }
                        }
                        break;
                    case 2: // Warping
                        if (this.x < 0) {
                            this.x = room.width - this.realSize;
                        }
                        if (this.x > room.width) {
                            this.x = this.realSize;
                        }
                        if (this.y < 0) {
                            this.y = room.height - this.realSize;
                        }
                        if (this.y > room.width) {
                            this.y = this.realSize;
                        }
                        break;
                    case 3: // Triangle
                        if (this.isActive && ((this.type === "tank" && this.bound == null) || this.type === "food")) {
                            let isOutside = false;
                            for (let point of room.mapPoints) {
                                let angle = Math.atan2(this.y - point.y, this.x - point.x),
                                    diff = Math.abs(util.angleDifference(angle, point.angle));
                                if (diff < Math.PI / 2) {
                                    isOutside = true;
                                    break;
                                }
                            }
                            if (isOutside) {
                                this.isOutsideRoom = true
                                let strength = Math.abs((util.getDistance(this, {
                                    x: room.width / 2,
                                    y: room.height / 2
                                }) - room.width / 2) * (force / room.speed)) / 1000;
                                this.x = util.lerp(this.x, room.width / 2, strength);
                                this.y = util.lerp(this.y, room.height / 2, strength);
                            }
                        }
                        break;
                    default: // Default rectangular
                        if (this.x < 0) {
                            this.isOutsideRoom = true
                            this.accel.x -= Math.min(this.x - this.realSize + 50, 0) * force / room.speed;
                        }
                        if (this.x > room.width) {
                            this.isOutsideRoom = true
                            this.accel.x -= Math.max(this.x + this.realSize - room.width - 50, 0) * force / room.speed;
                        }
                        if (this.y < 0) {
                            this.isOutsideRoom = true
                            this.accel.y -= Math.min(this.y - this.realSize + 50, 0) * force / room.speed;
                        }
                        if (this.y > room.height) {
                            this.isOutsideRoom = true
                            this.accel.y -= Math.max(this.y + this.realSize - room.height - 50, 0) * force / room.speed;
                        }
                        break;
                }

                // Do outside of room damage
                function outsideRoomDamage(entity) {
                    if (entity.shield.amount > 1) {
                        entity.shield.amount = entity.shield.amount - c.OUTSIDE_ROOM_DAMAGE
                    } else {
                        entity.health.amount = entity.health.amount - c.OUTSIDE_ROOM_DAMAGE
                    }
                    if (entity.onDamaged) entity.onDamaged(entity, null, c.OUTSIDE_ROOM_DAMAGE)
                }
                if (this.OUTSIDE_ROOM_DAMAGE && this.isOutsideRoom) {
                    outsideRoomDamage(this)
                }


                if (c.PORTALS.ENABLED && !this.settings.isHelicopter) {
                    let force = c.BORDER_FORCE;
                    if (c.PORTALS.DIVIDER_1.ENABLED) {
                        let l = c.PORTALS.DIVIDER_1.LEFT,
                            r = c.PORTALS.DIVIDER_1.RIGHT,
                            m = (l + r) * .5;
                        if (this.x > m && this.x < r) this.accel.x -= Math.min(this.x - this.realSize + 50 - r, 0) * force / room.speed;
                        if (this.x > l && this.x < m) this.accel.x -= Math.max(this.x + this.realSize - 50 - l, 0) * force / room.speed;
                    }
                    if (c.PORTALS.DIVIDER_2.ENABLED) {
                        let l = c.PORTALS.DIVIDER_2.TOP,
                            r = c.PORTALS.DIVIDER_2.BOTTOM,
                            m = (l + r) * .5;
                        if (this.y > m && this.y < r) this.accel.y -= Math.min(this.y - this.realSize + 50 - r, 0) * force / room.speed;
                        if (this.y > l && this.y < m) this.accel.y -= Math.max(this.y + this.realSize - 50 - l, 0) * force / room.speed;
                    }
                }
            }
        }
        regenerate() {
            if (this.shield.max) {
                if (this.REGEN !== -1) this.shield.regenerate();
            }
            if (this.health.amount) {
                if (this.REGEN !== -1) this.health.regenerate(this.shield.max && this.shield.max === this.shield.amount);
            }
        }
        death() {
            newLogs.death.start();
            //this.checkIfIShouldDie() && this.kill();
            // Turrets must not be calculated as a normal entity
            if (this.bond != null && this.bond.isGhost) {
                newLogs.death.stop();
                return true;
            }
            // Invulnerable and godmode players should not take damage or be killed. (Set the godmode and invuln properties to false beforehand)
            if (this.invuln || this.godmode) {
                this.damageReceived = 0;
                this.regenerate();
                newLogs.death.stop();
                return 0;
            }
            // If we die at range, attempt to die for some dumb reason
            if (this.settings.diesAtRange) {
                this.range -= 1 / room.speed;
                if (this.range <= 0) {
                    this.kill();
                }
            }
            // If we die at low speeds, do that because we are a failure
            if (this.settings.diesAtLowSpeed && !this.collisionArray.length && this.velocity.length < this.topSpeed / 2) {
                this.health.amount -= this.health.getDamage(1 / room.speed);
            }
            // Do damage to us
            if (this.damageReceived !== 0) {
                if (this.shield.max) {
                    let shieldDamage = this.shield.getDamage(this.damageReceived);
                    this.damageReceived -= shieldDamage;
                    this.shield.amount -= shieldDamage;
                }
                if (this.damageReceived !== 0) {
                    let healthDamage = this.health.getDamage(this.damageReceived);
                    this.blend.amount = 1;
                    this.health.amount -= healthDamage;
                }
            }
            this.regenerate();
            this.damageReceived = 0;
            if (this.isDead()) {
                // Explosions, phases and whatnot
                if (this.onDead != null && !this.hasDoneOnDead) {
                    this.hasDoneOnDead = true;
                    this.onDead();
                }
                // Second function so onDead isn't overwritten by specific gamemode features
                if (this.modeDead != null && !this.hasDoneModeDead) {
                    this.hasDoneModeDead = true;
                    this.modeDead();
                }
                // Process tag events if we should
                if (c.serverName.includes("Tag") && (this.isPlayer || this.isBot)) {
                    tagDeathEvent(this);
                }
                // Just in case one of the onDead events revives the tank from death (like dominators), don't run it
                if (this.isDead()) {
                    let killers = [],
                        killTools = [],
                        notJustFood = false,
                        name = this.master.name === "" ? this.master.type === "tank" ? "An unnamed player's " + this.label : this.master.type === "miniboss" ? "a visiting " + this.label : util.addArticle(this.label) : this.master.name + "'s " + this.label,
                        killerList = this.lastBouncer && c.serverName.includes("Bounce") ? [this.lastBouncer] : this.collisionArray,
                        jackpot = Math.round(util.getJackpot(this.skill.score) / this.collisionArray.length);
                    // Find out who killed us, and if it was "notJustFood" or not]
                    for (let i = 0, l = killerList.length; i < l; i++) {
                        let o = killerList[i];
                        if (o.type === "wall" || o.type === "mazeWall") {
                            continue;
                        }
                        if (o.master.isDominator || o.master.isArenaCloser || o.master.label === "Base Protector") {
                            if (!killers.includes(o.master)) {
                                killers.push(o.master);
                            }
                        }
                        if (o.master.settings.acceptsScore) {
                            if (o.master.type === "tank" || o.master.type === "miniboss") {
                                notJustFood = true;
                            }
                            o.master.skill.score += jackpot;
                            if (!killers.includes(o.master)) {
                                killers.push(o.master);
                            }
                        } else if (o.settings.acceptsScore) {
                            o.skill.score += jackpot;
                        }
                        killTools.push(o);
                    }
                    // Now process that information
                    let killText = notJustFood ? "" : "You have been killed by ",
                        giveKillMessage = this.settings.givesKillMessage;
                    for (let i = 0, l = killers.length; i < l; i++) {
                        let o = killers[i];
                        if (o.onKill) {
                            o.onKill(o, this);
                        }
                        this.killCount.killers.push(o.index);
                        if (this.type === "tank") {
                            if (killers.length > 1) {
                                o.killCount.assists++;
                                if (!o.teamwork) o.rewardManager(-1, "teamwork");
                            } else {
                                o.killCount.solo++;
                            }
                            o.rewardManager(0, 1);
                        } else if (this.type === "miniboss") {
                            o.killCount.bosses++;
                            o.rewardManager(2, 1);
                        } else if (this.type === "food") {
                            o.rewardManager(3, 1);
                        } else if (this.type === "crasher") {
                            o.rewardManager(8, 1);
                        }
                    }
                    // Understand who killed us, but only if it wasn't a minor NPC
                    if (notJustFood) {
                        for (let i = 0, l = killers.length; i < l; i++) {
                            let o = killers[i];
                            if (o.master.type !== "food" && o.master.type !== "crasher") {
                                killText += o.name === "" ? killText === "" ? "An unnamed player" : "An unnamed player" : o.name;
                                killText += " and ";
                            }
                            if (giveKillMessage) {
                                o.sendMessage("You" + (killers.length > 1 ? " assist " : " ") + "killed " + name + ".");
                            }
                        }
                        killText = killText.slice(0, -4);
                        killText += "killed you with ";
                    }
                    // If we generally broadcast something when we die, do so
                    if (this.settings.broadcastMessage) {
                        sockets.broadcast(this.settings.broadcastMessage);
                        global.playDeathSound(true); //RAHHH
                    }
                    let toAdd = "";
                    for (let i = 0, l = killers.length; i < l; i++) {
                        let o = killers[i];
                        if (o.label.includes("Collision")) {
                            toAdd = "a Collision and ";
                        } else {
                            toAdd += util.addArticle(o.label) + " and ";
                        }
                    }
                    killText += toAdd;
                    killText = killText.slice(0, -5);
                    if (this.killedByK) {
                        killText = "You killed yourself";
                    } else if (this.killedByWalls) {
                        killText = "You got stuck in the walls";
                    } else if (killText === "You have been kille") {
                        killText = "You have died a stupid death";
                    }
                    // If we're really us, just send the message
                    if (!this.underControl) {
                        this.sendMessage(killText + ".");
                    }
                    // Usurp message (Doesn't happen in ranked battle)
                    if (this.id === room.topPlayerID && !c.RANKED_BATTLE) {
                        global.playDeathSound(true);
                        let usurptText = this.name || "The leader";
                        if (notJustFood) {
                            usurptText += " has been usurped by";
                            for (let i = 0, l = killers.length; i < l; i++) {
                                let o = killers[i];
                                o.rewardManager(-1, "usurper");
                                if (o.type !== "food") {
                                    usurptText += " ";
                                    usurptText += o.name || "An unnamed player";
                                    usurptText += " and";
                                }
                            }
                            usurptText = usurptText.slice(0, -4);
                            usurptText += "!";
                        } else {
                            if (this.killedByWalls) {
                                usurptText += " went to the backrooms.";
                            } else if (killers[0] != null) {
                                if (killers[0].isArenaCloser) {
                                    usurptText += ` suffered by the hands of ${util.addArticle(killers[0].label)}.`;
                                } else if (killers[0].label.includes("Base Protector")) {
                                    usurptText += " strayed too close to a Base Protector.";
                                } else {
                                    usurptText += ` fought ${util.addArticle(killers[0].label)}, and the ${killers[0].label} won.`;
                                }
                            } else if (this.killedByK) {
                                usurptText += " took the easy way out.";
                            } else if (this.isBot) {
                                usurptText += " was slaughtered by server code.";
                            } else if (c.serverName == "Bounce") {
                                usurptText += " fell off this plane of existence.";
                            } else {
                                usurptText += " suffered an unknown fate.";
                            }
                        }
                        sockets.broadcast(usurptText);
                    }
                    newLogs.death.stop();
                    return true;
                }
            }
            newLogs.death.stop();
            return false;
        }
        protect() {
            entitiesToAvoid.push(this);
            this.isProtected = true;
        }
        sendMessage(message) { }
        rewardManager(id, amount) { }
        kill() {
            this.godmode = false;
            this.invuln = false;
            this.damageReceived = this.health.max * 2;
            this.health.amount = -1;
        }
        destroy() {
            if (this.hasDestroyed) {
                return;
            }
            this.hasDestroyed = true;
            newLogs.destroy.start();
            // Remove us from protected entities
            if (this.isProtected) {
                //entitiesToAvoid = entitiesToAvoid.filter(child => child.id !== this.id);
                //util.remove(entitiesToAvoid, entitiesToAvoid.indexOf(this));
                util.removeID(entitiesToAvoid, this.id);
            }
            // Remove us from the view of the players
            for (let v of views) {
                v.remove(this);
            }
            // Remove us from our children
            if (this.parent != null) {
                //util.remove(this.parent.children, this.parent.children.indexOf(this));
                //this.parent.children = this.parent.children.filter(child => child.id !== this.id);
                if(this.parent.childrenMap) this.parent.childrenMap.delete(this.id)
                util.removeID(this.parent.children, this.id);
            }
            if (this.master != null) {
                if (this.master.childrenMap) this.master.childrenMap.delete(this.id)
                util.removeID(this.master.children, this.id);
            }
            // NEDS WORK: remove our children
            /*for (let i = 0, l = entities.length; i < l; i ++) {
                let instance = entities[i];
                if (instance.source.id === this.id) {
                    if (instance.settings.persistsAfterDeath) {
                        instance.source = instance;
                        if (instance.settings.persistsAfterDeath === 'always') {
                            continue;
                        }
                    } else {
                        instance.kill();
                    }
                }
                if (instance.parent && instance.parent.id === this.id) {
                    instance.parent = null;
                }
                if (instance.master.id === this.id) {
                    instance.kill();
                    instance.master = instance;
                }
            }*/
            for (let [key, child] of this.childrenMap) {
                this.childrenMap.delete(key)
                child.parent = null
                child.source = child
                if (!child.settings.persistsAfterDeath) {
                    child.destroy()
                }
            };
            /*this.childrenMap.forEach(instance => {
                if (instance.source.id === this.id) {
                    if (instance.settings.persistsAfterDeath) {
                        instance.source = instance;
                        if (instance.settings.persistsAfterDeath === 'always') {
                            return;
                        }
                        if (this.source == this) {
                            instance.kill();
                            this.childrenMap.delete(instance.id);
                        }
                    } else {
                        this.childrenMap.delete(instance.id);
                        instance.kill();
                    }
                }
                if (instance.parent && instance.parent.id === this.id) {
                    instance.parent = null;
                }
                if (instance.master.id === this.id) {
                    this.childrenMap.delete(instance.id);
                    instance.kill();
                    instance.master = instance;
                }
            });*/

            if (this.isGuided && this.master.altCameraSource) {
                this.master.altCameraSource = false
            }

            this.removeFromGrid();
            this.isGhost = true;
            newLogs.destroy.stop();
            for (let turret of this.turrets) {
                turret.destroy();
            }
            // Evolve stuff
            if (this.evolutionTimeout) {
                clearTimeout(this.evolutionTimeout)
            }
            // Explosions, phases and whatnot
            if (this.onDead != null && !this.hasDoneOnDead) {
                this.hasDoneOnDead = true;
                this.onDead();
            }
            // Second function so onDead isn't overwritten by specific gamemode features
            if (this.modeDead != null && !this.hasDoneModeDead) {
                this.hasDoneModeDead = true;
                this.modeDead();
            }
            //entities.delete(this.id);
            this.isGhost = true;
        }
        isDead() {
            return this.health.amount <= 0 || this.isGhost;
        }
        isAlive() {
            return /*this != null && */ this.health.amount > 0 && !this.isGhost;
        }
        toggleRainbow() {
            this.rainbow = !this.rainbow;
            if (this.rainbow) this.intervalID = setInterval(this.rainbowLoop, this.rainbowSpeed);
            else clearInterval(this.intervalID);
        }
        rainbowLoop() {
            if (this.color < 100 || isNaN(this.color)) this.color = 100;
            this.color = (this.color - 100 + 1) % 86 + 100;
            if (this.multibox.enabled)
                for (let o of this.multibox.controlledTanks)
                    if (o.isAlive()) o.color = this.color;
        }
        toggleMultibox() {
            this.multibox.intervalID = setInterval(this.multiboxLoop, 500);
        }
        multiboxLoop() {
            this.settings.hitsOwnType = "never";
            for (let controlledBody of this.multibox.controlledTanks)
                if (controlledBody.isAlive()) {
                    controlledBody.autoOverride = this.autoOverride;
                    controlledBody.passive = this.passive;
                    controlledBody.godmode = this.godmode;
                    entities.forEach(o => {
                        if (o.master.id === controlledBody.id && o.id !== controlledBody.id) {
                            o.passive = controlledBody.passive;
                            o.diesToTeamBase = !controlledBody.godmode;
                        }
                    });
                    controlledBody.skill.set(this.skill.raw);
                    controlledBody.refreshBodyAttributes();
                    if (controlledBody.skill.score < 59214) {
                        controlledBody.skill.score = this.skill.score;
                        controlledBody.skill.level = this.skill.level;
                    }
                    if (controlledBody.tank !== this.tank) controlledBody.upgradeTank(this.tank);
                    controlledBody.tank = this.tank;
                    controlledBody.FOV = .1;
                    controlledBody.refreshFOV();
                    if (room.gameMode === "tdm") controlledBody.team = this.team;
                    else controlledBody.team = this.team = -9;
                    controlledBody.color = this.color;
                    controlledBody.settings.leaderboardable = false;
                    controlledBody.layer = this.layer - .5;
                    controlledBody.SIZE = this.SIZE;
                    controlledBody.nameColor = this.nameColor;
                    controlledBody.alpha = this.alpha;
                    controlledBody.ALPHA = this.ALPHA;
                }

        }
        relinquish(player) {
            if (player.body.isMothership) {
                player.body.nameColor = ["#00B0E1", "#F04F54", "#00E06C", "#BE7FF5", "#FFEB8E", "#F37C20", "#E85DDF", "#8EFFFB"][player.team - 1];
                player.body.controllers = [new ioTypes.nearestDifferentMaster(player.body), new ioTypes.mapTargetToGoal(player.body), new ioTypes.roamWhenIdle(player.body)];
                player.body.name = "Mothership";
            } else {
                player.body.controllers = [new ioTypes.nearestDifferentMaster(player.body), new ioTypes.spinWhileIdle(player.body)];
                player.body.nameColor = "#FFFFFF";
                if (player.body.label === "Trapper Dominator") {
                    player.body.addController(new ioTypes.alwaysFire(player.body));
                    player.body.facingType = "autospin";
                }
                player.body.name = "";
            }
            player.body.underControl = false;
            player.body.autoOverride = false;
            player.body.sendMessage = (content, color=0) => { this.talk("m", content, color) };
            player.body.rewardManager = (id, amount) => { };
            let fakeBody = new Entity({
                x: player.body.x,
                y: player.body.y
            });
            fakeBody.passive = true;
            fakeBody.underControl = true;
            player.body = fakeBody;
            player.body.kill();
        }
        runAnimations(gun) {
            let onShoot = gun.onShoot;
            if (gun.onShoot && gun.onShoot.animation) {
                const frames = gun.onShoot.frames;
                for (let i = 1; i <= frames; i++) setTimeout(() => {
                    if (gun.body.health.amount <= 0) {
                        return;
                    }
                    if (gun.onShoot.end && i === frames) {
                        gun.body.master.upgrades = [];
                    }
                    const id = `${gun.onShoot.transformExport}${gun.onShoot.end ? frames - i : i}`;
                    try {
                        gun.body.master.define(Class[id]);
                    } catch (e) {
                        console.log(id);
                    }
                }, 20 * i);
                return;
            }

            switch (onShoot) {
                case "log":
                    console.log("LOG");
                    break;
                case "hitScan":
                case "hitScan1":
                case "hitScan2":
                case "hitScan3": {
                    if (this.master.health.amount < 0) break;
                    let save = {
                        x: this.master.x,
                        y: this.master.y,
                        angle: this.master.facing + gun.angle
                    };
                    let s = this.size * gun.width * gun.settings2.size;
                    let target = {
                        x: save.x + this.control.target.x,
                        y: save.y + this.control.target.y
                    };
                    let amount = util.getDistance(target, save) / s | 0;
                    let explode = e => {
                        e.onDead = () => {
                            let o = new Entity(e, this);
                            o.accel.x = 3 * Math.cos(save.angle);
                            o.accel.y = 3 * Math.sin(save.angle);
                            o.color = this.master.color;
                            o.define(Class.hitScanExplosion);
                            // Pass the gun attributes
                            o.define({
                                BODY: gun.interpret(gun.settings3),
                                SKILL: gun.getSkillRaw(),
                                SIZE: (this.size * gun.width * gun.settings3.size) / 2,
                                LABEL: this.label + (gun.label ? " " + gun.label : "") + " " + o.label
                            });
                            o.refreshBodyAttributes();
                            o.life();
                            o.source = this;
                        }
                    };
                    let branchAlt = 0;
                    let branchLength = 0;
                    let branch = (e, a, b = false, g = 0, z = amount) => {
                        if (!b) branchAlt++;
                        let total = (z / 5 | 0) || 2;
                        let dir = (a ? Math.PI / 2 : -Math.PI / 2) + g;
                        for (let i = 0; i < total; i++) setTimeout(() => {
                            let ss = s * 1.5;
                            let x = e.x + (ss * Math.cos(save.angle + dir)) * i;
                            let y = e.y + (ss * Math.sin(save.angle + dir)) * i;
                            let o = new Entity({
                                x,
                                y
                            }, this);
                            o.facing = Math.atan2(target.y - y, target.x - x) + dir;
                            o.color = this.master.color;
                            o.define(Class.hitScanBullet);
                            // Pass the gun attributes
                            o.define({
                                BODY: gun.interpret(gun.settings3),
                                SKILL: gun.getSkillRaw(),
                                SIZE: (this.size * gun.width * gun.settings2.size) / 2,
                                LABEL: this.label + (gun.label ? " " + gun.label : "") + " " + o.label
                            });
                            o.refreshBodyAttributes();
                            o.life();
                            o.source = this;
                            if (i === total - 1) {
                                if (branchLength < 3) {
                                    branchLength++;
                                    branch(o, a, true, dir + g, total);
                                } else branchLength = 0;
                            }
                        }, (500 / amount) * i);
                    };
                    const hitScanLevel = +onShoot.split("hitScan").pop();
                    for (let i = 0; i < amount; i++) {
                        setTimeout(() => {
                            if (this.master.health.amount < 0) return;
                            let x = save.x + (s * Math.cos(save.angle)) * i;
                            let y = save.y + (s * Math.sin(save.angle)) * i;
                            let e = new Entity({
                                x: x,
                                y: y
                            }, this);
                            e.facing = Math.atan2(target.y - y, target.x - x);
                            e.color = this.master.color;
                            e.define(Class.hitScanBullet);
                            // Pass the gun attributes
                            e.define({
                                BODY: gun.interpret(gun.settings2),
                                SKILL: gun.getSkillRaw(),
                                SIZE: (this.size * gun.width * gun.settings2.size) / 2,
                                LABEL: this.label + (gun.label ? " " + gun.label : "") + " " + e.label
                            });
                            e.refreshBodyAttributes();
                            e.life();
                            e.source = this;
                            switch (hitScanLevel) {
                                case 1: {
                                    if (i % 5 === 0) branch(e, branchAlt % 2 === 0);
                                }
                                    break;
                                case 2: { // Superlaser
                                    if (i === amount - 1) explode(e);
                                }
                                    break;
                                case 3: { // Death Star
                                    if (i % 3 === 0) explode(e);
                                }
                                    break;
                            }
                        }, 10 * i);
                    }
                }
                    break;
                case "revo":
                    if (this.isAlive()) this.define(Class.baseThrowerFire);
                    break;
                case "mei":
                    if (this.isAlive()) this.define(Class.meiFire);
                    break;
                case "hand":
                case "hand2":
                case "hand3":
                case "hand4": {
                    let increment = onShoot === "hand2" ? 20 : onShoot === "hand3" ? 40 : onShoot === "hand4" ? 60 : 0,
                        tank = this.label === "Auto-Glove" ? "autoHandBasic" : "handBasic";
                    for (let i = 1; i < 21; i++) setTimeout(() => {
                        if (this.isAlive()) this.define(Class[`${tank}${i + increment}`]);
                    }, this.skill.rld * 20 * i); // 9.5
                }
                    break;
                case "hand5":
                    this.upgrades = [];
                    if (this.isAlive()) this.define(this.label === "Auto-Glove" ? Class.autoHandBasic0 : Class.handBasic0);
                    break;
                case "oxy":
                    if (this.isAlive()) this.define(Class.greenGuardianLauncher);
                    break;
                case "oxy2":
                    if (this.isAlive()) this.define(Class.greenMiniGuardianLauncher);
                    break;
                case "hybranger":
                case "hybranger2":
                    entities.forEach(o => {
                        if (o.master.id === this.id && o.type === "drone") o.kill();
                    });
                    for (let i = 1; i < 32; i++) setTimeout(() => {
                        if (this.isAlive()) this.define(Class[`hybranger${onShoot === "hybranger" ? i : (i === 31 ? 0 : i + 31)}`]);
                    }, 14 * i);
                    break;
                case "shape":
                case "shape2":
                    entities.forEach(o => {
                        if (o.master.id === this.id && o.type === "drone") o.kill();
                    });
                    for (let i = 1; i < 32; i++) setTimeout(() => {
                        if (this.isAlive()) this.define(Class[`shapeChange${onShoot === "shape" ? i : 31 - i}`]);
                    }, 14 * i);
                    break;
                case "surge":
                case "surge2":
                    for (let i = 1; i < 21; i++) setTimeout(() => {
                        if (this.isAlive()) this.define(Class[`sniperEMP${onShoot === "surge" ? i : 20 + i}`]);
                    }, this.skill.rld * (onShoot === "surge" ? 180 : 60) * i);
                    break;
                case "surge3":
                    if (this.isAlive()) this.define(Class.sniperEMP0);
                    break;
                default:
                    util.warn("Unknown ON_SHOOT value: " + onShoot + "!");
                    onShoot = null;
            };
        }
    }

    const logs = (() => {
        const logger = (() => {
            const set = obj => {
                obj.time = util.time();
            };
            const mark = obj => {
                obj.data.push(util.time() - obj.time);
            };
            const record = obj => {
                let o = util.averageArray(obj.data);
                obj.data = [];
                return o;
            };
            const sum = obj => {
                let o = util.sumArray(obj.data);
                obj.data = [];
                return o;
            };
            const tally = obj => {
                obj.count++;
            };
            const count = obj => {
                let o = obj.count;
                obj.count = 0;
                return o;
            };
            return () => {
                let internal = {
                    data: [],
                    time: util.time(),
                    count: 0
                };
                return {
                    set: () => set(internal),
                    mark: () => mark(internal),
                    record: () => record(internal),
                    sum: () => sum(internal),
                    count: () => count(internal),
                    tally: () => tally(internal)
                };
            };
        })();
        return {
            entities: logger(),
            collide: logger(),
            network: logger(),
            minimap: logger(),
            //misc2: logger(),
            //misc3: logger(),
            physics: logger(),
            life: logger(),
            selfie: logger(),
            master: logger(),
            activation: logger(),
            loops: logger()
        };
    })();

    const newLogs = (function () {
        class Log {
            constructor(name) {
                this.name = name;
                this.startAt = 0;
                this.time = 0;
                this.totalTime = 0;
                this.count = 0;
            }
            start() {
                this.startAt = performance.now();
            }
            stop() {
                this.time += performance.now() - this.startAt;
                this.totalTime += this.time;
                this.tally();
            }
            get average() {
                return (this.totalTime == 0 || this.count == 0) ? 0 : this.totalTime / this.count;
            }
            tally() {
                this.count++;
                if (this.count >= 100_000) {
                    this.count = 0;
                    this.totalTime = 0;
                }
            }
            reset() {
                this.startAt = this.time = 0;
            }
        }
        const output = {
            // GAME TICK
            collision: new Log("Collision"),
            queryForCollisionPairs: new Log("QuadTree (queryForCollisionPairs)"),
            entities: new Log("Entities"),
            // Entity Functions
            location: new Log("Entity.prototype.location()"),
            death: new Log("Entity.prototype.death()"),
            life: new Log("Entity.prototype.life()"),
            destroy: new Log("Entity.prototype.destroy()"),
            activation: new Log("Activation"),
            controllers: new Log("AI and Controllers"),
            moveFace: new Log("Move and Face"),
            physics: new Log("Physics"),
            camera: new Log("Selfie snap :D"),
            buildList: new Log("BuildList"),
            targeting: new Log("Targeting"),
            aspects: new Log("Guns"),
            // Other Functions
            broadcast: new Log("Minimaps & Leaderboards"),
            network: new Log("Socket bs"),
        };
        return output;
    })();

    const sockets = (() => {
        const protocol = require("./lib/fasttalk");
        const bans = [];
        const backlog = [];
        let lastConnection = Date.now() - 501;
        class BacklogData {
            constructor(id, ip) {
                this.id = id;
                this.ip = ip;
                backlog.push(this);
            }
        }
        let id = 0;
        function flatten(data) {
            let output = [data.type]; // We will remove the first entry in the persepective method
            if (data.type & 0x01) {
                output.push(+data.facing.toFixed(2), data.layer);
            } else {
                const stuff = [data.id, 0, data.index, (data.x + .5) | 0, (data.y + .5) | 0, /*(data.vx + .5) | 0, (data.vy + .5) | 0,*/ data.size + .5 | 0, +data.facing.toFixed(2)];
                if (data.twiggle) {
                    stuff[1] += 1;
                }
                if (data.layer !== 0) {
                    stuff[1] += 2;
                    stuff.push(data.layer);
                }
                stuff.push(data.color ?? 0);
                if (data.health < .975) {
                    stuff[1] += 4;
                    stuff.push(Math.ceil(255 * data.health));
                }
                if (data.shield < .975) {
                    stuff[1] += 8;
                    stuff.push(Math.ceil(255 * data.shield));
                }
                if (data.alpha < .975) {
                    stuff[1] += 16;
                    stuff.push(Math.ceil(255 * data.alpha));
                }
                if (data.seeInvisible) {
                    stuff[1] += 32;
                }
                if (data.nameColor !== "#FFFFFF") {
                    stuff[1] += 64;
                    stuff.push(data.nameColor);
                }
                if (data.label) {
                    stuff[1] += 128
                    stuff.push(data.label)
                }
                if (data.sizeRatio[0] !== 1) {
                    stuff[1] += 256;
                    stuff.push(data.sizeRatio[0]);
                }
                if (data.sizeRatio[1] !== 1) {
                    stuff[1] += 512;
                    stuff.push(data.sizeRatio[1]);
                }
                output.push(...stuff);
                if (data.type & 0x04) {
                    output.push(data.name || "", data.score || 0, JSON.stringify(data.messages) || "[]");
                }
            }
            // Add the gun data to the array
            let gundata = [data.guns.length];
            for (let i = 0, l = data.guns.length; i < l; i++) {
                gundata.push((data.guns[i].time + .5) | 0, (data.guns[i].power + .5) | 0);
            }
            output.push(...gundata);
            // For each turret, add their own output
            let turdata = [data.turrets.length];
            for (let i = 0, l = data.turrets.length; i < l; i++) {
                turdata.push(...flatten(data.turrets[i]));
            }
            // Push all that to the array
            output.push(...turdata);
            // Return it
            return output;
        }

        function perspective(e, player, data) {
            if (player.body != null && player.body.id === e.master.id) {
                data = data.slice();
                if (player.command.autospin) {
                    if (data[2] % 2 === 0) {
                        data[2] += 1;
                    }
                }
                if (room.gameMode === "ffa" && player.body.color === "FFA_RED") data[(data[2] & 2) ? 9 : 8] = (player.teamColor ?? 0);
            }
            return data;
        }

        const checkInView = (camera, obj) => Math.abs(obj.x - camera.x) < camera.fov * .6 + 1.5 * (obj.size * (obj.width || 1)) + 100 && Math.abs(obj.y - camera.y) < camera.fov * .6 * .5625 + 1.5 * (obj.size * (obj.height || 1)) + 100;
        const traffic = socket => {
            let strikes = 0;
            return () => {
                if (util.time() - socket.status.lastHeartbeat > c.maxHeartbeatInterval) {
                    socket.error("traffic evaluation", "Heartbeat lost", true);
                    return 0;
                }
                if (socket.status.requests > 50) strikes++;
                else strikes = 0;
                if (strikes > 3) {
                    socket.error("traffic evaluation", "Socket traffic volume violation", true);
                    return 0;
                }
                socket.status.requests = 0;
            };
        };
        function validateHeaders(request) {
            let valid = ["localhost", "woomy-site.glitch.me", "woomy-api.glitch.me", "woomy-api-dev.glitch.me", "woomy.app", ".rivet.game"];
            let has = [0, 0];
            if (request.headers.origin) {
                for (let ip of valid) {
                    if (request.headers.origin.includes(ip)) {
                        has[0]++;
                    }
                }
            }
            if (request.headers["user-agent"]) {
                for (let agent of ["Mozilla", "AppleWebKit", "Chrome", "Safari"]) {
                    if (request.headers["user-agent"].includes(agent)) {
                        has[1]++;
                    }
                }
            }
            return !(has[0] !== 1 || has[1] === 0);
        }
        const generateEvalPacket = require("./lib/generateEvalCode.js");
        api.apiEvent.on("badIp", (data) => {
            let socket = clients.find(client => client.ip === data.data.ip)

            if (socket.betaData.permissions > 1) {
                return;
            }
            
            if (!socket) {
                util.warn(`Tried to kick ${socket?.ip} for bad ip but the socket could not be found`)
                return
            }
            util.warn("Bad IP connection attempt terminated")
            socket.lastWords("P", `Your ip has been banned. Reason: "${data.data.reason}". `);
        })
        class SocketUser {
            constructor(socket, request) {
                util.log("New socket initiated!");
                this.id = id++;
                this._socket = serverSocket();
                this._request = request;
                this.sentPackets = 0
                this.receivedPackets = 0
                this.camera = {
                    x: undefined,
                    y: undefined,
                    vx: 0,
                    vy: 0,
                    lastUpdate: util.time(),
                    lastDowndate: undefined,
                    fov: 2000
                };
                this.animationsToDo = new Map();
                this.betaData = {
                    permissions: 0,
                    nameColor: "#FFFFFF",
                    discordID: -1,
                    username: "",
                    globalName: "",
                };
                this.player = {
                    camera: {},
                    id: this.id
                };
                this.status = {
                    verified: false,
                    receiving: 0,
                    deceased: true,
                    requests: 0,
                    hasSpawned: false,
                    needsFullMap: true,
                    needsFullLeaderboard: true,
                    needsNewBroadcast: true,
                    lastHeartbeat: util.time(),
                    previousScore: 0
                };
                this._socket.binaryType = "arraybuffer";
                this._socket.on("message", message => this.incoming(message));
                this._socket.on("close", () => {
                    if ("loops" in this) {
                        this.loops.terminate();
                    }
                    this.close();
                });
                this._socket.on("error", e => {
                    util.error("" + e);
                    if ("logDisconnect" in global) {
                        global.logDisconnect(e);
                    }
                    this._socket.terminate();
                    this.close();
                });
                /*if (!validateHeaders(request)) {
                    this.lastWords("P", "Connection too unstable to be verified.");
                    util.warn("User tried to connect to the game from an invalid client!");
                    return;
                }
                // Keys
                try {
                    let url = (this._request._parsedUrl?.query || this._request.url.split("/?")[1]);
                    this.IDKeys = Object.fromEntries(url.split("&").map(entry => (entry = entry.split("="), [entry[0], Number(entry[1])])));
                    if (JSON.stringify(Object.keys(this.IDKeys)) !== '["a","b","c","d","e"]') {
                        this.lastWords("P", "Invalid Identification set!");
                        util.warn("Invalid identification set! (Keys)");
                        return;
                    }
                    if (Object.values(this.IDKeys).some(value => value !== Math.round(Math.min(Math.max(value, 1000000), 10000000)))) {
                        this.lastWords("P", "Invalid Identification set!");
                        util.warn("Invalid identification set! (Values) " + Object.values(this.IDKeys));
                        return;
                    }
                    if (clients.find(client => JSON.stringify(client.IDKeys) === JSON.stringify(this.IDKeys))) {
                        this.lastWords("P", "Invalid Identification set!");
                        util.warn("Invalid identification set! (Duplicates)");
                        return;
                    }
                } catch (error) {
                    util.warn(error.stack);
                    socket.terminate();
                    return;
                }*/
                this.ip = "127.0.0.1"
                /*try {
                    this.ip = request.headers["x-forwarded-for"] || request.connection.remoteAddress;
                    if (!this.ip) throw new Error("No IP address found!");
                    if (this.ip.startsWith("::ffff:")) this.ip = this.ip.slice(7);
                } catch (e) {
                    this.lastWords("P", "Invalid IP, connection terminated.");
                    util.warn("Invalid IP, connection terminated.\n" + e);
                    return;
                }*/

                /*if (Date.now() - lastConnection < 500) {
                    this.talk("P", "Connection rate limit reached, please try again.");
                    util.warn("Rate limit triggered!");
                    socket.terminate();
                    return;
                }*/
                lastConnection = Date.now();/*
                try {
                    fetch("http://isproxy.glitch.me/lookup?ping=yes&ip=" + this.ip).then(response => response.json()).then(json => {
                        if (json.isBanned) {
                            this.talk("P", "VPN/Proxy detected, please disable it and try rejoining.");
                            console.log("User disconnected due to VPN/Proxy!");
                            socket.terminate();
                        }
                    });
                } catch(error) {
                    util.warn("Unable to fetch from proxyDB!");
                }*/
                api.apiConnection.talk({
                    type: "checkIp",
                    data: {
                        ip: this.ip
                    }
                })

                /*let ban = bans.find(instance => instance.ip === this.ip);
                if (ban) {
                    this.lastWords("P", "You have been banned from the server. Reason: " + ban.reason);
                    util.warn("A socket was terminated before verification due to being banned!");
                    return;
                }
                const sameIP = clients.filter(client => client.ip === this.ip).length;
                if (sameIP >= c.tabLimit) {
                    this.lastWords("P", "Too many connections from this IP have been detected. Please close some tabs and try again.");
                    util.warn("A socket was terminated before verification due to having too many connections with the same IP open!");
                    return;
                }*/
                this.nextAllowedRespawnData = 0;
                this.loops = (() => {
                    let nextUpdateCall = null,
                        trafficMonitoring = setInterval(() => traffic(this), 1500);
                    return {
                        setUpdate: timeout => {
                            nextUpdateCall = timeout;
                        },
                        cancelUpdate: () => {
                            clearTimeout(nextUpdateCall);
                        },
                        terminate: () => {
                            clearTimeout(nextUpdateCall);
                            clearTimeout(trafficMonitoring);
                        }
                    };
                })();
                this.makeView();
                this.spawnCount = 0;
                this.name = undefined;
                this.update = time => {
                    this.loops.cancelUpdate();
                    this.loops.setUpdate(setTimeout(() => {
                        this.view.gazeUpon();
                    }, time));
                };
                this.inactivityTimeout = null;
                this.beginTimeout = () => {
                    this.inactivityTimeout = setTimeout(() => {
                        this.talk("P", "You were disconnected for inactivity.");
                        this.kick("Kicked for inactivity!");
                    }, (c.INACTIVITY_TIMEOUT || 360) * 1000);
                };
                this.endTimeout = () => clearTimeout(this.inactivityTimeout);
                this.backlogData = new BacklogData(this.id, this.ip);
                //this.runEvalPacket();
                this.animationsInterval = setInterval(this.animationsUpdate.bind(this), 1000 / 5);// 5 fps animations
                clients.push(this);
            }
            animationsUpdate() {
                if (this.animationsToDo.size === 0) {
                    return;
                }
                let packet = ["am", this.animationsToDo.size];
                this.animationsToDo.forEach((value, key) => {
                    packet.push(key, value.length, ...value);
                });
                this.animationsToDo.clear();
                this.talk(...packet);
            }
            runEvalPacket() {
                this.sendEvalPacket().then(isGood => {
                    if (!isGood) {
                        this.lastEvalPacketEnded = Date.now();
                        //this.kick("You failed the vibe check"/*"Integer Challenge Failed"*/);
                    } else {
                        this.lastEvalPacketEnded = Date.now();
                    }
                });
            }
            sendEvalPacket() {
                return new Promise((resolve, reject) => {
                    const challenge = generateEvalPacket(this.IDKeys);
                    this.talk("I_solemnly_swear_I_wont_exploit", LZString.compressToEncodedURIComponent(challenge.code));
                    let t = 7, i = setInterval(() => {
                        if (util.time() - this.status.lastHeartbeat < 6000) { // Don't count tabbed out
                            if (t-- <= 0) {
                                clearInterval(t);
                                resolve(false);
                            }
                        }
                    }, 1000);
                    this.clearEvalInterval = (response) => {
                        let checksPassed = 0
                        let requiredChecks = 2
                        /*
                            0 = eval
                            1 = _sent (receive for server)
                            2 = _receive (sent for server)
                        */

                        // Beat eval
                        if (response[0] === challenge.result) {
                            checksPassed++
                        }

                        //console.log(response[2], ((_random() * 10000) | 0))
                        //console.log(response[2] - ((_random() * 10000) | 0))

                        // Beat sent/receive
                        let buffer = 50
                        response[2] -= 80085
                        response[1] -= 80085
                        if (
                            response[2] > this.sentPackets - buffer && response[2] < this.sentPackets + buffer &&
                            response[1] > this.receivedPackets - buffer && response[1] < this.receivedPackets + buffer
                        ) {
                            //console.log("did packets")
                            checksPassed++
                        }
                        //console.log(response[4], this.sentPackets)
                        //console.log(response[3], this.receivedPackets)


                        // Did they pass the vibe check?
                        if (checksPassed < requiredChecks) {
                            resolve(false);
                            console.log(this.ip, `failed the eval packet (${checksPassed}/${requiredChecks})`)
                        } else {
                            clearInterval(i);
                            resolve(true);
                        }
                        delete this.clearEvalInterval;
                    }
                });
            }
            get readableID() {
                return `Socket (${this.id}) [${this.name || "Unnamed Player"}]: `;
            }
            get open() {
                return this._socket.readyState === this._socket.OPEN;
            }
            talk(...message) {
                /*if (this.open) {
                    (true) ? this._socket.send(WASMModule.shuffle(protocol.encode(message)), {
                        binary: true
                    }) : postToWorker(message, uint8 => {
                        this._socket.send(uint8, {
                            binary: true
                        });
                    }, this.id);
                }*/
                this.sentPackets++
                if (this.open) {
                        this._socket.send((message), {
                            binary: true
                        });
                }
            }
            lastWords(...message) {
                if (this.open) {
                    this._socket.send((message), {
                        binary: true
                    }, () => {
                        setTimeout(() => {
                            this._socket.terminate();
                        }, 1000);
                    });
                }/*
                if (this.open) {
                    this._socket.send(WASMModule.shuffle(protocol.encode(message)), {
                        binary: true
                    }, () => {
                        setTimeout(() => {
                            this._socket.terminate();
                        }, 1000);
                    });
                }*/
            }
            error(type = "unknown", reason = "unspecified", report = false) {
                this.talk("P", `Something went wrong during the ${type} process: ${reason}. ${report ? "Please report this bug if it continues to occur." : ""}`);
                this.kick(reason + "!");
            }
            kick(reason = "Unspecified.") {
                util.warn(this.readableID + "has been kicked. Reason: " + reason);
                this.talk("P", "You have been kicked: " + reason)
                this.lastWords("K");
            }
            ban(reason) {
                if (this.isBanned) {
                    return;
                }
                this.isBanned = true;
                util.warn(this.readableID + "has been banned. Reason: " + reason);
                bans.push({
                    ip: this.ip,
                    reason: reason
                });
                this.talk("P", "You have been banned: " + reason)
                this.lastWords("K");
            }
            close() {
                if (this.isClosed) {
                    return;
                }

                this.isClosed = true;

                let player = this.player || {},
                    index = players.indexOf(player),
                    body = player.body;
                if (index !== -1) {
                    let below5000 = false;
                    if (body != null && body.skill.score < 5000) {
                        below5000 = true;
                    }
                    setTimeout(() => {
                        if (body != null) {
                            if (body.underControl) {
                                body.relinquish(player);
                            } else {
                                body.kill();
                            }
                        }
                    }, below5000 ? 1 : c.disconnectDeathTimeout);
                    if (this.inactivityTimeout != null) this.endTimeout();
                }
                if (global.isVPS && typeof this.rivetPlayerToken === "string") rivet.matchmaker.players.disconnected({ playerToken: this.rivetPlayerToken });
                util.info(this.readableID + "has disconnected! Players: " + (clients.length - 1).toString());
                api.apiConnection.talk({
                    type: "updatePlayerCount",
                    data: {
                        count: clients.length - 1
                    }
                })
                players = players.filter(player => player.id !== this.id);
                clients = clients.filter(client => client._socket && client._socket.readyState === 1 && client.id !== this.id);
                views = views.filter(view => view.id !== this.id);
                clearInterval(this.animationsInterval);
            }
            closeWithReason(reason) {
                this.talk("P", reason);
                this.kick(reason);
            }
            makeGUI() {
                const skilNames = ["atk", "hlt", "spd", "str", "pen", "dam", "rld", "mob", "rgn", "shi"];
                const cache = {
                    _: {},
                    get: key => {
                        if (cache._[key] == null) {
                            return null;
                        }
                        const output = cache._[key] != null && cache._[key].update && cache._[key].value;
                        cache._[key].update = false;
                        return output;
                    },
                    set: (key, value) => {
                        if (cache._[key]) {
                            let updated = false;
                            if (value instanceof Array) {
                                updated = value.length !== cache._[key].value.length || value.some((element, index) => cache._[key].value[index] !== element);
                            } else if (value !== cache._[key].value) {
                                updated = true;
                            }
                            if (!updated) {
                                return;
                            }
                        }
                        cache._[key] = {
                            update: true,
                            value: value
                        };
                    }
                };
                function getSkills(body) {
                    let val = 0;
                    val += 0x1 * body.skill.amount("atk");
                    val += 0x10 * body.skill.amount("hlt");
                    val += 0x100 * body.skill.amount("spd");
                    val += 0x1000 * body.skill.amount("str");
                    val += 0x10000 * body.skill.amount("pen");
                    val += 0x100000 * body.skill.amount("dam");
                    val += 0x1000000 * body.skill.amount("rld");
                    val += 0x10000000 * body.skill.amount("mob");
                    val += 0x100000000 * body.skill.amount("rgn");
                    val += 0x1000000000 * body.skill.amount("shi");
                    return val.toString(36);
                } 
                cache.set("time", performance.now());
                return () => {
                    let current = cache.get("time"),
                        output = [0],
                        body = this?.player?.body;
                    if (performance.now() - current > 1000) {
                        cache._ = {};
                        cache.set("time", performance.now());
                    }
                    cache.set("mspt", room.mspt);
                    if (body) {
                        cache.set("label", [body.index, this.player.teamColor != null ? this.player.teamColor : body.color, body.id]);
                        cache.set("score", body.skill.score + .5 | 0);
                        if (!body.lvlCheated && body.skill.score > 59212) body.rewardManager(-1, "wait_its_all_sandbox");
                        cache.set("points", body.skill.points);
                        cache.set("upgrades", body.upgrades.filter(up => up.level <= body.skill.level).map(up => up.index));
                        cache.set("skillNames", skilNames.map(name => [body.skill.title(name), body.skill.cap(name), body.skill.cap(name, true)]).flat());
                        cache.set("skills", getSkills(body));
                    }
                    if (current = cache.get("mspt"), current != null && current !== false) {
                        output[0] += 0x0001;
                        output.push(current);
                    }
                    if (current = cache.get("label"), current != null && current !== false) {
                        output[0] += 0x0002;
                        output.push(...current);
                    }
                    if (current = cache.get("score"), current != null && current !== false) {
                        output[0] += 0x0004;
                        output.push(current);
                    }
                    if (current = cache.get("points"), current != null && current !== false) {
                        output[0] += 0x0008;
                        output.push(current);
                    }
                    if (current = cache.get("upgrades"), current != null && current !== false) {
                        output[0] += 0x0010;
                        output.push(current.length, ...current);
                    }
                    if (current = cache.get("skillNames"), current != null && current !== false) {
                        output[0] += 0x0020;
                        output.push(...current);
                    }
                    if (current = cache.get("skills"), current != null && current !== false) {
                        output[0] += 0x0040;
                        output.push(current);
                    }
                    return output;
                }
            }
            makeView() {
                let nearby = [];
                this.view = {
                    id: this.id,
                    clear: () => nearby = [],
                    add: object => checkInView(this.camera, object) && nearby.push(object),
                    forceAdd: object => nearby.push(object),
                    remove: object => {
                        nearby = nearby.filter(entry => entry.id !== object.id);
                    },
                    check: object => checkInView(this.camera, object),
                    gazeUpon: () => {
                        newLogs.network.start();
                        let player = this.player,
                            camera = this.camera,
                            rightNow = room.lastCycle;
                        camera.lastUpdate = rightNow;
                        this.status.receiving++;
                        let fov = camera.fov;
                        if (player.body != null) {
                            // If there is a player object
                            if (player.body.isDead() && !this.status.deceased) {
                                // If the player is dead
                                this.status.deceased = true;
                                const records = player.records();
                                this.status.previousScore = records[0]
                                this.talk("F", ...records);
                                this.nextAllowedRespawnData = Date.now() + 2850;
                                if (records[0] > 300000) { // Score > 300k
                                    const totalKills = Math.round(records[2] + (records[3] / 2) + (records[4] * 2));
                                    if (totalKills >= Math.floor(records[0] / 100000)) { // Total kills >= 100k(s) aka the amount of kills is greater than or equal to your score / 100k, 1 kills per 100k
                                        sendRecordValid({
                                            name: this.name || "Unnamed",
                                            discord: this.betaData.discordID,
                                            tank: player.body.labelOverride || player.body.label,
                                            score: records[0],
                                            totalKills: totalKills,
                                            timeAlive: util.formatTime(records[1] * 1000),
                                        });
                                    }
                                    if (player.body.miscIdentifier !== "No Death Log") {
                                        util.info(trimName(player.body.name) + " has died. Final Score: " + player.body.skill.score + ". Tank Used: " + player.body.label + ". Players: " + clients.length + ".");
                                    }
                                    this.beginTimeout();
                                    player.body = null;
                                }
                            } else if (player.body.photo) {
                                camera.x = player.body.photo.cx;
                                camera.y = player.body.photo.cy;
                                camera.vx = player.body.photo.vx;
                                camera.vy = player.body.photo.vy;
                                fov = player.body.fov;
                                player.viewId = player.body.id;
                            }
                        } else {
                            fov = 1000;
                        }
                        camera.fov = fov;
                        // Look at our list of nearby entities and get their updates
                        let visible = [];
                        for (let i = 0, l = nearby.length; i < l; i++) {
                            let instance = nearby[i];
                            /*if (instance.socketUpdateKey !== socketUpdateKey) {
                                instance.socketUpdateKey = socketUpdateKey;
                                instance.takeSelfie();
                            }*/
                            if (
                                !instance.photo ||
                                (c.SANDBOX && instance.sandboxId !== this.sandboxId) ||
                                (c.RANKED_BATTLE && instance.roomId !== this.roomId) ||
                                (player.body && !player.body.seeInvisible && instance.alpha < 0.1)
                            ) continue;
                            if (instance.animation) {
                                this.animationsToDo.set(instance.id, instance.animation);
                            }
                            if (!instance.flattenedPhoto) {
                                instance.flattenedPhoto = flatten(instance.photo);
                            }
                            let output = perspective(instance, player, instance.flattenedPhoto);
                            if (output) {
                                visible.push(output);
                            }
                        }
                        let numberInView = visible.length;
                        if (player.body != null && player.body.displayText !== this.oldDisplayText) {
                            this.oldDisplayText = player.body.displayText
                            this.talk("displayText", true, player.body.displayText, player.body.displayTextColor)
                        } else if (player.body != null && !player.body.displayText && this.oldDisplayText) {
                            this.oldDisplayText = null
                            this.talk("displayText", false)
                        }
                        /*this.talk("u",
                            !!(player.body != null ? player.body.controllingSquadron : false),
                            (player.body != null ? (player.body.cameraShiftFacing != null) : false),
                            rightNow, camera.x, camera.y, fov, camera.vx, camera.vy, ...player.gui(), numberInView,
                            ...visible.flat());*/

                        // Dreadnought thingy
                        if (c.serverName.includes("Growth") && player.body != null && !player.body.hasDreadnoughted && player.body.skill.score >= 2_000_000) {
                            player.body.hasDreadnoughted = true;
                            player.body.upgrades.push({
                                class: "dreadnoughts",
                                level: 60,
                                index: Class.dreadnoughts.index,
                                tier: 4
                            });
                        }
                        // Boss Slayer Thingy
                        if (c.serverName.includes("Boss Rush") && player.body != null && !player.body.hasDreadnoughted && player.body.skill.score >= 2_000_000) {
                            player.body.hasDreadnoughted = true;
                            player.body.upgrades.push({
                                class: "legendary",
                                level: 60,
                                index: Class.legendary.index,
                                tier: 4
                            });
                        }

                        this.talk(
                            "u",
                            (player.body != null ? (player.body.cameraShiftFacing != null) : false),
                            rightNow,
                            camera.x + .5 | 0,
                            camera.y + .5 | 0,
                            fov + .5 | 0,
                            ...player.gui(),
                            numberInView,
                            ...visible.flat()
                        );
                        newLogs.network.stop();
                    }
                };
                views.push(this.view);
            }
            async incoming(message) {
                this.receivedPackets++
                /*if (!(message instanceof ArrayBuffer)) {
                    this.error("initialization", "Non-binary packet", true);
                    return 1;
                }
                if (!message.byteLength || message.byteLength > 512) {
                    this.error("dumbass", "Malformed packet", true);
                    return 1;
                }*/
                //message = WASMModule.shuffle(Array.from(new Uint8Array(message)));
                let m = (message);
                if (m == null || m === -1) {
                    this.error("initialization", "Malformed packet", true);
                    return 1;
                }
                let player = this.player,
                    body = player != null ? player.body : null,
                    isAlive = body != null && body.health.amount > 0 && !body.isGhost,
                    index = m.shift();
                switch (index) {
                    case "k": { // Verify Key
                        if (room.arenaClosed) return;
                        if (m.length !== 4) {
                            this.error("token verification", "Ill-sized token request", true);
                            return 1;
                        }
                        if (typeof m[1] !== "string") {
                            this.error("token verification", "Non-string socket id was offered: " + typeof m[2])
                        }
                        if (typeof m[2] !== "string") {
                            this.error("token verification", "Non-string rivet player id was offered: " + typeof m[2])
                        }
                        let key = m[0];
                        if (key.length > 124) {
                            this.error("token verification", "Overly-long token offered");
                            return 1;
                        }
                        if (this.status.verified) {
                            this.error("spawn", "Duplicate spawn attempt", true);
                            return 1;
                        }

                        /*if(m[0]){
                            await fetch("https://discord.com/api/v10/users/@me", {
                                headers: {
                                    Authorization: "Bearer " + m[0],
                                },
                            }).then((res) => res.json()).then((userData) => {
                                if (userData.code != undefined) {
                                    return
                                };
                            }).catch((err)=>{});
                        }*/
                        this.betaData = {
                            permissions: 3,
                            nameColor: "#000000",
                            username: "Much love <3 - Drako hyena",
                            globalName: "Developer",
                            discordID: "1"
                        }
                        
                        if (room.testingMode) {
                            this.closeWithReason("This server is currently closed to the public; no players may join.");
                            return 1;
                        }
                        if (multitabIDs.indexOf(m[1]) !== -1 && this.betaData.permissions < 1) {
                            this.closeWithReason("Please only use one tab at once!");
                            return 1;
                        }
                        if(global.isVPS) rivet.matchmaker.players.connected({ playerToken: m[2] }).catch(err => this.closeWithReason("Rivet player verification failed"));
                        this.rivetPlayerToken = m[2]
                        this.identification = m[1];
                        this.verified = true;
                        this.usingAdBlocker = m[3]
                        this.talk("w", c.RANKED_BATTLE ? "queue" : true);
                        //                      if (c.serverName.includes("Sandbox") && this.betaData.permissions === 0) this.betaData.permissions = 1; 
                        if (key) {
                            util.info("A socket was verified with the token: " + this.betaData.username || "Unknown Token" + ".");
                        }
                    } break;
                    case "j": { // Rejoin queue
                        if (this.roomId === "ready") {
                            this.roomId = null;
                        }
                    } break;
                    case "s": {// Spawn request
                        if (!this.status.deceased) {
                            this.error("spawn", "Trying to spawn while already alive", true);
                            return 1;
                        }
                        if (Date.now() < this.nextAllowedRespawnData) {
                            this.error("spawn", "Trying to respawn too early", true);
                            return 1;
                        }
                        if (m.length !== 3) {
                            this.error("spawn", "Ill-sized spawn request", true);
                            return 1;
                        }
                        this.party = +m[0];
                        if (c.SANDBOX) {
                            const room = global.sandboxRooms.find(entry => entry.id === this.party);
                            if (!room) {
                                this.party = (Math.random() * 1000000) | 0;
                            }
                            this.sandboxId = this.party;
                        }
                        let name = '';
                        if (typeof m[1] !== "string") {
                            this.error("spawn", "Non-string name provided", true);
                            return 1;
                        }
                        m[1] = m[1].split(',');
                        for (let i = 0; i < m[1].length; i++) name += String.fromCharCode(m[1][i]);
                        name = util.cleanString(name, 25);
                        let isNew = m[2];
                        if (room.arenaClosed) {
                            this.closeWithReason(`The arena is closed. You may ${isNew ? "join" : "rejoin"} once the server restarts.`);
                            return 1;
                        }
                        if (typeof name !== "string") {
                            this.error("spawn", "Non-string name provided", true);
                            return 1;
                        }
                        if (encodeURI(name).split(/%..|./).length > 25) {
                            this.error("spawn", "Overly-long name");
                            return 1;
                        }
                        if (isNew !== 0 && isNew !== 1) {
                            this.error("spawn", "Invalid isNew value", true);
                            return 1;
                        }
                        for (let text of blockedNames) {
                            if (name.toLowerCase().includes(text)) {
                                this.error("spawn", "Inappropriate name (" + trimName(name) + ")");
                                return 1;
                            }
                        }
                        this.status.deceased = false;
                        if (players.indexOf(this.player) !== -1) util.remove(players, players.indexOf(this.player));
                        if (views.indexOf(this.view) !== -1) {
                            util.remove(views, views.indexOf(this.view));
                            this.makeView();
                        }
                        this.player = this.spawn(name);
                        if (isNew) this.talk("R", room.width, room.height, JSON.stringify(c.ROOM_SETUP), JSON.stringify(util.serverStartTime), this.player.body.label, room.speed, +c.ARENA_TYPE);
                        //socket.update(0);
                        util.info(trimName(name) + (isNew ? " joined" : " rejoined") + " the game! Player ID: " + (entitiesIdLog - 1) + ". IP: "+this.ip+". Players: " + clients.length + ".");
                        api.apiConnection.talk({
                            type: "updatePlayerCount",
                            data: {
                                count: clients.length
                            }
                        })
                        /*if (this.spawnCount > 0 && this.name != undefined && trimName(name) !== this.name) {
                            this.error("spawn", "Unknown protocol error!");
                            return;
                        }*/
                        this.spawnCount += 1;
                        this.name = trimName(name);
                        if (this.inactivityTimeout != null) this.endTimeout();
                        // Namecolor
                        let body = this.player.body;
                        body.skill.score += Math.pow(this.status.previousScore, 0.7)
                        body.nameColor = this.betaData.nameColor;
                        body.messages = []
                        this.name = body.name
                        switch (this.name) {
                            case "4NAX":
                                body.nameColor = "#FF9999";
                                break;
                            case "Silvy":
                                body.nameColor = "#99F6FF";
                                break;
                            case "SkuTsu":
                                body.nameColor = "#b2f990";
                                break;
                        }
                        if (body.nameColor.toLowerCase() !== "#ffffff") body.rewardManager(-1, "i_feel_special");
                        this.view?.gazeUpon();
                    } break;
                    case "p": { // Ping packet
                        if (m.length !== 0) {
                            this.error("ping calculation", "Ill-sized ping", true);
                            return 1;
                        }
                        this.talk("p");
                        this.status.lastHeartbeat = util.time();
                    } break;
                    case "mu": // Mockup request
                        if(typeof m[0] !== "number"){
                            this.error("Mockup Request", "Non-numeric value")
                            return 1;
                        }
                        this.talk("mu", m[0], JSON.stringify(mockups.getMockup(m[0])))
                        break;
                    case "C": { // Command packet
                        if (m.length !== 3) {
                            this.error("command handling", "Ill-sized command packet", true);
                            return 1;
                        }
                        let target = {
                            x: m[0],
                            y: m[1],
                        },
                            commands = m[2]
                        // Verify data
                        if (typeof target.x !== 'number' || typeof target.y !== 'number' || isNaN(target.x) || isNaN(target.y) || typeof commands !== 'number') {
                            this.kick('Weird downlink.');
                            return 1;
                        }
                        if (commands >= 255) {
                            this.kick('Malformed command packet.');
                            return 1;
                        }
                        // Put the new target in
                        player.target = target;

                        // Process the commands
                        if (player.command != null && player.body != null && commands > -1) {
                            player.command.up = (commands & 1);
                            player.command.down = (commands & 2) >> 1;
                            player.command.left = (commands & 4) >> 2;
                            player.command.right = (commands & 8) >> 3;
                            player.command.lmb = (commands & 16) >> 4;
                            player.command.mmb = (commands & 32) >> 5;
                            player.command.rmb = (commands & 64) >> 6;
                        }
                        if (player.command != null) {
                            player.command.report = m;
                        }
                    } break;
                    case "t": { // Player toggle
                        if (m.length !== 1) {
                            this.error("control toggle", "Ill-sized toggle", true);
                            return 1;
                        }
                        let given = "",
                            tog = m[0];
                        if (typeof tog !== "number") {
                            this.error("control toggle", "Non-numeric toggle value", true);
                            return 1;
                        }
                        if (!isAlive) return;
                        switch (tog) {
                            case 0:
                                given = "autospin";
                                break;
                            case 1:
                                given = "autofire";
                                break;
                            case 2:
                                given = "override";
                                break;
                            case 3:
                                given = "reversed";
                                break;
                            default:
                                this.error("control toggle", `Unknown toggle value (${tog})`, true);
                                return 1;
                        }
                        if (player.command != null) {
                            player.command[given] = !player.command[given];
                            if (given === "reversed") given = "Target Flip"
                            if (given === 'override' && body.onOverride !== undefined) {
                                body.onOverride(body);
                            } else {
                                body.sendMessage(given.charAt(0).toUpperCase() + given.slice(1) + (player.command[given] ? ": ON" : ": OFF"));
                            }
                        }
                    } break;
                    case "U": { // Upgrade request
                        if (m.length !== 1) {
                            this.error("tank upgrade", "Ill-sized tank upgrade request", true);
                            return 1;
                        }
                        if (typeof m[0] !== "number") {
                            this.error("tank upgrade", "Non-numeric upgrade request", true);
                            return 1;
                        }
                        if (body?.isDead?.()) break;

                        let cooldown = this.betaData.permissions > 1 ? 0 : 450 * (this.usingAdBlocker ? 1: 1)
                        if(c.serverName.includes("Corrupted Tanks")){
                            cooldown *= 5
                        }
                        if ((body.lastUpgradeTime !== undefined && Date.now() - body.lastUpgradeTime < cooldown) && this.betaData.permissions < 2) {
                            break;
                        }

                        let num = m[0];
                        if (typeof num !== "number" || num < 0) {
                            this.error("tank upgrade", `Invalid tank upgrade value (${num})`, true);
                            return 1;
                        }
                        if (body != null) {
                            body.lastUpgradeTime = Date.now();
                            body.sendMessage("Upgrading...");
                            if(this.usingAdBlocker && !this.didAdBlockMessage){
                                this.didAdBlockMessage = true
                                body.sendMessage("Please disable your adblocker. Woomy is hard to maintain and it helps a lot :(".split("").join("​"), "#FF0000")
                            }
                            setTimeout(() => {
                                if (body != null) {
                                    body.upgrade(num);
                                }
                            }, cooldown);
                        }
                    } break;
                    case "x": { // Skill upgrade request
                        if (m.length !== 1) {
                            this.error("skill upgrade", "Ill-sized skill upgrade request", true);
                            return 1;
                        }
                        let num = m[0],
                            stat = "";
                        if (typeof num !== "number") {
                            this.error("skill upgrade", "Non-numeric stat upgrade value", true);
                            return 1;
                        }
                        if (!isAlive) break;
                        switch (num) {
                            case 0:
                                stat = "atk";
                                break;
                            case 1:
                                stat = "hlt";
                                break;
                            case 2:
                                stat = "spd";
                                break;
                            case 3:
                                stat = "str";
                                break;
                            case 4:
                                stat = "pen";
                                break;
                            case 5:
                                stat = "dam";
                                break;
                            case 6:
                                stat = "rld";
                                break;
                            case 7:
                                stat = "mob";
                                break;
                            case 8:
                                stat = "rgn";
                                break;
                            case 9:
                                stat = "shi";
                                break;
                            default:
                                this.error("skill upgrade", `Unknown skill upgrade value (${num})`, true);
                                return 1;
                        }
                        body.skillUp(stat);
                    } break;
                    case "z": { // Leaderboard desync report
                        if (m.length !== 0) {
                            this.error("leaderboard", "Ill-sized leaderboard desync request", true);
                            return 1;
                        }
                        this.status.needsFullLeaderboard = true;
                    } break;
                    case "l": { // Control a Dominator or Mothership (should be simplified at some point)
                        if (m.length !== 0) {
                            this.error("Dominator/Mothership control", "Ill-sized control request", true);
                            return 1;
                        }
                        if (room.gameMode !== "tdm" || !isAlive) return;
                        if (c.serverName.includes("Domination")) {
                            if (!body.underControl) {
                                let choices = [];
                                entities.forEach(o => {
                                    if (o.isDominator && o.team === player.body.team && !o.underControl) choices.push(o);
                                });
                                if (!choices.length) return player.body.sendMessage("No Dominators are available on your team to control.");
                                let dominator = choices[Math.floor(Math.random() * choices.length)],
                                    name = body.name,
                                    nameColor = body.nameColor;
                                dominator.underControl = true;
                                player.body = dominator;
                                body.controllers = [];
                                body.passive = false;
                                setTimeout(() => {
                                    if (body != null) {
                                        body.miscIdentifier = "No Death Log";
                                        body.kill();
                                    }
                                }, 5000);
                                player.body.name = name;
                                player.body.nameColor = nameColor;
                                player.body.sendMessage = (content, color=0) => this.talk("m", content, color);
                                player.body.rewardManager = (id, amount) => {
                                    this.talk("AA", id, amount);
                                }
                                player.body.controllers = [new ioTypes.listenToPlayerStatic(player.body, player)];
                                player.body.FOV = 1;
                                player.body.refreshFOV();
                                player.body.invuln = player.body.godmode = player.body.passive = false;
                                player.body.facingType = player.body.label === "Auto-Dominator" ? "autospin" : "toTarget";
                                player.body.sendMessage("Press H or reload your game to relinquish control of the Dominator.");
                                player.body.sendMessage("You are now controlling the " + room.cardinals[Math.floor(3 * player.body.y / room.height)][Math.floor(3 * player.body.x / room.height)] + " Dominator!");
                                player.body.rewardManager(-1, "i_am_the_dominator");
                            } else {
                                let loc = room.cardinals[Math.floor(3 * player.body.y / room.height)][Math.floor(3 * player.body.x / room.height)];
                                player.body.sendMessage("You have relinquished control of the " + loc + " Dominator.");
                                player.body.rewardManager(-1, "okay_this_is_boring_i_give_up");
                                player.body.FOV = .5;
                                util.info(trimName(this.name) + " has relinquished control of a Dominator. Location: " + loc + " Dominator. Players: " + clients.length + ".");
                                this.talk("F", ...player.records());
                                player.body.relinquish(player);
                            }
                        } else if (c.serverName.includes("Mothership")) {
                            if (!body.underControl) {
                                let choices = [];
                                entities.forEach(o => {
                                    if (o.isMothership && o.team === player.body.team && !o.underControl) choices.push(o);
                                });
                                if (!choices.length) return player.body.sendMessage("Your team's Mothership is unavailable for control.");
                                let mothership = choices[Math.floor(Math.random() * choices.length)],
                                    name = body.name;
                                mothership.underControl = true;
                                player.body = mothership;
                                body.controllers = [];
                                body.passive = false;
                                setTimeout(() => {
                                    if (body != null) {
                                        body.miscIdentifier = "No Death Log";
                                        body.kill();
                                    }
                                }, 1000);
                                player.body.settings.leaderboardable = false;
                                player.body.name = name;
                                player.body.nameColor = ["#00B0E1", "#F04F54", "#00E06C", "#BE7FF5", "#FFEB8E", "#F37C20", "#E85DDF", "#8EFFFB"][player.team - 1];
                                player.body.sendMessage = (content, color=0) => this.talk("m", content, color);
                                player.body.rewardManager = (id, amount) => {
                                    this.talk("AA", id, amount);
                                }
                                player.body.controllers = [new ioTypes.listenToPlayer(player.body, player)];
                                player.body.refreshFOV();
                                player.body.invuln = player.body.godmode = player.body.passive = false;
                                player.body.facingType = "toTarget";
                                player.body.skill.points = 0;
                                player.body.settings.leaderboardable = true;
                                player.body.sendMessage("Press H or reload your game to relinquish control of the Mothership.");
                                player.body.sendMessage("You are now controlling your team's Mothership!");
                                player.body.rewardManager(-1, "i_am_the_mothership");
                            } else {
                                player.body.sendMessage("You have relinquished control of your team's Mothership.");
                                player.body.rewardManager(-1, "okay_this_is_boring_i_give_up");
                                util.info(trimName(this.name) + " has relinquished control of their team's Mothership. Players: " + clients.length + ".");
                                this.talk("F", ...player.records());
                                player.body.relinquish(player);
                            }
                        }
                    } break;
                    case "L": { // Level up cheat
                        if (m.length !== 0) {
                            this.error("level up", "Ill-sized level-up request", true);
                            return 1;
                        }
                        if (body != null && !body.underControl && body.skill.level < c.SKILL_CHEAT_CAP) {
                            body.skill.score += body.skill.levelScore;
                            body.lvlCheated = true;
                            body.skill.maintain();
                            body.refreshBodyAttributes();
                        }
                    } break;
                    case "P": { // Class tree prompt
                        if (m.length !== 1) {
                            this.error("class tree prompting", "Ill-sized class tree prompt request", true);
                            return 1;
                        }
                        if (!isAlive) return;
                        if (m[0]) {
                            body.sendMessage("Press U to close the class tree.");
                            body.sendMessage("Use the arrow keys to cycle through the class tree.");
                        }
                    } break;
                    case "I_solemnly_swear_I_wont_exploit": // Eval packet response
                        if (this.clearEvalInterval) {
                            this.clearEvalInterval(m);
                        } else {
                            //this.kick("Improper packet or inactive for too long");
                        }
                        break;
                    case "da": // Server Data Stats
                        if (m.length !== 0) {
                            this.error("Server Data Stats", "Ill-sized request", true)
                            return 1
                        }
                        this.talk("da", global.serverStats.cpu, global.serverStats.mem, global.exportNames.length)
                        break;
                    case "T": { // Beta-tester level 1 and 2 keys
                        if (m.length !== 1) {
                            this.error("beta-tester level 1-2 key", "Ill-sized key request", true);
                            return 1;
                        }
                        if (typeof m[0] !== "number") {
                            this.error("beta-tester level 1-2 key", "Non-numeric key value", true);
                            return 1;
                        }
                        if (!isAlive){
                            return;
                        } else if (this.betaData.permissions === 0){
                            if(c.SANDBOX && m[0] === 2){
                                body.define(Class.genericTank);
                                body.upgradeTank(Class.basic);
                                for(let [key, value] of body.childrenMap){
                                    value.kill()
                                }
                            }
                            return
                        }
                        if (body.underControl) return body.sendMessage("You cannot use beta-tester keys while controlling a Dominator or Mothership.");
                        switch (m[0]) {
                            case 0: { // Upgrade to TESTBED
                                body.define(Class.genericTank);
                                body.define(Class.basic);
                                switch (this.betaData.permissions) {
                                    case 1: {
                                        body.upgradeTank(Class.testbed_beta);
                                    } break;
                                    case 2: {
                                        body.upgradeTank(Class.testbed_admin);
                                    } break;
                                    case 3: {
                                        body.upgradeTank(Class.testbed);
                                        body.health.amount = body.health.max;
                                        body.shield.amount = body.shield.max;
                                    } break;
                                }
                                body.sendMessage("DO NOT use OP tanks to repeatedly kill players. It will result in a permanent demotion. Press P to change to Basic and K to suicide.");
                                if (room.gameMode === "ffa") body.color = "FFA_RED";
                                else body.color = [10, 12, 11, 15, 3, 35, 36, 0][player.team - 1];
                                util.info(trimName(body.name) + " upgraded to TESTBED. Token: " + this.betaData.username || "Unknown Token");
                            } break;
                            case 1: { // Suicide
                                body.killedByK = true;
                                body.kill();
                                util.info(trimName(body.name) + " used k to suicide. Token: " + this.betaData.username || "Unknown Token");
                            } break;
                            case 2: { // Reset to Basic
                                body.define(Class.genericTank);
                                body.upgradeTank(Class.basic);
                                if (this.betaData.permissions === 3) {
                                    body.health.amount = body.health.max;
                                    body.shield.amount = body.shield.max;
                                    body.invuln = true;
                                }
                                if (room.gameMode === "ffa") body.color = "FFA_RED";
                                else body.color = [10, 12, 11, 15, 3, 35, 36, 0][player.team - 1];
                            } break;
                            case 4: { // Passive mode
                                if (room.arenaClosed) return body.sendMessage("Passive Mode is disabled when the arena is closed.");
                                body.passive = !body.passive;
                                entities.forEach(o => {
                                    if (o.master.id === body.id && o.id !== body.id) o.passive = body.passive;
                                });
                                if (body.multibox.enabled)
                                    for (let o of body.multibox.controlledTanks) {
                                        if (o != null) o.passive = body.passive;
                                        entities.forEach(r => {
                                            if (r.master.id === o.id && r.id !== o.id) r.passive = o.passive;
                                        });
                                    }
                                body.sendMessage("Passive Mode: " + (body.passive ? "ON" : "OFF"));
                            } break;
                            case 5: { // Rainbow
                                if (this.betaData.permissions < 3 && room.gameMode === "tdm") {
                                    body.sendMessage("You cannot enable rainbow in a team-based gamemode");
                                } else {
                                    body.toggleRainbow();
                                    body.sendMessage("Rainbow Mode: " + (body.rainbow ? "ON" : "OFF"));
                                }
                            } break;
                            case 7: { // Reset color
                                if (room.gameMode === "ffa") body.color = "FFA_RED";
                                else body.color = [10, 12, 11, 15, 3, 35, 36, 0][player.team - 1];
                                //body.sendMessage("Reset your body color.");
                            } break;
                            default:
                                this.error("beta-tester level 1 key", `Unknown key value (${m[0]})`, true);
                                return 1;
                        }
                    }
                        break;
                    case "B": { // Beta-tester level 3 keys
                        if (m.length !== 1) {
                            this.error("beta-tester level 3 key", "Ill-sized key request!", true);
                            return 1;
                        }
                        if (typeof m[0] !== "number") {
                            this.error("beta-tester level 3 key", "Non-numeric key value", true);
                            return 1;
                        }

                        // I'm lazy
                        if (
                            m[0] === 12 &&
                            (
                                this.betaData.permissions > 0 &&
                                isAlive
                            )
                        ) {
                            if (!c.serverName.includes("Sandbox")) {
                                //player.body.sendMessage('Server is not a sandbox server!');
                                break;
                            }

                            //player.body.sendMessage('Command is unfinished :3');

                            let i;

                            for (i = 0; i < global.sandboxRooms.length; i++) {
                                if (player.body.sandboxId == global.sandboxRooms[i].id) break;
                            }

                            i = (i + 1) % global.sandboxRooms.length;
                            player.body.sandboxId = global.sandboxRooms[i].id;
                            player.body.socket.sandboxId = global.sandboxRooms[i].id;
                            this.talk("R", room.width, room.height, JSON.stringify(c.ROOM_SETUP), JSON.stringify(util.serverStartTime), this.player.body.label, room.speed);
                            player.body.sendMessage(`Sandbox server set: ${i + 1} / ${global.sandboxRooms.length} (${global.sandboxRooms[i].id})`);
                            return;
                        }

                        if (!isAlive || this.betaData.permissions !== 3) return;
                        if (body.underControl) return body.sendMessage("You cannot use beta-tester keys while controlling a Dominator or Mothership.");
                        switch (m[0]) {
                            case 0: { // Color change
                                body.color = Math.floor(42 * Math.random());
                            } break;
                            case 1: { // Godmode
                                if (room.arenaClosed) return body.sendMessage("Godmode is disabled when the arena is closed.");
                                body.godmode = !body.godmode;
                                entities.forEach(o => {
                                    if (o.master.id === body.id && o.id !== body.id) o.diesToTeamBase = !body.godmode;
                                });
                                body.sendMessage("Godmode: " + (body.godmode ? "ON" : "OFF"));
                            } break;
                            case 2: { // Spawn entities at mouse
                                let loc = {
                                    x: player.target.x + body.x,
                                    y: player.target.y + body.y
                                };
                                {
                                    let o;
                                    if (body.keyFEntity[0] === "bot") {
                                        o = spawnBot(loc);
                                    } else {
                                        o = new Entity(loc);
                                        o.define(Class[body.keyFEntity[0]]);
                                    }
                                    if (body.keyFEntity[1]) o.define({ SIZE: body.keyFEntity[1] });
                                    setTimeout(() => {
                                        o.velocity.null();
                                        o.accel.null();
                                    }, 50);
                                    if (o.type === "food") {
                                        o.team = -100;
                                        o.ACCELERATION = .015 / (o.size * 0.2);
                                    };
                                    if (body.sandboxId) {
                                        o.sandboxId = body.sandboxId;
                                    }
                                    if (body.keyFEntity[2]) {
                                        o.team = body.team;
                                        o.controllers = [];
                                        o.master = body;
                                        o.source = body;
                                        o.parent = body;
                                        //if (o.type === "tank") o.ACCELERATION *= 1.5;
                                        let toAdd = [];
                                        for (let ioName of body.keyFEntity[2] === 2 ? ['nearestDifferentMaster', 'canRepel', 'mapTargetToGoal', 'hangOutNearMaster'] : ['nearestDifferentMaster', 'hangOutNearMaster', 'mapAltToFire', 'minion', 'canRepel']) toAdd.push(new ioTypes[ioName](o));
                                        o.addController(toAdd);
                                    }
                                    /*
                                        instance.sendMessage("You have lost control over yourself...");
                                        instance.team = body.team;
                                        if (instance.socket != null) instance.socket.talk("tg", true);
                                        body.sendMessage("You now have control over the " + instance.label);
                                        instance.controllers = [];
                                        instance.master = body;
                                        instance.source = body;
                                        instance.parent = body;
                                        if (instance.type === "tank") instance.ACCELERATION *= 1.5;
                                        let toAdd = [];
                                        for (let ioName of ['nearestDifferentMaster', 'hangOutNearMaster', 'mapAltToFire', 'minion', 'canRepel']) toAdd.push(new ioTypes[ioName](instance));
                                        instance.addController(toAdd);
                                        */
                                }
                            } break;
                            case 3: { // Teleport to mouse
                                body.x = player.target.x + body.x;
                                body.y = player.target.y + body.y;
                            } break;
                            case 8: { // Tank journey
                                body.upgradeTank(Class[global.exportNames[body.index + 2]]);
                            } break;
                            case 9: { // Kill what your mouse is over
                                entities.forEach(o => {
                                    if (o !== body && util.getDistance(o, {
                                        x: player.target.x + body.x,
                                        y: player.target.y + body.y
                                    }) < o.size * 1.3) {
                                        if (o.type === "tank") body.sendMessage(`You killed ${o.name || "An unnamed player"}'s ${o.label}.`);
                                        else body.sendMessage(`You killed ${util.addArticle(o.label)}.`);
                                        o.kill();
                                    }
                                });
                            } break;
                            case 10: { // Stealth mode
                                body.stealthMode = !body.stealthMode;
                                body.settings.leaderboardable = !body.stealthMode;
                                body.settings.givesKillMessage = !body.stealthMode;
                                const exportName = global.exportNames[body.index];
                                body.alpha = body.ALPHA = body.stealthMode ? 0 : (Class[exportName]?.ALPHA == null) ? 1 : Class[exportName].ALPHA;
                                body.sendMessage("Stealth Mode: " + (body.stealthMode ? "ON" : "OFF"));
                            } break;
                            case 11: { // drag
                                if (!player.pickedUpInterval) {
                                    let tx = player.body.x + player.target.x;
                                    let ty = player.body.y + player.target.y;
                                    let pickedUp = [];
                                    entities.forEach(e => {
                                        if (!(e.type === "mazeWall" && e.shape === 4) && (e.x - tx) * (e.x - tx) + (e.y - ty) * (e.y - ty) < e.size * e.size * 1.5) {
                                            pickedUp.push({ e, dx: e.x - tx, dy: e.y - ty });
                                        }
                                    });
                                    if (pickedUp.length === 0) {
                                        player.body.sendMessage('No entities found to pick up!');
                                    } else {
                                        player.pickedUpInterval = setInterval(() => {
                                            if (!player.body) {
                                                clearInterval(player.pickedUpInterval);
                                                player.pickedUpInterval = null;
                                                return;
                                            }
                                            let tx = player.body.x + player.target.x;
                                            let ty = player.body.y + player.target.y;
                                            for (let { e: entity, dx, dy } of pickedUp)
                                                if (!entity.isGhost) {
                                                    entity.x = dx + tx;
                                                    entity.y = dy + ty;
                                                }
                                        }, 25);
                                    }
                                } else {
                                    clearInterval(player.pickedUpInterval);
                                    player.pickedUpInterval = null;
                                }
                            } break;
                            case 13:
                                for (let instance of entities.filter(e => e.bound == null && e !== body)) {
                                    if (util.getDistance(instance, {
                                        x: body.x + body.control.target.x,
                                        y: body.y + body.control.target.y
                                    }) < instance.size) {
                                        setTimeout(function () {
                                            if (body != null) {
                                                body.invuln = false;
                                                body.passive = false;
                                                body.godmode = false;
                                                body.sendMessage("Your soulless body is decaying...");
                                                for (let i = 0; i < 100; i++) {
                                                    let max = body.health.amount;
                                                    let parts = max / 100;
                                                    setTimeout(function () {
                                                        body.shield.amount = 0;
                                                        body.health.amount -= parts * 1.1;
                                                        if(i == 99) body.kill()
                                                    }, 100 * i);
                                                }
                                            }
                                        }, 200);
                                        body.controllers = [];
                                        instance.sendMessage("You have lost control over yourself...");
                                        if (instance.socket != null) instance.socket.talk("tg", true);
                                        player.body = instance;
                                        player.body.refreshBodyAttributes();
                                        body.sendMessage = (content, color=0) => this.talk("m", content, color);
                                        body.rewardManager = (id, amount) => {
                                            this.talk("AA", id, amount);
                                        }
                                        player.body.controllers = [new ioTypes.listenToPlayer(player.body, player)];
                                        player.body.sendMessage("You now have control over the " + instance.label);
                                    }
                                }
                                break;
                            case 14:
                                for (let instance of entities.filter(e => e.bound == null && e !== body)) {
                                    if (util.getDistance(instance, {
                                        x: body.x + body.control.target.x,
                                        y: body.y + body.control.target.y
                                    }) < instance.size) {
                                        instance.sendMessage("You have lost control over yourself...");
                                        instance.team = body.team;
                                        if (instance.socket != null) instance.socket.talk("tg", true);
                                        body.sendMessage("You now have control over the " + instance.label);
                                        instance.controllers = [];
                                        instance.master = body;
                                        instance.source = body;
                                        instance.parent = body;
                                        if (instance.type === "tank") instance.ACCELERATION *= 1.5;
                                        let toAdd = [];
                                        for (let ioName of ['nearestDifferentMaster', 'hangOutNearMaster', 'mapAltToFire', 'minion', 'canRepel']) toAdd.push(new ioTypes[ioName](instance));
                                        instance.addController(toAdd);
                                    }
                                }
                                break;
                            case 15: { // Full heal
                                body.health.amount = body.health.max;
                                body.shield.amount = body.shield.max;
                                body.sendMessage("Healed to max health and shield");
                            } break;
                            default:
                                this.error("beta-tester level 2 key", `Unknown key value (${m[0]})`, true);
                                return 1;
                        }
                    }
                        break;
                    case "D": { // Beta-tester commands
                        if (m.length < 0 || m.length > 11) {
                            this.error("beta-tester console", "Ill-sized beta-command request", true);
                            return 1;
                        }
                        if (typeof m[0] !== "number") {
                            this.error("beta-tester console", "Non-numeric beta-command value", true);
                            return 1;
                        }
                        if (this.betaData.permissions !== 3) return this.talk("Z", "[ERROR] You need a beta-tester level 3 token to use these commands.");
                        if (!isAlive) return this.talk("Z", "[ERROR] You cannot use a beta-tester command while dead.");
                        //if (body.underControl) return socket.talk("Z", "[ERROR] You cannot use a beta-tester command while controlling a Dominator or Mothership.");
                        switch (m[0]) {
                            case 0: { // Broadcast
                                sockets.broadcast(m[1], m[2]);
                            } break;
                            case 1: { // Color change
                                body.color = m[1];
                            } break;
                            case 2: { // Set skill points
                                body.skill.points = m[1];
                            } break;
                            case 3: { // Set score
                                body.skill.score = m[1];
                            } break;
                            case 4: { // Set size
                                body.SIZE = m[1];
                            } break;
                            case 5: { // Define tank
                                body.upgradeTank(isNaN(m[1]) ? Class[m[1]] : Class[m[1]]);

                            } break;
                            case 6: { // Set stats
                                if ("weapon_speed" === m[1]) body.skill.spd = m[2];
                                if ("weapon_reload" === m[1]) body.skill.rld = m[2];
                                if ("move_speed" === m[1]) {
                                    body.SPEED = m[2];
                                    body.ACCELERATION = m[2] / 3;
                                    body.refreshBodyAttributes();
                                }
                                if ("max_health" === m[1]) {
                                    body.HEALTH = m[2];
                                    body.refreshBodyAttributes();
                                }
                                if ("body_damage" === m[1]) {
                                    body.DAMAGE = m[2];
                                    body.refreshBodyAttributes();
                                }
                                if ("weapon_damage" === m[1]) body.skill.dam = m[2];
                            } break;
                            case 7: { // Spawn entities
                                let o = new Entity({
                                    x: m[2] === "me" ? body.x : m[2],
                                    y: m[3] === "me" ? body.y : m[3]
                                });
                                o.define(Class[m[1]]);
                                o.team = m[4] === "me" ? body.team : m[4];
                                o.color = m[5] === "default" ? o.color : m[5];
                                o.SIZE = m[6] === "default" ? o.SIZE : m[6];
                                o.skill.score = m[7] === "default" ? o.skill.score : m[7];
                                if (o.type === "food") o.ACCELERATION = .015 / (o.size * 0.2);
                            } break;
                            case 8: { // Change maxChildren value
                                body.maxChildren = m[1];
                            } break;
                            case 9: { // Teleport
                                body.x = m[1];
                                body.y = m[2];
                            } break;
                            case 10: {
                                body.invisible = [m[1], m[2], m[3]];
                            } break;
                            case 11: { // Set FOV
                                body.FOV = m[1];
                                body.refreshFOV();
                            } break;
                            case 12: { // Set autospin speed
                                body.spinSpeed = m[1];
                            } break;
                            case 13: { // Set entity spawned by F
                                body.keyFEntity = [m[1], m[2], m[3]];
                            } break;
                            case 14: { // Clear children
                                entities.forEach(o => {
                                    if (o.master.id === body.id && o.id !== body.id) o.kill();
                                });
                                //body.children
                            } break;
                            case 15: { // Set team
                                if (-m[1] > room.teamAmount) return this.talk("Z", "[ERROR] The maximum team amount for this server is " + room.teamAmount + ".");
                                body.team = m[1];
                                player.team = -m[1];
                                this.rememberedTeam = m[1];
                            } break;
                            case 17: { // Change skill-set
                                body.skill.set([m[7], m[5], m[4], m[6], m[3], m[10], m[1], m[2], m[9], m[8]]);
                                body.skill.points -= m[1] + m[2] + m[3] + m[4] + m[5] + m[6] + m[7] + m[8] + m[9] + m[10];
                                if (body.skill.points < 0) body.skill.points = 0;
                                body.refreshBodyAttributes();
                            } break;
                            case 18: { // Set rainbow speed
                                body.rainbowSpeed = m[1];
                                body.toggleRainbow();
                                body.toggleRainbow();
                            } break;
                            case 19: { // Enable or disable multiboxing
                                if (m[1] === 0) {
                                    if (!body.multibox.enabled) return this.talk("Z", "[ERROR] Multiboxing is already disabled for you.");
                                    this.talk("Z", "[INFO] You have disabled multiboxing for yourself.");
                                    body.multibox.enabled = false;
                                    body.onDead();
                                    return body.onDead = null;
                                }
                                this.talk("Z", "[INFO] You are now controlling " + m[1] + " new " + (m[1] > 1 ? "entities" : "entity") + ".");
                                while (m[1]-- > 0) {
                                    let controlledBody = new Entity({
                                        x: body.x + Math.random() * 5,
                                        y: body.y - Math.random() * 5
                                    });
                                    if (room.gameMode === "tdm") controlledBody.team = body.team;
                                    else body.team = controlledBody.team = -9;
                                    controlledBody.define(Class.basic);
                                    controlledBody.controllers = [new ioTypes.listenToPlayer(body, player)];
                                    controlledBody.invuln = false;
                                    controlledBody.color = body.color;
                                    controlledBody.settings.leaderboardable = false;
                                    controlledBody.passive = body.passive;
                                    controlledBody.godmode = body.godmode;
                                    if (body.stealthMode) controlledBody.alpha = controlledBody.ALPHA = 0;
                                    body.multibox.controlledTanks.push(controlledBody);
                                }
                                body.onDead = () => {
                                    if (body.multibox.intervalID != null) clearInterval(body.multibox.intervalID);
                                    for (let o of body.multibox.controlledTanks)
                                        if (o.isAlive()) o.kill();
                                    body.multibox.controlledTanks = [];
                                };
                                if (!body.multibox.enabled) body.toggleMultibox();
                                body.multibox.enabled = true;
                            } break;
                            case 20: { // Add controller
                                if (ioTypes[m[1]] == null) {
                                    this.talk("Z", "[ERROR] That controller doesn't exist!");
                                    return;
                                }
                                body.controllers.push(new ioTypes[m[1]](body, player));
                                this.talk("Z", "[INFO] Added that controller to you!");
                            } break;
                            case 21: { // Remove controller
                                if (ioTypes[m[1]] == null) {
                                    this.talk("Z", "[ERROR] That controller doesn't exist!");
                                    return;
                                }
                                body.controllers = body.controllers.filter(entry => !(entry instanceof ioTypes[m[1]]));
                                this.talk("Z", "[INFO] Removed that controller from you!");
                            } break;
                            case 22: { // Clear Controllers
                                body.controllers = [];
                                this.talk("Z", "[INFO] Removed all controllers from you!");
                            } break;
                            default:
                                this.error("beta-tester console", `Unknown beta-command value (${m[1]})`, true);
                                return 1;
                        }
                    } break;
                    case "X": { // Boss tiers
                        if (m.length !== 0) {
                            this.error("tier cycle", "Ill-sized tier cycle request", true);
                            return 1;
                        }
                        if(!body.canUseQ) return;

                        if(body?.onQ) body.onQ(body)

                        if (!isAlive || body.bossTierType === -1 || !body.canUseQ) return;
                        setTimeout(() => body.canUseQ = true, 1000);
                        let labelMap = (new Map().set("MK-1", 1).set("MK-2", 2).set("MK-3", 3).set("MK-4", 4).set("MK-5", 0).set("TK-1", 1).set("TK-2", 2).set("TK-3", 3).set("TK-4", 4).set("TK-5", 0).set("PK-1", 1).set("PK-2", 2).set("PK-3", 3).set("PK-4", 0).set("EK-1", 1).set("EK-2", 2).set("EK-3", 3).set("EK-4", 4).set("EK-5", 5).set("EK-6", 0).set("HK-1", 1).set("HK-2", 2).set("HK-3", 3).set("HK-4", 0).set("HPK-1", 1).set("HPK-2", 2).set("HPK-3", 0).set("RK-1", 1).set("RK-2", 2).set("RK-3", 3).set("RK-4", 4).set("RK-5", 0).set("OBP-1", 1).set("OBP-2", 2).set("OBP-3", 0).set("AWP-1", 1).set("AWP-2", 2).set("AWP-3", 3).set("AWP-4", 4).set("AWP-5", 5).set("AWP-6", 6).set("AWP-7", 7).set("AWP-8", 8).set("AWP-9", 9).set("AWP-10", 0).set("Defender", 1).set("Custodian", 0).set("Switcheroo (Ba)", 1).set("Switcheroo (Tw)", 2).set("Switcheroo (Sn)", 3).set("Switcheroo (Ma)", 4).set("Switcheroo (Fl)", 5).set("Switcheroo (Di)", 6).set("Switcheroo (Po)", 7).set("Switcheroo (Pe)", 8).set("Switcheroo (Tr)", 9).set("Switcheroo (Pr)", 10).set("Switcheroo (Au)", 11).set("Switcheroo (Mi)", 12).set("Switcheroo (La)", 13).set("Switcheroo (A-B)", 14).set("Switcheroo (Si)", 15).set("Switcheroo (Hy)", 16).set("Switcheroo (Su)", 17).set("Switcheroo (Mg)", 0).set("CHK-1", 1).set("CHK-2", 2).set("CHK-3", 0).set("GK-1", 1).set("GK-2", 2).set("GK-3", 0).set("NK-1", 1).set("NK-2", 2).set("NK-3", 3).set("NK-4", 4).set("NK-5", 5).set("NK-5", 0).set("Dispositioner", 1).set("Reflector", 2).set("Triad", 0).set("SOULLESS-1", 1).set("Railtwin", 1).set("Synced Railtwin", 0).set("EQ-1", 1).set("EQ-2", 2).set("EQ-3", 0).set("ES-1", 1).set("ES-2", 2).set("ES-3", 3).set("ES-4", 4).set("ES-5", 0).set("RS-1", 1).set("RS-2", 2).set("RS-3", 3).set("RS-4", 0));
                        if (labelMap.has(body.label) && body.bossTierType !== 16) body.tierCounter = labelMap.get(body.label);
                        switch (body.bossTierType) {
                            case 0:
                                body.upgradeTank(Class[`eggBossTier${++body.tierCounter}`]);
                                break;
                            case 1:
                                body.upgradeTank(Class[`squareBossTier${++body.tierCounter}`]);
                                break;
                            case 2:
                                body.upgradeTank(Class[`triangleBossTier${++body.tierCounter}`]);
                                break;
                            case 3:
                                body.upgradeTank(Class[`pentagonBossTier${++body.tierCounter}`]);
                                break;
                            case 4:
                                body.upgradeTank(Class[`hexagonBossTier${++body.tierCounter}`]);
                                break;
                            case 5:
                                body.upgradeTank(Class[`heptagonBossTier${++body.tierCounter}`]);
                                break;
                            case 6:
                                body.upgradeTank(Class[`rocketBossTier${++body.tierCounter}`]);
                                break;
                            case 7:
                                body.upgradeTank(Class[`obp${++body.tierCounter}`]);
                                break;
                            case 8:
                                body.upgradeTank(Class[`AWP_${++body.tierCounter}`]);
                                break;
                            case 9:
                                body.upgradeTank(Class[`defender${++body.tierCounter}`]);
                                break;
                            case 10:
                                body.upgradeTank(Class[`switcheroo${++body.tierCounter}`]);
                                break;
                            case 11:
                                body.upgradeTank(Class[`chk${++body.tierCounter}`]);
                                break;
                            case 12:
                                body.upgradeTank(Class[`greenBossTier${++body.tierCounter}`]);
                                break;
                            case 13:
                                body.upgradeTank(Class[`nk${++body.tierCounter}`]);
                                break;
                            case 14:
                                body.upgradeTank(Class[`hewnPuntUpg${++body.tierCounter}`]);
                                break;
                            case 15:
                                body.upgradeTank(Class[`soulless${++body.tierCounter}`]);
                                break;
                            case 16:
                                entities.forEach(o => {
                                    if (o.master.id === body.id && o.type === "drone") o.kill();
                                });
                                let increment = 20 * body.switcherooID;
                                for (let i = 1; i < 21; i++) setTimeout(() => {
                                    if (body.isAlive()) body.master.define(Class[`switcherooAnim${i + increment === 380 ? 0 : i + increment}`]);
                                }, 24 * i);
                                if (body.multibox.enabled)
                                    for (let o of body.multibox.controlledTanks)
                                        if (o.isAlive()) {
                                            entities.forEach(r => {
                                                if (r.master.id === o.id && r.type === "drone") r.kill();
                                            });
                                            for (let i = 1; i < 21; i++) setTimeout(() => {
                                                if (o.isAlive()) {
                                                    let num = i + increment === 380 ? 0 : i + increment;
                                                    o.master.define(Class[`switcherooAnim${num}`]);
                                                    body.tank = `switcherooAnim${num}`;
                                                }
                                            }, 24 * i);
                                        }
                                break;
                            case 17:
                                body.upgradeTank(Class[`twinRailgun${++body.tierCounter}`]);
                                break;
                            case 18:
                                body.upgradeTank(Class[`eggQueenTier${++body.tierCounter}`]);
                                break;
                            case 19:
                                body.upgradeTank(Class[`eggSpiritTier${++body.tierCounter}`]);
                                break;
                            case 20:
                                body.upgradeTank(Class[`redStarTier${++body.tierCounter}`]);
                                break;
                            default:
                                this.error("tier cycle", `Unknown Q tier value (${body.bossTierType})`, true);
                                return 1;
                        }
                    } break;
                    case "M": // Sync name color
                        break;
                    case "N": { // Lol best antitab
                        if (typeof m[0] !== "string") {
                            this.kick("Packet shuffling failed!");
                            return 0;
                        }
                        if (c.strictSingleTab) {
                            let stop = false;
                            for (let socket of clients) {
                                if (socket.identification === m[0]) {
                                    if (socket.betaData.permissions < 1) {
                                        this.kick("Please only use one tab at a time!");
                                        stop = true;
                                    }
                                    break;
                                }
                            }
                            if (!stop) {
                                multitabIDs.push(m[0]);
                            }
                        }
                    } break;
                    case "cs": // short for chat send
                        // Do they even exist
                        if (!body?.messages) {
                            api.apiConnection.talk({
                                type: "devalert",
                                data: {
                                    note: "sent message without body",
                                    ip: this.ip,
                                    data: "No Text Provided"
                                }
                            })
                            return
                        }

                        // Are they spamming?
                        if(Date.now()-this.lastChatSend < 1500){
                            this.talk("m", "You are sending messages too quickly!", "#FF0000")
                            this.lastChatSend = Date.now()
                            return
                        }
                        this.lastChatSend = Date.now()

                        // Parse the message and see if theyre saying some bad words
                        let text = m[0];
                        text = util.cleanString(text, 50);
                        for (let Text of bannedPhrases) {
                            if (text.toLowerCase().includes(Text)) {
                                this.error("msg", "Inappropriate message (" + trimName(text) + ")");
                                return 1;
                            }
                        }
                        if (!text.length) return 1;
                        if (!body?.messages){
                            api.apiConnection.talk({
                                type: "devalert",
                                data: {
                                    note: "sent message without body",
                                    ip: this.ip,
                                    data: text
                                }
                            })
                            return
                        }

                        // clear out old chats
                        body.messages = body.messages.slice(-5).filter(e => Date.now() - e.when < 15000);

                        // Have they said the same thing recently?
                        if(fuzzysort.go(text, body.messages, {threshold: -1000, key: "text",}).length !== 0){
                            this.talk("m", "That message is too close to a recently sent message!", "#FF0000")
                            return
                        }


                        let replaces = {
                            ":100:": "💯",
                            ":fire:": "🔥",
                            ":alien:": "👽",
                            ":speaking_head:": "🗣️",
                        }
                        for (let key in replaces) {
                            text = text.replace(new RegExp(key, "g"), replaces[key]);
                        }

                        body.messages.push({
                            text: text,
                            when: Date.now()
                        })

                        api.apiConnection.talk({
                            type: "chat",
                            data: {
                                name: this.name,
                                id: body.id,
                                text: text,
                                discordId: body?.socket?.betaData?.discordID
                            }
                        })


                        break;
                    default:
                        this.error("initialization", `Unknown packet index (${index})`, true);
                        return 1;
                }
            }
            spawn(name) {
                let player = {
                    id: this.id
                },
                    loc = {};
                player.team = this.rememberedTeam;
                let i = 10;
                switch (room.gameMode) {
                    case "tdm": {
                        if (player.team == null && this.party) {
                            player.team = room.partyHash.indexOf(+this.party) + 1;
                            if (player.team < 1 || room.defeatedTeams.includes(-player.team) || room.tagMode) {
                                this.talk("m", "That party link is expired or invalid!");
                                player.team = null;
                            } else {
                                this.talk("m", "Team set with proper party link!");
                            }
                        }
                        if (player.team == null || room.defeatedTeams.includes(-player.team)) {
                            if (c.serverName === "Infiltration") {
                                player.team = Math.random() > .95 ? 20 : getTeam(1);
                            } else {
                                player.team = getTeam(1);
                            }
                        }
                        if (player.team !== this.rememberedTeam) {
                            this.party = room.partyHash[player.team - 1];
                            this.talk("pL", room.partyHash[player.team - 1]);
                        }
                        let spawnSectors = player.team === 20 ? ["edge"] : ["spn", "bas", "n_b", "bad"].map(r => r + player.team).filter(sector => room[sector] && room[sector].length);
                        const sector = ran.choose(spawnSectors);
                        if (sector && room[sector].length) {
                            do loc = room.randomType(sector);
                            while (dirtyCheck(loc, 50) && i--);
                        } else {
                            do loc = room.gaussInverse(5);
                            while (dirtyCheck(loc, 50) && i--);
                        }
                    }
                        break;
                    default:
                        do loc = room.gaussInverse(5);
                        while (dirtyCheck(loc, 50) && i--);
                }
                if (c.PLAYER_SPAWN_TILES) {
                    i = 10
                    let tile = ran.choose(c.PLAYER_SPAWN_TILES)
                    do loc = room.randomType(tile);
                    while (dirtyCheck(loc, 50) && i--);
                }
                this.rememberedTeam = player.team;
                let body = new Entity(loc);
                if (c.RANKED_BATTLE) {
                    body.roomId = this.roomId;
                }
                body.protect();

                switch (c.serverName) {
                    case "Infiltration":
                        if (player.team === 20) {
                            body.define(Class[ran.choose(["infiltrator", "infiltratorFortress", "infiltratorTurrates"])]);
                        } else {
                            body.define(Class.basic);//body.define(Class[ran.choose(["auto1", "watcher", "caltrop", "microshot"])]);
                        }
                        break;
                    case "Squidward's Tiki Land":
                        body.define(startingTank = Class.playableAC);
                        break;
                    case "Corrupted Tanks":
                        body.upgrade()
                        break;
                    case "Tank Builder":
                        body.define(startingTank = Class.genericTank);
                        break;
                    case "Bounce":
                        body.define(startingTank = Class.bouncer);
                        break;
                    default:
                        body.define(Class[c.STARTING_TANK] || Class[startingTank]);
                }
                body.name = name || this.betaData.globalName;
                body.addController(new ioTypes.listenToPlayer(body, player));
                body.sendMessage = (content, color=0) => this.talk("m", content, color);
                body.rewardManager = (id, amount) => {
                    this.talk("AA", id, amount);
                }
                body.isPlayer = true;
                if (this.sandboxId) {
                    body.sandboxId = this.sandboxId;
                    this.talk("pL", body.sandboxId);
                    this.talk("gm", "sbx");
                }
                body.invuln = true;
                body.invulnTime = [Date.now(), room.gameMode !== "tdm" || !room["bas1"].length ? 18e4 : 6e4];
                player.body = body;
                if (room.gameMode === "tdm") {
                    body.team = -player.team;
                    body.color = [10, 12, 11, 15, 3, 35, 36, 0][player.team - 1];
                    if (player.team === 20) {
                        body.color = 17;
                    }
                } else body.color = "FFA_RED";
                player.teamColor = room.gameMode === "ffa" ? 10 : body.color;
                player.target = {
                    x: 0,
                    y: 0
                };
                player.command = {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                    lmb: false,
                    mmb: false,
                    rmb: false,
                    autofire: false,
                    autospin: false,
                    override: false,
                    reversed: false,
                };
                player.records = (() => { // sendRecordValid
                    let begin = util.time();
                    return () => [
                        player.body.skill.score,
                        Math.floor((util.time() - begin) / 1000),
                        player.body.killCount.solo,
                        player.body.killCount.assists,
                        player.body.killCount.bosses,
                        player.body.killCount.killers.length, ...player.body.killCount.killers,
                        this.usingAdBlocker
                    ];
                })();
                player.gui = this.makeGUI(player);
                player.socket = this;
                body.socket = this;
                players.push(player);
                this.camera.x = body.x;
                this.camera.y = body.y;
                this.camera.fov = 1000;
                this.status.hasSpawned = true;
                body.rewardManager(-1, "welcome_to_the_game");
                global.spawnMusicRestart()
                if (c.SANDBOX) {
                    [
                        "Press \"p\" to change to basic again",
                        "To get people to join your room, send them your party link!",
                        "Welcome to sandbox! Hold N to level up."
                    ].forEach(body.sendMessage);
                }else{
                    body.sendMessage(`You will remain invulnerable until you move, shoot, or your timer runs out.`);
                    body.sendMessage("You have spawned! Welcome to the game. Hold N to level up.");
                }
                this.talk("c", this.camera.x, this.camera.y, this.camera.fov);
                views.forEach(view => view.add(body));
                return player;
            }
        }

        const broadcast = (() => {
            let getBarColor = entry => {
                switch (entry.team) {
                    case -100:
                        return entry.color;
                    case -1:
                        return 10
                    case -2:
                        return 12
                    case -3:
                        return 11
                    case -4:
                        return 15
                    case -5:
                        return 3
                    case -6:
                        return 35;
                    case -20: // Rogue
                        return 17;
                    default:
                        if (room.gameMode[0] === '1' || room.gameMode[0] === '2' || room.gameMode[0] === '3' || room.gameMode[0] === '4') return entry.color;
                        return 11;
                }
            }
            global.newBroadcasting = function () {
                const counters = {
                    minimapAll: 0,
                    minimapTeams: {},
                    minimapSandboxes: {}
                };
                const output = {
                    minimapAll: [],
                    minimapTeams: {},
                    minimapSandboxes: {},
                    leaderboard: []
                };
                for (let i = 0; i < c.TEAM_AMOUNT; i++) {
                    output.minimapTeams[i + 1] = [];
                    counters.minimapTeams[i + 1] = 0;
                }
                for (let player of players) {
                    if (player.socket && player.socket.rememberedTeam) {
                        output.minimapTeams[-player.socket.rememberedTeam] = [];
                        counters.minimapTeams[-player.socket.rememberedTeam] = 0;
                    }
                }
                for (let room of global.sandboxRooms) {
                    output.minimapSandboxes[room.id] = [];
                    counters.minimapSandboxes[room.id] = 0;
                }

                if (c.serverName.includes("Tag") || c.SOCCER) {
                    for (let i = 0; i < c.TEAM_AMOUNT; i++) {
                        output.leaderboard.push({
                            id: i,
                            skill: {
                                score: c.SOCCER ? soccer.scoreboard[i] : 0,
                            },
                            index: c.SOCCER ? Class.soccerMode.index : Class.tagMode.index,
                            name: ["BLUE", "RED", "GREEN", "PURPLE"][i],
                            color: [10, 12, 11, 15][i] ?? 0,
                            nameColor: "#FFFFFF",
                            team: -i - 1,
                            label: 0
                        });
                    }
                }
                entities.forEach(my => {
                    if (my.type === "bullet" || my.type === "swarm" || my.type === "drone" || my.type === "minion" || my.type === "trap") {
                        return;
                    }
                    if (!my.isOutsideRoom && (((my.type === 'wall' || my.type === "mazeWall") && my.alpha > 0.2) || my.showsOnMap || my.type === 'miniboss' || (my.type === 'tank' && my.lifetime) || my.isMothership || my.miscIdentifier === "appearOnMinimap")) {
                        if (output.minimapSandboxes[my.sandboxId] != null) {
                            output.minimapSandboxes[my.sandboxId].push(
                                my.id,
                                (my.type === 'wall' || my.type === 'mazeWall') ? my.shape === 4 ? 2 : 1 : 0,
                                util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                                util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                                my.color ?? 0,
                                Math.round(my.SIZE),
                                my.width || 1,
                                my.height || 1
                            );
                            counters.minimapSandboxes[my.sandboxId]++;
                        } else {
                            output.minimapAll.push(
                                my.id,
                                (my.type === 'wall' || my.type === 'mazeWall') ? my.shape === 4 ? 2 : 1 : 0,
                                util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                                util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                                my.color ?? 0,
                                Math.round(my.SIZE),
                                my.width || 1,
                                my.height || 1
                            ); counters.minimapAll++;
                        }
                    }
                    if (my.type === 'tank' && my.master === my && !my.lifetime) {
                        if (output.minimapTeams[my.team] != null) {
                            output.minimapTeams[my.team].push(
                                my.id,
                                util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                                util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                                my.color ?? 0
                            );
                            counters.minimapTeams[my.team]++;
                        }
                    }
                    if (!c.SOCCER) {
                        if (c.serverName.includes("Mothership")) {
                            if (my.isMothership) {
                                output.leaderboard.push(my);
                            }
                        } else if (c.serverName.includes("Tag")) {
                            if (my.isPlayer || my.isBot) {
                                let entry = output.leaderboard.find(r => r.team === my.team);
                                if (entry) entry.skill.score++;
                            }
                        } else if (!c.DISABLE_LEADERBOARD && my.settings != null && my.settings.leaderboardable && my.settings.drawShape && (my.type === 'tank' || my.killCount.solo || my.killCount.assists)) {
                            output.leaderboard.push(my);
                        }
                    }
                });
                let topTen = [];
                for (let i = 0; i < 10 && output.leaderboard.length; i++) {
                    let top, is = 0
                    for (let j = 0; j < output.leaderboard.length; j++) {
                        let val = output.leaderboard[j].skill.score
                        if (val > is) {
                            is = val
                            top = j
                        }
                    }
                    if (is === 0) break
                    let entry = output.leaderboard[top];
                    topTen.push({
                        id: entry.id,
                        data: c.SANDBOX ? [
                            Math.round(c.serverName.includes("Mothership") ? entry.health.amount : entry.skill.score),
                            entry.index,
                            entry.name,
                            entry.color ?? 0,
                            getBarColor(entry) ?? 0,
                            entry.nameColor,
                            entry.labelOverride || 0,
                            entry.sandboxId || -1
                        ] : [
                            Math.round(c.serverName.includes("Mothership") ? entry.health.amount : entry.skill.score),
                            entry.index,
                            entry.name,
                            entry.color ?? 0,
                            getBarColor(entry) ?? 0,
                            entry.nameColor,
                            entry.labelOverride || 0
                        ]
                    });
                    output.leaderboard.splice(top, 1);
                }
                room.topPlayerID = topTen.length ? topTen[0].id : -1
                output.leaderboard = topTen.sort((a, b) => a.id - b.id);
                output.minimapAll = [counters.minimapAll, ...output.minimapAll];
                for (let team in output.minimapTeams) {
                    output.minimapTeams[team] = [counters.minimapTeams[team], ...output.minimapTeams[team]];
                }
                for (let team in output.minimapSandboxes) {
                    output.minimapSandboxes[team] = [counters.minimapSandboxes[team], ...output.minimapSandboxes[team]];
                }
                output.leaderboard = [output.leaderboard.length, ...output.leaderboard.map(entry => {
                    return [entry.id, ...entry.data];
                }).flat()];
                return output;
            }
            const slowLoop = () => {
                let time = util.time();
                for (let socket of clients)
                    if (time - socket.statuslastHeartbeat > c.maxHeartbeatInterval) socket.kick("Lost heartbeat!");
            };
            setInterval(slowLoop, 8000);

            function fastLoop() {
                newLogs.broadcast.reset();
                newLogs.broadcast.start();
                const data = global.newBroadcasting();
                for (const socket of clients) {
                    if (socket.status.hasSpawned) {
                        if (socket.battleRoom instanceof RankedRoom) {
                            socket.talk("b", ...socket.battleRoom.minimap, 0, ...socket.battleRoom.leaderboard);
                        } else if (c.SANDBOX && data.minimapSandboxes[socket.sandboxId] != null) {
                            socket.talk("b", ...data.minimapSandboxes[socket.sandboxId], 0, ...(socket.anon ? [0] : data.leaderboard));
                        } else {
                            let myTeam = data.minimapTeams[-socket.player.team];
                            socket.talk("b", ...data.minimapAll, ...(myTeam ? myTeam : [0]), ...(socket.anon ? [0] : data.leaderboard));
                        }
                    }
                }
                newLogs.broadcast.stop();
            }
            setInterval(fastLoop, 1000);
        })();
        return {
            talkToAll: function(){
                for(let socket of clients){
                    socket.talk.apply(this, arguments)
                }
            },
            broadcast: (message, color = "") => {
                for (let socket of clients) socket.talk("m", message, color);
            },
            broadcastRoom: () => {
                for (let socket of clients) socket.talk("r", room.width, room.height, JSON.stringify(c.ROOM_SETUP));
            },
            connect: async (socket, request) => new SocketUser(socket, request),
            ban: (id, reason, setMessage = "") => {
                let client;
                if (client = clients.find(r => r.id === id), client instanceof SocketUser) {
                    if (setMessage.length) {
                        client.talk("P", setMessage);
                    }
                    client.ban(reason);
                    return true;
                }
                if (client = backlog.find(r => r.id === id), client instanceof BacklogData) {
                    bans.push({
                        ip: client.ip,
                        reason: reason
                    });
                    return true;
                }
                return false;
            },
            unban: id => {
                let client = backlog.find(r => r.id === id);
                if (client instanceof BacklogData) {
                    let index = bans.findIndex(ban => ban.ip === client.ip);
                    if (index > -1) {
                        bans.splice(index, 1);
                        return true;
                    }
                }
                return false;
            }
        }
    })();
    window.sockets = sockets

    const gameLoop = (() => {
        const collide = (() => {
            if (c.NEW_COLLISIONS) {
                function bounce(instance, other, doDamage, doMotion) {
                    let dist = Math.max(1, util.getDistance(instance, other));
                    if (dist > instance.realSize + other.realSize) {
                        return;
                    }
                    instance.collisionArray.push(other);
                    other.collisionArray.push(instance);
                    if (doMotion) {
                        //newLogs.doMotion.start();
                        let angle = Math.atan2(instance.y - other.y, instance.x - other.x),
                            cos = Math.cos(angle),
                            sin = Math.sin(angle),
                            distanceFactor = (instance.realSize * other.realSize) * (instance.realSize * other.realSize),
                            pushFactor = ((distanceFactor / dist) / distanceFactor) * Math.sqrt(distanceFactor / 3) / Math.max(instance.mass / other.mass, other.mass / instance.armySentrySwarmAI);
                        instance.accel.x += cos * pushFactor * instance.pushability;
                        instance.accel.y += sin * pushFactor * instance.pushability;
                        other.accel.x -= cos * pushFactor * other.pushability;
                        other.accel.y -= sin * pushFactor * other.pushability;
                        //newLogs.doMotion.stop();
                    }
                    if (doDamage) {
                        //newLogs.doDamage.start();
                        let tock = Math.min(instance.stepRemaining, other.stepRemaining),
                            combinedRadius = other.size + instance.size,
                            motion = {
                                instance: new Vector(instance.m_x, instance.m_y),
                                other: new Vector(other.m_x, other.m_y)
                            },
                            delt = new Vector(tock * (motion.instance.x - motion.other.x), tock * (motion.instance.y - motion.other.y)),
                            diff = new Vector(instance.x - other.x, instance.y - other.y),
                            dir = new Vector(other.x - instance.x, other.y - instance.y).unit(),
                            component = Math.max(0, dir.x * delt.x + dir.y * delt.y), componentNorm = component / delt.length,
                            deathFactor = {
                                instance: 1,
                                other: 1
                            },
                            depth = {
                                instance: util.clamp((combinedRadius - diff.length) / (2 * instance.size), 0, 1),
                                other: util.clamp((combinedRadius - diff.length) / (2 * other.size), 0, 1)
                            },
                            pen = {
                                instance: {
                                    sqr: Math.pow(instance.penetration, 2),
                                    sqrt: Math.sqrt(instance.penetration)
                                },
                                other: {
                                    sqr: Math.pow(other.penetration, 2),
                                    sqrt: Math.sqrt(other.penetration)
                                }
                            },
                            speedFactor = {
                                instance: instance.maxSpeed ? Math.pow(motion.instance.length / instance.maxSpeed, .25) : 1,
                                other: other.maxSpeed ? Math.pow(motion.other.length / other.maxSpeed, .25) : 1
                            };

                        if (!Number.isFinite(speedFactor.instance)) speedFactor.instance = 1;
                        if (!Number.isFinite(speedFactor.other)) speedFactor.other = 1;

                        let resistDiff = instance.health.resist - other.health.resist,
                            damage = {
                                instance: c.DAMAGE_CONSTANT * instance.damage * (1 + resistDiff) * (1 + other.heteroMultiplier * (instance.settings.damageClass === other.settings.damageClass)) * ((instance.settings.buffVsFood && other.settings.damageType === 1) ? 3 : 1) * instance.damageMultiplier() * Math.min(2, Math.max(speedFactor.instance, 1) * speedFactor.instance),
                                other: c.DAMAGE_CONSTANT * other.damage * (1 - resistDiff) * (1 + instance.heteroMultiplier * (instance.settings.damageClass === other.settings.damageClass)) * ((other.settings.buffVsFood && instance.settings.damageType === 1) ? 3 : 1) * other.damageMultiplier() * Math.min(2, Math.max(speedFactor.other, 1) * speedFactor.other)
                            };
                        if (instance.settings.ratioEffects) damage.instance *= Math.min(1, Math.pow(Math.max(instance.health.ratio, instance.shield.ratio), 1 / instance.penetration));
                        if (other.settings.ratioEffects) damage.other *= Math.min(1, Math.pow(Math.max(other.health.ratio, other.shield.ratio), 1 / other.penetration));
                        if (instance.settings.damageEffects) damage.instance *= (1 + (componentNorm - 1) * (1 - depth.other) / instance.penetration) * (1 + pen.other.sqrt * depth.other - depth.other) / pen.other.sqrt;
                        if (other.settings.damageEffects) damage.other *= (1 + (componentNorm - 1) * (1 - depth.instance) / other.penetration) * (1 + pen.instance.sqrt * depth.instance - depth.instance) / pen.instance.sqrt;
                        if (!Number.isFinite(damage.instance)) damage.instance = 1;
                        if (!Number.isFinite(damage.other)) damage.other = 1;
                        let damageToApply = {
                            instance: damage.instance,
                            other: damage.other
                        };
                        let stuff = instance.health.getDamage(damageToApply.other, false);
                        deathFactor.instance = stuff > instance.health.amount ? instance.health.amount / stuff : 1;
                        stuff = other.health.getDamage(damageToApply.instance, false);
                        deathFactor.other = stuff > other.health.amount ? other.health.amount / stuff : 1;
                        instance.damageReceived += damage.other * deathFactor.other;
                        other.damageReceived += damage.instance * deathFactor.instance;
                        //newLogs.doDamage.stop();
                    }
                }
                return function (instance, other) {
                    if (
                        // Ghost busting
                        instance.isGhost || other.isGhost ||
                        // Passive bullshit
                        instance.passive || other.passive ||
                        // Passive bullshit
                        instance.isObserver || other.isObserver ||
                        // Inactive should be ignored
                        !instance.isActive || !other.isActive ||
                        // Multi-Room mechanics
                        (c.RANKED_BATTLE && instance.roomId !== other.roomId) ||
                        (c.SANDBOX && instance.sandboxId !== other.sandboxId) ||
                        // Forced no collision
                        instance.settings.hitsOwnType === "forcedNever" || other.settings.hitsOwnType === "forcedNever" ||
                        // Same master collisions
                        instance.master === other || other.master === instance
                    ) {
                        return;
                    }
                    let doDamage = instance.team !== other.team,
                        doMotion = true;
                    bounce(instance, other, doDamage, doMotion);
                }
            }
            // Collision Functions
            function simpleCollide(my, n) {
                let diff = (1 + util.getDistance(my, n) / 2) * room.speed;
                let a = (my.intangibility) ? 1 : my.pushability,
                    b = (n.intangibility) ? 1 : n.pushability,
                    c = 0.05 * (my.x - n.x) / diff,
                    d = 0.05 * (my.y - n.y) / diff;
                my.accel.x += a / (b + 0.3) * c;
                my.accel.y += a / (b + 0.3) * d;
                n.accel.x -= b / (a + 0.3) * c;
                n.accel.y -= b / (a + 0.3) * d;
            }
            /*const firmCollide = (my, n, buffer = 0) => {
                let item1 = {
                    x: my.x + my.m_x,
                    y: my.y + my.m_y
                },
                    item2 = {
                        x: n.x + n.m_x,
                        y: n.y + n.m_y
                    },
                    dist = util.getDistance(item1, item2),
                    s1 = Math.max(my.velocity.length, my.topSpeed),
                    s2 = Math.max(n.velocity.length, n.topSpeed),
                    strike1,
                    strike2;
                if (dist === 0) {
                    let oops = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
                    my.accel.x += oops.x;
                    my.accel.y += oops.y;
                    n.accel.x -= oops.x;
                    n.accel.y -= oops.y;
                    return;
                }
                if (buffer > 0 && dist <= my.realSize + n.realSize + buffer) {
                    let repel = (my.acceleration + n.acceleration) * (my.realSize + n.realSize + buffer - dist) / buffer / room.speed;
                    my.accel.x += repel * (item1.x - item2.x) / dist;
                    my.accel.y += repel * (item1.y - item2.y) / dist;
                    n.accel.x -= repel * (item1.x - item2.x) / dist;
                    n.accel.y -= repel * (item1.y - item2.y) / dist;
                }
                while (dist <= my.realSize + n.realSize && !(strike1 && strike2)) {
                    strike2 = strike1 = false;
                    if (my.velocity.length <= s1) {
                        my.velocity.x -= .05 * (item2.x - item1.x) / dist / room.speed;
                        my.velocity.y -= .05 * (item2.y - item1.y) / dist / room.speed;
                    } else strike1 = true;
                    if (n.velocity.length <= s2) {
                        n.velocity.x += .05 * (item2.x - item1.x) / dist / room.speed;
                        n.velocity.y += .05 * (item2.y - item1.y) / dist / room.speed;
                    } else strike2 = true;
                    item1 = {
                        x: my.x + my.m_x,
                        y: my.y + my.m_y
                    };
                    item2 = {
                        x: n.x + n.m_x,
                        y: n.y + n.m_y
                    };
                    dist = util.getDistance(item1, item2);
                }
            };*/
            function shieldCollide(shield, entity) {
                let dx = entity.x - shield.x;
                let dy = entity.y - shield.y;
                let sum = entity.size + (shield.size * 1.08);
                let length = Math.sqrt(dx * dx + dy * dy);
                let ux = dx / length;
                let uy = dy / length;

                entity.x = shield.x + (sum + 1) * ux;
                entity.y = shield.y + (sum + 1) * uy;

                entity.accel.null();
                entity.velocity.x += (sum) * ux * .05;
                entity.velocity.y += (sum) * uy * .05;
            }

            function firmCollide(instance, other, buffer = 0) {
                let dist = util.getDistance(instance, other);
                if (dist <= instance.size + other.size + buffer + 2) {
                    let diff = (1 + dist) * room.speed,
                        instanceSizeRatio = util.clamp(instance.size / other.size, .25, 1.5),//(instance.size + other.size),
                        otherSizeRatio = util.clamp(other.size / instance.size, .25, 1.5),//(instance.size + other.size),
                        instancePushFactor = (instance.intangibility) ? 1 : instance.pushability * otherSizeRatio,
                        otherPushFactor = (other.intangibility) ? 1 : other.pushability * instanceSizeRatio,
                        xDiffStrength = 5 * (instance.x - other.x) / diff,
                        yDiffStrength = 5 * (instance.y - other.y) / diff;
                    instance.accel.x += instancePushFactor / (otherPushFactor + .3) * xDiffStrength;
                    instance.accel.y += instancePushFactor / (otherPushFactor + .3) * yDiffStrength;
                    other.accel.x -= otherPushFactor / (instancePushFactor + .3) * xDiffStrength;
                    other.accel.y -= otherPushFactor / (instancePushFactor + .3) * yDiffStrength;
                }

                /*let angle = Math.atan2(other.y - instance.y, other.x - instance.x);
                other.x = instance.x + Math.cos(angle) * dist;
                other.y = instance.y + Math.sin(angle) * dist;*/
            }
            /*function firmCollide(my, n, buffer = 0) {
                let item1 = {
                    x: my.x + my.m_x,
                    y: my.y + my.m_y,
                };
                let item2 = {
                    x: n.x + n.m_x,
                    y: n.y + n.m_y,
                };
                let dist = util.getDistance(item1, item2);
                let s1 = Math.max(my.velocity.length, my.topSpeed);
                let s2 = Math.max(n.velocity.length, n.topSpeed);
                let strike1, strike2, t = 5;
                if (buffer > 0 && dist <= my.realSize + n.realSize + buffer) {
                    let repel = (my.acceleration + n.acceleration) * (my.realSize + n.realSize + buffer - dist) / buffer / room.speed;
                    my.accel.x += repel * (item1.x - item2.x) / dist;
                    my.accel.y += repel * (item1.y - item2.y) / dist;
                    n.accel.x -= repel * (item1.x - item2.x) / dist;
                    n.accel.y -= repel * (item1.y - item2.y) / dist;
                }
                while (dist <= my.realSize + n.realSize && !(strike1 && strike2) && t > 0) {
                    t --;
                    strike1 = false;
                    strike2 = false;
                    if (my.velocity.length <= s1) {
                        my.velocity.x -= 0.05 * (item2.x - item1.x) / dist / room.speed;
                        my.velocity.y -= 0.05 * (item2.y - item1.y) / dist / room.speed;
                    } else {
                        strike1 = true;
                    }
                    if (n.velocity.length <= s2) {
                        n.velocity.x += 0.05 * (item2.x - item1.x) / dist / room.speed;
                        n.velocity.y += 0.05 * (item2.y - item1.y) / dist / room.speed;
                    } else {
                        strike2 = true;
                    }
                    item1 = {
                        x: my.x + my.m_x,
                        y: my.y + my.m_y,
                    };
                    item2 = {
                        x: n.x + n.m_x,
                        y: n.y + n.m_y,
                    };
                    dist = util.getDistance(item1, item2);
                }
            }*/
            function spikeCollide(my, n) {
                let diff = (1 + util.getDistance(my, n) / 2) * room.speed;
                let a = (my.intangibility) ? 1 : my.pushability,
                    b = (n.intangibility) ? 1 : n.pushability,
                    c = 15 * (my.x - n.x) / diff,
                    d = 15 * (my.y - n.y) / diff,
                    e = Math.min(my.velocity.length, 3),
                    f = Math.min(n.velocity.length, 3);
                my.accel.x += a / (b + 0.3) * c * e;
                my.accel.y += a / (b + 0.3) * d * e;
                n.accel.x -= b / (a + 0.3) * c * f;
                n.accel.y -= b / (a + 0.3) * d * f;
            }
            const advancedCollide = (my, n, doDamage, doInelastic, nIsFirmCollide = false) => {
                let tock = Math.min(my.stepRemaining, n.stepRemaining),
                    combinedRadius = n.size + my.size,
                    motion = {
                        _me: new Vector(my.m_x, my.m_y),
                        _n: new Vector(n.m_x, n.m_y)
                    },
                    delt = new Vector(tock * (motion._me.x - motion._n.x), tock * (motion._me.y - motion._n.y)),
                    diff = new Vector(my.x - n.x, my.y - n.y),
                    dir = new Vector(n.x - my.x, n.y - my.y).unit(),
                    component = Math.max(0, dir.x * delt.x + dir.y * delt.y);
                if (component >= diff.length - combinedRadius) {
                    let goAhead = false,
                        tmin = 1 - tock,
                        //tmax = 1,
                        A = Math.pow(delt.x, 2) + Math.pow(delt.y, 2),
                        B = 2 * delt.x * diff.x + 2 * delt.y * diff.y,
                        C = Math.pow(diff.x, 2) + Math.pow(diff.y, 2) - Math.pow(combinedRadius, 2),
                        det = B * B - (4 * A * C),
                        t;
                    if (!A || det < 0 || C < 0) {
                        t = 0;
                        if (C < 0) goAhead = true;
                    } else {
                        let t1 = (-B - Math.sqrt(det)) / (2 * A),
                            t2 = (-B + Math.sqrt(det)) / (2 * A);
                        if (t1 < tmin || t1 > 1) {
                            if (t2 < tmin || t2 > 1) t = false;
                            else {
                                t = t2;
                                goAhead = true;
                            }
                        } else {
                            if (t2 >= tmin && t2 <= 1) t = Math.min(t1, t2);
                            else t = t1;
                            goAhead = true;
                        }
                    }
                    if (goAhead) {
                        my.collisionArray.push(n);
                        n.collisionArray.push(my);
                        if (t) {
                            my.x += motion._me.x * t;
                            my.y += motion._me.y * t;
                            n.x += motion._n.x * t;
                            n.y += motion._n.y * t;
                            my.stepRemaining -= t;
                            n.stepRemaining -= t;
                            diff = new Vector(my.x - n.x, my.y - n.y);
                            dir = new Vector(n.x - my.x, n.y - my.y).unit();
                            component = Math.max(0, dir.x * delt.x + dir.y * delt.y);
                        }
                        let componentNorm = component / delt.length,
                            deathFactor = {
                                _me: 1,
                                _n: 1
                            },
                            depth = {
                                _me: util.clamp((combinedRadius - diff.length) / (2 * my.size), 0, 1),
                                _n: util.clamp((combinedRadius - diff.length) / (2 * n.size), 0, 1)
                            },
                            combinedDepth = {
                                up: depth._me * depth._n,
                                down: (1 - depth._me) * (1 - depth._n)
                            },
                            pen = {
                                _me: {
                                    sqr: Math.pow(my.penetration, 2),
                                    sqrt: Math.sqrt(my.penetration)
                                },
                                _n: {
                                    sqr: Math.pow(n.penetration, 2),
                                    sqrt: Math.sqrt(n.penetration)
                                }
                            },
                            savedHealthRatio = {
                                _me: my.health.ratio,
                                _n: n.health.ratio
                            };
                        if (doDamage) {
                            let speedFactor = {
                                _me: my.maxSpeed ? Math.pow(motion._me.length / my.maxSpeed, .25) : 1,
                                _n: n.maxSpeed ? Math.pow(motion._n.length / n.maxSpeed, .25) : 1
                            };
                            if (!Number.isFinite(speedFactor._me)) speedFactor._me = 1;
                            if (!Number.isFinite(speedFactor._n)) speedFactor._n = 1;

                            let resistDiff = my.health.resist - n.health.resist,
                                damage = {
                                    _me: c.DAMAGE_CONSTANT * my.damage * (1 + resistDiff) * (1 + n.heteroMultiplier * (my.settings.damageClass === n.settings.damageClass)) * ((my.settings.buffVsFood && n.settings.damageType === 1) ? 3 : 1) * my.damageMultiplier(), //Math.min(2, 1),
                                    _n: c.DAMAGE_CONSTANT * n.damage * (1 - resistDiff) * (1 + my.heteroMultiplier * (my.settings.damageClass === n.settings.damageClass)) * ((n.settings.buffVsFood && my.settings.damageType === 1) ? 3 : 1) * n.damageMultiplier() //Math.min(2, 1)
                                };

                            if (!my.settings.speedNoEffect) {
                                damage._me *= Math.min(2, Math.max(speedFactor._me, 1) * speedFactor._me);
                            }

                            if (!n.settings.speedNoEffect) {
                                damage._n *= Math.min(2, Math.max(speedFactor._n, 1) * speedFactor._n);
                            }

                            if (my.settings.ratioEffects) damage._me *= Math.min(1, Math.pow(Math.max(my.health.ratio, my.shield.ratio), 1 / my.penetration));
                            if (n.settings.ratioEffects) damage._n *= Math.min(1, Math.pow(Math.max(n.health.ratio, n.shield.ratio), 1 / n.penetration));
                            if (my.settings.damageEffects) damage._me *= (1 + (componentNorm - 1) * (1 - depth._n) / my.penetration) * (1 + pen._n.sqrt * depth._n - depth._n) / pen._n.sqrt;
                            if (n.settings.damageEffects) damage._n *= (1 + (componentNorm - 1) * (1 - depth._me) / n.penetration) * (1 + pen._me.sqrt * depth._me - depth._me) / pen._me.sqrt;
                            let damageToApply = {
                                _me: damage._me,
                                _n: damage._n
                            };

                            if (!Number.isFinite(damageToApply._me)) {
                                damageToApply._me = 1;
                            }
                            if (!Number.isFinite(damageToApply._n)) {
                                damageToApply._n = 1;
                            }
                            if (n.shield.max) damageToApply._me -= n.shield.getDamage(damageToApply._me);
                            if (my.shield.max) damageToApply._n -= my.shield.getDamage(damageToApply._n);
                            let stuff = my.health.getDamage(damageToApply._n, false);
                            deathFactor._me = stuff > my.health.amount ? my.health.amount / stuff : 1;
                            stuff = n.health.getDamage(damageToApply._me, false);
                            deathFactor._n = stuff > n.health.amount ? n.health.amount / stuff : 1;
                            let finalDmg = {
                                my: damage._n * deathFactor._n,
                                n: damage._me * deathFactor._me
                            };
                            if (n.hitsOwnTeam) {
                                finalDmg.my *= -1;
                            }
                            if (my.hitsOwnTeam) {
                                finalDmg.n *= -1;
                            }
                            my.damageReceived += finalDmg.my;
                            n.damageReceived += finalDmg.n;

                            if (my.onDamaged) {
                                my.onDamaged(my, n, finalDmg.my);
                            }
                            if (my.onDealtDamage) {
                                my.onDealtDamage(my, n, finalDmg.n);
                            }
                            if (my.onDealtDamageUniv) {
                                my.onDealtDamageUniv(my, n, finalDmg.n);
                            }
                            if (my.master && my.master.onDealtDamageUniv) {
                                my.master.onDealtDamageUniv(my.master, n, finalDmg.n);
                            }
                            if (n.onDamaged) {
                                n.onDamaged(n, my, finalDmg.n);
                            }
                            if (n.onDealtDamage) {
                                n.onDealtDamage(n, my, finalDmg.my);
                            }
                            if (n.onDealtDamageUniv) {
                                n.onDealtDamageUniv(n, my, finalDmg.my);
                            }
                            if (n.master && n.master.onDealtDamageUniv) {
                                n.master.onDealtDamageUniv(n.master, my, finalDmg.my);
                            }
                        }
                        if (nIsFirmCollide < 0) {
                            nIsFirmCollide *= -.5;
                            my.accel.x -= nIsFirmCollide * component * dir.x;
                            my.accel.y -= nIsFirmCollide * component * dir.y;
                            n.accel.x += nIsFirmCollide * component * dir.x;
                            n.accel.y += nIsFirmCollide * component * dir.y;
                        } else if (nIsFirmCollide > 0) {
                            n.accel.x += nIsFirmCollide * (component * dir.x + combinedDepth.up);
                            n.accel.y += nIsFirmCollide * (component * dir.y + combinedDepth.up);
                        } else {
                            let elasticity = 2 - 4 * Math.atan(my.penetration * n.penetration) / Math.PI;
                            if (doInelastic && my.settings.motionEffects && n.settings.motionEffects) elasticity *= savedHealthRatio._me / pen._me.sqrt + savedHealthRatio._n / pen._n.sqrt;
                            else elasticity *= 2;
                            let spring = 2 * Math.sqrt(savedHealthRatio._me * savedHealthRatio._n) / room.speed,
                                elasticImpulse = Math.pow(combinedDepth.down, 2) * elasticity * component * my.mass * n.mass / (my.mass + n.mass),
                                springImpulse = c.KNOCKBACK_CONSTANT * spring * combinedDepth.up,
                                impulse = -(elasticImpulse + springImpulse) * (1 - my.intangibility) * (1 - n.intangibility),
                                force = {
                                    x: impulse * dir.x,
                                    y: impulse * dir.y
                                },
                                modifiers = {
                                    _me: c.KNOCKBACK_CONSTANT * my.pushability / my.mass * deathFactor._n,
                                    _n: c.KNOCKBACK_CONSTANT * n.pushability / n.mass * deathFactor._me
                                };
                            my.accel.x += modifiers._me * force.x;
                            my.accel.y += modifiers._me * force.y;
                            n.accel.x -= modifiers._n * force.x;
                            n.accel.y -= modifiers._n * force.y;
                        }
                    }
                }
            };
            /*const reflectCollide = (wall, bounce) => {
                const width = wall.width ? wall.size * wall.width : wall.size;
                const height = wall.height ? wall.size * wall.height : wall.size;
                if (bounce.x + bounce.size < wall.x - width || bounce.x - bounce.size > wall.x + width || bounce.y + bounce.size < wall.y - height || bounce.y - bounce.size > wall.y + height) return 0;
                if (wall.intangibility || bounce.type === "crasher") return 0
                let bounceBy = bounce.type === "tank" ? .65 : bounce.type === "food" || bounce.type === "crasher" ? .8 : bounce.type === "miniboss" ? .85 : .35;
                let left = bounce.x < wall.x - width;
                let right = bounce.x > wall.x + width;
                let top = bounce.y < wall.y - height;
                let bottom = bounce.y > wall.y + height;
                let leftExposed = bounce.x - bounce.size < wall.x - width;
                let rightExposed = bounce.x + bounce.size > wall.x + width;
                let topExposed = bounce.y - bounce.size < wall.y - height;
                let bottomExposed = bounce.y + bounce.size > wall.y + height;
                let x = leftExposed ? -width : rightExposed ? width : 0;
                let y = topExposed ? -wall.size : bottomExposed ? height : 0;
                let point = new Vector(wall.x + x - bounce.x, wall.y + y - bounce.y);
                let intersected = true;
                if (left && right) {
                    left = right = false;
                }
                if (top && bottom) {
                    top = bottom = false;
                }
                if (leftExposed && rightExposed) {
                    leftExposed = rightExposed = false;
                }
                if (topExposed && bottomExposed) {
                    topExposed = bottomExposed = false;
                }
                if ((left && !top && !bottom) || (leftExposed && !topExposed && !bottomExposed)) {
                    //bounce.accel.x -= (bounce.x + bounce.size - wall.x + width) * bounceBy;
                    if (bounce.accel.x > 0) {
                        bounce.accel.x = 0;
                        bounce.velocity.x = 0;
                    }
                    bounce.x = wall.x - width - bounce.size;
                } else if ((right && !top && !bottom) || (rightExposed && !topExposed && !bottomExposed)) {
                    //bounce.accel.x -= (bounce.x - bounce.size - wall.x - width) * bounceBy;
                    if (bounce.accel.x < 0) {
                        bounce.accel.x = 0;
                        bounce.velocity.x = 0;
                    }
                    bounce.x = wall.x + width + bounce.size;
                } else if ((top && !left && !right) || (topExposed && !leftExposed && !rightExposed)) {
                    //bounce.accel.y -= (bounce.y + bounce.size - wall.y + height) * bounceBy;
                    if (bounce.accel.y > 0) {
                        bounce.accel.y = 0;
                        bounce.velocity.y = 0;
                    }
                    bounce.y = wall.y - height - bounce.size;
                } else if ((bottom && !left && !right) || (bottomExposed && !leftExposed && !rightExposed)) {
                    //bounce.accel.y -= (bounce.y - bounce.size - wall.y - height) * bounceBy;
                    if (bounce.accel.y < 0) {
                        bounce.accel.y = 0;
                        bounce.velocity.y = 0;
                    }
                    bounce.y = wall.y + height + bounce.size;
                } else {
                    if (!x || !y) {
                        if (bounce.x + bounce.y < wall.x + wall.y) { // top left
                            if (bounce.x - bounce.y < wall.x - wall.y) { // bottom left
                                //bounce.accel.x -= (bounce.x + bounce.size - wall.x + width) * bounceBy;
                                if (bounce.accel.x > 0) {
                                    bounce.accel.x = 0;
                                    bounce.velocity.x = 0;
                                }
                                bounce.x = wall.x - width - bounce.size;
                            } else { // top right
                                //bounce.accel.y -= (bounce.y + bounce.size - wall.y + height) * bounceBy;
                                if (bounce.accel.y > 0) {
                                    bounce.accel.y = 0;
                                    bounce.velocity.y = 0;
                                }
                                bounce.y = wall.y - height - bounce.size;
                            }
                        } else { // bottom right
                            if (bounce.x - bounce.y < wall.x - wall.y) { // bottom left
                                //bounce.accel.y -= (bounce.y - bounce.size - wall.y - height) * bounceBy;
                                if (bounce.accel.y < 0) {
                                    bounce.accel.y = 0;
                                    bounce.velocity.y = 0;
                                }
                                bounce.y = wall.y + height + bounce.size;
                            } else { // top right
                                //bounce.accel.x -= (bounce.x - bounce.size - wall.x - width) * bounceBy;
                                if (bounce.accel.x < 0) {
                                    bounce.accel.x = 0;
                                    bounce.velocity.x = 0;
                                }
                                bounce.x = wall.x + width + bounce.size;
                            }
                        }
                    } else if (point.isShorterThan(bounce.size) || !(left || right || top || bottom)) { } else {
                        intersected = false;
                    }
                }
                if (intersected) {
                    if (!bounce.godmode) {
                        if (!bounce.settings.bounceOnObstacles && (bounce.type === "bullet" || bounce.type === "swarm" || bounce.type === "trap" || (bounce.type === "food" && !bounce.isNestFood) || bounce.type === "minion" || bounce.type === "drone")) {
                            bounce.kill();
                        } else {
                            room.wallCollisions.push({
                                id: bounce.id,
                                justForceIt: !(left || right || top || bottom) || point.isShorterThan(bounce.size),
                                left: (left && !top && !bottom) || (leftExposed && !topExposed && !bottomExposed),
                                right: (right && !top && !bottom) || (rightExposed && !topExposed && !bottomExposed),
                                top: (top && !left && !right) || (topExposed && !leftExposed && !rightExposed),
                                bottom: (bottom && !left && !right) || (bottomExposed && !leftExposed && !rightExposed)
                            });
                        }
                    }
                    bounce.collisionArray.push(wall);
                }
            };*/

            const rectWallCollide = (wall, bounce) => {
                const width = wall.width ? wall.size * wall.width : wall.size;
                const height = wall.height ? wall.size * wall.height : wall.size;
                //if (wall.intangibility || bounce.type === "crasher") return 0
                if (bounce.x + bounce.size < wall.x - width || bounce.x - bounce.size > wall.x + width || bounce.y + bounce.size < wall.y - height || bounce.y - bounce.size > wall.y + height) return 0;
                if (!bounce.settings.isHelicopter) {
                    //let bounceBy = bounce.type === "tank" ? .65 : bounce.type === "food" || bounce.type === "crasher" ? .8 : bounce.type === "miniboss" ? .85 : .35;
                    let left = bounce.x < wall.x - width;
                    let right = bounce.x > wall.x + width;
                    let top = bounce.y < wall.y - height;
                    let bottom = bounce.y > wall.y + height;
                    let leftExposed = bounce.x - bounce.size < wall.x - width;
                    let rightExposed = bounce.x + bounce.size > wall.x + width;
                    let topExposed = bounce.y - bounce.size < wall.y - height;
                    let bottomExposed = bounce.y + bounce.size > wall.y + height;
                    let x = leftExposed ? -width : rightExposed ? width : 0;
                    let y = topExposed ? -wall.size : bottomExposed ? height : 0;
                    let point = new Vector(wall.x + x - bounce.x, wall.y + y - bounce.y);
                    let intersected = true;
                    if (left && right) {
                        left = right = false;
                    }
                    if (top && bottom) {
                        top = bottom = false;
                    }
                    if (leftExposed && rightExposed) {
                        leftExposed = rightExposed = false;
                    }
                    if (topExposed && bottomExposed) {
                        topExposed = bottomExposed = false;
                    }
                    if ((left && !top && !bottom) || (leftExposed && !topExposed && !bottomExposed)) {
                        if (bounce.accel.x > 0) {
                            bounce.accel.x = 0;
                            bounce.velocity.x = 0;
                        }
                        bounce.x = wall.x - width - bounce.size;
                    } else if ((right && !top && !bottom) || (rightExposed && !topExposed && !bottomExposed)) {
                        if (bounce.accel.x < 0) {
                            bounce.accel.x = 0;
                            bounce.velocity.x = 0;
                        }
                        bounce.x = wall.x + width + bounce.size;
                    } else if ((top && !left && !right) || (topExposed && !leftExposed && !rightExposed)) {
                        if (bounce.accel.y > 0) {
                            bounce.accel.y = 0;
                            bounce.velocity.y = 0;
                        }
                        bounce.y = wall.y - height - bounce.size;
                    } else if ((bottom && !left && !right) || (bottomExposed && !leftExposed && !rightExposed)) {
                        if (bounce.accel.y < 0) {
                            bounce.accel.y = 0;
                            bounce.velocity.y = 0;
                        }
                        bounce.y = wall.y + height + bounce.size;
                    } else {
                        if (!x || !y) {
                            if (bounce.x + bounce.y < wall.x + wall.y) { // top left
                                if (bounce.x - bounce.y < wall.x - wall.y) { // bottom left
                                    if (bounce.accel.x > 0) {
                                        bounce.accel.x = 0;
                                        bounce.velocity.x = 0;
                                    }
                                    bounce.x = wall.x - width - bounce.size;
                                } else { // top right
                                    if (bounce.accel.y > 0) {
                                        bounce.accel.y = 0;
                                        bounce.velocity.y = 0;
                                    }
                                    bounce.y = wall.y - height - bounce.size;
                                }
                            } else { // bottom right
                                if (bounce.x - bounce.y < wall.x - wall.y) { // bottom left
                                    if (bounce.accel.y < 0) {
                                        bounce.accel.y = 0;
                                        bounce.velocity.y = 0;
                                    }
                                    bounce.y = wall.y + height + bounce.size;
                                } else { // top right
                                    if (bounce.accel.x < 0) {
                                        bounce.accel.x = 0;
                                        bounce.velocity.x = 0;
                                    }
                                    bounce.x = wall.x + width + bounce.size;
                                }
                            }
                        } else if (point.isShorterThan(bounce.size) || !(left || right || top || bottom)) { } else {
                            intersected = false;
                        }
                    }
                    if (intersected) {
                        if (!bounce.godmode) {
                            if (!bounce.settings.bounceOnObstacles && (bounce.type === "bullet" || bounce.type === "trap")) {
                                bounce.kill();
                            } else {
                                room.wallCollisions.push({
                                    id: bounce.id,
                                    justForceIt: !(left || right || top || bottom) || point.isShorterThan(bounce.size),
                                    left: (left && !top && !bottom) || (leftExposed && !topExposed && !bottomExposed),
                                    right: (right && !top && !bottom) || (rightExposed && !topExposed && !bottomExposed),
                                    top: (top && !left && !right) || (topExposed && !leftExposed && !rightExposed),
                                    bottom: (bottom && !left && !right) || (bottomExposed && !leftExposed && !rightExposed)
                                });
                            }
                        }
                        /*if (bounce.type !== "bullet" && bounce.type !== "drone" && bounce.type !== "minion" && bounce.type !== "swarm" && bounce.type !== "trap") {
                            if (bounce.collisionArray.some(body => body.type === "mazeWall") && util.getDistance(wall, bounce) < wall.size * 1.25) bounce.kill();
                        } else bounce.kill();*/
                        bounce.collisionArray.push(wall);
                    }
                } else {
                    if (!bounce.godmode && !bounce.passive && !bounce.invuln) {
                        if (!bounce.theGreatestPlan) {
                            bounce.rewardManager(-1, "the_greatest_plan");
                            bounce.theGreatestPlan = true;
                        }
                        bounce.health.amount -= 1;
                    };
                }
            };

            /*
            const rectWallCollide = (wall, bounce) => {
                const width = wall.width ? wall.size * wall.width * 2 : wall.size * 2;
                const height = wall.height ? wall.size * wall.height * 2 : wall.size * 2;

                const diff_x = bounce.x - wall.x;
                const diff_y = bounce.y - wall.y;
                const av_width = (bounce.realSize * 2 + width) * 0.5;
                const av_height = (bounce.realSize * 2 + height) * 0.5;

                if (Math.abs(diff_x) > av_width || Math.abs(diff_y) > av_height) return;

                if (bounce.settings.isHelicopter) {
                    if (!bounce.godmode && !bounce.invuln) {
                        bounce.health.amount -= 1;
                    };
                } else {
                    if (Math.abs(diff_x / width) > Math.abs(diff_y / height)) {
                        if (diff_x < 0) {
                            bounce.x = wall.x - bounce.realSize - width * 0.5;
                            bounce.velocity.x = 0;
                            bounce.accel.x = Math.min(bounce.accel.x, 0);
                        } else {
                            bounce.x = wall.x + bounce.realSize + width * 0.5;
                            bounce.velocity.x = 0;
                            bounce.accel.x = Math.max(bounce.accel.x, 0);
                        }
                    } else {
                        if (diff_y < 0) {
                            bounce.y = wall.y - bounce.realSize - height * 0.5;
                            bounce.velocity.y = 0;
                            bounce.accel.y = Math.min(bounce.accel.y, 0);
                        } else {
                            bounce.y = wall.y + bounce.realSize + height * 0.5;
                            bounce.velocity.y = 0;
                            bounce.accel.y = Math.max(bounce.accel.y, 0);
                        }
                    }
    
                    if (!bounce.godmode && !bounce.settings.bounceOnObstacles && (bounce.type === "bullet" || bounce.type === "swarm" || bounce.type === "trap" || (bounce.type === "food" && !bounce.isNestFood) || bounce.type === "minion" || bounce.type === "drone")) {
                        bounce.kill();
                    } else room.wallCollisions.push({
                        id: bounce.id
                    });
                    bounce.collisionArray.push(wall);
                }
            }*/

            function moonCollide(moon, n) {
                let dx = moon.x - n.x,
                    dy = moon.y - n.y,
                    d2 = dx * dx + dy * dy,
                    totalRadius = moon.realSize + n.realSize;
                if (d2 > totalRadius * totalRadius) {
                    return;
                }
                let dist = Math.sqrt(d2),
                    sink = totalRadius - dist;
                dx /= dist;
                dy /= dist;
                n.accel.x -= dx * n.pushability * 0.05 * sink * room.speed;
                n.accel.y -= dy * n.pushability * 0.05 * sink * room.speed;
            }

            const growOnCollision = (instance, other) => {
                if (instance.SIZE >= other.SIZE) {
                    instance.SIZE += 7;
                    other.kill();
                } else {
                    other.SIZE += 7;
                    instance.kill();
                }
            };

            return (instance, other) => {
                if (
                    // Ghost busting
                    instance.isGhost || other.isGhost ||
                    // Passive bullshit
                    instance.passive || other.passive ||
                    // Passive bullshit
                    instance.isObserver || other.isObserver ||
                    // Inactive should be ignored
                    !instance.isActive || !other.isActive ||
                    // Multi-Room mechanics
                    (c.RANKED_BATTLE && instance.roomId !== other.roomId) ||
                    (c.SANDBOX && instance.sandboxId !== other.sandboxId) ||
                    // Forced no collision
                    instance.settings.hitsOwnType === "forcedNever" || other.settings.hitsOwnType === "forcedNever" ||
                    // Same master collisions
                    instance.master === other || other.master === instance
                ) {
                    return;
                }

                if (instance.x === other.x && instance.y === other.y) {
                    instance.x += other.size;
                    instance.y += other.size;
                    other.x -= other.size;
                    other.y -= other.size;
                    return;
                }

                let isSameTeam = (instance.team === other.team);

                switch (true) {
                    // Passive mode collisions
                    case (instance.passive || other.passive): {
                        if (instance.passive && other.passive && instance.settings.hitsOwnType === other.settings.hitsOwnType) {
                            switch (instance.settings.hitsOwnType) {
                                case "mountain":
                                    if (instance.master.id === other.master.id) growOnCollision(instance, other);
                                case "push":
                                    if (instance.master.id === other.master.id) advancedCollide(instance, other, false, false);
                                    break;
                                case "hard":
                                    firmCollide(instance, other);
                                    break;
                                case "hardWithBuffer":
                                    if (instance.master.id === other.master.id) firmCollide(instance, other, 30);
                                    break;
                                case "hardOnlyDrones":
                                    if (instance.master.id === other.master.id) firmCollide(instance, other);
                                    break;
                                case "stick":
                                    break;
                            }
                        }
                    } break;
                    // Dominator/Mothership collisions
                    case (isSameTeam && (instance.settings.hitsOwnType === "pushOnlyTeam" || other.settings.hitsOwnType === "pushOnlyTeam")): {
                        if (instance.settings.hitsOwnType === other.settings.hitsOwnType) return;
                        let pusher = instance.settings.hitsOwnType === "pushOnlyTeam" ? instance : other,
                            entity = instance.settings.hitsOwnType === "pushOnlyTeam" ? other : instance;
                        if (entity.settings.goThruObstacle || entity.type !== "tank" || entity.settings.hitsOwnType === "never") return;
                        if (entity.settings.isHelicopter) {
                            if (!entity.godmode && !entity.invuln) {
                                if (!entity.theGreatestPlan) {
                                    entity.rewardManager(-1, "the_greatest_plan");
                                    entity.theGreatestPlan = true;
                                }
                                entity.health.amount -= 1;
                            }
                            return;
                        }
                        let a = 1 + 10 / (Math.max(entity.velocity.length, pusher.velocity.length) + 10);
                        advancedCollide(pusher, entity, false, false, a);
                    } break;
                    // Normal Obstacle collisions
                    case (instance.type === "wall" || other.type === "wall"): {
                        let wall = instance.type === "wall" ? instance : other,
                            entity = instance.type === "wall" ? other : instance;
                        if (entity.settings.diesByObstacles) return entity.kill();
                        if (entity.settings.goThruObstacle || entity.type === "mazeWall" || entity.isDominator) return;
                        if (entity.settings.isHelicopter && !entity.godmode && !entity.invuln) {
                            if (!entity.theGreatestPlan) {
                                entity.rewardManager(-1, "the_greatest_plan");
                                entity.theGreatestPlan = true;
                            }
                            entity.health.amount -= 1;
                            return;
                        }
                        let a = entity.type === "bullet" || entity.type === "trap" ? 1 + 10 / (Math.max(entity.velocity.length, wall.velocity.length) + 10) : 1;
                        wall.shape === 0 ? moonCollide(wall, entity) : advancedCollide(wall, entity, false, false, a);
                    } break;
                    // Shield collisions
                    case (instance.settings.hitsOwnType === "shield" || other.settings.hitsOwnType === "shield"): {
                        if (isSameTeam || instance.master.id === other.master.id) return;
                        let shield = instance.settings.hitsOwnType === "shield" ? instance : other,
                            entity = instance.settings.hitsOwnType === "shield" ? other : instance;
                        if (entity.settings.goThruObstacle || entity.type === "wall" || entity.type === "food" || entity.type === "mazeWall" || entity.type === "miniboss" || entity.isDominator || entity.master.isDominator || shield.master.id === entity.id) return;
                        shieldCollide(shield, entity);
                        //advancedCollide(shield, entity, false, false, -1 - 10 / (Math.max(entity.velocity.length, shield.master.velocity.length) - 10));
                    } break;
                    // Maze Wall collisions
                    case (instance.type === "mazeWall" || other.type === "mazeWall"): {
                        if (instance.type === other.type) return;
                        let wall = instance.type === "mazeWall" ? instance : other,
                            entity = instance.type === "mazeWall" ? other : instance;
                        if (entity.settings.goThruObstacle || entity.type === "wall" || entity.isDominator /* || entity.type === "crasher"*/) return;
                        rectWallCollide(wall, entity);
                    } break;
                    // Crasher and Polygon collisions
                    case (instance.type === "crasher" && other.type === "food" || other.type === "crasher" && instance.type === "food"): {
                        firmCollide(instance, other);
                    } break;
                    // Player collision
                    case (!isSameTeam && !instance.hitsOwnTeam && !other.hitsOwnTeam):
                    case (isSameTeam && (instance.hitsOwnTeam || other.hitsOwnTeam) && instance.master.source.id !== other.master.source.id): {
                        advancedCollide(instance, other, true, true);
                    } break;
                    // Never collide
                    case (instance.settings.hitsOwnType === "never" || other.settings.hitsOwnType === "never"): { } break;
                    // Standard collision
                    case (instance.settings.hitsOwnType === other.settings.hitsOwnType && !instance.multibox.enabled && !other.multibox.enabled): {
                        switch (instance.settings.hitsOwnType) {
                            case "mountain":
                                if (instance.master.id === other.master.id) growOnCollision(instance, other);
                            case "push":
                                advancedCollide(instance, other, false, false);
                                break;
                            case "hard":
                                firmCollide(instance, other);
                                break;
                            case "hardWithBuffer":
                                if (instance.master.id === other.master.id) firmCollide(instance, other, 30);
                                break;
                            case 'spike':
                                spikeCollide(instance, other)
                                break
                            case "hardOnlyDrones":
                                if (instance.master.id === other.master.id) firmCollide(instance, other);
                                break;
                            case "hardOnlyTanks":
                                if (instance.type === "tank" && other.type === "tank" && !instance.isDominator && !other.isDominator && !instance.isInMyBase() && !other.isInMyBase()) firmCollide(instance, other);
                                break;
                            case "repel":
                                simpleCollide(instance, other);
                                break;
                            case "stick":
                                if ((other.type === "tank" || other.type === "crasher" || other.type === "food" || other.type === "mazeWall" || other.type === "obstacle" || instance.master.id === other.master.id) && !stuck) {
                                    instance.stuck = true;
                                    instance.stickHost = other;
                                    instance.stickX = instance.x;
                                    instance.stickY = instance.y;
                                    instance.stickF = instance.facing;
                                    let differ = Math.abs(other.facing - instance.facing);
                                    if (differ > 180) differ = 360 - differ;
                                    instance.stickRD = differ;
                                    let tdx = instance.x,
                                        tdy = instance.y;
                                    instance.stickDist = Math.sqrt((tdx^2) + (tdy^2))
                                }
                                break;
                        }
                    }
                }
                if (instance.onCollide) {
                    instance.onCollide(instance, other)
                }
                if (other.onCollide) {
                    other.onCollide(other, instance)
                }
            };
        })();
        const entitiesActivationLoop = my => {
            newLogs.activation.start();
            my.collisionArray = [];
            newLogs.activationUpdate.start();
            my.activation.update();
            const myIsActive = my.isActive;
            newLogs.activationUpdate.stop();
            newLogs.updateAABB.start();
            my.updateAABB(myIsActive);
            newLogs.updateAABB.stop();
            if (myIsActive) {
                if (!my.passive && !my.invuln && my.health.amount > 0 && Number.isFinite(my.dangerValue) && my.dangerValue > 0 && my.team !== -101 && targetableEntities.indexOf(my) === -1) {
                    targetableEntities.push(my);
                }
            }
            newLogs.activation.stop();
            return myIsActive;
        };
        const entitiesLiveLoop = my => {
            if (room.wallCollisions.length) {
                let walls = room.wallCollisions.filter(collision => collision.id === my.id);
                if (walls.length > 1) {
                    let collides = walls.some(wall => wall.justForceIt);
                    if (!collides) {
                        for (let i = 1; i < walls.length; i++) {
                            if ((walls[0].left && walls[i].right) || (walls[0].right && walls[i].left) || (walls[0].top && walls[i].bottom) || (walls[0].bottom && walls[i].top)) {
                                collides = true;
                                break;
                            }
                        }
                    }
                    if (collides) {
                        if (my.type !== "tank" && my.type !== "miniboss") {
                            my.killedByWalls = true;
                            my.kill();
                        }
                        my.health.amount -= 1;
                        if (my.health.amount <= 0) {
                            my.invuln = my.passive = my.godmode = false;
                            my.killedByWalls = true;
                        }
                    }
                }
            }
            if (my.death()) {
                my.destroy();
                return false;
            } else {
                if (my.bond == null) {
                    newLogs.physics.start();
                    my.physics();
                    newLogs.physics.stop();
                }
                newLogs.life.start();
                my.life();
                newLogs.life.stop();
                newLogs.location.start();
                my.location();
                newLogs.location.stop();
                my.friction();
                my.takeSelfie();
                my.lastSavedHealth = {
                    health: my.health.amount,
                    shield: my.shield.amount
                };
                return true;
            }
        };
        return () => {
            let start = performance.now();
            // Reset logging for this tick
            newLogs.location.reset();
            newLogs.death.reset();
            newLogs.life.reset();
            newLogs.destroy.reset();
            newLogs.activation.reset();
            //newLogs.activationUpdate.reset();
            //newLogs.updateAABB.reset();
            newLogs.controllers.reset();
            newLogs.moveFace.reset();
            newLogs.aspects.reset();
            newLogs.physics.reset();
            newLogs.camera.reset();
            newLogs.buildList.reset();
            newLogs.targeting.reset();
            newLogs.collision.reset();
            //newLogs.doMotion.reset();
            //newLogs.doDamage.reset();
            newLogs.entities.reset();
            newLogs.queryForCollisionPairs.reset();
            // Update sandbox rooms if we have to
            if (c.SANDBOX) {
                global.sandboxRooms.forEach(({ id }) => {
                    if (!clients.find(entry => entry.sandboxId === id)) {
                        global.sandboxRooms = global.sandboxRooms.filter(entry => entry.id !== id);
                        entities.forEach(o => {
                            if (o.sandboxId === id) {
                                o.kill();
                            }
                        });
                    }
                });
            }
            // I'm smort, so this is cool

            // Clear the grid
            grid.clear();

            // Add everyone to the grid
            newLogs.entities.start();
            entities.forEach(entity => {
                newLogs.activation.start();
                entity.activation();
                newLogs.activation.stop();
                if (entity.isActive && entitiesLiveLoop(entity)) {
                    if (!entity.neverInGrid) {
                        entity._AABB = grid.getAABB(entity);
                        grid.insert(entity);
                    }
                    if (!entity.passive && !entity.invuln && Number.isFinite(entity.dangerValue) && entity.dangerValue > 0 && entity.team !== -101 && targetableEntities.indexOf(entity) === -1) {
                        targetableEntities.push(entity);
                    }
                }
                entity.collisionArray = [];
                entity.collisionIDs = [];
            });

            room.wallCollisions = [];

            purgeEntities();
            targetableEntities = targetableEntities.filter(my => !my.isGhost && !my.isDead() && !my.passive && !my.invuln && my.health.amount > 0 && Number.isFinite(my.dangerValue) && my.team !== -101);
            newLogs.entities.stop();
            //targetingGrid.clear();

            // Update and collide!
            newLogs.collision.start();
            /*for (let i = 0, l = entities.length; i < l; i++) {
                if (entities[i].isActive && !entities[i].neverInGrid && entities[i]._AABB) {
                    newLogs.queryForCollisionPairs.start();
                    let pairs = grid.queryForCollisionPairs(entities[i]);
                    newLogs.queryForCollisionPairs.stop();
                    for (let other of pairs) {
                        if (entities[i].collisionIDs.includes(other.id) || other.collisionIDs.includes(entities[i].id)) {
                            continue;
                        }
                        entities[i].collisionIDs.push(other.id);
                        other.collisionIDs.push(entities[i].id);
                        collide(entities[i], other);
                    }
                }
            }*/
            entities.forEach(entity => {
                if (entity.isActive && !entity.neverInGrid && entity._AABB) {
                    newLogs.queryForCollisionPairs.start();
                    let pairs = grid.getCollisions(entity);
                    newLogs.queryForCollisionPairs.stop();
                    for (let other of pairs) {
                        if (entity.collisionIDs.includes(other.id) || other.collisionIDs.includes(entity.id)) {
                            continue;
                        }
                        entity.collisionIDs.push(other.id);
                        other.collisionIDs.push(entity.id);
                        collide(entity, other);
                    }
                }
            });
            newLogs.collision.stop();

            // Let's calculate entities and collision
            grid.clear();
            purgeEntities();


            // End smortness
            /*// Do collision
            if (entities.length > 1) {
                room.wallCollisions = [];
                newLogs.hshg.start();
                grid.update();
                grid.queryForCollisionPairs(collide);
                newLogs.hshg.stop();
            };
            // Update entities
            newLogs.entities.start();
            targetableEntities = targetableEntities.filter(my => my.isAlive() && !my.isDead() && !my.passive && !my.invuln && my.health.amount > 0 && Number.isFinite(my.dangerValue) && my.team !== -101);
            for (let i = 0, l = entities.length; i < l; i++) {
                entitiesLiveLoop(entities[i]);
            }*/
            room.lastCycle = util.time();
            room.mspt = performance.now() - start;
            const border = 1866
            if (c.serverName.includes("Boss Rush") && c.ISSIEGE) {
            entities.forEach (entity => {
              if (entity.x < border && entity.team != -100 && !entity.passive && !entity.godmode) {entity.kill()/*entity.x += 15*/}
              if (entity.type == 'miniboss' && entity.x < 5500) {entity.x += Math.random()*1.5}
              if (entity.SANCTUARY_TYPE != null && entity.x < border) {entity.x = (c.WIDTH-border) * Math.random() + border}
              if (entity.label.includes("Ascended") && entity.x < border) {entity.x = (c.WIDTH-border) * Math.random() + border}//fix ascended stuff not moving
                })
              }
        };
    })();

    const maintainLoop = (() => {
        global.placeObstacles = () => {
            if (room.modelMode) return;
            if (c.ARENA_TYPE === 1) {
                let o = new Entity({
                    x: room.width / 2,
                    y: room.height / 2
                });
                o.define(Class.moon);
                o.settings.hitsOwnType = "never";
                o.team = -101;
                o.protect();
                o.life();
            }
            const place = (loc, type) => {
                if(!type) return;
                let x = 0,
                    position;
                do {
                    position = room.randomType(loc);
                    x++;
                    if (x > 200) {
                        util.warn("Failed to place obstacles!");
                        return 0;
                    }
                } while (dirtyCheck(position, 10 + type.SIZE));
                let o = new Entity(position);
                o.define(type);
                o.team = -101;
                o.facing = ran.randomAngle();
                o.protect();
                o.life();
            }
            let roidCount = room.roid.length * room.width * room.height / room.xgrid / room.ygrid / 5e4 / 1.5,
                rockCount = room.rock.length * room.width * room.height / room.xgrid / room.ygrid / 25e4 / 1.5,
                count = 0;
            for (let i = Math.ceil(roidCount * .2); i; i--) {
                count++;
                place("roid", Class.megaObstacle);
            }
            for (let i = Math.ceil(roidCount); i; i--) {
                count++;
                place("roid", Class.obstacle);
            }
            for (let i = Math.ceil(roidCount * .4); i; i--) {
                count++;
                place("roid", Class.babyObstacle);
            }
            for (let i = Math.ceil(rockCount * .1); i; i--) {
                count++;
                place("rock", Class.megaObstacle);
            }
            for (let i = Math.ceil(rockCount * .2); i; i--) {
                count++;
                place("rock", Class.obstacle);
            }
            for (let i = Math.ceil(rockCount * .4); i; i--) {
                count++;
                place("rock", Class.babyObstacle);
            }
            //util.log("Placed " + count + " obstacles.");
        }
        global.generateMaze = roomId => {
            let locsToAvoid = c.MAZE.LOCS_TO_AVOID != null ? c.MAZE.LOCS_TO_AVOID : ["roid", "rock", "nest", "port", "domi", "edge"];
            for (let i = 1; i < 5; i++) locsToAvoid.push("bas" + i), locsToAvoid.push("n_b" + i), locsToAvoid.push("bad" + i), locsToAvoid.push("dom" + i);
            function makeMaze(config={}) {
                ////// Config
                const cellSize = config.cellSize || 500
                const stepOneSpacing = config.stepOneSpacing || 2
                const stepTwoFillChance = config.fillChance || 0
                const stepThreeSparedChance = config.sparedChance || 0
                const stepFourCavey = config.cavey || false
                const stepFiveLineAmount = config.lineAmount || false
                const posMulti = config.posMulti || 0.25
                const margin = config.margin || 0

                const widthCellAmount = Math.floor(room.width / cellSize)
                const heightCellAmount = Math.floor(room.height / cellSize)
                let maze = [];
                for (let i = 0; i < heightCellAmount; i++) {
                    maze.push((new Array(widthCellAmount)).fill(0))
                }
                ////// Creation
                //// Place the cells
                for (let y = 0; y < maze.length; y++) {
                    for (let x = 0; x < maze[0].length; x++) {
                        if (x % (1 + stepOneSpacing) === 0) {
                            if (maze[y * (stepOneSpacing + 1)]) maze[y * (stepOneSpacing + 1)][x] = 1
                        } else {
                            if (Math.random() < stepTwoFillChance) {
                                maze[y][x] = 1
                            }
                        }
                    }
                }
                //// Cull and fill the cells
                for (let y = 0; y < maze.length; y++) {
                    for (let x = 0; x < maze[0].length; x++) {
                        if (maze[y][x] === 1) {
                            let hasNeighbors = false
                            if (
                                (maze[y - 1] !== undefined && maze[y - 1][x]) ||
                                (maze[y + 1] !== undefined && maze[y + 1][x]) ||
                                (maze[y][x - 1] !== undefined && maze[y][x - 1]) ||
                                (maze[y][x + 1] !== undefined && maze[y][x + 1])
                            ) {
                                hasNeighbors = true
                            }
                            if (!hasNeighbors && Math.random() > stepThreeSparedChance) {
                                maze[y][x] = 0
                            }
                        } else { // maze[y][x] === 0
                            let missingNeighbors = 0
                            let missedNeighbor = [0, 0] // y, x
                            if (maze[y - 1] !== undefined && stepFourCavey != maze[y - 1][x]) {
                                missingNeighbors++
                                missedNeighbor = [-1, 0]
                            }
                            if (maze[y + 1] !== undefined && stepFourCavey != maze[y + 1][x]) {
                                missingNeighbors++
                                missedNeighbor = [1, 0]
                            }
                            if (maze[y][x - 1] !== undefined && stepFourCavey != maze[y][x - 1]) {
                                missingNeighbors++
                                missedNeighbor = [0, -1]
                            }
                            if (maze[y][x + 1] !== undefined && stepFourCavey != maze[y][x + 1]) {
                                missingNeighbors++
                                missedNeighbor = [0, 1]
                            }
                            if (stepFourCavey ? missingNeighbors <= 1 : missingNeighbors >= 3) {
                                maze[y][x] = 1
                                maze[y + missedNeighbor[0]][x + missedNeighbor[1]] = 1
                                y = 0
                                x = 0
                            }
                        }
                    }
                }

                //// Empty out specified areas
                for (let y = 0; y < maze.length; y++) {
                    for (let x = 0; x < maze[0].length; x++) {
                        if(margin){
                            // Margins
                            if (y <= margin) { // top
                                maze[y][x] = 0
                            }
                            if (y >= maze.length - 1 - margin) { // bottom
                                maze[y][x] = 0
                            }
                            if (x <= margin) { // left
                                maze[y][x] = 0
                            }
                            if (x >= maze[0].length - 1 - margin) { // right
                                maze[y][x] = 0
                            }
                        }
                        // Locs to avoid
                        let realSize = cellSize / 2
                        for (let loc of locsToAvoid) {
                            if (room.isIn(loc, {
                                    x: (x * cellSize + realSize) + cellSize * posMulti,
                                    y: (y * cellSize + realSize) + cellSize * posMulti
                                })) {
                                maze[y][x] = 0
                            }
                        }
                    }
                }

                //// Connect all the empty cells
                // Setup
                let tangents = {
                    ID_PICKER: 20
                }
                function getConnectedEmpties(y, x, tangentid) {
                    maze[y][x] = tangentid
                    tangents[tangentid].amount++
                    if (maze[y + 1] !== undefined && maze[y + 1][x] === 0) {
                        getConnectedEmpties(y + 1, x, tangentid)
                    }
                    if (maze[y - 1] !== undefined && maze[y - 1][x] === 0) {
                        getConnectedEmpties(y - 1, x, tangentid)
                    }
                    if (maze[y]?.[x + 1] !== undefined && maze[y][x + 1] === 0) {
                        getConnectedEmpties(y, x + 1, tangentid)
                    }
                    if (maze[y]?.[x - 1] !== undefined && maze[y][x - 1] === 0) {
                        getConnectedEmpties(y, x - 1, tangentid)
                    }
                }
                // Identify and record each tangent
                for (let y = 0; y < maze.length; y++) {
                    for (let x = 0; x < maze[0].length; x++) {
                        if (maze[y][x] === 0) {
                            let tangentid = tangents.ID_PICKER
                            tangents.ID_PICKER += 20
                            tangents[tangentid] = {
                                amount: 0,
                                point: [y, x] // [y, x]
                            }
                            getConnectedEmpties(y, x, tangentid)
                        }
                    }
                }
                delete tangents.ID_PICKER
                // Connect or fill the empty cells
                if (stepFiveLineAmount === false) { // Fill
                    let largestTangent = {
                        id: undefined,
                        amount: 0
                    };
                    for (let key in tangents) {
                        let data = tangents[key]
                        if (data.amount > largestTangent.amount) {
                            largestTangent.id = key
                            largestTangent.amount = data.amount
                        }
                    }
                    for (let y = 0; y < maze.length; y++) {
                        for (let x = 0; x < maze[0].length; x++) {
                            if (maze[y][x] > 1 && maze[y][x] != largestTangent.id) {
                                maze[y][x] = 1
                            }
                        }
                    }
                } else { // Connect
                    function bresenham(startX, startY, endX, endY) {
                        const deltaCol = Math.abs(endX - startX)
                        const deltaRow = Math.abs(endY - startY)
                        let pointX = startX
                        let pointY = startY
                        const horizontalStep = (startX < endX) ? 1 : -1
                        const verticalStep = (startY < endY) ? 1 : -1
                        const points = []
                        let difference = deltaCol - deltaRow
                        while (true) {
                            const doubleDifference = 2 * difference
                            if (doubleDifference > -deltaRow) {
                                difference -= deltaRow;
                                pointX += horizontalStep
                            } else if (doubleDifference < deltaCol) {
                                difference += deltaCol;
                                pointY += verticalStep
                            }
                            if ((pointX == endX) && (pointY == endY)) {
                                break
                            }
                            points.push([pointY, pointX])
                        }
                        return points
                    }
                    for (let key in tangents) {
                        let data = tangents[key]
                        let usedkeys = new Set()
                        usedkeys.add(key)
                        for (let i = 0; i < stepFiveLineAmount; i++) {
                            let shortestTangent = {
                                id: undefined,
                                dist: Infinity,
                                point: undefined
                            };
                            for (let key2 in tangents) {
                                if (usedkeys.has(key2)) continue;
                                let data2 = tangents[key2]
                                let dist = Math.sqrt((Math.pow(data.point[1] - data2.point[1], 2)) + (Math.pow(data.point[0] - data2.point[0], 2)))
                                if (dist < shortestTangent.dist) {
                                    shortestTangent.id = key2
                                    shortestTangent.dist = dist
                                    shortestTangent.point = data2.point
                                }
                            }
                            if (!shortestTangent.id) { // We are out of tangents
                                break;
                            }
                            usedkeys.add(shortestTangent.id)
                            let points = bresenham(data.point[1], data.point[0], shortestTangent.point[1], shortestTangent.point[0])
                            for (let point of points) {
                                maze[point[0]][point[1]] = 0
                            }
                        }
                    }
                }// Normalize the tangents
                for(let y = 0; y < maze.length; y++){
                    for(let x = 0; x < maze[0].length; x++){
                        if(maze[y][x] > 1) maze[y][x] = 0
                    }
                }

                //// Merge the maze walls
                let proxyGrid = []
                for (let part of maze) {
                    proxyGrid.push(new Array(part.length).fill(0))
                }
                let rects = {
                    ID: 1
                }
                function fillRect(y, x, id) {
                    if (
                        x < 0 || y < 0 ||
                        x >= proxyGrid[0].length || y >= proxyGrid.length ||
                        maze[y][x] !== 1 || proxyGrid[y][x] !== 0 ||
                        x > rects[id].maxX || y > rects[id].maxY
                    ) return;

                    proxyGrid[y][x] = id;

                    if (maze[y + 1]?.[x] === 0 || (proxyGrid[y + 1]?.[x] !== 0 && proxyGrid[y][x + 1] !== id)) {
                        rects[id].maxY = y
                    }
                    if (maze[y][x + 1] === 0 || (proxyGrid[y][x + 1] !== 0 && proxyGrid[y][x + 1] !== id)) {
                        rects[id].maxX = x
                    }

                    fillRect(y, x + 1, id); // Right
                    fillRect(y + 1, x, id); // Down
                }

                for (let y = 0; y < maze.length; y++) {
                    for (let x = 0; x < maze[0].length; x++) {
                        if (maze[y][x] !== 1 || proxyGrid[y][x] !== 0) continue;

                        let id = rects.ID++
                        rects[id] = {
                            maxX: proxyGrid[0].length - 1,
                            maxY: proxyGrid.length - 1
                        }
                        fillRect(y, x, id);
                        // clean up spillage
                        for (let y2 = 0; y2 < proxyGrid.length; y2++) {
                            for (let x2 = 0; x2 < proxyGrid[0].length; x2++) {
                                if (proxyGrid[y2][x2] !== id) continue;
                                if (y2 > rects[id].maxY) {
                                    proxyGrid[y2][x2] = 0;
                                    continue;
                                }
                                if (x2 > rects[id].maxX) {
                                    proxyGrid[y2][x2] = 0;
                                    continue;
                                }
                            }
                        }

                    }
                }

                // gather the wall data
                let handledIds = new Set()
                handledIds.add(0)
                for (let y = 0; y < proxyGrid.length; y++) {
                    for (let x = 0; x < proxyGrid[0].length; x++) {
                        if (handledIds.has(proxyGrid[y][x])) continue;
                        handledIds.add(proxyGrid[y][x])
                        rects[proxyGrid[y][x]].firstOccurrence = [y, x]
                    }
                }
                delete rects.ID

                //// Place the walls
                for (let key in rects) {
                    let wallData = rects[key]

                    let width = 1 + wallData.maxX - wallData.firstOccurrence[1]
                    let height = 1 + wallData.maxY - wallData.firstOccurrence[0]
                    let x = wallData.firstOccurrence[1] * cellSize
                    let y = wallData.firstOccurrence[0] * cellSize
                    let realSize = cellSize / 2

                    let o = new Entity({
                        x: (x + realSize * width) + cellSize*posMulti,
                        y: (y + realSize * height) + cellSize*posMulti
                    });
                    o.define(Class.mazeObstacle);
                    o.SIZE = realSize
                    o.width = width + 0.05
                    o.height = height + 0.05
                    o.team = -101;
                    o.alwaysActive = true;
                    o.isActive = true;
                    o.settings.canGoOutsideRoom = true;
                    o.godmode = true
                    o.protect();
                    o.life();
                }
            }
            makeMaze(c.MAZE)
        }
        if (!room.modelMode) placeObstacles();
        if (c.MAZE.ENABLED) {
            global.generateMaze();
        }
        const spawnBosses = (() => {
            let timer = 0;
            const boss = (() => {
                let i = 0,
                    names = [],
                    bois = [Class.egg],
                    n = 0,
                    begin = "Placeholder message for spawnBosses.begin()",
                    arrival = "Placeholder message for spawnBosses.arrival()",
                    loc = "norm";
                const spawn = () => {
                    let spot,
                        max = 150;
                    do spot = room.randomType(loc);
                    while (dirtyCheck(spot, 500) && max-- > 0);
                    let o = new Entity(spot);
                    o.define(ran.choose(bois));
                    o.team = -100;
                    o.name = names[i++];
                };
                return {
                    prepareToSpawn: (classArray, number, nameClass, typeOfLocation = "norm") => {
                        n = number;
                        bois = classArray;
                        loc = typeOfLocation;
                        names = ran.chooseBossName(nameClass, number);
                        i = 0;
                        if (n === 1) {
                            begin = "A boss is coming...";
                            arrival = names[0] + " has arrived!";
                        } else {
                            begin = "Bosses are coming...";
                            arrival = "";
                            for (let i = 0; i < n - 2; i++) arrival += names[i] + ", ";
                            arrival += names[n - 2] + " and " + names[n - 1] + " have arrived!";
                        }
                    },
                    spawn: () => {
                        sockets.broadcast(begin);
                        for (let i = 0; i < n; i++) setTimeout(spawn, ran.randomRange(3500, 5000));
                        setTimeout(() => sockets.broadcast(arrival), 5000);
                        util.spawn(arrival);
                    }
                };
            })();
            return census => {
                if (timer > c.BOSS_SPAWN_TIMER && ran.dice(3 * c.BOSS_SPAWN_TIMER - timer)) {
                    util.spawn("Preparing to spawn bosses...");
                    timer = 0;
                    let bosses = [
                        [{ // Elite
                            spawn: [
                                Class.eliteDestroyerAI,
                                Class.eliteGunnerAI,
                                Class.eliteSprayerAI,
                                Class.eliteTwinAI,
                                Class.eliteMachineAI,
                                Class.eliteTrapAI,
                                Class.eliteBorerAI,
                                Class.eliteSniperAI,
                                Class.eliteBasicAI,
                                Class.eliteInfernoAI,
                                Class.skimBossAI,
                                Class.cutterAI
                            ],
                            amount: Math.floor(2 * Math.random()) + 1,
                            nameType: 'a',
                            spawnsAt: 'nest',
                            broadcast: `A stirring in the distance...`,
                            chance: 80
                        }, {
                            spawn: [
                                Class.ultimateAI,
                                Class.ultMultitoolAI,
                                Class.eliteRifleAI2
                            ],
                            amount: 1,
                            nameType: 'a',
                            spawnsAt: 'nest',
                            broadcast: 'The elites have something prepared...',
                            chance: 20
                        }], [{ // Dead
                            spawn: [
                                Class.fallenBoosterAI,
                                Class.fallenOverlordAI,
                                Class.fallenPistonAI,
                                Class.fallenAutoTankAI,
                                Class.fallenCavalcadeAI,
                                Class.fallenFighterAI,
                                Class.fallenDrifterAI
                            ],
                            amount: Math.floor(3 * Math.random()) + 1,
                            nameType: 'a',
                            spawnsAt: 'norm',
                            broadcast: `The dead are rising...`,
                            chance: 65
                        }, {
                            spawn: [
                                Class.reanimFarmerAI,
                                Class.reanimHeptaTrapAI,
                                Class.reanimUziAI,
                                Class.reanimBiohazardAI
                            ],
                            amount: 1,
                            nameType: 'a',
                            spawnsAt: 'norm',
                            broadcast: `Many had sought for the day that they would return... Just not in this way...`,
                            chance: 35
                        }], [{ // Polygon
                            spawn: [
                                Class.leviathanAI,
                                Class.nailerAI,
                                Class.gravibusAI,
                                Class.eggQueenTier1AI,
                                Class.demolisherAI,
                                Class.eggQueenTier2AI,
                                Class.conquistadorAI,
                                Class.hexadecagorAI,
                                Class.derogatorAI,
                                Class.octogeddonAI, // add rogue version
                                Class.octagronAI, // add rogue version
                                Class.palisadeAI // add rogue version
                            ],
                            amount: Math.floor(3 * Math.random()) + 1,
                            nameType: 'castle',
                            spawnsAt: 'norm',
                            broadcast: `A strange trembling...`,
                            chance: 50
                        }, {
                            spawn: [
                                Class.guardianAI,
                                Class.summonerAI,
                                Class.defenderAI
                            ],
                            amount: 3,
                            nameType: 'a',
                            spawnsAt: 'nest',
                            broadcast: `The original trio...`,
                            chance: 34.5
                        }, {
                            spawn: [
                                Class.constAI,
                                Class.bowAI,
                                Class.xyvAI
                            ],
                            amount: 1,
                            nameType: 'castle',
                            spawnsAt: 'norm',
                            broadcast: `A grand disturbance is on the horizon...`,
                            chance: 14.5
                        }, {
                            spawn: [
                                Class.greenGuardianAI,
                                Class.s2_22AI,
                                Class.at4_bwAI,
                                Class.hb3_37AI
                            ],
                            amount: 1,
                            nameType: 'a',
                            spawnsAt: 'nest',
                            broadcast: `Security protocol initiated...`,
                            chance: 1
                        }], [{ // Crasher
                            spawn: [
                                Class.trapeFighterAI,
                                Class.visUltimaAI,
                                Class.gunshipAI,
                                Class.messengerAI,
                                Class.pulsarAI,
                                Class.colliderAI,
                                Class.deltrabladeAI,
                                Class.alphaSentryAI,
                                Class.constructionistAI,
                                Class.vanguardAI,
                                Class.magnetarAI,
                                Class.kioskAI,
                                Class.aquamarineAI,
                                Class.blitzkriegAI,
                                Class.sliderAI,
                                Class.trapperzoidAI,
                                Class.quasarAI,
                                Class.bluestarAI,
                                Class.rs1AI,
                                Class.rs2AI,
                                Class.curveplexAI,
                                Class.streakAI,
                                Class.goldenStreakAI
                            ],
                            amount: Math.floor(3 * Math.random()) + 1,
                            nameType: 'castle',
                            spawnsAt: 'norm',
                            broadcast: `Influx detected...`,
                            chance: 90
                        }, {
                            spawn: [
                                Class.cupidAI
                            ],
                            amount: 1,
                            nameType: 'all',
                            spawnsAt: 'nest',
                            broadcast: `He is thy who guards the nest with love...`,
                            chance: 10
                        }], [{ // Artificial
                            spawn: [
                                Class.cometAI,
                                Class.brownCometAI,
                                Class.atriumAI,
                                Class.dropshipAI,
                                Class.asteroidAI
                            ],
                            amount: 1,
                            nameType: 'castle',
                            spawnsAt: 'nest',
                            broadcast: `You're gonna regret this...`,
                            chance: 70
                        }, {
                            spawn: [
                                Class.orangicusAI,
                                Class.applicusAI,
                                Class.lemonicusAI,
                                Class.lavendicusAI
                            ],
                            amount: 1,
                            nameType: 'castle',
                            spawnsAt: 'norm',
                            broadcast: `Smells like fruit...`,
                            chance: 10
                        }, {
                            spawn: [
                                Class.sassafrasAI
                            ],
                            amount: 1,
                            nameType: 'sassafras',
                            spawnsAt: ["roid", "rock"][Math.floor(2 * Math.random())],
                            broadcast: `i like crackers`,
                            chance: 10
                        }, {
                            spawn: [
                                Class.snowflakeAI
                            ],
                            amount: 1,
                            nameType: 'castle',
                            spawnsAt: 'nest',
                            broadcast: `Ice age coming, ice age coming...`,
                            chance: 10
                        }], [{ // Army
                            spawn: [
                                Class.armySentrySwarmAI,
                                Class.armySentryGunAI,
                                Class.armySentryTrapAI,
                                Class.armySentryRangerAI,
                                Class.armySentryBlastAI,
                                Class.armySentrySwarmAI,
                                Class.armySentryGunAI,
                                Class.armySentryTrapAI,
                                Class.armySentryRangerAI,
                                Class.armySentryBlastAI
                            ],
                            amount: 10,
                            nameType: 'castle',
                            spawnsAt: 'nest',
                            broadcast: `Sentries unite...`,
                            chance: 100
                        }], [{// Radioactive
                            spawn: [
                                Class.acedixAI,
                                Class.nitriceAI
                            ],
                            amount: Math.floor(Math.random()) + 1,
                            nameType: 'radioactive',
                            spawnsAt: 'nest',
                            broadcast: `High radiation levels detected.`,
                            chance: 100
                        }], [{// Fallen Polygons
                            spawn: [
                                Class.fallenCrasher
                            ],
                            amount: rnd(3,5),
                            nameType: 'all',
                            spawnsAt: 'nest',
                            broadcast: `Tortured by all, they have returned to destroy...`,
                            chance: 100
                        }]
                    ];

                    let chosen = (() => {
                        let choice = bosses[Math.floor(Math.random() * bosses.length)];
                        let random = Math.random() * 100 + 1;
                        let chanceAmount = choice[0].chance;
                        let i;

                        for (i = 0; i < choice.length; i++) {
                            if (chanceAmount > random) break;
                            chanceAmount += choice[i + 1].chance;
                        }

                        return choice[i];
                    })();

                    sockets.broadcast(chosen.broadcast);

                    boss.prepareToSpawn(chosen.spawn, chosen.amount, chosen.nameType, chosen.spawnsAt);
                    setTimeout(boss.spawn, 3000);
                } else if (!census.miniboss) timer++;
            };
        })();

        class Spawner {
    constructor(entities) {
        this.entities = [];
        for (let entity of entities) {
            if (typeof entity === "string") {
                this.entities.push(entity)
                continue;
            }
            while (entity[1]--) {
                this.entities.push(entity[0])
            }
        }
        this.bias = 0
        this.biasInfluence = 1
    }
    getEntity() { // Chance to get that entity gets lower the further down it is
        return this.entities[Math.min(Math.random() * this.entities.length * (1 - Math.random() * this.biasInfluence) | 0, this.entities.length-1)]
    }
}


        const SancSpawner = new Spawner([
    ["eggSanctuary", 3],
    ["squareSanctuary", 3],
    ["triSanctuary", 2],
    "pentaSanctuary",
    "alphaCrasher",
    "bowedSanc",
    "sunKing",
    "snowballSanctuary"
]);
        let sancCooldown = 0
        const spawnSancs = (census, id) => {
            if (room.modelMode || (Date.now()-sancCooldown < c.TIME_BETWEEN_SANCS)) return;
            if (census.sancs < room.maxSancs) {
                let spot,
                    max = 10;
                do spot = room.randomType("norm");
                while (dirtyCheck(spot, 120) && max-- > 0);

                let sanc = SancSpawner.getEntity();

                let o = new Entity(spot);
                o.define(Class[sanc]);
                o.team = -100;
                o.facing = ran.randomAngle()
                let ogOnDead = o.onDead
                o.onDead = () => {
                    sancCooldown = Date.now()
                    ogOnDead()
                }
                o.sandboxId = id
            }
        }
    let crasherList = [
        // CRASHERS
        "crasher",
        "semiCrushCrasher",
        "semiCrushCrasher0",
        "semiCrushCrasher14",
        "fastCrasher",
        "longCrasher",
        "minesweepCrasher",
        "bladeCrasher",
        "invisoCrasher",
        "grouperSpawn",
        "tramplerSpawn",
        "curvyBoy",
        "kamikazeCrasher",
        "wallerCrasher",
        "redRunner1",
        "redRunner2",
        //"redRunner3",
        //"redRunner4",
        "iceCrusher",
        "greenRunner",
        "destroyCrasher",
        "asteroidCrasher",
        "prismarineCrash", 
        "busterCrasher",
        //"boomCrasher",
        //"poisonBlades",
        //"visDestructia",
        //"megaCrushCrasher",
        "walletCrasher",
        "blueRunner",
        //"torchKamikaze",
        "orbitcrasher",
        //"seerCrasher",
        //"tridentCrasher",
        "clasherCrasher",
        "eggCrasher",
        "summonerSquare",
        "triangleCrasher",
        "pentagonCrasher",
        "hexagonCrasher",
        "heptagonCrasher",
        "diamondCrasher1",//,
        //"diamondCrasher2",
        //"diamondCrasher3",
        //"diamondCrasher4"
        "sapphireCrash",
        //"visOccultatum"
        "yellowRunner", // dasher + crusher but no fragmentation
        "tetraBlades", // tri-blade but better
        "heartCrasher", // i wuv u - heart crasher 
        "dacaeInactive", // i sleep
        "wraithCrash",
        "ghoulCrash"
    ];
    // let crasherTimesRarity = 2;
    let sentryList = [
          // SENTRIES
        "sentryAI",
        "sentrySwarmAI",
        "sentryTrapAI",
        "sentryGunAI",
        "sentryRangerAI",
        "flashSentryAI",
        "semiCrushSentryAI",
        "crushSentryAI",
        "bladeSentryAI",
        "skimSentryAI",
        "squareSwarmerAI",
        "squareGunSentry",
        "crusaderCrash",
        "greenSentrySwarmAI",
        "awp39SentryAI",
        "flashGunnerAI",
        "scorcherSentryAI",
        "diamondSentryAI", // kinda op ngl
        "conjLiteAI",
        //"crasherHive", broken fy
        "scoutBoosterAI",
        "scoutGunAI",
        "scoutStealthAI",
        "convoySpawn",
        "vedetteRangerAI",
        "vedetteDistressAI",
        "vedetteAmbushAI",
        "sentinelMinigunAI",
        "sentinelMissileAI",
        "sentinelCrossbowAI",
        "outpostFortressAI",
        "outpostCrabAI",
        "outpostColonyAI",
        "greenRunnerSentryAI"
    ];
    let nestGuardsSpawnList;
    nestGuardsSpawnList = crasherList.concat(sentryList);
        const CrasherSpawner = new Spawner(crasherList);
        const SentrySpawner = new Spawner(sentryList);
        const spawnCrasher = (census, id) => {
            let sentrySpawn = Math.random() >= 2/3;
            if (room.modelMode) return;
            if (census.crasher < room.maxCrashers) {
                let spot,
                    max = 10;
                do spot = room.randomType("nest");
                while (dirtyCheck(spot, 30) && max-- > 0);
                let crasher = sentrySpawn ? SentrySpawner.getEntity() : CrasherSpawner.getEntity();
                let times = Math.random()>0.25 ? 1 : (Math.random()*(sentrySpawn ? 2 : 4)|0)+1;
                for (let i = 0; i < times; i++) {
                    let o = new Entity(spot);
                    o.define(Class[crasher], ran.chance(c.SHINY_CHANCE)?{isShiny: true}:{});
                    o.team = -100;
                    o.damage *= 1 / 2;
                    if (!o.dangerValue) {
                        o.dangerValue = 3 + Math.random() * 3 | 0;
                    }
                    o.sandboxId = id
                }
            }
        };
        const makeNPCs = (() => {
            if (room.modelMode) return;
            if (c.serverName.includes("Boss")) {
                let sanctuaries = 0;
                let spawn = (loc, team) => {
                    let o = new Entity(loc);
                    o.define(Class[team === -1 ? "trapperDominatorAISanctuaryNerf" : "dominatorNerf"]);
                    o.team = team;
                    o.color = getTeamColor(team);
                    o.skill.score = 111069;
                    //o.name = "Dominator";
                    //o.SIZE = c.WIDTH / c.X_GRID / 10;
                    o.isDominator = true;
                    o.controllers = [new ioTypes.nearestDifferentMaster(o), new ioTypes.spinWhileIdle(o)];
                    o.onDead = function () {
                        if (o.team === -100) {
                            spawn(loc, -1);
                            room.setType("bas1", loc);
                            sockets.broadcast("A dominator has been captured by BLUE!");
                            if (sanctuaries < 1) {
                                sockets.broadcast("The game is saved!");
                            }
                            sanctuaries++;
                        } else {
                            sanctuaries--;
                            if (sanctuaries < 1) {
                                const losingIndex = rnd(0,4)
                                const losing = [
                                    ['Your team will lose in 90 seconds!', `${i} seconds until your team loses!`, 'Your team has lost! Arena closure will begin shortly.'],
                                    ['Your team dies in 90 seconds!', `${i} until your team dies!`, 'Your team has died! The fog is coming.'],
                                    ['CHAOS ENSUES IN 90 SECONDS', `${i} SECONDS UNTIL CHAOS ENSUES`, 'YOU HAVE DIED. THEY ARE COMING'],
                                    ['death in 90s', `${i}s 'til death'`, 'death. ac is coming'],
                                    ['Your team must retreat in 90 seconds unless sanctuaries are restored!', `${i} seconds until your team retreats unless sanctuaries are restored!`, 'Your team is retreating! Air conditioning!']
                                ]
                                sockets.broadcast(losing[losingIndex][0]);
                                function tick(i) {
                                    if (sanctuaries > 0) {
                                        return;
                                    }
                                    if (i <= 0) {
                                        sockets.broadcast(losing[losingIndex][2]);
                                        setTimeout(closeArena, 2500);
                                        return;
                                    }
                                    if (i % 15 === 0 || i <= 10) {
                                        sockets.broadcast(losing[losingIndex][1]);
                                    }
                                    setTimeout(function retick() {
                                        tick(i - 1);
                                    }, 1000);
                                }
                                tick(91);
                            }
                            spawn(loc, -100);
                            room.setType("domi", loc);
                            sockets.broadcast("A dominator has been captured by the bosses!");
                        }
                    }
                }
                for (let loc of room["bas1"]) {
                    sanctuaries++;
                    spawn(loc, -1);
                }
                bossRushLoop();
            }
            if (room.gameMode === "tdm" && c.DO_BASE_DAMAGE && !c.serverName.includes("Boss Rush")) {
                let spawnBase = (loc, team, type) => {
                    let o = new Entity(loc);
                    o.define(type);
                    o.team = -team;
                    o.color = [10, 12, 11, 15, 3, 35, 36, 0][team - 1];
                    o.onDead = () => spawnBase(loc, team, type);
                }
                for (let i = 1; i < room.teamAmount + 1; i++) {
                    for (let loc of room["bas" + i]) {
                        spawnBase(loc, i, Class.baseProtector);
                    }
                    for (let loc of room["bad" + i]) {
                        spawnBase(loc, i, Class.baseDroneSpawner);
                    }
                }
                if ((c.serverName.includes("Domination") || c.SPAWN_DOMINATORS) && room.domi.length > 0) (new Domination()).init();
                if (c.SOCCER) soccer.init();
                if (c.serverName.includes("Mothership"))
                    for (let i = 1; i < room.teamAmount + 1; i++)
                        for (let loc of room["mot" + i]) mothershipLoop(loc, i);
            }
            if (c.serverName.includes("Void Walkers")) {
                util.log("Initializing Void Walkers")
                voidwalkers()
            }

            return () => {
                if (!room.arenaClosed && !room.modelMode && !c.RANKED_BATTLE){
                    if (c.SANDBOX) {
                        for (let i = 0; i < global.sandboxRooms.length; i++) {
                            let room = global.sandboxRooms[i];
                            //// Sandbox census
                            let census = {
                                crasher: 0,
                                miniboss: 0,
                                tank: 0,
                                trap: 0
                            }
                            entities.forEach(instance => {
                                if (instance.sandboxId === room.id && census[instance.type] != null) census[instance.type]++;
                            });

                            if(room.spawnCrashers)spawnCrasher(census, room.id);
                            //spawnBosses(census, room.id); Not in sandbox

                            //// The rest of the sandbox stuff like bots and buttons
                            // Set up dummies
                            if (!room.didSetUp) {
                                room.didSetUp = true

                                function spawnDpsButton() {
                                    const button = new Entity({
                                        x: 500,
                                        y: 500
                                    });
                                    button.define(Class.button);
                                    button.pushability = button.PUSHABILITY = 0;
                                    button.godmode = true
                                    button.team = -101;
                                    button.totalDamage = 0
                                    button.averageDps = []
                                    button.lastHitTime = Date.now()
                                    button.sandboxId = room.id
                                    button.settings.noNameplate = false
                                    button.type = "utility"
                                    button.hitsOwnType = "never"
                                    button.settings.leaderboardable = false
                                    button.SIZE = 50
                                    button.DAMAGE = 15
                                    button.onDamaged = function (me, them, amount) {
                                        if (!amount) return;
                                        button.totalDamage += amount
                                    }
                                    button.onTick = function () {
                                        if (Date.now() - button.lastHitTime > 1000) {
                                            button.lastHitTime = Date.now()

                                            if (button.averageDps.length > 6) {
                                                button.averageDps.shift()
                                            }
                                            button.averageDps.push(button.totalDamage)

                                            button.name = `${(button.averageDps.reduce((total, value) => total + value, 0) / button.averageDps.length).toFixed(2)} Average DPS`
                                            button.totalDamage = 0
                                        }
                                    }
                                    button.onDead = spawnDpsButton
                                    button.refreshBodyAttributes();
                                }
                                spawnDpsButton()

                                let explainText = new Entity({
                                    x: -45,
                                    y: -75
                                })
                                explainText.define(Class.text)
                                explainText.name = "Ram into the buttons to press them"
                                explainText.size = 20
                                explainText.sandboxId = room.id

                                function spawnBotButton(status) {
                                    const button = new Entity({
                                        x: -45,
                                        y: -30
                                    });
                                    button.define(Class.button);
                                    button.pushability = button.PUSHABILITY = 0;
                                    button.godmode = true
                                    button.REGEN = 1000000
                                    button.team = -101;
                                    button.totalDamage = 0
                                    button.averageDps = []
                                    button.lastHitTime = Date.now()
                                    button.sandboxId = room.id
                                    button.settings.noNameplate = false
                                    button.type = "utility"
                                    button.hitsOwnType = "never"
                                    button.settings.leaderboardable = false
                                    button.color = status ? 11 : 12
                                    button.name = status ? "Bots enabled" : "Bots disabled"
                                    if (status) {
                                        room.botCap = 3
                                    } else {
                                        room.botCap = 0
                                    }
                                    button.onDamaged = function (me, them, amount) {
                                        if (!them.isPlayer) {
                                            return
                                        }
                                        me.kill()
                                    }
                                    button.onDead = () => {
                                        setTimeout(() => {
                                            spawnBotButton(!status)
                                        }, 1000)
                                    }
                                    button.refreshBodyAttributes();
                                }
                                spawnBotButton(false)

                                function crasherSpawningButton(status) {
                                    const button = new Entity({
                                        x: -45,
                                        y: 60
                                    });
                                    button.define(Class.button);
                                    button.pushability = button.PUSHABILITY = 0;
                                    button.godmode = true
                                    button.team = -101;
                                    button.totalDamage = 0
                                    button.averageDps = []
                                    button.lastHitTime = Date.now()
                                    button.sandboxId = room.id
                                    button.settings.noNameplate = false
                                    button.type = "utility"
                                    button.hitsOwnType = "never"
                                    button.settings.leaderboardable = false
                                    button.color = status ? 11 : 12
                                    button.name = status ? "Crashers enabled" : "Crashers disabled"
                                    if (status) {
                                        room.spawnCrashers = true
                                    } else {
                                        room.spawnCrashers = false
                                    }
                                    button.onDamaged = function (me, them, amount) {
                                        if (!them.isPlayer) {
                                            return
                                        }
                                        me.kill()
                                    }
                                    button.onDead = () => {
                                        setTimeout(() => {
                                            crasherSpawningButton(!status)
                                        }, 1000)
                                    }
                                    button.refreshBodyAttributes();
                                }
                                crasherSpawningButton(false)

                                function foodSpawningButton(status) {
                                    const button = new Entity({
                                        x: -45,
                                        y: 150
                                    });
                                    button.define(Class.button);
                                    button.pushability = button.PUSHABILITY = 0;
                                    button.godmode = true
                                    button.team = -101;
                                    button.totalDamage = 0
                                    button.averageDps = []
                                    button.lastHitTime = Date.now()
                                    button.sandboxId = room.id
                                    button.settings.noNameplate = false
                                    button.type = "utility"
                                    button.hitsOwnType = "never"
                                    button.settings.leaderboardable = false
                                    button.color = status ? 11 : 12
                                    button.name = status ? "Food enabled" : "Food disabled"
                                    if (status) {
                                        room.spawnFood = true
                                    } else {
                                        room.spawnFood = false
                                    }
                                    button.onDamaged = function (me, them, amount) {
                                        if (!them.isPlayer) {
                                            return
                                        }
                                        me.kill()
                                    }
                                    button.onDead = () => {
                                        setTimeout(() => {
                                            foodSpawningButton(!status)
                                        }, 1000)
                                    }
                                    button.refreshBodyAttributes();
                                }
                                foodSpawningButton(true)
                            }

                            // Do bots, remove dead ones first
                            room.bots = room.bots.filter(e => {
                                return !e.isDead();
                            });
                            if (room.bots.length < room.botCap && !global.arenaClosed) {
                                for (let j = room.bots.length; j < room.botCap; j++) {
                                    if (Math.random() > .5) {
                                        const bot = spawnBot(null);
                                        bot.sandboxId = room.id;
                                        room.bots.push(bot);
                                    }
                                }
                            }
                            let botIndex = 0
                            for (let o of room.bots) {
                                if (room.bots.length > room.botCap) {
                                    o.kill()
                                    room.bots.splice(botIndex, 1)
                                }
                                if (o.skill.level < 60) {
                                    o.skill.score += 35;
                                    o.skill.maintain();
                                }
                                if (o.upgrades.length && Math.random() > 0.5 && !o.botDoneUpgrading) {
                                    o.upgrade(Math.floor(Math.random() * o.upgrades.length));
                                    if (Math.random() > .9) {
                                        o.botDoneUpgrading = true;
                                    }
                                }
                                botIndex++
                            }
                        }
                    } else {
                        let census = {
                            crasher: 0,
                            miniboss: 0,
                            tank: 0,
                            sancs: 0
                        };

                        entities.forEach(instance => {
                            if (census[instance.type] != null) {
                                census[instance.type]++;
                            } else if (instance.sanctuaryType !== "None" || instance.miscIdentifier === "Sanctuary Boss") {
                                census.sancs++
                            }
                        });

                        spawnCrasher(census);
                        spawnBosses(census);
                        spawnSancs(census)

                        if (room.maxBots > 0) {
                            bots = bots.filter(body => !body.isGhost && body.isAlive());
                            if (bots.length < room.maxBots) spawnBot();
                            for (let o of bots) {
                                if (o.skill.level < 60) {
                                    o.skill.score += 35;
                                    o.skill.maintain();
                                }
                                /*if (o.upgrades.length && Math.random() > .15 && !o.botDoneUpgrading) {
                                    o.upgrade(Math.floor(Math.random() * o.upgrades.length));
                                    if (Math.random() > .999) {
                                        o.botDoneUpgrading = true;
                                    }
                                }*/
                            }
                        }
                    }
                }
            };
        })();
        const createFood = (() => {
            function spawnSingle(location, type, id) {
                if (c.SANDBOX && global.sandboxRooms.length < 1) {
                    return {};
                }
                let o = new Entity(location);
                o.define(Class[type], ran.chance(c.SHINY_CHANCE)?{isShiny: true}:{});
                o.ACCELERATION = .015 / (o.size * 0.2);
                o.facing = ran.randomAngle();
                o.team = -100;
                o.PUSHABILITY *= .5;
                if (c.SANDBOX) {
                    o.sandboxId = id || ran.choose(global.sandboxRooms).id;
                }
                o.refreshBodyAttributes()
                return o;
            };

            const FoodSpawner = new Spawner([
    // Normal
    "egg",
    "square",
    "triangle",
    "pentagon",
    "smallHexagon",
    "smallHeptagon"
])
            function spawnFood(id){
                let location, i = 8;
                do {
                    if (!i--) return;
                    location = room.random();
                }while (dirtyCheck(location, 100) && room.isIn("nest", location));

                // Spawn groups of food
                for (let i = 0, amount = (Math.random() * 20) | 0; i < amount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    spawnSingle({
                    x: location.x + Math.cos(angle) * (Math.random() * 50),
                    y: location.y + Math.sin(angle) * (Math.random() * 50)
                    }, FoodSpawner.getEntity(), id);
                }
            }

            const NestSpawner = new Spawner([
    "pentagon",
    "smallHexagon",
    "smallHeptagon",
    "betaPentagon",
    "alphaPentagon",
    "splitterPentagon"
])
            function spawnNestFood(id) {
                let location, i = 8;
                do {
                    if (!i--) return;
                    location = room.randomType("nest");
                } while (dirtyCheck(location, 100))
                let shape = spawnSingle(location, NestSpawner.getEntity(), id);
                shape.isNestFood = true;
            }
            return () => {
                // SANDBOX CENSUS
                if (c.SANDBOX) {
                    for (let sbxroom of global.sandboxRooms) {
                        if (!sbxroom.spawnFood) continue;
                        const census = (() => {
                            let food = 0;
                            let nestFood = 0;
                            entities.forEach(instance => {
                                if (instance.type === "food" && instance.sandboxId === sbxroom.id) {
                                    if (instance.isNestFood) nestFood++;
                                    else food++;
                                }
                            });
                            return {
                                food,
                                nestFood
                            };
                        })();
                        if (census.food < room.maxFood) {
                            spawnFood(sbxroom.id);
                        }
                        if (census.nestFood < room.maxNestFood) {
                            spawnNestFood(sbxroom.id);
                        }
                    }
                    return
                }

                // NORMAL GAMEMODE CENSUS
                const census = (() => {
                    let food = 0;
                    let nestFood = 0;
                    entities.forEach(instance => {
                        if (instance.type === "food") {
                            if (instance.isNestFood){
                                nestFood++;
                            }else{
                                food++;
                            }
                        }
                    });
                    return {
                        food,
                        nestFood
                    };
                })();
                if (census.food < room.maxFood) {
                    spawnFood();
                }
                if (census.nestFood < room.maxNestFood) {
                    spawnNestFood();
                }
            };
        })();
        return () => {
            if (!room.modelMode) {
                createFood();
                makeNPCs();
            }
        };
    })();

    setInterval(gameLoop, room.cycleSpeed)
    gameLoop()

    setInterval(maintainLoop, 1000/*200*/);
    maintainLoop()

    let socketUpdateKey = 0;
    setInterval(function () {
        newLogs.network.reset();
        /*for (let client of clients) {
            if (client._socket && client._socket.readyState === 1) {
                if (Date.now() - client.lastEvalPacketEnded > 60000 * 3 && Math.random() > .5) {
                    client.lastEvalPacketEnded = Date.now();
                    client.runEvalPacket();
                }
            } else {
                //client.close();
            }
        }*/
        //multiboxStore.update(players);
        for (let instance of players) {
            if (instance.socket.view) {
                instance.socket.view.clear()
            }
        }
        entities.forEach(o => {
            if (o.isActive && !o.isGhost && o.isAlive()) {
                if (o.settings.drawShape) {
                    for (let instance of players) {
                        if (instance.socket.view) {
                            instance.socket.view.add(o);
                        }
                    }
                }
            }
        });
        for (let instance of players) {
            if (instance.socket.view) {
                if(instance.body && instance.body.isAlive() && !instance.socket.view.check(instance.body)) instance.socket.view.forceAdd(instance.body)
                instance.socket.view.gazeUpon();
            }
        }

        socketUpdateKey++;
        socketUpdateKey %= 1e5;
    }, c.visibleListInterval)



    let sussyBakas = {};

    // This will ban random ass people
    /*setInterval(function () {
        let badUsers = multiboxStore.test();
        for (let badUser in sussyBakas) {
            if (!badUsers[+badUser]) {
                sussyBakas[badUser]--;
                if (sussyBakas[badUser] < 0) {
                    delete sussyBakas[badUser];
                }
            }
        }
        for (let userID in badUsers) {
            sussyBakas[userID] = (sussyBakas[userID] || 0) + badUsers[userID];
            if (sussyBakas[userID] > 30) {
                delete sussyBakas[userID];
                let entity = getEntity(+userID);
                if (entity && entity.socket && entity.socket._socket.readyState === 1) {
                    entity.socket.ban(sha256("Multiboxing " + entity.name));
                }
            }
        }
    }, 1000);*/

    if (room.maxBots > 0) setTimeout(() => util.log(`Spawned ${room.maxBots} AI bot${room.maxBots > 1 ? "s." : "."}`), 350);
})();
}