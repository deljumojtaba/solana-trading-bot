export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRandomAmount(min, max) {
  return Math.random() * (max - min) + min;
}

export function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatNumber(number, decimals = 4) {
  return Number(number).toFixed(decimals);
}

export function calculatePercentageChange(oldValue, newValue) {
  return ((newValue - oldValue) / oldValue) * 100;
}
