/**
 * Utility functions for audio manipulation and conversion
 * Used in the Song Mixer for downloading mixed audio
 */

/**
 * Converts an AudioBuffer to WAV format
 * 
 * This function creates a WAV file from Web Audio API's AudioBuffer.
 * WAV is an uncompressed audio format that's widely supported.
 * 
 * Process:
 * 1. Create ArrayBuffer with correct size for WAV file
 * 2. Write WAV header (RIFF, fmt, data chunks)
 * 3. Interleave audio channel data
 * 4. Convert float samples to 16-bit PCM
 * 
 * @param {AudioBuffer} buffer - The audio buffer to convert
 * @returns {ArrayBuffer} WAV file data as ArrayBuffer
 * 
 * @example
 * const wavData = audioBufferToWav(audioBuffer);
 * const blob = new Blob([wavData], { type: 'audio/wav' });
 * // Can now download or play the blob
 */
export function audioBufferToWav(buffer: AudioBuffer) {
  // ============================================================================
  // SETUP
  // ============================================================================
  const numOfChan = buffer.numberOfChannels;
  // Calculate total file size: 44 bytes (header) + audio data
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;  // Offset for writing audio data
  let pos = 0;     // Position in header

  // ============================================================================
  // HELPER FUNCTIONS - Write to DataView
  // ============================================================================
  /**
   * Write 16-bit unsigned integer (little-endian)
   */
  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  /**
   * Write 32-bit unsigned integer (little-endian)
   */
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // ============================================================================
  // WAV HEADER - RIFF Chunk
  // ============================================================================
  // WAV files use the RIFF (Resource Interchange File Format) container
  setUint32(0x46464952); // "RIFF" in ASCII (0x52494646 reversed for little-endian)
  setUint32(length - 8); // File length minus 8 bytes (RIFF header)
  setUint32(0x45564157); // "WAVE" in ASCII

  // ============================================================================
  // WAV HEADER - Format Chunk
  // ============================================================================
  // Describes the audio format
  setUint32(0x20746d66); // "fmt " chunk identifier
  setUint32(16);         // Chunk size (16 for PCM)
  setUint16(1);          // Audio format (1 = PCM, uncompressed)
  setUint16(numOfChan);  // Number of channels (1=mono, 2=stereo)
  setUint32(buffer.sampleRate);  // Sample rate (e.g., 44100 Hz)
  setUint32(buffer.sampleRate * 2 * numOfChan); // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
  setUint16(numOfChan * 2); // Block align (NumChannels * BitsPerSample/8)
  setUint16(16);         // Bits per sample (16-bit PCM)

  // ============================================================================
  // WAV HEADER - Data Chunk
  // ============================================================================
  setUint32(0x61746164); // "data" chunk identifier
  setUint32(length - pos - 4); // Chunk size (remaining bytes)

  // ============================================================================
  // AUDIO DATA - Interleave and Convert
  // ============================================================================
  // Extract channel data from AudioBuffer
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  // Write interleaved audio samples
  // AudioBuffer uses float32 (-1.0 to 1.0), WAV uses int16 (-32768 to 32767)
  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // Interleave channels (L, R, L, R for stereo)
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // Clamp to valid range
      // Convert float (-1.0 to 1.0) to 16-bit signed integer (-32768 to 32767)
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true); // Write 16-bit sample (44 = header size)
      offset += 2;
    }
    pos++;
  }

  return bufferArr;
}
