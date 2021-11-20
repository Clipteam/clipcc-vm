/**
 * 此类用于存放需要被生成的模块代码。
 */
 
class Operators {
    static getCode () {
        return {
            operator_add: 'Cast.toNumber(#<NUM1>#) + Cast.toNumber(#<NUM2>#)',
            operator_subtract: 'Cast.toNumber(#<NUM1>#) - Cast.toNumber(#<NUM2>#)',
            operator_multiply: 'Cast.toNumber(#<NUM1>#) * Cast.toNumber(#<NUM2>#)',
            operator_divide: 'Cast.toNumber(#<NUM1>#) / Cast.toNumber(#<NUM2>#)',
            operator_lt: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) < 0',
            operator_equals: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) == 0',
            operator_gt: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) > 0',
            operator_and: '#<OPERAND1># && #<OPERAND2>#',
            operator_or: '#<OPERAND1># || #<OPERAND2>#',
            operator_not: '!#<OPERAND>#',
            operator_join: '#<STRING1># + #<STRING2>#'
        };
    }
}
 
module.exports = Operators;
