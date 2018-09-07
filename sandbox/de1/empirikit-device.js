// @ts-check
import { BaseDevice } from './base-device.js'

export class EmpiriKitDevice extends BaseDevice {
    constructor(usbDevice) {
        super('EmpiriKit');

        this.initialize = this.initialize.bind(this);

        this._startDataStream = this._startDataStream.bind(this);
        this._readFromDevice = this._readFromDevice.bind(this);
        this._handleMessage = this._handleMessage.bind(this);

        this._usbDevice = usbDevice;
        this.deviceId = `${this.deviceType}:${usbDevice.serialNumber}`;

        this._setRGB = this._setRGB.bind(this);

    }

    initialize() {
        console.log(`Initializing ${this.deviceType} device with id: ${this.deviceId}`);

        this._usbDevice.open()
        .then(_ => this._usbDevice.selectConfiguration(1))
        .then(_ => this._usbDevice.claimInterface(2))
        .then(_ => this._usbDevice.controlTransferOut({
            requestType: 'class',
            recipient: 'interface',
            request: 0x22,
            value: 0x01,
            index: 0x02})) // Ready to receive data
        .then(_ => { 
            // Clear current read stream buffer
            this.rstring = "";
            // init the devce (get HW info, etc)
            // TODO: Multi device support - could need proper serial numbers in firmware
            
            setTimeout(this._startDataStream, 500);
            
            this._readFromDevice(); 
        }) // Waiting for 64 bytes of data from endpoint #5.
        .catch(error => { console.log(error); });
    }

    _readFromDevice() {
        this._usbDevice.transferIn(5, 64).then(result => {
            const decoder = new TextDecoder();
            this.rstring += decoder.decode(result.data);
            // do a quick JSON smoketest (should do better with decoder/streaming)
            const startIdx = this.rstring.indexOf('{');
            if(startIdx > 0) this.rstring = this.rstring.substring(startIdx);
            const endIdx = this.rstring.indexOf('}');
            if(endIdx > -1) {
                const parseStr = this.rstring.substring(0, endIdx+1);
                this.rstring = this.rstring.substring(endIdx+1);
                try {
                    const msg = JSON.parse(parseStr);
                    this._handleMessage(msg);
                    //   this.dispatchEvent(new CustomEvent('ek-event', {detail:msg}), {bubbles: true});
                } catch(e) {
                    console.log("NOT JSON:",parseStr);
                }
                this.rstring = "";
            }
            this._readFromDevice();
        })
        .catch(error => { 
            console.log(error);
            this.emitDeviceDisconnected();
            this.rstring = "";
        });
    }
    
    sendCMD(string) {
        console.log(`Sending to serial: ${string}\n`);
        let data = new TextEncoder('utf-8').encode(string);
        console.log(data);
        if (this._usbDevice) {
            this._usbDevice.transferOut(5, data);
        }
    };
    
    _startDataStream() {
        this.sendCMD('{"STRACC":1}');
        this.sendCMD('{"STRTCH":1}');
    }
    
    _handleMessage(data) {
        if(data.datatype === "StreamData") {
            this.tick = data.tick;
            let accelData = data.accelerometerdata;
            let touchData = data.touchsensordata;
            
            if(accelData !== undefined) {
                const deviceId = this._usbDevice.serialNumber; // FIX firmware to get real serial number
                const accelFactor = 9.82 / (1<<14);  // TBD: Maybe we can adjust it in the firmware
                
                // Note: the values are adjusted to match direction and readings from Thingy:52 
                const accel = {
                    x: +accelData[0] * accelFactor,
                    y: -accelData[1] * accelFactor,
                    z: +accelData[2] * accelFactor
                };

                
                // this.emitDebugData({type: 'acceleration', value: accel});    
            }
            
            if(touchData !== undefined && this._lastTouchData != touchData) {
                //this.emitDebugData({type: 'touch', value: touchData});
                const tmpAlertLevel = Math.round(touchData * 4 / 40);
                if(tmpAlertLevel != this._alertLevel) {
                    this.emitDebugAlertLevel(tmpAlertLevel);
                }
                this._lastTouchData = touchData;
            }
        } else if(data.datatype === "HardwareInfo") {
            this.capabilities = data.capabilities;
            this.uid = data.uid;
            this.version = data.version;
        } else {
            console.log(data);
        }
    }
    
    _setRGB(value) {
        const hexToRGB = hex => hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16));
        const color = hexToRGB(value);
        this.sendCMD(`{"SETRGB":${JSON.stringify(color)}}`);
    }
}