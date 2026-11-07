/** Build a WhatsApp click-to-chat URL without exposing account data in the page URL. */
export function whatsappConfirmationUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}