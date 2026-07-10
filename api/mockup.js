const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'assets', 'exact-mockup');
    const files = fs.readdirSync(dir)
      .filter((name) => /^\d{2}[a-z]?\.txt$/.test(name))
      .sort();

    const base64 = files
      .map((name) => fs.readFileSync(path.join(dir, name), 'utf8').replace(/\s/g, ''))
      .join('');

    const image = Buffer.from(base64, 'base64');

    if (image.length !== 76368) {
      throw new Error(`Unexpected image size: ${image.length}`);
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', String(image.length));
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(image);
  } catch (error) {
    console.error(error);
    res.status(500).send('Image failed to load');
  }
};
