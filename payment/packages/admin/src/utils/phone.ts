/** 手机号脱敏：保留前3位和后4位，中间用 **** 替换 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}
