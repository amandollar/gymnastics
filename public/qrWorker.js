// qrWorker.js - Web Worker for generating QR codes for student ID cards
// Load QRCode library (browser version) via CDN
self.importScripts('https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js');

/**
 * Expected message format: an array of student objects with at least `id` property.
 * The worker will generate two QR code data URLs (front and back) for each student.
 */
self.onmessage = async function (e) {
  const students = e.data; // array of { id: string }
  if (!Array.isArray(students)) return;

  const origin = self.location.origin;

  for (const s of students) {
    const url = `${origin}/students/${s.id}`;
    try {
      const [front, back] = await Promise.all([
        QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }),
        QRCode.toDataURL(url, { margin: 1, width: 300, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      ]);
      self.postMessage({ id: s.id, front, back });
    } catch (err) {
      console.error('QR worker error for student', s.id, err);
    }
  }
  // Signal completion
  self.postMessage(null);
};
