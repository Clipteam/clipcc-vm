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
            operator_equals: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) === 0'
        };
    }
}
 
module.exports = Operators;
