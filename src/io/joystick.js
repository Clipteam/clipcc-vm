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
        if (data.x) this._x = data.x;
        if (data.y) this._y = data.y;
        if (data.distance) this._distance = data.distance;
    }

    getX () {
        return this._x;
    }

    getY () {
        return this._y;
    }

    getDirection () {
        return this._direction;
    }
}

module.exports = Joystick;
