// @ts-check

/**
 * Handles
 *  - 'defcon' levels
 *  - mesh communication
 */

const _alertLevels = [
    {
        name: "LOW",
        color: '#004040'
    },
    {
        name: "NORMAL",
        color: '#00ff00'
    },
    {
        name: "RAISED",
        color: '#ffff00'
    },
    {
        name: "HIGH",
        color: '#ff8000'
    },
    {
        name: "SEVERE",
        color: '#ff0000'
    }
];

export class BaseDevice extends EventTarget {
    constructor(type) {
        super();

        this.deviceType = type;
        this.deviceId = null;
        this._alertLevel = 1; // normal
    }

    initialize() {
        throw `${typeof this}.initialize() not implemented!`;
    }

    emitDeviceReady() {
        this.dispatchEvent(new CustomEvent('ready'));
    }

    emitDeviceDisconnected() {
        this.dispatchEvent(new CustomEvent('disconnect'));
    }

    emitDebugData(data) {
        this.dispatchEvent(new CustomEvent('debug-data', {detail: data}));
    }

    emitDebugAlertLevel(level) {
        this.dispatchEvent(new CustomEvent('debug-alert-level', {detail: level}));
    }


    setAlertLevel(level) {
        this._alertLevel = level;
        const alertVal = _alertLevels[level];

        if(alertVal && this._setRGB !== undefined) {
            this._setRGB(alertVal.color);
        }
    }

    // mesh functions
    // defcon related functions
}
