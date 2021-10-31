/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Motion {
     static getCode () {
         return {
             motion_movesteps: `
                const steps = Cast.toNumber(#[STEPS]#);
                const radians = MathUtil.degToRad(90 - util.target.direction);
                const dx = steps * Math.cos(radians);
                const dy = steps * Math.sin(radians);
                util.target.setXY(util.target.x + dx, util.target.y + dy);
            `,
            motion_gotoxy: `
                const x = Cast.toNumber(#[X]#);
                const y = Cast.toNumber(#[Y]#);
                util.target.setXY(x, y);
            `
         }
     }
 }
 
module.exports = Motion;