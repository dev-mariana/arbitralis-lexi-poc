export function maskPhone(from: string): string {
  if (from.length < 8) return '***';
  
  return `${from.slice(0, 4)}****${from.slice(-4)}`;
}
