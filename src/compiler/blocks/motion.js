/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Motion {
    static getCode () {
        return {
            motion_movesteps: 
                'const radians = MathUtil.degToRad(90 - util.target.direction);\n' +
                'const dx = Number(#<STEPS>#) * Math.cos(radians);\n' +
                'const dy = Number(#<STEPS>#) * Math.sin(radians);\n' +
                'util.target.setXY(util.target.x + dx, util.target.y + dy);',
            motion_gotoxy: 'util.target.setXY(#<X>#, #<Y>#);',
            motion_turnright: 'util.target.setDirection(util.target.direction + Number(#<DEGREES>#));',
            motion_turnleft: 'util.target.setDirection(util.target.direction - Number(#<DEGREES>#));',
        }
    }
}
 
module.exports = Motion;