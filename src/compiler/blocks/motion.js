/**
 * 此类用于存放需要被生成的模块代码。
 */

class Motion {
    static getCode () {
        return {
            motion_movesteps: 'util.target.setXY(util.target.x + Cast.toNumber(#<STEPS>#) * Math.cos(MathUtil.degToRad(90 - util.target.direction)), util.target.y + Cast.toNumber(#<STEPS>#) * Math.sin(MathUtil.degToRad(90 - util.target.direction)));',
            motion_gotoxy: 'util.target.setXY(#<X>#, #<Y>#);',
            motion_goto: 'if (blockClass.scratch3_motion.getTargetXY(\'#<TO>#\', util)) util.target.setXY(blockClass.scratch3_motion.getTargetXY(\'#<TO>#\', util)[0], blockClass.scratch3_motion.getTargetXY(\'#<TO>#\', util)[1]);',
            motion_pointtowards: 'blockClass.scratch3_motion.pointTowards({TOWARDS: String(#<TOWARDS>#)}, util)',
            motion_turnright: 'util.target.setDirection(util.target.direction + Cast.toNumber(#<DEGREES>#));',
            motion_turnleft: 'util.target.setDirection(util.target.direction - Cast.toNumber(#<DEGREES>#));',
            motion_pointindirection: 'util.target.setDirection(Cast.toNumber(#<DIRECTION>#));',
            motion_ifonedgebounce: 'blockClass.scratch3_motion.ifOnEdgeBounce(null, util);',
            motion_setrotationstyle: 'util.target.setRotationStyle("#<STYLE>#");',
            motion_changexby: 'util.target.setXY(util.target.x + Cast.toNumber(#<DX>#), util.target.y);',
            motion_setx: 'util.target.setXY(Cast.toNumber(#<X>#), util.target.y);',
            motion_changeyby: 'util.target.setXY(util.target.x, util.target.y + Cast.toNumber(#<DY>#));',
            motion_sety: 'util.target.setXY(util.target.x, Cast.toNumber(#<Y>#));',
            motion_xposition: 'blockClass.scratch3_motion.limitPrecision(util.target.x)',
            motion_yposition: 'blockClass.scratch3_motion.limitPrecision(util.target.y)',
            motion_direction: 'util.target.direction',
            motion_scroll_right: '',
            motion_scroll_up: '',
            motion_align_scene: '',
            motion_xscroll: '',
            motion_yscroll: ''
            
        };
    }
}
 
module.exports = Motion;
