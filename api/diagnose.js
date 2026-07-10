const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'assets', 'exact-mockup');
    const files = fs.readdirSync(dir)
      .filter((name) => /^\d{2}\.txt$/.test(name))
      .sort();

    const details = files.map((name) => {
      const raw = fs.readFileSync(path.join(dir, name), 'utf8').replace(/\s/g, '');
      return {
        name,
        length: raw.length,
        sha256: crypto.createHash('sha256').update(raw).digest('hex')
      };
    });

    const base64 = files
      .map((name) => fs.readFileSync(path.join(dir, name), 'utf8').replace(/\s/g, ''))
      .join('');

    const image = Buffer.from(base64, 'base64');

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      files: details,
      base64Length: base64.length,
      decodedLength: image.length,
      decodedSha256: crypto.createHash('sha256').update(image).digest('hex')
    });
  } catch (error) {
    res.status(500).json({ error: String(error && error.stack || error) });
  }
};
