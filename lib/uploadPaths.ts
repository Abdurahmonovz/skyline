import path from 'path';
import fs from 'fs';

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export function ensureUploadDirs() {
  for (const sub of ['assignments', 'submissions']) {
    const dir = path.join(UPLOAD_ROOT, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function assignmentFilePath(storedName: string) {
  return path.join(UPLOAD_ROOT, 'assignments', storedName);
}

export function submissionFilePath(storedName: string) {
  return path.join(UPLOAD_ROOT, 'submissions', storedName);
}
