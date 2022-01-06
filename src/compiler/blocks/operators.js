/**
 * 此类用于存放需要被生成的模块代码。
 */
const GeneratorType = require('../generator-type.js');

class Operators {
    static getProcessor () {
        return {
            operator_add: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} + ${NUM2})`;
            },
            operator_subtract: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} - ${NUM2})`;
            },
            operator_multiply: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} * ${NUM2})`;
            },
            operator_divide: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} / ${NUM2})`;
            },
            operator_lt: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `Cast.compare(${OPERAND1}, ${OPERAND2}) < 0`;
            },
            operator_equals: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `Cast.compare(${OPERAND1}, ${OPERAND2}) == 0`;
            },
            operator_gt: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `Cast.compare(${OPERAND1}, ${OPERAND2}) > 0`;
            },
            operator_and: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `${OPERAND1} && ${OPERAND2}`;
            },
            operator_or: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `${OPERAND1} || ${OPERAND2}`;
            },
            operator_not: (parameters) => {
                const OPERAND = parameters.OPERAND;
                return `!${OPERAND}`;
            },
            operator_random: (parameters) => {
                const FROM = parameters.FROM;
                const TO = parameters.TO;
                return `blockClass.scratch3_operator({${FROM}, ${TO}})`;
            },
            operator_join: (parameters) => {
                const STRING1 = parameters.STRING1;
                const STRING2 = parameters.STRING2;
                return `${STRING1} + ${STRING2}`;
            },
            operator_mathop: (parameters) => {
                const operator = parameters.OPERATOR.toLowerCase();
                const n = parameters.NUM;
                switch (operator) {
                    case 'abs': return `Math.abs(${n})`;
                    case 'floor': return `Math.floor(${n})`;
                    case 'ceiling': return `Math.ceil(${n})`;
                    case 'sqrt': return `Math.sqrt(${n})`;
                    case 'sin': return `parseFloat(Math.sin((Math.PI * ${n}) / 180).toFixed(10))`;
                    case 'cos': return `parseFloat(Math.cos((Math.PI * ${n}) / 180).toFixed(10))`;
                    case 'tan': return `(Math.sin(${n}) / Math.cos(${n}))`;
                    case 'asin': return `(Math.asin(${n}) * 180) / Math.PI`;
                    case 'acos': return `(Math.acos(${n}) * 180) / Math.PI`;
                    case 'atan': return `(Math.atan(${n}) * 180) / Math.PI`;
                    case 'ln': return `Math.log(${n})`;
                    case 'log': return `Math.log(${n}) / Math.LN10`;
                    case 'e ^': return `Math.exp(${n})`;
                    case '10 ^': return `Math.pow(10, ${n})`;
                }
            }
        };
    }
}
 
module.exports = Operators;
