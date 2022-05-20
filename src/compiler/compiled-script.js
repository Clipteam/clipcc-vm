const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

class CompiledScript {
    constructor (type = 'script', source) {
        this.type = type;
        this.source = source;
        this.isGenerated = false;
        this.convert();
    }

    convert () {
        console.log('Converting script...', this);
        if (!this.isGenerated) {
            this.generator = new GeneratorFunction('util', 'parameter', this.source);
            this.isGenerated = true;
        }
    }
}

module.exports = CompiledScript;
