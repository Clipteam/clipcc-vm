const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

class CompiledScript {
    constructor (name = 'script', source, parameters = []) {
        this.name = name;
        this.source = source;
        this.parameters = parameters;
        this.isGenerated = false;
        this.convert();
    }

    convert () {
        console.log('Converting script...', this);
        if (!this.isGenerated) {
            console.log(...this.parameters);
            this.generator = new GeneratorFunction('util', ...this.parameters, this.source);
            this.isGenerated = true;
        }
    }
}

module.exports = CompiledScript;
