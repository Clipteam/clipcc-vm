/**
 * 此类用于存放需要被生成的模块代码
 */
 
class Pen {
    static getCode () {
        return {
            pen_clear: 'blockClass.extension_pen.clear();',
            pen_penDown: 'blockClass.extension_pen.penDown({}, util);',
            pen_penUp: 'blockClass.extension_pen.penUp({}, util);',
            pen_stamp: 'blockClass.extension_pen.stamp({}, util);',
        };
    }
}
 
module.exports = Pen;
