export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  // If it starts with + or already contains spaces/formatting, return as-is
  if (phone.startsWith("+") || phone.includes(" ") || phone.includes("-")) {
    return phone;
  }
  // Strip non-digits
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function getTelLink(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (/^\d{10}$/.test(cleaned)) {
    return `tel:+91${cleaned}`;
  }
  return `tel:${cleaned}`;
}
