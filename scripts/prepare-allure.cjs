const fs = require('fs');
const path = require('path');

const dirs = [
  path.join('apps', 'backend', 'allure-results'),
  path.join('apps', 'frontend', 'allure-results'),
  path.join('e2e', 'allure-results'),
];

// Данные окружения
const envContent = [
  'Project=Geogis',
  'Environment=Development',
  `Branch=${process.env.GITHUB_REF_NAME || 'local'}`,
  `Commit=${process.env.GITHUB_SHA || 'local'}`,
  `Author=${process.env.GITHUB_ACTOR || 'user'}`,
].join('\n');

console.log('🚀 Starting Allure metadata preparation...');

dirs.forEach((dir) => {
  try {
    const targetDir = path.resolve(process.cwd(), dir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`✅ Created directory: ${targetDir}`);
    }

    // 1. Environment
    fs.writeFileSync(path.join(targetDir, 'environment.properties'), envContent);
    console.log(`📝 Added environment.properties to ${dir}`);

    // 2. Executor (CI only)
    if (process.env.GITHUB_RUN_ID) {
      const executorData = {
        name: 'GitHub Actions',
        type: 'github',
        reportName: 'Allure Report',
        url: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        buildOrder: Number(process.env.GITHUB_RUN_NUMBER),
        buildName: `Build #${process.env.GITHUB_RUN_NUMBER}`,
      };
      fs.writeFileSync(
        path.join(targetDir, 'executor.json'),
        JSON.stringify(executorData, null, 2),
      );
      console.log(`🔗 Added executor.json to ${dir}`);
    }

    // 3. Categories (Copy logic)
    const candidates = [
      path.resolve(process.cwd(), 'scripts', 'categories.json'),
      path.resolve(process.cwd(), 'other', 'categories.json'),
      path.resolve(__dirname, 'categories.json'),
    ];

    const categoriesSrc = candidates.find((c) => fs.existsSync(c));

    if (categoriesSrc) {
      fs.copyFileSync(categoriesSrc, path.join(targetDir, 'categories.json'));
      console.log(`🗂️ Copied categories.json to ${dir}`);
    } else {
      console.warn(`⚠️ categories.json not found, skipping for ${dir}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${dir}:`, err.message);
  }
});

console.log('✨ Allure metadata is ready!');
