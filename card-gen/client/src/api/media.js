import { authenticatedFetch } from './auth.js';

export async function listMedia(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.append('type', params.type);
  if (params.q) query.append('q', params.q);
  if (params.folder) query.append('folder', params.folder);
  const qs = query.toString();
  return authenticatedFetch(`/media${qs ? `?${qs}` : ''}`);
}

export async function deleteMedia(id) {
  return authenticatedFetch(`/media/${id}`, { method: 'DELETE' });
}

export async function deleteMultipleMedia(ids) {
  return authenticatedFetch(`/media/delete-multiple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
}

export async function renameFolder(oldFolder, newFolder) {
  return authenticatedFetch(`/media/rename-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldFolder, newFolder })
  });
}

export async function uploadMedia({ file, type, customFolder }) {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  if (customFolder) form.append('customFolder', customFolder);
  return authenticatedFetch(`/media/upload`, {
    method: 'POST',
    body: form,
    headers: {} // let browser set multipart boundary
  });
}

export async function uploadMultipleMedia({ files, type, customFolder }) {
  const form = new FormData();
  files.forEach(file => {
    form.append('files', file);
  });
  form.append('type', type);
  if (customFolder) form.append('customFolder', customFolder);
  return authenticatedFetch(`/media/upload-multiple`, {
    method: 'POST',
    body: form,
    headers: {} // let browser set multipart boundary
  });
}

export async function destroyMediaAsset({ publicId, resourceType } = {}) {
  return authenticatedFetch(`/media/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, resourceType }),
  });
}

