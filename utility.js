//utility function.
global.rnd = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
global.isEmptyArray = function (value) {
    return value.isArray && value.length == 0;;
};