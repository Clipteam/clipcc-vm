/**
 * 此类用于存放需要被生成的模块代码
 */
 
class Sensing {
    static getCode () {
        return {
            sensing_operatingsystem: 'blockClass_scratch3_sensing.getOS()',
            sensing_clipcc_version: 'util.runtime.version',
            sensing_turnonturbomode: 'this.runtime.turboMode = true' +
                'this.runtime.emit(\'TURBO_MODE_ON\')',
            sensing_turnoffturbomode: 'this.runtime.turboMode = false' +
                'this.runtime.emit(\'TURBO_MODE_OFF\')',
            sensing_isturbomode: 'util.runtime.turboMode'
        };
    }
}
 
module.exports = Sensing;
