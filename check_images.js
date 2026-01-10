const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\anton\\.gemini\\antigravity\\scratch\\TARO\\images\\zodiac';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    const buffer = fs.readFileSync(filePath);

    // PNG dimensions are at offset 16 (4 bytes width, 4 bytes height)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    console.log(`${file}: ${width}x${height} (${(width / height).toFixed(2)})`);
});
