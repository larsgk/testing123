// @ts-check
import { BaseDevice } from './base-device.js'

export class Thingy52Device extends BaseDevice {
    constructor(btDevice) {
        super('Thingy52');

        this.initialize = this.initialize.bind(this);

        this._btDevice = btDevice;
        this.deviceId = `${this.deviceType}:${this._btDevice.id}`;

        this._onTemperatureChange = this._onTemperatureChange.bind(this);
        this._onAccelChange = this._onAccelChange.bind(this);
        this._onButtonChange = this._onButtonChange.bind(this);
        this._setRGB = this._setRGB.bind(this);
    }

    async initialize() {
        console.log(`Initializing ${this.deviceType} device with id: ${this.deviceId}`);
        const server = await this._btDevice.gatt.connect();

        // Sensors
        await this._startTemperatureNotifications(server);
        await this._startAccelerometerNotifications(server);
        await this._startButtonClickNotifications(server);

        // Actuators
        this._rgbled = await this._getLedCharacteristic(server);

        this._btDevice.ongattserverdisconnected = _ => this._deviceDisconnected();

        this.emitDeviceReady();
    }

    disconnect() {
        this._btDevice.gatt.disconnect();
    }

    _deviceDisconnected(device) {
        console.log(`Disconnected: ${this.deviceId}`);

        this.emitDeviceDisconnected();
    }

    _onAccelChange(event) {
        const target = event.target;

        const accel = {
          x: +target.value.getFloat32(0, true).toPrecision(5),
          y: +target.value.getFloat32(4, true).toPrecision(5),
          z: +target.value.getFloat32(8, true).toPrecision(5)
        };

        // do some crude shake detection

        this.emitDebugData({type: 'acceleration', value: accel});    
    }

    _onTemperatureChange(event) {
        const target = event.target;
    
        const integer = target.value.getUint8(0);
        const decimal = target.value.getUint8(1);

        this.emitDebugData({type: 'temperature', value: parseFloat(`${integer}.${decimal}`)}); 
    }
    
    _onButtonChange(event) {
        const target = event.target;
    
        const buttonPressed = target.value.getUint8(0) === 1;

        this.emitDebugData({type: 'button', value: buttonPressed});

        this.emitDebugAlertLevel(buttonPressed ? 4 : 1);
    }

    _setRGB(value) {
        if (this._rgbled) {
            const hexToRGB = hex => hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16));
            const color = hexToRGB(value);
            return this._rgbled.writeValue(new Uint8Array([1, ...color]));
        }
    }

    async _startTemperatureNotifications(server) {
        const service = await server.getPrimaryService('ef680200-9b35-4933-9b10-52ffa9740042');
        const characteristic = await service.getCharacteristic('ef680201-9b35-4933-9b10-52ffa9740042');
        characteristic.addEventListener('characteristicvaluechanged', this._onTemperatureChange);
        return characteristic.startNotifications();
    }

    async _startAccelerometerNotifications(server) {
        const service = await server.getPrimaryService('ef680400-9b35-4933-9b10-52ffa9740042');
        const characteristic = await service.getCharacteristic('ef68040a-9b35-4933-9b10-52ffa9740042');
        characteristic.addEventListener('characteristicvaluechanged', this._onAccelChange);
        return characteristic.startNotifications();
    }
    
    async _startButtonClickNotifications(server) {
        const service = await server.getPrimaryService('ef680300-9b35-4933-9b10-52ffa9740042');
        const characteristic = await service.getCharacteristic('ef680302-9b35-4933-9b10-52ffa9740042');
        characteristic.addEventListener('characteristicvaluechanged', this._onButtonChange);
        return characteristic.startNotifications();
    }

    async _getLedCharacteristic(server) {
        const service = await server.getPrimaryService('ef680300-9b35-4933-9b10-52ffa9740042');
        return await service.getCharacteristic('ef680301-9b35-4933-9b10-52ffa9740042');
    }
    
}