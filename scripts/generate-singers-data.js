const fs = require('fs');
const path = require('path');

/**
 * This script scans the public/assets/song directory and generates
 * a JSON file containing all available singers for each song.
 * This eliminates the need for runtime fs operations in the API route.
 */

const SONG_DIR = path.join(process.cwd(), 'public', 'assets', 'song');
const OUTPUT_FILE = path.join(process.cwd(), 'lib', 'data', 'singers-data.json');

function generateSingersData() {
  const singersData = {};

  // Check if song directory exists
  if (!fs.existsSync(SONG_DIR)) {
    console.warn('⚠️  Song directory not found:', SONG_DIR);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2));
    return;
  }

  // Get all song directories
  const songDirs = fs.readdirSync(SONG_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`📁 Found ${songDirs.length} song directories`);

  // Process each song directory
  for (const songId of songDirs) {
    const songDir = path.join(SONG_DIR, songId);
    const voicesDir = path.join(songDir, 'voices');
    
    // Check if voices are in a subdirectory or directly in the song directory
    let voiceFiles = [];
    let basePath = '';
    
    if (fs.existsSync(voicesDir)) {
      // Voices are in a subdirectory
      voiceFiles = fs.readdirSync(voicesDir);
      basePath = `/assets/song/${songId}/voices`;
    } else {
      // Voices might be directly in the song directory
      const allFiles = fs.readdirSync(songDir);
      const regex = new RegExp(`snd_bgm_live_${songId}_chara_(\\d+)_(\\d+)\\.opus`);
      voiceFiles = allFiles.filter(file => regex.test(file));
      basePath = `/assets/song/${songId}`;
    }
    
    if (voiceFiles.length === 0) {
      singersData[songId] = [];
      continue;
    }

    const singers = [];
    // Pattern: snd_bgm_live_{SongID}_chara_{CharacterID}_{VersionID}.opus
    const regex = new RegExp(`snd_bgm_live_${songId}_chara_(\\d+)_(\\d+)\\.opus`);

    for (const file of voiceFiles) {
      const match = file.match(regex);
      if (match) {
        const characterId = parseInt(match[1]);
        const version = match[2];
        singers.push({
          characterId,
          version,
          file: `${basePath}/${file}`
        });
      }
    }

    singersData[songId] = singers;
    console.log(`  ✓ Song ${songId}: ${singers.length} singers`);
  }

  // Write the data to file
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(singersData, null, 2));
  
  const totalSingers = Object.values(singersData).reduce((sum, singers) => sum + singers.length, 0);
  console.log(`\n✅ Generated singers data: ${totalSingers} total singers across ${songDirs.length} songs`);
  console.log(`📝 Output: ${OUTPUT_FILE}`);
}

// Run the script
try {
  generateSingersData();
} catch (error) {
  console.error('❌ Error generating singers data:', error);
  process.exit(1);
}
