const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'assets', 'exact-mockup', '00.txt');
    const base64 = fs.readFileSync(file, 'utf8').replace(/\s/g, '');
    const image = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(image);
  } catch (error) {
    res.status(500).send('Image failed to load');
  }
};
