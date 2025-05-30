const startTime = new Date();

export function generateDateString() {
  const day = String(startTime.getDate()).padStart(2, '0');
  const month = String(startTime.getMonth() + 1).padStart(2, '0');
  const year = startTime.getFullYear();
  const hours = String(startTime.getHours()).padStart(2, '0');
  const minutes = String(startTime.getMinutes()).padStart(2, '0');
  const seconds = String(startTime.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
}
