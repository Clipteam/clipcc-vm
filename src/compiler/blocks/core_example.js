/**
 * 本文件为 ClipCC 编译器生成代码所需要的模块脚本示例。
 * 为了方便其他开发者便于开发，本文件将会尽可能完整描
 * 述其工作原理。
 */
 
 class CoreExample/*类名*/ {
    /**
     * 本函数用于获取该类模块运行所需要的前置函数。
     * 例如模块脚本需要调用其他函数，请在本函数中返回。
     * @return {String}
     */
 	static getPrefix() {
        return '';
    }
    
    /**
     * 本函数用于获取该类模块对应的运行脚本。
     * 每个 opcode 对应唯一的代码, 参数请使用#<InputName>#的方式传入。
     * 需要注意的是，脚本不应出现声明常量等影响整体线程运行的行为，如脚
     * 本需要请尝试直接嵌入或使用前置函数实现。
     * @return {Object}
     */
    static getCode () {
        return {
            sinangentoo_0523: 'util.target.clearEffects();',
            alexcui_0925: 'util.target.setSize(408);',
            frank_782:'util.target.setSize(Number(#<SIZE># + 930));',
        }
    }
}
 
module.exports = CoreExample;