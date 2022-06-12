class Joystick {
    constructor (runtime) {
        this._x = 0;
        this._y = 0;
        this._distance = 0;
        /**
         * Reference to the owning Runtime.
         * Can be used, for example, to activate hats.
         * @type{!Runtime}
         */
        this.runtime = runtime;
    }

    postData (data) {
        if (data.hasOwnProperty('x')) this._x = data.x;
        if (data.hasOwnProperty('y')) this._y = data.y;
        if (data.hasOwnProperty('distance')) this._distance = data.distance;
    }

    getX () {
        return this._x;
    }

    getY () {
        return this._y;
    }

    getDistance () {
        return this._distance;
    }
}

module.exports = Joystick;
