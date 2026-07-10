export function parseFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', middleName: null, lastName: '', secondLastName: null };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: null, lastName: '', secondLastName: null };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: null, lastName: parts[1], secondLastName: null };
  }
  if (parts.length === 3) {
    return { firstName: parts[0], middleName: null, lastName: parts[1], secondLastName: parts[2] };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, parts.length - 2).join(' ') || null,
    lastName: parts[parts.length - 2],
    secondLastName: parts[parts.length - 1]
  };
}
