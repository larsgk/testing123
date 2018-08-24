// @ts-check
import { BaseSensor } from './basesensor.js'

export class Thingy52Control extends BaseSensor {
    constructor() {
        super('Thingy52');

        this._onTemperatureChange = this._onTemperatureChange.bind(this);
        this._onAccelChange = this._onAccelChange.bind(this);
        this._onButtonChange = this._onButtonChange.bind(this);

        this._devices = new Map();
    }

    initialize() {
        // todo ..
    }

    async scan() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['ef680100-9b35-4933-9b10-52ffa9740042'] }],
                optionalServices: [
                    "ef680200-9b35-4933-9b10-52ffa9740042",
                    "ef680300-9b35-4933-9b10-52ffa9740042",
                    "ef680400-9b35-4933-9b10-52ffa9740042",
                    "ef680500-9b35-4933-9b10-52ffa9740042"
                ]
            });

            this._attachDevice(device);

        } catch (err) {
            console.log(err); // No device was selected.
        }
    }

    // When the GATT server is disconnected, remove the device from the list
    _deviceDisconnected(device) {
        console.log('Disconnected', device);

        if(this._devices.has(device.id)) {
            this._devices.delete(device.id);
            this.emitDisconnected(device.id);
            this.emitMessage(device.id, "");
        }
    }

    async _attachDevice(device) {
        if(this._devices.has(device.id)) {
            console.log("Device already connected: ", device.id);
            return;
        }

        const server = await device.gatt.connect();

        await this._startTemperatureNotifications(server);
        await this._startAccelerometerNotifications(server);
        await this._startButtonClickNotifications(server);

        // Maybe we need some light to indicate accelerometer 
        // const led = await this._getLedCharacteristic(server);
    
        this._devices.set(device.id, device);
    
        device.ongattserverdisconnected = _ => this._deviceDisconnected(device);
        
        this.emitConnected(device.id);
    }

    _onAccelChange(event) {
        const target = event.target;
        const deviceId = target.service.device.id;

        const accel = {
          x: +target.value.getFloat32(0, true).toPrecision(5),
          y: +target.value.getFloat32(4, true).toPrecision(5),
          z: +target.value.getFloat32(8, true).toPrecision(5)
        };

        this.emitData(deviceId, {type: 'acceleration', value: accel});    
    }

    _onTemperatureChange(event) {
        const target = event.target;
        const deviceId = target.service.device.id;
    
        const integer = target.value.getUint8(0);
        const decimal = target.value.getUint8(1);

        this.emitData(deviceId, {type: 'temperature', value: parseFloat(`${integer}.${decimal}`)}); 
      }
    
    
    _onButtonChange(event) {
        const target = event.target;
        const deviceId = target.service.device.id;
    
        const buttonPressed = target.value.getUint8(0) === 1;

        this.emitData(deviceId, {type: 'button', value: buttonPressed});    
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

    _detachDevice(device) {
        device.gatt.disconnect();
        // results in _deviceDisconnected call.
    }
}