// Quick dependency fix
const { execSync } = require('child_process');

console.log('🔧 Installing missing queue-microtask dependency...');

try {
  execSync('npm install queue-microtask@1.2.3 --save', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Dependency installed successfully!');
  
  console.log('🚀 Starting dev server...');
  execSync('npm run dev', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
