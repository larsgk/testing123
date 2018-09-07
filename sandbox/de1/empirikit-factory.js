// @ts-check
import { EmpiriKitDevice } from './empirikit-device.js';

const empiriKitUSBID = {
    VID: 0x1209,
    PID: 0xD017
};

class _Factory extends EventTarget {
    constructor() {
        super();
        this.type = "empiriKit";

        console.log(`Created factory for: ${this.type}`);

        this.initialize();
    }

    initialize() {
        // Connect to paired devices
        navigator.usb.getDevices()
        .then(availableDevices => {
            console.log(availableDevices);
            // Check that this is an empiriKit device
            for(let usbDevice of availableDevices) {
                if(usbDevice.vendorId === empiriKitUSBID.VID && usbDevice.productId === empiriKitUSBID.PID) {
                    const device = new EmpiriKitDevice(usbDevice);

                    this.dispatchEvent(new CustomEvent('connect', {detail: {device: device}}));
                }
            }
            throw "no device available yet";
        })
        .catch(error => { console.log(error); });
        
        navigator.usb.addEventListener('connect', evt => {
            console.log("something connected!");
            const device = new EmpiriKitDevice(evt.device);

            this.dispatchEvent(new CustomEvent('connect', {detail: {device: device}}));
        });
    }

    scan() {
        navigator.usb.requestDevice({ filters: [{vendorId: empiriKitUSBID.VID, productId: empiriKitUSBID.PID}] })
        .then(selectedDevice => {
            const device = new EmpiriKitDevice(selectedDevice);

            this.dispatchEvent(new CustomEvent('connect', {detail: {device: device}}));
        })
        .catch(error => { console.log(error); });
    }
}


const _instance = new _Factory();

export const EmpiriKitFactory = _instance;