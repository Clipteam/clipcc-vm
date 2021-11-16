/**
 * 此类用于存放需要被生成的模块代码。
 */

class Motion {
    static getCode () {
        return {
            motion_movesteps: 'util.target.setXY(util.target.x + Cast.toNumber(#<STEPS>#) * Math.cos(MathUtil.degToRad(90 - util.target.direction)), util.target.y + Cast.toNumber(#<STEPS>#) * Math.sin(MathUtil.degToRad(90 - util.target.direction)));',
            motion_gotoxy: 'util.target.setXY(#<X>#, #<Y>#);',
            motion_goto: 'if (blockClass.scratch3_motion.getTargetXY(#[TO]#, util)) util.target.setXY(blockClass.scratch3_motion.getTargetXY(#[TO]#, util)[0], blockClass.scratch3_motion.getTargetXY(#[TO]#, util)[1]);',
            motion_turnright: 'util.target.setDirection(util.target.direction + Cast.toNumber(#<DEGREES>#));',
            motion_turnleft: 'util.target.setDirection(util.target.direction - Cast.toNumber(#<DEGREES>#));'
        };
    }
}
 
module.exports = Motion;
