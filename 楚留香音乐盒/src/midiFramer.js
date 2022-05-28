//See: https://github.com/googlearchive/android-MidiSynth/blob/master/Application/src/main/java/com/example/android/common/midi/MidiFramer.java

/**
 * Convert stream of arbitrary MIDI bytes into discrete messages.
 *
 * Parses the incoming bytes and then posts individual messages to the receiver
 * specified in the constructor. Short messages of 1-3 bytes will be complete.
 * System Exclusive messages may be posted in pieces.
 *
 * Resolves Running Status and interleaved System Real-Time messages.
 */

/** Number of bytes in a message nc from 8c to Ec */
const CHANNEL_BYTE_LENGTHS = [3, 3, 3, 3, 2, 2, 3];
/** Number of bytes in a message Fn from F0 to FF */
const SYSTEM_BYTE_LENGTHS = [1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function getBytesPerMessage(statusByte) {
    // Java bytes are signed so we need to mask off the high bits
    // to get a value between 0 and 255.
    let statusInt = statusByte & 0xFF;
    if (statusInt >= 0xF0) {
        // System messages use low nibble for size.
        return SYSTEM_BYTE_LENGTHS[statusInt & 0x0F];
    } else if (statusInt >= 0x80) {
        // Channel voice messages use high nibble for size.
        return CHANNEL_BYTE_LENGTHS[(statusInt >> 4) - 8];
    } else {
        return 0; // data byte
    }
}

function MidiFramer() {
    let mBuffer = [];
    let mCount = 0;
    let mRunningStatus;
    let mNeeded;
    let mInSysEx = false;

    let messagesBuffer = [];

    this.parse = function (data, offset, count, timestamp) {
        let sysExStartOffset = (mInSysEx ? offset : -1);

        for (let i = 0; i < count; i++) {
            let currentByte = data[offset];
            let currentInt = currentByte & 0xFF;
           // console.log("currentInt in hex: " + currentInt.toString(16));
            if (currentInt >= 0x80) { // status byte?
                if (currentInt < 0xF0) { // channel message?
                    mRunningStatus = currentByte;
                    mCount = 1;
                    mNeeded = getBytesPerMessage(currentByte) - 1;
                } else if (currentInt < 0xF8) { // system common?
                    if (currentInt == 0xF0 /* SysEx Start */) {
                        // Log.i(TAG, "SysEx Start");
                        mInSysEx = true;
                        sysExStartOffset = offset;
                    } else if (currentInt == 0xF7 /* SysEx End */) {
                        // Log.i(TAG, "SysEx End");
                        if (mInSysEx) {
                            messagesBuffer.push([data, sysExStartOffset,
                                offset - sysExStartOffset + 1, timestamp]);
                            mInSysEx = false;
                            sysExStartOffset = -1;
                        }
                    } else {
                        mBuffer[0] = currentByte;
                        mRunningStatus = 0;
                        mCount = 1;
                        mNeeded = getBytesPerMessage(currentByte) - 1;
                    }
                } else { // real-time?
                    // Single byte message interleaved with other data.
                    if (mInSysEx) {
                        messagesBuffer.push([data, sysExStartOffset,
                            offset - sysExStartOffset, timestamp]);
                        sysExStartOffset = offset + 1;
                    }
                    messagesBuffer.push([data, offset, 1, timestamp]);
                }
            } else { // data byte
                if (!mInSysEx) {
                    mBuffer[mCount++] = currentByte;
                    if (--mNeeded == 0) {
                        if (mRunningStatus != 0) {
                            mBuffer[0] = mRunningStatus;
                        }
                        let mBufferCopy = mBuffer.slice();
                        messagesBuffer.push([mBufferCopy, 0, mCount, timestamp]);
                        mNeeded = getBytesPerMessage(mBuffer[0]) - 1;
                        mCount = 1;
                    }
                }
            }
            ++offset;
        }

        // send any accumulatedSysEx data
        if (sysExStartOffset >= 0 && sysExStartOffset < offset) {
            messagesBuffer.push([data, sysExStartOffset,
                offset - sysExStartOffset, timestamp]);
        }
    }
    this.dataAvailable = function () {
        return messagesBuffer.length;
    }

    this.read = function () {
        return messagesBuffer.shift();
    }

}

module.exports = MidiFramer;