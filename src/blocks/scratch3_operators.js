const Cast = require('../util/cast.js');
const MathUtil = require('../util/math-util.js');

class Scratch3OperatorsBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            operator_add: this.add,
            operator_subtract: this.subtract,
            operator_multiply: this.multiply,
            operator_divide: this.divide,
            operator_lt: this.lt,
            operator_equals: this.equals,
            operator_gt: this.gt,
            operator_and: this.and,
            operator_or: this.or,
            operator_not: this.not,
            operator_random: this.random,
            operator_join: this.join,
            operator_indexof: this.indexOf,
            operator_letter_of: this.letterOf,
            operator_length: this.length,
            operator_contains: this.contains,
            operator_mod: this.mod,
            operator_round: this.round,
            operator_mathop: this.mathop,

            operator_power: this.power,
            operator_bitand: this.bitand,
            operator_bitor: this.bitor,
            operator_bitxor: this.bitxor,
            operator_bitnot: this.bitnot,
            operator_bitlsh: this.bitlsh,
            operator_bitrsh: this.bitrsh,
            operator_bitursh: this.bitursh,
            operator_le: this.le,
            operator_ge: this.ge,
            operator_nequals: this.nequals
        };
    }

    getCompiledFragment () {
        return {
            operator_add: this._add,
            operator_subtract: this._subtract,
            operator_multiply: this._multiply,
            operator_divide: this._divide,
            operator_lt: this._lt,
            operator_equals: this._equals,
            operator_gt: this._gt,
            operator_and: this._and,
            operator_or: this._or,
            operator_not: this._not,
            operator_length: this._length,
            operator_join: this._join,
            operator_mathop: this._mathop,
            operator_power: this._power,
            operator_bitand: this._bitand,
            operator_bitor: this._bitor,
            operator_bitxor: this._bitxor,
            operator_bitnot: this._bitnot,
            operator_bitlsh: this._bitlsh,
            operator_bitrsh: this._bitrsh,
            operator_bitursh: this._bitursh,
            operator_le: this._le,
            operator_ge: this._ge,
            operator_nequals: this._nequals
        };
    }

    _add (args) {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.value + args.NUM2.value}`;
        return `${args.NUM1.asNumber()} + ${args.NUM2.asNumber()}`;
    }

    add (args) {
        return Cast.toNumber(args.NUM1) + Cast.toNumber(args.NUM2);
    }
    
    _subtract (args) {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.value - args.NUM2.value}`;
        return `${args.NUM1.asNumber()} - ${args.NUM2.asNumber()}`;
    }

    subtract (args) {
        return Cast.toNumber(args.NUM1) - Cast.toNumber(args.NUM2);
    }

    _multiply (args) {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.value * args.NUM2.value}`;
        return `${args.NUM1.asNumber()} * ${args.NUM2.asNumber()}`;
    }

    multiply (args) {
        return Cast.toNumber(args.NUM1) * Cast.toNumber(args.NUM2);
    }

    _divide (args) {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.value / args.NUM2.value}`;
        return `${args.NUM1.asNumber()} / ${args.NUM2.asNumber()}`;
    }

    divide (args) {
        return Cast.toNumber(args.NUM1) / Cast.toNumber(args.NUM2);
    }

    _lt (args) {
        return `lt(${args.OPERAND1.raw()}, ${args.OPERAND2.raw()})`;
    }

    lt (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) < 0;
    }

    _equals (args) {
        return `eq(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }

    equals (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) === 0;
    }

    _gt (args) {
        return `gt(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }

    gt (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) > 0;
    }

    _and (args) {
        return `${args.OPERAND1 ? args.OPERAND1.asBoolean() : 'false'} && ${args.OPERAND2 ? args.OPERAND2.asBoolean() : 'false'}`;
    }

    and (args) {
        return Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2);
    }

    _or (args) {
        return `${args.OPERAND1 ? args.OPERAND1.asBoolean() : 'false'} || ${args.OPERAND2 ? args.OPERAND2.asBoolean() : 'false'}`;
    }

    or (args) {
        return Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2);
    }

    _not (args) {
        return `!${args.OPERAND ? args.OPERAND.asBoolean() : 'false'}`;
    }

    not (args) {
        return !Cast.toBoolean(args.OPERAND);
    }

    random (args) {
        const nFrom = Cast.toNumber(args.FROM);
        const nTo = Cast.toNumber(args.TO);
        const low = nFrom <= nTo ? nFrom : nTo;
        const high = nFrom <= nTo ? nTo : nFrom;
        if (low === high) return low;
        // If both arguments are ints, truncate the result to an int.
        if (Cast.isInt(args.FROM) && Cast.isInt(args.TO)) {
            return low + Math.floor(Math.random() * ((high + 1) - low));
        }
        return (Math.random() * (high - low)) + low;
    }

    _join (args) {
        return `${args.STRING1.asString()} + ${args.STRING2.asString()}`;
    }

    join (args) {
        return Cast.toString(args.STRING1) + Cast.toString(args.STRING2);
    }

    indexOf (args) {
        const {STRING, SUBSTRING, POS} = args;
        let index = STRING.indexOf(SUBSTRING);
        if (index === -1) return -1;
        for (let i = 0; i < Number(POS) - 1; i++) {
            index = STRING.indexOf(SUBSTRING, index + 1);
            if (index === -1) return -1;
        }
        return index + 1;
    }

    letterOf (args) {
        const index = Cast.toNumber(args.LETTER) - 1;
        const str = Cast.toString(args.STRING);
        // Out of bounds?
        if (index < 0 || index >= str.length) {
            return '';
        }
        return str.charAt(index);
    }

    _length (args) {
        return `(${args.STRING.asString()}).length`;
    }

    length (args) {
        return Cast.toString(args.STRING).length;
    }

    contains (args) {
        const format = function (string) {
            return Cast.toString(string).toLowerCase();
        };
        return format(args.STRING1).includes(format(args.STRING2));
    }

    mod (args) {
        const n = Cast.toNumber(args.NUM1);
        const modulus = Cast.toNumber(args.NUM2);
        let result = n % modulus;
        // Scratch mod uses floored division instead of truncated division.
        if (result / modulus < 0) result += modulus;
        return result;
    }

    round (args) {
        return Math.round(Cast.toNumber(args.NUM));
    }

    _mathop (args) {
        const operator = args.OPERATOR.raw().toLowerCase();
        switch (operator) {
        case 'abs': return `Math.abs(${args.NUM.asNumber()})`;
        case 'ceiling': return `Math.ceil(${args.NUM.asNumber()})`;
        case 'floor': return `Math.floor(${args.NUM.asNumber()})`;
        case 'sqrt': return `Math.sqrt(${args.NUM.asNumber()})`;
        case 'sin': return `Math.sin(${args.NUM.asNumber()})`;
        case 'cos': return `Math.cos(${args.NUM.asNumber()})`;
        case 'tan': return `Math.tan(${args.NUM.asNumber()})`;
        case 'asin': return `Math.asin(${args.NUM.asNumber()})`;
        case 'acos': return `Math.acos(${args.NUM.asNumber()})`;
        case 'atan': return `Math.atan(${args.NUM.asNumber()})`;
        case 'ln': return `Math.log(${args.NUM.asNumber()})`;
        case 'log': return `Math.log(${args.NUM.asNumber()})/Math.log(10)`;
        case 'e ^': return `Math.exp(${args.NUM.asNumber()})`;
        case '10 ^': return `Math.pow(10, ${args.NUM.asNumber()})`;
        }
    }

    mathop (args) {
        const operator = Cast.toString(args.OPERATOR).toLowerCase();
        const n = Cast.toNumber(args.NUM);
        switch (operator) {
        case 'abs': return Math.abs(n);
        case 'floor': return Math.floor(n);
        case 'ceiling': return Math.ceil(n);
        case 'sqrt': return Math.sqrt(n);
        case 'sin': return parseFloat(Math.sin((Math.PI * n) / 180).toFixed(10));
        case 'cos': return parseFloat(Math.cos((Math.PI * n) / 180).toFixed(10));
        case 'tan': return MathUtil.tan(n);
        case 'asin': return (Math.asin(n) * 180) / Math.PI;
        case 'acos': return (Math.acos(n) * 180) / Math.PI;
        case 'atan': return (Math.atan(n) * 180) / Math.PI;
        case 'ln': return Math.log(n);
        case 'log': return Math.log(n) / Math.LN10;
        case 'e ^': return Math.exp(n);
        case '10 ^': return Math.pow(10, n);
        }
        return 0;
    }

    _power (args) {
        return `Math.pow(${args.NUM1.asNumber()}, ${args.NUM2.asNumber()})`;
    }

    power (args) {
        return Math.pow(Cast.toNumber(args.NUM1), Cast.toNumber(args.NUM2));
    }

    _bitand (args) {
        return `${args.NUM1.asNumber()} & ${args.NUM2.asNumber()}`;
    }

    bitand (args) {
        return Cast.toNumber(args.NUM1) & Cast.toNumber(args.NUM2);
    }

    _bitor (args) {
        return `${args.NUM1.asNumber()} | ${args.NUM2.asNumber()}`;
    }

    bitor (args) {
        return Cast.toNumber(args.NUM1) | Cast.toNumber(args.NUM2);
    }

    _bitxor (args) {
        return `${args.NUM1.asNumber()} ^ ${args.NUM2.asNumber()}`;
    }

    bitxor (args) {
        return Cast.toNumber(args.NUM1) ^ Cast.toNumber(args.NUM2);
    }

    _bitlsh (args) {
        return `${args.NUM1.asNumber()} << ${args.NUM2.asNumber()}`;
    }

    bitlsh (args) {
        return Cast.toNumber(args.NUM1) << Cast.toNumber(args.NUM2);
    }

    _bitrsh (args) {
        return `${args.NUM1.asNumber()} >> ${args.NUM2.asNumber()}`;
    }

    bitrsh (args) {
        return Cast.toNumber(args.NUM1) >> Cast.toNumber(args.NUM2);
    }

    _bitursh (args) {
        return `${args.NUM1.asNumber()} >>> ${args.NUM2.asNumber()}`;
    }

    bitursh (args) {
        return Cast.toNumber(args.NUM1) >>> Cast.toNumber(args.NUM2);
    }

    _bitnot (args) {
        return `~${args.NUM.asNumber()}`;
    }

    bitnot (args) {
        return ~Cast.toNumber(args.NUM1);
    }

    _ge (args) {
        return `ge(${args.NUM1.asString()}, ${args.NUM2.asString()})`;
    }

    ge (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) >= 0;
    }

    _le (args) {
        return `le(${args.NUM1.asString()}, ${args.NUM2.asString()})`;
    }

    le (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) <= 0;
    }

    _nequals (args) {
        return `${args.NUM1.asString()} !== ${args.NUM2.asString()}`;
    }

    nequals (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) !== 0;
    }

    gcd (args) {
        return MathUtil.gcd(Cast.toNumber(args.NUM1), Cast.toNumber(args.NUM2));
    }

    lcm (args) {
        return MathUtil.lcm(Cast.toNumber(args.NUM1), Cast.toNumber(args.NUM2));
    }
}

module.exports = Scratch3OperatorsBlocks;
