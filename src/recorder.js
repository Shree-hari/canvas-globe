/**
 * Canvas → WebM recording via MediaRecorder. No encoder dependency, no upload,
 * no server: the clip is produced entirely in the tab.
 */

const CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

/** First container the browser can actually encode, or null. */
export function supportedRecordingType() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of CANDIDATES) if (MediaRecorder.isTypeSupported?.(type)) return type;
  return null;
}

export const canRecord = () => supportedRecordingType() !== null;

/**
 * Records the canvas and resolves to a Blob. Pass `duration` for a fixed-length
 * clip, or call `stop()` on the returned handle.
 */
export function recordCanvas(canvas, { duration = 6000, fps = 30, bitrate = 6e6, type } = {}) {
  const mimeType = type || supportedRecordingType();
  if (!mimeType) return { promise: Promise.reject(new Error("canvas-globe: MediaRecorder is unavailable")), stop() {} };
  if (!canvas.captureStream) {
    return { promise: Promise.reject(new Error("canvas-globe: canvas.captureStream is unavailable")), stop() {} };
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate });
  const chunks = [];
  let timer = null;

  const promise = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    recorder.onerror = (e) => reject(e.error || new Error("canvas-globe: recording failed"));
    recorder.onstop = () => {
      clearTimeout(timer);
      for (const track of stream.getTracks()) track.stop();
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.start();
    if (duration > 0) timer = setTimeout(() => recorder.state !== "inactive" && recorder.stop(), duration);
  });

  return {
    promise,
    mimeType,
    stop() {
      if (recorder.state !== "inactive") recorder.stop();
      return promise;
    },
  };
}

/** Triggers a browser download for a Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
