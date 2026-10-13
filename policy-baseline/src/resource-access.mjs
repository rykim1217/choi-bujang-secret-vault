// Ownership is decided from the verified principal and the stored record only.
export function storedOwnerMatches(record, ownerField, principalUserId) {
  return Boolean(record && typeof principalUserId === 'string'
    && record[ownerField] === principalUserId);
}
