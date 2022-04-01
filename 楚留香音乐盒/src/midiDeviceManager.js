//https://developer.android.google.cn/reference/android/media/midi/package-summary
importClass(android.media.midi.MidiManager);
importClass(android.media.midi.MidiDeviceInfo);
importClass(android.media.midi.MidiDeviceStatus);
importClass(android.media.midi.MidiReceiver);
importClass(android.media.midi.MidiOutputPort);

//Context
importClass(android.content.Context);

var MidiFramer = require("./midiFramer.js");


function MidiDeviceManager() {
    this.STATUS_COMMAND_MASK = 0xF0;
    this.STATUS_CHANNEL_MASK = 0x0F;
    this.STATUS_NOTE_OFF = 0x80;
    this.STATUS_NOTE_ON = 0x90;
    let midiManager = context.getSystemService(Context.MIDI_SERVICE);
    let midiFramer = new MidiFramer();
    this.getMidiDeviceNames = function () {
        let midiDevices = midiManager.getDevices();
        let midiDeviceNames = [];
        for (let i = 0; i < midiDevices.length; i++) {
            let midiDeviceInfo = midiDevices[i];
            let midiDeviceName = midiDeviceInfo.getProperties().getString(MidiDeviceInfo.PROPERTY_NAME);
            if (midiDeviceName === "" || midiDeviceName === null) {
                midiDeviceName = "未命名";
            }
            midiDeviceNames.push(midiDeviceName);
        }
        return midiDeviceNames;
    };
    this.getMidiPortNames = function (midiDeviceIndex) {
        let midiPortNames = [];
        let midiDevices = midiManager.getDevices();
        let midiDeviceInfo = midiDevices[midiDeviceIndex];
        let portInfos = midiDeviceInfo.getPorts();
        for (let i = 0; i < portInfos.length; i++) {
            if (portInfos[i].getType() === MidiDeviceInfo.PortInfo.TYPE_OUTPUT) { //Output是相对于对方设备的输出端口, 因此在这里用于输入
                let midiPortName = portInfos[i].getName();
                if (midiPortName === ""|| midiPortName === null) {
                    midiPortName = "未命名";
                }
                midiPortNames.push(midiPortName);
            }
        }
        return midiPortNames;
    }
    let device = null;
    let pktBuffer = [];
    let msgBuffer = [];
    let midiReceiver = new android.media.midi.MidiReceiver(
        {
            onSend: function (msg, offset, cnt, timeStamp) {    
                let arr = [];   //这里如果用Uint8Array也会卡死
                for (let i = 0; i < cnt+offset; i++) {
                    arr.push(msg[i]);
                }
                pktBuffer.push([arr, offset, cnt, timeStamp]);
                //如果在这里调用回调函数, 程序就会卡死, 因此只能轮询
            }
        });
    this.openDevicePort = function (midiDeviceIndex, midiPortIndex) {
        let midiDeviceInfo = midiManager.getDevices()[midiDeviceIndex];
        
        let deviceOpenListener = new MidiManager.OnDeviceOpenedListener({
            onDeviceOpened: function (dev) {
                if(dev === null){
                    throw new Error("打开设备失败:" + dev);
                    return;
                }
                device = dev;
            }
        });
        midiManager.openDevice(midiDeviceInfo,deviceOpenListener,null);
        while(device === null){
            console.log("等待设备连接...");
            sleep(100);
        }
        let outputPort = device.openOutputPort(midiPortIndex);
        outputPort.connect(midiReceiver);
    }
    this.dataAvailable = function () {
        while(pktBuffer.length > 0){
            let pkt = pktBuffer.shift();
            midiFramer.parse(new Uint8Array(pkt[0]), pkt[1], pkt[2], pkt[3]);
        }
        while(midiFramer.dataAvailable()){
            msgBuffer.push(midiFramer.read());
        }
        return msgBuffer.length;
    }
    this.read = function () {
        let data = msgBuffer.shift();
        //console.log("msg:" + data[0]);
        return new Uint8Array(data[0]);
    }
    this.close = function () {
        device.close();
        device = null;
        msgBuffer = [];
    }
}


module.exports = MidiDeviceManager;