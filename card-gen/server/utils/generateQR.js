import QRCode from "qrcode";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const QR_PIXEL_WIDTH = 640;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// card-gen/server/utils -> card-gen/client/public/logo.svg
const DEFAULT_LOGO_PATH = path.resolve(__dirname, "..", "..", "client", "public", "vl-logo.jpeg");
let _defaultLogoBufferPromise = null;

async function getDefaultLogoBuffer() {
  if (!_defaultLogoBufferPromise) {
    _defaultLogoBufferPromise = fs.readFile(DEFAULT_LOGO_PATH);
  }
  try {
    return await _defaultLogoBufferPromise;
  } catch {
    // If the file is missing at runtime, behave gracefully (QR still works without logo).
    return null;
  }
}

/**
 * PNG data URL (data:image/png;base64,...) for the given text.
 * Always attempts to embed the project's static logo (`card-gen/client/public/logo.svg`)
 * in the center (white plate + logo). If the logo cannot be loaded or rendered,
 * falls back to a plain QR.
 *
 * @param {string} text - URL or payload to encode
 */
export const generateQR = async (text) => {
  const plainDataUrl = async () =>
    QRCode.toDataURL(text, { errorCorrectionLevel: "H", width: QR_PIXEL_WIDTH, margin: 2 });

  try {
    const qrBuffer = await QRCode.toBuffer(text, {
      type: "png",
      errorCorrectionLevel: "H",
      width: QR_PIXEL_WIDTH,
      margin: 2,
    });

    const logoBuffer = await getDefaultLogoBuffer();
    if (!logoBuffer) {
      return await plainDataUrl();
    }

    const meta = await sharp(qrBuffer).metadata();
    const w = meta.width || QR_PIXEL_WIDTH;
    const logoBox = Math.max(40, Math.floor(w * 0.19));
    const pad = Math.max(6, Math.floor(logoBox * 0.14));
    const plateSize = logoBox + pad * 2;

    let resizedLogo;
    try {
      resizedLogo = await sharp(logoBuffer)
        .resize(logoBox, logoBox, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();
    } catch {
      return await plainDataUrl();
    }

    const whitePlate = await sharp({
      create: {
        width: plateSize,
        height: plateSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const left = Math.floor((w - plateSize) / 2);
    const top = Math.floor((w - plateSize) / 2);
    const logoLeft = left + pad;
    const logoTop = top + pad;

    const out = await sharp(qrBuffer)
      .composite([
        { input: whitePlate, left, top },
        { input: resizedLogo, left: logoLeft, top: logoTop },
      ])
      .png()
      .toBuffer();

    return `data:image/png;base64,${out.toString("base64")}`;
  } catch {
    throw new Error("QR generation failed");
  }
};
