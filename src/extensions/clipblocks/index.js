const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Variable = require('../../engine/variable');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const { forEach } = require('jszip');

const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzBmYmQ4Yzt9LmNscy0ye2ZpbGw6I2ZmZjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlJlZGxpc3QgTE9HTzwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMjguOSA5LjggMjguODUgOS44NiAyOC44NSAxNi40NSAzMi4yIDEzLjEgMjguOSA5LjgiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zNC4xMiw4LjY5bC0uODEtLjgxYTEuNzQsMS43NCwwLDAsMC0yLjQ4LDBsLTEsMSwzLjMsMy4zLDEtMUExLjc0LDEuNzQsMCwwLDAsMzQuMTIsOC42OVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDApIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMjIuMywyMi44MkgyMC4wNmEuODkuODksMCwwLDEtLjg4LS44OFYxOS43YS40OC40OCwwLDAsMSwuMTMtLjMxbDkuNTQtOS41M1Y5LjRBMi40LDIuNCwwLDAsMCwyNi40NSw3SDguNEEyLjM5LDIuMzksMCwwLDAsNiw5LjRWMzAuNkEyLjM5LDIuMzksMCwwLDAsOC40LDMzaDE4YTIuNCwyLjQsMCwwLDAsMi40LTIuNFYxNi40NWwtNi4yNCw2LjI0QS40OC40OCwwLDAsMSwyMi4zLDIyLjgyWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCkiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjkuNjQiIHk9IjEwLjUyIiB3aWR0aD0iMTQuMDYiIGhlaWdodD0iMS43NiIgcng9IjAuNTYiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjkuNjQiIHk9IjE1Ljc5IiB3aWR0aD0iOS42NyIgaGVpZ2h0PSIxLjc2IiByeD0iMC41NiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE3LjEzLDI2LjgzSDE5LjN2MS4wNkgxNS4wN1YyNi43N2EyLjUxLDIuNTEsMCwwLDAsLjg1LS4zMywyLjY3LDIuNjcsMCwwLDAsLjY3LS41OCwzLjE0LDMuMTQsMCwwLDAsLjQ0LS43OCwyLjY2LDIuNjYsMCwwLDAsLjE1LS45LDIuNTIsMi41MiwwLDAsMC0uMjEtMSwyLjY5LDIuNjksMCwwLDAtLjU2LS44NCwyLjcxLDIuNzEsMCwwLDAtLjg0LS41NywyLjYxLDIuNjEsMCwwLDAtMi4wNSwwLDIuNiwyLjYsMCwwLDAtLjg0LjU3LDIuNzEsMi43MSwwLDAsMC0uNTcuODQsMi41MiwyLjUyLDAsMCwwLS4yMSwxLDIuNDQsMi40NCwwLDAsMCwuMTYuOSwyLjY1LDIuNjUsMCwwLDAsMS4xLDEuMzYsMi41MSwyLjUxLDAsMCwwLC44NS4zM3YxLjEySDkuNzhWMjYuODNIMTJhMy44NywzLjg3LDAsMCwxLS44Mi0xLjIxLDMuNjcsMy42NywwLDAsMS0uMjktMS40NCwzLjU4LDMuNTgsMCwwLDEsLjI5LTEuNDMsMy43MywzLjczLDAsMCwxLC44LTEuMTgsMy44LDMuOCwwLDAsMSwxLjE3LS44LDMuNzIsMy43MiwwLDAsMSwyLjg4LDAsMy44NSwzLjg1LDAsMCwxLDEuMTguOEEzLjcxLDMuNzEsMCwwLDEsMTgsMjIuNzVhMy40MiwzLjQyLDAsMCwxLC4yOSwxLjQzQTMuNSwzLjUsMCwwLDEsMTgsMjUuNjIsMy41NiwzLjU2LDAsMCwxLDE3LjEzLDI2LjgzWk0xOS4zLDMwSDkuNzhWMjlIMTkuM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDApIi8+PC9zdmc+';
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6bm9uZTt9LmNscy0ye2ZpbGw6IzBmYmQ4Yzt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlJlZGxpc3QgTE9HT2luU2NyaXB0PC90aXRsZT48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjcuMDkiIHk9IjE0LjcyIiB3aWR0aD0iMTEuOTUiIGhlaWdodD0iMi4xNyIgcng9IjAuNjkiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjcuMDkiIHk9IjguMiIgd2lkdGg9IjE3LjM4IiBoZWlnaHQ9IjIuMTciIHJ4PSIwLjY5Ii8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTkuMDUsMTkuMThhLjU1LjU1LDAsMCwwLS4xNi4zOHYyLjc2QTEuMDksMS4wOSwwLDAsMCwyMCwyMy40MWgyLjc2YS41Ny41NywwLDAsMCwuMzktLjE2bDcuNzEtNy43MlY3LjM5WiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIzMC44NCA3LjM4IDMwLjg0IDE1LjUzIDM0Ljk4IDExLjM5IDMwLjkxIDcuMzIgMzAuODQgNy4zOCIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTM3LjM2LDUuOTRsLTEtMWEyLjE3LDIuMTcsMCwwLDAtMy4wNywwTDMyLjA3LDYuMTZsNC4wOCw0LjA3TDM3LjM2LDlBMi4xNywyLjE3LDAsMCwwLDM3LjM2LDUuOTRaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMjIuNzQsMjMuNDFIMjBhMS4wOSwxLjA5LDAsMCwxLTEuMDktMS4wOVYxOS41NmEuNTUuNTUsMCwwLDEsLjE2LS4zOEwzMC44NCw3LjM5VjYuODJhMywzLDAsMCwwLTMtM0g1LjU2YTMsMywwLDAsMC0zLDNWMzNhMywzLDAsMCwwLDMsM0gyNy44OGEzLDMsMCwwLDAsMy0zVjE1LjUzbC03LjcxLDcuNzJBLjU3LjU3LDAsMCwxLDIyLjc0LDIzLjQxWk03LjA5LDguOWEuNjkuNjksMCwwLDEsLjY5LS43aDE2YS42OS42OSwwLDAsMSwuNjkuN3YuNzhhLjY5LjY5LDAsMCwxLS42OS42OWgtMTZhLjY5LjY5LDAsMCwxLS42OS0uNjlaTTE3LjgxLDMyLjNINlYzMUgxNy44MVptMC0yLjYySDEyLjU3VjI4LjNhMy4xNiwzLjE2LDAsMCwwLDEuMDYtLjQxLDMuNTQsMy41NCwwLDAsMCwuODItLjcyLDMuNDksMy40OSwwLDAsMCwuNTQtMSwzLjE3LDMuMTcsMCwwLDAsLjItMS4xMSwzLjIxLDMuMjEsMCwwLDAtLjI2LTEuMjcsMy4yNywzLjI3LDAsMCwwLTEuNzQtMS43NCwzLjM1LDMuMzUsMCwwLDAtMi41NCwwLDMuMjcsMy4yNywwLDAsMC0xLjc0LDEuNzQsMy4yMSwzLjIxLDAsMCwwLS4yNiwxLjI3LDMuMTcsMy4xNywwLDAsMCwuMiwxLjExLDMuNDksMy40OSwwLDAsMCwuNTQsMSwzLjU0LDMuNTQsMCwwLDAsLjgyLjcyLDMuMTksMy4xOSwwLDAsMCwxLC40MXYxLjM4SDZ2LTEuM0g4LjcyYTQuNzUsNC43NSwwLDAsMS0xLTEuNSw0LjU4LDQuNTgsMCwwLDEsMC0zLjU2LDQuNzQsNC43NCwwLDAsMSwyLjQ0LTIuNDQsNC43LDQuNywwLDAsMSwzLjU2LDAsNC43NCw0Ljc0LDAsMCwxLDIuNDQsMi40NCw0LjU4LDQuNTgsMCwwLDEsMCwzLjU2LDQuNzUsNC43NSwwLDAsMS0xLDEuNWgyLjY5Wm0uNTQtMTIuNzlINy43OGEuNjkuNjksMCwwLDEtLjY5LS42OXYtLjc5YS42OS42OSwwLDAsMSwuNjktLjY5SDE4LjM1YS42OS42OSwwLDAsMSwuNjkuNjl2Ljc5QS42OS42OSwwLDAsMSwxOC4zNSwxNi44OVoiLz48L3N2Zz4=';

/**
 * Enum for true/false.
 * @readonly
 * @enum {string}
 */
const BooleanParam = {
    TRUE: true,
    FALSE: false
};

/**
 * Enum for flash graphics.
 * @readonly
 * @enum {string}
 */
 const FlashGraphicParam = {
    BEVEL: "bevel",
    BLUR: "blur",
    SHADOW: "shadow",
    GLOW: "glow"
};

class ClipBlocks {
    constructor(runtime) {
        this.runtime = runtime;
    }

    getInfo() {
        return {
            id: 'clipblocks',
            name: 'Clip Blocks',
            color1: '#4C97FF',
            //menuIconURI: menuIconURI,
            //blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'createVariable',
                    text: formatMessage({
                        id: 'clipblocks.createvar',
                        default: 'create a variable [NAME]',
                        description: 'create a variable'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'deleteVariable',
                    text: formatMessage({
                        id: 'clipblocks.deletevar',
                        default: 'delete a variable [NAME]',
                        description: 'delete a variable'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'isVariableExist',
                    text: formatMessage({
                        id: 'clipblocks.isVariableExist',
                        default: 'is [NAME] exist?',
                        description: 'is the variable exist?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'valueOfVariable',
                    text: formatMessage({
                        id: 'clipblocks.valueOfVariable',
                        default: 'value of [NAME]',
                        description: 'value of variable'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'setVisibility',
                    text: formatMessage({
                        id: 'clipblocks.setVisibility',
                        default: 'set the visibility of all sprite to [BOOLEANMENU]',
                        description: 'hide all sprite'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        BOOLEANMENU: {
                            type: ArgumentType.STRING,
                            menu: 'booleanParam',
                            defaultValue: BooleanParam.FALSE
                        }
                    }
                },
                {
                    opcode: 'showDialog',
                    text: formatMessage({
                        id: 'clipblocks.showDialog',
                        default: 'show dialog title:[TITLE] content: [CONTENT] left-layout: [BOOLEANMENU] buttontext:[BUTTONTEXT] ',
                        description: 'show dialog'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TITLE: {
                            type: ArgumentType.STRING,
                            defaultValue: "FBI WARNING"
                        },
                        CONTENT: {
                            type: ArgumentType.STRING,
                            defaultValue: "A quick brown fox jumps over the lazy dog!!"
                        },
                        BOOLEANMENU: {
                            type: ArgumentType.STRING,
                            menu: 'booleanParam',
                            defaultValue: BooleanParam.FALSE
                        },
                        BUTTONTEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: "OMG"
                        }
                    }
                },
                {
                    opcode: 'colorInPosition',
                    text: formatMessage({
                        id: 'clipblocks.colorInPosition',
                        default: 'color of x:[X] y:[Y]',
                        description: 'color in position'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'setStageSize',
                    text: formatMessage({
                        id: 'clipblocks.setStageSize',
                        default: 'set stage size to [WIDTH] x [HEIGHT]',
                        description: 'set stage size'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        WIDTH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 480
                        },
                        HEIGHT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 360
                        }
                    }
                },
                {
                    opcode: 'setRate',
                    text: formatMessage({
                        id: 'clipblocks.setRate',
                        default: 'set rate to [RATE]',
                        description: 'set rate'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        RATE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 30
                        }
                    }
                },
                {
                    opcode: 'setFlashGraphicEffect',
                    text: formatMessage({
                        id: 'clipblocks.setFlashGraphicEffect',
                        default: 'set [FLASHEFFECT] flash effect to [VALUE1] [VALUE2] [VALUE3]',
                        description: 'set flash graphic effect'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        FLASHEFFECT: {
                            type: ArgumentType.STRING,
                            menu: 'flashGraphicParam',
                            defaultValue: FlashGraphicParam.BLUR
                        },
                        VALUE1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        VALUE2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        VALUE3: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                    }
                },
                {
                    opcode: 'clearFlashGraphicEffect',
                    text: formatMessage({
                        id: 'clipblocks.clearFlashGraphicEffect',
                        default: 'clear all flash effect',
                        description: 'clear all flash effect'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'setClipboard',
                    text: formatMessage({
                        id: 'clipblocks.setClipboard',
                        default: 'set the content of clipboard to [TEXT]',
                        description: 'set clipboard'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: "A quick brown fox jumps over the lazy dog."
                        }
                    }
                },
                {
                    opcode: 'getClipboard',
                    text: formatMessage({
                        id: 'clipblocks.getClipboard',
                        default: 'content of clipboard',
                        description: 'get clipboard'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'playSoundFromInternet',
                    text: formatMessage({
                        id: 'clipblocks.playSoundFromInternet',
                        default: 'play sound from URL: [URL]',
                        description: 'set clipboard'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: "https://example.music.site/Brain Power.mp3"
                        }
                    }
                },
                {
                    opcode: 'stopSoundFromInternet',
                    text: formatMessage({
                        id: 'clipblocks.stopSoundFromInternet',
                        default: 'stop sound from URL',
                        description: 'set clipboard'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'gotoWebsite',
                    text: formatMessage({
                        id: 'clipblocks.gotoWebsite',
                        default: 'go to website: [URL]',
                        description: 'go to website'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: "https://cc3.codingclip.com/"
                        }
                    }
                },
            ],
            menus: {
                booleanParam: {
                    acceptReporters: true,
                    items: this.getBooleanParamItem()
                },
                flashGraphicParam: {
                    acceptReporters: true,
                    items: this.getFlashGraphicParamItem()
                }
            }
        }
    }

    createVariable (args, util){
        const editingTarget = util.target.sprite.runtime.getEditingTarget();
        //editingTarget.createVariable(1,"NMSL",Variable.BROADCAST_MESSAGE_TYPE);
    }
    deleteVariable (args){return }
    isVariableExist (args){return false}
    valueOfVariable (args){return 114514}

    setVisibility (args, utils){
        const targets = utils.runtime.targets;
        console.log(targets);
        targets.forEach(function(target){
            if(!target.isStage){
                //console.log(target);
                //console.log("修改前：", target.visible);
                target.setVisible(Cast.toBoolean(args.BOOLEANMENU));
                //console.log("修改后：", target.visible);
            }
        });
        
    }

    showDialog (args){return }
    colorInPosition (args){return 16777215}
    setStageSize (args){return }
    setRate (args){return }
    setFlashGraphicEffect (args){return }
    clearFlashGraphicEffect (args){return }

    async setClipboard (args){
        /* 该方法用于http协议下使用
        const input = document.createElement('INPUT');
        input.style.opacity  = 0;
        input.style.position = 'absolute';
        input.style.left = '-100000px';
        document.body.appendChild(input);
        // 创建一个不可见的input

        input.value = args.TEXT;
        input.select();
        input.setSelectionRange(0, args.TEXT.length);
        document.execCommand('copy');
        document.body.removeChild(input);
        //自动选中复制销毁
        */
        if (!navigator.clipboard) return ; // 不支持该操作
        navigator.clipboard.writeText(args.TEXT)
    }

    async getClipboard (args){
        if (!navigator.clipboard) return ""; // 不支持该操作
        if (this.getBroswer().broswer == "FireFox" && parseInt(this.getBroswer().version) < 91) {
            console.log("Unsupported firefox version!")
            return ;
        };//Firefox不支持
        const permissionStatus = await navigator.permissions.query({name:'clipboard-read'});
        if (permissionStatus.state != 'granted') return "" // 未授权
        return await navigator.clipboard.readText();
    }

    getBroswer(){
        var Sys = {};
        var ua = navigator.userAgent.toLowerCase();  
        var s;  
        (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? Sys.ie = s[1] :
        (s = ua.match(/msie ([\d\.]+)/)) ? Sys.ie = s[1] :  
        (s = ua.match(/edge\/([\d\.]+)/)) ? Sys.edge = s[1] :
        (s = ua.match(/firefox\/([\d\.]+)/)) ? Sys.firefox = s[1] :  
        (s = ua.match(/(?:opera|opr).([\d\.]+)/)) ? Sys.opera = s[1] :  
        (s = ua.match(/chrome\/([\d\.]+)/)) ? Sys.chrome = s[1] :  
        (s = ua.match(/version\/([\d\.]+).*safari/)) ? Sys.safari = s[1] : 0;  
        // 根据关系进行判断
        if (Sys.ie) return {'broswer': "IE", "version": Sys.ie};
        if (Sys.edge) return {'broswer': "Edge", "version": Sys.edge};
        if (Sys.firefox) return {'broswer': "FireFox", "version": Sys.firefox};
        if (Sys.chrome) return {'broswer': "Chrome", "version": Sys.chrome}; 
        if (Sys.opera) return {'broswer': "Opera", "version": Sys.opera};
        if (Sys.safari) return {'broswer': "Safari", "version": Sys.safari};
        return 'Unkonwn';
    }

    playSoundFromInternet (args, utils){
        utils.target.audio = new Audio(args.URL);
        console.log(utils.target.audio);
        utils.target.audio.play();
    }

    stopSoundFromInternet (args, utils){
        let audio = utils.target.audio;
        audio.pause();
        audio.currentTime = 0;
    }

    gotoWebsite (args){
        document.open(args.URL, "website", null, false);
    }

    getBooleanParamItem () {
        return [
            {
                text: formatMessage({
                    id: 'clipblocks.booleanMenu.true',
                    default: 'true',
                    description: 'label for true'
                }),
                value: BooleanParam.TRUE
            },
            {
                text: formatMessage({
                    id: 'clipblocks.booleanMenu.false',
                    default: 'false',
                    description: 'label for false'
                }),
                value: BooleanParam.FALSE
            }
        ];
    }

    getFlashGraphicParamItem () {
        return [
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.bevel',
                    default: 'bevel',
                    description: 'label for bevel'
                }),
                value: FlashGraphicParam.BEVEL
            },
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.blur',
                    default: 'blur',
                    description: 'label for blur'
                }),
                value: FlashGraphicParam.BLUR
            },
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.glow',
                    default: 'glow',
                    description: 'label for glow'
                }),
                value: FlashGraphicParam.GLOW
            },
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.shadow',
                    default: 'shadow',
                    description: 'label for shadow'
                }),
                value: FlashGraphicParam.SHADOW
            }
        ];
    }
}

module.exports = ClipBlocks;
