const Cast = require('../util/cast');
const MathUtil = require('../util/math-util.js');
const Timer = require('../util/timer');
const getMonitorIdForBlockWithArgs = require('../util/get-monitor-id');

class Scratch3SensingBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The 'answer' block value.
         * @type {string}
         */
        this._answer = '';

        /**
         * The timer utility.
         * @type {Timer}
         */
        this._timer = new Timer();

        /**
         * The stored microphone loudness measurement.
         * @type {number}
         */
        this._cachedLoudness = -1;

        /**
         * The time of the most recent microphone loudness measurement.
         * @type {number}
         */
        this._cachedLoudnessTimestamp = 0;

        /**
         * The list of queued questions and respective `resolve` callbacks.
         * @type {!Array}
         */
        this._questionList = [];

        this.runtime.on('ANSWER', this._onAnswer.bind(this));
        this.runtime.on('PROJECT_START', this._resetAnswer.bind(this));
        this.runtime.on('PROJECT_STOP_ALL', this._clearAllQuestions.bind(this));
        this.runtime.on('STOP_FOR_TARGET', this._clearTargetQuestions.bind(this));
        this.runtime.on('RUNTIME_DISPOSED', this._resetAnswer.bind(this));
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            sensing_touchingobject: this.touchingObject,
            sensing_touchingcolor: this.touchingColor,
            sensing_coloristouchingcolor: this.colorTouchingColor,
            sensing_distanceto: this.distanceTo,
            sensing_timer: this.getTimer,
            sensing_resettimer: this.resetTimer,
            sensing_of: this.getAttributeOf,
            sensing_mousex: this.getMouseX,
            sensing_mousey: this.getMouseY,
            sensing_joystickx: this.getJoystickX,
            sensing_joysticky: this.getJoystickY,
            sensing_joystick_distance: this.getJoystickDistance,
            sensing_setdragmode: this.setDragMode,
            sensing_mousedown: this.getMouseDown,
            sensing_mousepressed: this.getMousePressed,
            sensing_keypressed: this.getKeyPressed,
            sensing_current: this.current,
            sensing_dayssince2000: this.daysSince2000,
            sensing_loudness: this.getLoudness,
            sensing_loud: this.isLoud,
            sensing_askandwait: this.askAndWait,
            sensing_answer: this.getAnswer,
            sensing_username: this.getUsername,
            sensing_userid: () => {}, // legacy no-op block
            sensing_operatingsystem: this.getOS,
            sensing_clipcc_version: this.getVersion,
            sensing_turnonturbomode: (args, util) => {
                this.setTurboMode(true);
            },
            sensing_turnoffturbomode: (args, util) => {
                this.setTurboMode(false);
            },
            sensing_isturbomode: (args, util) => this.runtime.turboMode,
            sensing_distancebetweenposition: this.distanceBetweenPosition,
            sensing_directionbetweenposition: this.directionBetweenPosition,
            sensing_colorat: this.colorAt
        };
    }

    getMonitored () {
        return {
            sensing_answer: {
                getId: () => 'answer'
            },
            sensing_loudness: {
                getId: () => 'loudness'
            },
            sensing_timer: {
                getId: () => 'timer'
            },
            sensing_current: {
                // This is different from the default toolbox xml id in order to support
                // importing multiple monitors from the same opcode from sb2 files,
                // something that is not currently supported in scratch 3.
                getId: (_, fields) => getMonitorIdForBlockWithArgs('current', fields) // _${param}`
            }
        };
    }

    _onAnswer (answer) {
        this._answer = answer;
        const questionObj = this._questionList.shift();
        if (questionObj) {
            const [_question, resolve, target, wasVisible, wasStage] = questionObj;
            // If the target was visible when asked, hide the say bubble unless the target was the stage.
            if (wasVisible && !wasStage) {
                this.runtime.emit('SAY', target, 'say', '');
            }
            resolve();
            this._askNextQuestion();
        }
    }

    _resetAnswer () {
        this._answer = '';
    }

    _enqueueAsk (question, resolve, target, wasVisible, wasStage) {
        this._questionList.push([question, resolve, target, wasVisible, wasStage]);
    }

    _askNextQuestion () {
        if (this._questionList.length > 0) {
            const [question, _resolve, target, wasVisible, wasStage] = this._questionList[0];
            // If the target is visible, emit a blank question and use the
            // say event to trigger a bubble unless the target was the stage.
            if (wasVisible && !wasStage) {
                this.runtime.emit('SAY', target, 'say', question);
                this.runtime.emit('QUESTION', '');
            } else {
                this.runtime.emit('QUESTION', question);
            }
        }
    }

    _clearAllQuestions () {
        this._questionList = [];
        this.runtime.emit('QUESTION', null);
    }

    _clearTargetQuestions (stopTarget) {
        const currentlyAsking = this._questionList.length > 0 && this._questionList[0][2] === stopTarget;
        this._questionList = this._questionList.filter(question => (
            question[2] !== stopTarget
        ));

        if (currentlyAsking) {
            this.runtime.emit('SAY', stopTarget, 'say', '');
            if (this._questionList.length > 0) {
                this._askNextQuestion();
            } else {
                this.runtime.emit('QUESTION', null);
            }
        }
    }

    askAndWait (args, util) {
        const _target = util.target;
        return new Promise(resolve => {
            const isQuestionAsked = this._questionList.length > 0;
            this._enqueueAsk(String(args.QUESTION), resolve, _target, _target.visible, _target.isStage);
            if (!isQuestionAsked) {
                this._askNextQuestion();
            }
        });
    }

    getAnswer () {
        return this._answer;
    }

    touchingObject (args, util) {
        return util.target.isTouchingObject(args.TOUCHINGOBJECTMENU);
    }

    touchingColor (args, util) {
        const color = Cast.toRgbColorList(args.COLOR);
        return util.target.isTouchingColor(color);
    }

    colorTouchingColor (args, util) {
        const maskColor = Cast.toRgbColorList(args.COLOR);
        const targetColor = Cast.toRgbColorList(args.COLOR2);
        return util.target.colorIsTouchingColor(targetColor, maskColor);
    }

    distanceTo (args, util) {
        if (util.target.isStage) return 10000;

        let targetX = 0;
        let targetY = 0;
        if (args.DISTANCETOMENU === '_mouse_') {
            targetX = util.ioQuery('mouse', 'getScratchX');
            targetY = util.ioQuery('mouse', 'getScratchY');
        } else {
            args.DISTANCETOMENU = Cast.toString(args.DISTANCETOMENU);
            const distTarget = this.runtime.getSpriteTargetByName(
                args.DISTANCETOMENU
            );
            if (!distTarget) return 10000;
            targetX = distTarget.x;
            targetY = distTarget.y;
        }

        const dx = util.target.x - targetX;
        const dy = util.target.y - targetY;
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    distanceBetweenPosition (args, util) {
        const dx = args.X1 - args.X2;
        const dy = args.Y1 - args.Y2;
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    directionBetweenPosition (args, util) {
        const dx = args.X2 - args.X1;
        const dy = args.Y2 - args.Y1;
        let d = MathUtil.radToDeg(Math.atan(dx / dy));
        if (dy < 0) {
            if (d > 0) d = d - 180;
            else d = d + 180;
        }
        return d;
    }

    setTurboMode (turboModeOn) {
        this.runtime.turboMode = !!turboModeOn;
        if (this.runtime.turboMode) {
            this.runtime.emit('TURBO_MODE_ON');
        } else {
            this.runtime.emit('TURBO_MODE_OFF');
        }
    }

    setDragMode (args, util) {
        util.target.setDraggable(args.DRAG_MODE === 'draggable');
    }

    getTimer (args, util) {
        return util.ioQuery('clock', 'projectTimer');
    }

    resetTimer (args, util) {
        util.ioQuery('clock', 'resetProjectTimer');
    }

    getMouseX (args, util) {
        return util.ioQuery('mouse', 'getScratchX');
    }

    getMouseY (args, util) {
        return util.ioQuery('mouse', 'getScratchY');
    }
    
    getJoystickX (args, util) {
        return util.ioQuery('joystick', 'getX');
    }
    
    getJoystickY (args, util) {
        return util.ioQuery('joystick', 'getY');
    }
    
    getJoystickDistance (args, util) {
        return util.ioQuery('joystick', 'getDistance');
    }

    getMouseDown (args, util) {
        return util.ioQuery('mouse', 'getIsDown');
    }

    getMousePressed (args, util) {
        return util.ioQuery('mouse', 'getMousePressed', [Number(args.MOUSE_OPTION)]);
    }

    current (args) {
        const menuOption = Cast.toString(args.CURRENTMENU).toLowerCase();
        const date = new Date();
        switch (menuOption) {
        case 'year': return date.getFullYear();
        case 'month': return date.getMonth() + 1; // getMonth is zero-based
        case 'date': return date.getDate();
        case 'dayofweek': return date.getDay() + 1; // getDay is zero-based, Sun=0
        case 'hour': return date.getHours();
        case 'minute': return date.getMinutes();
        case 'second': return date.getSeconds();
        }
        return 0;
    }

    getKeyPressed (args, util) {
        return util.ioQuery('keyboard', 'getKeyIsDown', [args.KEY_OPTION]);
    }

    daysSince2000 () {
        const msPerDay = 24 * 60 * 60 * 1000;
        const start = new Date(2000, 0, 1); // Months are 0-indexed.
        const today = new Date();
        const dstAdjust = today.getTimezoneOffset() - start.getTimezoneOffset();
        let mSecsSinceStart = today.valueOf() - start.valueOf();
        mSecsSinceStart += ((today.getTimezoneOffset() - dstAdjust) * 60 * 1000);
        return mSecsSinceStart / msPerDay;
    }

    getLoudness () {
        if (typeof this.runtime.audioEngine === 'undefined') return -1;
        if (this.runtime.currentStepTime === null) return -1;

        // Only measure loudness once per step
        const timeSinceLoudness = this._timer.time() - this._cachedLoudnessTimestamp;
        if (timeSinceLoudness < this.runtime.currentStepTime) {
            return this._cachedLoudness;
        }

        this._cachedLoudnessTimestamp = this._timer.time();
        this._cachedLoudness = this.runtime.audioEngine.getLoudness();
        return this._cachedLoudness;
    }

    isLoud () {
        return this.getLoudness() > 10;
    }

    getAttributeOf (args) {
        let attrTarget;

        if (args.OBJECT === '_stage_') {
            attrTarget = this.runtime.getTargetForStage();
        } else {
            args.OBJECT = Cast.toString(args.OBJECT);
            attrTarget = this.runtime.getSpriteTargetByName(args.OBJECT);
        }

        // attrTarget can be undefined if the target does not exist
        // (e.g. single sprite uploaded from larger project referencing
        // another sprite that wasn't uploaded)
        if (!attrTarget) return 0;

        // Generic attributes
        if (attrTarget.isStage) {
            switch (args.PROPERTY) {
            // Scratch 1.4 support
            case 'background #': return attrTarget.currentCostume + 1;

            case 'backdrop #': return attrTarget.currentCostume + 1;
            case 'backdrop name':
                return attrTarget.getCostumes()[attrTarget.currentCostume].name;
            case 'volume': return attrTarget.volume;
            }
        } else {
            switch (args.PROPERTY) {
            case 'x position': return attrTarget.x;
            case 'y position': return attrTarget.y;
            case 'direction': return attrTarget.direction;
            case 'costume #': return attrTarget.currentCostume + 1;
            case 'costume name':
                return attrTarget.getCostumes()[attrTarget.currentCostume].name;
            case 'size': return attrTarget.size;
            case 'volume': return attrTarget.volume;
            }
        }

        // Target variables.
        const varName = args.PROPERTY;
        const variable = attrTarget.lookupVariableByNameAndType(varName, '', true);
        if (variable) {
            return variable.value;
        }

        // Otherwise, 0
        return 0;
    }

    getUsername (args, util) {
        return util.ioQuery('userData', 'getUsername');
    }

    getOS () {
        if (navigator.userAgentData) {
            return new Promise(resolve => {
                navigator.userAgentData.getHighEntropyValues(["platformVersion"])
                    .then(ua => {
                        if (navigator.userAgentData.platform !== "Windows")
                            resolve(this._getOS());
                        
                        const majorPlatformVersion = parseInt(ua.platformVersion.split('.')[0]);
                        if (majorPlatformVersion >= 13) resolve('Win11');
                        else resolve(this._getOS());
                    });
            });
        }
        return this._getOS();
    }
    
    _getOS () {
        const userAgent = navigator.userAgent;
        const isWin = (navigator.platform == 'Win32') || (navigator.platform == 'Windows');
        const isMac = (navigator.platform == 'Mac68K') || (navigator.platform == 'MacPPC') || (navigator.platform == 'Macintosh') || (navigator.platform == 'MacIntel');
        if (isMac) return 'Mac';
        const isUnix = (navigator.platform == 'X11') && !isWin && !isMac;
        if (isUnix) return 'Unix';
        const isLinux = (String(navigator.platform).indexOf('Linux') > -1);
        if (isLinux) return 'Linux';
        if (isWin) {
            const isWin2K = userAgent.indexOf('Windows NT 5.0') > -1 || userAgent.indexOf('Windows 2000') > -1;
            if (isWin2K) return 'Win2000';
            const isWinXP = userAgent.indexOf('Windows NT 5.1') > -1 || userAgent.indexOf('Windows XP') > -1;
            if (isWinXP) return 'WinXP';
            const isWin2003 = userAgent.indexOf('Windows NT 5.2') > -1 || userAgent.indexOf('Windows 2003') > -1;
            if (isWin2003) return 'Win2003';
            const isWinVista = userAgent.indexOf('Windows NT 6.0') > -1 || userAgent.indexOf('Windows Vista') > -1;
            if (isWinVista) return 'WinVista';
            const isWin7 = userAgent.indexOf('Windows NT 6.1') > -1 || userAgent.indexOf('Windows 7') > -1;
            if (isWin7) return 'Win7';
            const isWin10 = userAgent.indexOf('Windows NT 10') > -1 || userAgent.indexOf('Windows 10') > -1;
            if (isWin10) return 'Win10';
        }
        return 'Other';
    }

    getVersion () {
        return this.runtime.version;
    }
    
    colorAt (args) {
        const renderer = this.runtime.renderer;
        const x = Cast.toNumber(args.X);
        const y = Cast.toNumber(args.Y);
        const {r, g, b} = renderer.extractColor(x, y, 1, true).color;
        return (r << 16) + (g << 8) + b;
    }
}

module.exports = Scratch3SensingBlocks;
