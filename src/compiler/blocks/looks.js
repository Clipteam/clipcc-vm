/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Looks {
    static getCode () {
        return {
            looks_show: 
                'util.target.setVisible(true);\n' +
                'this._renderBubble(util.target);',
            looks_hide: 
                'util.target.setVisible(false);\n' +
                'this._renderBubble(util.target);',
            /*
            looks_changeeffectby: '
                const effect = String(#<EFFECT>#).toLowerCase();
                const change = Number(#<CHANGE>#);
                if (!util.target.effects.hasOwnProperty(effect)) return;
                let newValue = change + util.target.effects[effect];
                newValue = this.clampEffect(effect, newValue);
                util.target.setEffect(effect, newValue);',
            looks_seteffectto: '
                const effect = String(#<EFFECT>#).toLowerCase();
                let value = Number(#<VALUE>#);
                value = this.clampEffect(effect, value);
                util.target.setEffect(effect, value);',
            */
            looks_cleargraphiceffects: 'util.target.clearEffects();',
            looks_changesizeby: 'util.target.setSize(util.target.size + Number(#<CHANGE>#));',
            looks_setsizeto:'util.target.setSize(Number(#<SIZE>#));',
        }
    }
}
 
module.exports = Looks;