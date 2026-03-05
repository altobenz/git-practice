const fs = require('fs');
const path = require('path');
const { generateHtml } = require('./generateHtml');

function main(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error(`エラー: 入力ファイルが見つかりません: ${inputPath}`);
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(inputPath, 'utf-8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`エラー: JSONのパースに失敗しました: ${e.message}`);
    process.exit(1);
  }

  const html = generateHtml(data);

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`レポートを生成しました: ${outputPath}`);
}

if (require.main === module) {
  const input = process.argv[2] || path.join(__dirname, '..', 'data', 'sample.json');
  const output = process.argv[3] || path.join(__dirname, '..', 'output', 'report.html');
  main(input, output);
}

module.exports = { main };
