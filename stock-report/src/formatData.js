function formatPrice(num) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(change, percent) {
  const sign = change > 0 ? '+' : '';
  const pSign = percent > 0 ? '+' : '';
  const c = change.toFixed(2);
  const p = percent.toFixed(2);
  return `${sign}${c} (${pSign}${p}%)`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

function getDirection(change) {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'unchanged';
}

function formatVolume(num) {
  if (num === undefined || num === null) return '-';
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}億`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString('en-US');
}

function formatPercent(num) {
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  return timeStr;
}

function getImportanceLabel(level) {
  if (level === 'high') return '★★★';
  if (level === 'medium') return '★★';
  return '★';
}

function getFearGreedLabel(value) {
  if (value <= 24) return { label: 'Extreme Fear', color: '#7b2d8e' };
  if (value <= 44) return { label: 'Fear', color: '#dc2626' };
  if (value <= 55) return { label: 'Neutral', color: '#ca8a04' };
  if (value <= 74) return { label: 'Greed', color: '#ea580c' };
  return { label: 'Extreme Greed', color: '#16a34a' };
}

module.exports = {
  formatPrice, formatChange, formatDate, getDirection,
  formatVolume, formatPercent, formatTime, getImportanceLabel, getFearGreedLabel,
};
