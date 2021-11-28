class GeneratorType {
    constructor () {
        // unnecessary to constructure it.
    }
    
    static asNum (value) {
        return `(+${value})`;
    }
    
    static asBool (value) {
        return `!!(${value})`;
    }
    
    static asString (value) {
        return `("${value}")`;
    }
}

module.exports = GeneratorType;
