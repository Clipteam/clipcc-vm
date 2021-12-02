/**
 * 此类用于存放需要被生成的模块代码
 */
const GeneratorType = require('../generator-type.js');

class Sensing {
    static getProcessor () {
        return {
            sensing_mousex: () => 'ioQuery(util.runtime, "mouse", "getScratchX")',
            sensing_mousey: () => 'ioQuery(util.runtime, "mouse", "getScratchY")',
            sensing_operatingsystem: () => 'blockClass_scratch3_sensing.getOS()',
            sensing_clipcc_version: () => 'util.runtime.version',
            sensing_turnonturbomode: () => 'util.runtime.turboMode = true;\nutil.runtime.emit(\'TURBO_MODE_ON\');',
            sensing_turnoffturbomode: () => 'util.runtime.turboMode = false;\nutil.runtime.emit(\'TURBO_MODE_OFF\');',
            sensing_isturbomode: () =>'util.runtime.turboMode'
        };
    }
}
 
module.exports = Sensing;
