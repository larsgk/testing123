// @ts-check
import { Thingy52Device } from './thingy52-device.js'

class _Factory extends EventTarget {
    constructor() {
        super();
        this.type = "Thingy52";

        console.log(`Created factory for: ${this.type}`);
    }

    async scan() {
        try {
            const bluetoothDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['ef680100-9b35-4933-9b10-52ffa9740042'] }],
                optionalServices: [
                    "ef680200-9b35-4933-9b10-52ffa9740042",
                    "ef680300-9b35-4933-9b10-52ffa9740042",
                    "ef680400-9b35-4933-9b10-52ffa9740042",
                    "ef680500-9b35-4933-9b10-52ffa9740042"
                ]
            });

            // TODO: check with mesh if already connected (then bail out)

            const device = new Thingy52Device(bluetoothDevice);

            this.dispatchEvent(new CustomEvent('connect', {detail: {device: device}}));
        } catch (err) {
            console.log(err); // No device was selected.
        }
    }    
}

const _instance = new _Factory();

export const Thing52Factory = _instance;