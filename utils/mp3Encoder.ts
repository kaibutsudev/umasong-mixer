import { Mp3Encoder } from 'lamejs';

export function audioBufferToMp3(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const kbps = 128; // Standard quality

  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Int8Array[] = [];

  // Get channel data
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : null;

  // We need to convert Float32Array to Int16Array for lamejs
  // Process in chunks to avoid blocking the main thread too much (though this is sync)
  const sampleBlockSize = 1152; // multiple of 576
  const len = left.length;
  
  for (let i = 0; i < len; i += sampleBlockSize) {
    const leftChunk = left.subarray(i, i + sampleBlockSize);
    const rightChunk = right ? right.subarray(i, i + sampleBlockSize) : null;
    
    // Convert to Int16
    const leftInt16 = new Int16Array(leftChunk.length);
    for (let j = 0; j < leftChunk.length; j++) {
       leftInt16[j] = leftChunk[j] < 0 ? leftChunk[j] * 0x8000 : leftChunk[j] * 0x7FFF;
    }
    
    let rightInt16: Int16Array | undefined;
    if (rightChunk) {
        rightInt16 = new Int16Array(rightChunk.length);
        for (let j = 0; j < rightChunk.length; j++) {
            rightInt16[j] = rightChunk[j] < 0 ? rightChunk[j] * 0x8000 : rightChunk[j] * 0x7FFF;
        }
    }

    const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
}
