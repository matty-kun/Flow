let pendingPhoto: string | null = null;

export function setPendingPhoto(uri: string) {
  pendingPhoto = uri;
}

export function consumePendingPhoto(): string | null {
  const uri = pendingPhoto;
  pendingPhoto = null;
  return uri;
}
