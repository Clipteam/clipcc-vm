/**
 * @fileoverview 用于处理编译器解析出来的输入内容
 */
const Cast = require('../util/cast');

class CompiledInput {
    /**
     * 编译输入单元
     * @param {any} value - 输入单元的值
     * @param {number} type - 输入单元的类型
     * @param {boolean} constant - 输入单元是否为常量
     */
    constructor (value, type, constant = false) {
        this.value = value;
        this.type = type;
        this.constant = constant;
    }

    static get TYPE_ALWAYS_NUMBER () {
        return '0';
    }

    static get TYPE_NUMBER () {
        return '1';
    }

    static get TYPE_STRING () {
        return '2';
    }

    static get TYPE_BOOLEAN () {
        return '3';
    }

    static get TYPE_DYNAMIC () {
        return '4';
    }

    raw () {
        return this.value;
    }

    asString () {
        if (this.constant) return `"${JSON.stringify(`${this.value}`).slice(1, -1)}"`;
        if (this.type === CompiledInput.TYPE_STRING) return this.value;
        return `("" + (${this.value}))`;
    }

    asPureNumber () {
        if (this.constant) {
            const temp = +this.value;
            if (temp) return temp.toString();
            if (Object.is(temp, -0)) return '-0';
            return '0';
        }
        if (this.type === CompiledInput.TYPE_ALWAYS_NUMBER) return this.value;
        return `(+(${this.value}) || 0)`;
    }

    asNumber () {
        if (this.constant) return this.asPureNumber();
        if (this.type === CompiledInput.TYPE_NUMBER) return this.value;
        return `(+(${this.value}))`;
    }

    asBoolean () {
        if (this.constant) return Cast.toBoolean(this.value).toString();
        if (this.type === CompiledInput.TYPE_BOOLEAN) return this.value;
        // 由于 Scratch 3 类型转换较为复杂，因此在非常量的情况下抛给运行时处理
        return ` toBoolean(${this.value})`;
    }
}

module.exports = CompiledInput;
