/**
 * 此类用于存放需要被生成的模块代码
 */
 
class Sensing {
    static getCode () {
        return {
            sensing_mousex: 'ioQuery(util.runtime, "mouse", "getScratchX")',
            sensing_mousey: 'ioQuery(util.runtime, "mouse", "getScratchY")',
            sensing_operatingsystem: 'blockClass_scratch3_sensing.getOS()',
            sensing_clipcc_version: 'util.runtime.version',
            sensing_turnonturbomode: 'util.runtime.turboMode = true;\n' +
                'util.runtime.emit(\'TURBO_MODE_ON\');',
            sensing_turnoffturbomode: 'util.runtime.turboMode = false;\n' +
                'util.runtime.emit(\'TURBO_MODE_OFF\');',
            sensing_isturbomode: 'util.runtime.turboMode'
        };
    }
}
 
module.exports = Sensing;
