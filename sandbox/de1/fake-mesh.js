// @ts-check
import { Thing52Factory } from './thingy52-factory.js';
import { EmpiriKitFactory } from './empirikit-factory.js';

/**
 * owns devices
 * dispatches info between devices (~ 'publish/subscribe')
 */

export class FakeMesh extends EventTarget {
    constructor() {
        super();

        this.devices = new Map();

        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onDebugData = this.onDebugData.bind(this);
        this.onDebugAlertLevel = this.onDebugAlertLevel.bind(this);

        this.factories = new Map();
        this.factories.set(Thing52Factory.type, Thing52Factory);
        this.factories.set(EmpiriKitFactory.type, EmpiriKitFactory);

        for(let factory of this.factories.values()) {
            factory.addEventListener('connect', this.onConnect);
        }
    }

    factoryTypes() {
        return this.factories.keys();
    }

    scanFor(type) {
        if(!this.factories.has(type)) {
            throw `No factory registered for ${type}`;
        }

        this.factories.get(type).scan();
    }

    disconnect(deviceId) {
        const device = this.devices.get(deviceId);

        if(device) {
            device.disconnect();
        }
    }

    onConnect(evt) {
        const device = evt.detail.device;

        device.addEventListener('disconnect', this.onDisconnect);
        device.addEventListener('debug-data', this.onDebugData);
        device.addEventListener('debug-alert-level', this.onDebugAlertLevel);

        device.initialize();
        
        this.devices.set(device.deviceId, device);
        console.log(`Now there are ${this.devices.size} devices in the mesh`);
    }

    onDisconnect(evt) {
        const device = evt.target;

        this.devices.delete(device.deviceId);

        console.log(`Now there are ${this.devices.size} devices in the mesh`);
    }

    onDebugData(evt) {
        const device = evt.target;

        if(["temperature","button"].includes(evt.detail.type)) {
            console.log(device,evt.detail);
        }
    }

    onDebugAlertLevel(evt) {
        const device = evt.target;

        const level = evt.detail;

        for(let device of this.devices.values()) {
            device.setAlertLevel(level);
        }
    }

}