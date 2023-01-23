package com.leff.midi;

import com.leff.midi.util.MidiUtil;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/* loaded from: /home/user/下载/clxTools/楚留香音乐盒/src/android-midi-lib.dex */
public class MidiFile {
    public static final int DEFAULT_RESOLUTION = 480;
    public static final int HEADER_SIZE = 14;
    public static final byte[] IDENTIFIER = {77, 84, 104, 100};
    private int mResolution;
    private int mTrackCount;
    private List<MidiTrack> mTracks;
    private int mType;

    public MidiFile() {
        this((int) DEFAULT_RESOLUTION);
    }

    public MidiFile(int resolution) {
        this(resolution, new ArrayList());
    }

    public MidiFile(int resolution, List<MidiTrack> tracks) {
        this.mResolution = resolution < 0 ? DEFAULT_RESOLUTION : resolution;
        this.mTracks = tracks != null ? tracks : new ArrayList<>();
        this.mTrackCount = tracks.size();
        this.mType = this.mTrackCount > 1 ? 1 : 0;
    }

    public MidiFile(File fileIn) throws FileNotFoundException, IOException {
        this(new FileInputStream(fileIn));
    }

    public MidiFile(InputStream rawIn) throws IOException {
        BufferedInputStream in = new BufferedInputStream(rawIn);
        byte[] buffer = new byte[14];
        in.read(buffer);
        initFromBuffer(buffer);
        this.mTracks = new ArrayList();
        for (int i = 0; i < this.mTrackCount; i++) {
            this.mTracks.add(new MidiTrack(in));
        }
    }

    public void setType(int type) {
        if (type < 0) {
            type = 0;
        } else if (type > 2) {
            type = 1;
        } else if (type == 0 && this.mTrackCount > 1) {
            type = 1;
        }
        this.mType = type;
    }

    public int getType() {
        return this.mType;
    }

    public int getTrackCount() {
        return this.mTrackCount;
    }

    public void setResolution(int res) {
        if (res >= 0) {
            this.mResolution = res;
        }
    }

    public int getResolution() {
        return this.mResolution;
    }

    public long getLengthInTicks() {
        long length = 0;
        for (MidiTrack T : this.mTracks) {
            long l = T.getLengthInTicks();
            if (l > length) {
                length = l;
            }
        }
        return length;
    }

    public List<MidiTrack> getTracks() {
        return this.mTracks;
    }

    public void addTrack(MidiTrack T) {
        addTrack(T, this.mTracks.size());
    }

    public void addTrack(MidiTrack T, int pos) {
        int i = 1;
        if (pos > this.mTracks.size()) {
            pos = this.mTracks.size();
        } else if (pos < 0) {
            pos = 0;
        }
        this.mTracks.add(pos, T);
        this.mTrackCount = this.mTracks.size();
        if (this.mTrackCount <= 1) {
            i = 0;
        }
        this.mType = i;
    }

    public void removeTrack(int pos) {
        int i = 1;
        if (pos >= 0 && pos < this.mTracks.size()) {
            this.mTracks.remove(pos);
            this.mTrackCount = this.mTracks.size();
            if (this.mTrackCount <= 1) {
                i = 0;
            }
            this.mType = i;
        }
    }

    public void writeToFile(File outFile) throws FileNotFoundException, IOException {
        FileOutputStream fout = new FileOutputStream(outFile);
        fout.write(IDENTIFIER);
        fout.write(MidiUtil.intToBytes(6, 4));
        fout.write(MidiUtil.intToBytes(this.mType, 2));
        fout.write(MidiUtil.intToBytes(this.mTrackCount, 2));
        fout.write(MidiUtil.intToBytes(this.mResolution, 2));
        for (MidiTrack T : this.mTracks) {
            T.writeToFile(fout);
        }
        fout.flush();
        fout.close();
    }

    private void initFromBuffer(byte[] buffer) {
        if (!MidiUtil.bytesEqual(buffer, IDENTIFIER, 0, 4)) {
            System.out.println("File identifier not MThd. Exiting");
            this.mType = 0;
            this.mTrackCount = 0;
            this.mResolution = DEFAULT_RESOLUTION;
            return;
        }
        this.mType = MidiUtil.bytesToInt(buffer, 8, 2);
        this.mTrackCount = MidiUtil.bytesToInt(buffer, 10, 2);
        this.mResolution = MidiUtil.bytesToInt(buffer, 12, 2);
    }
}