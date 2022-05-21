class VariablePool {
    constructor (name) {
        this.name = name;
        this.variableId = 0;
    }

    add () {
        this.variableId++;
        return `${this.name}__${this.variableId}`;
    }
}

module.exports = VariablePool;
