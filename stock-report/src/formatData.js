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

module.exports = { formatPrice, formatChange, formatDate, getDirection };
