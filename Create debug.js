# Create debug.js
cat > debug.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging command loader...\n');

const commandsPath = path.join(__dirname, 'src', 'commands');
console.log('Commands path exists:', fs.existsSync(commandsPath));

if (fs.existsSync(commandsPath)) {
    const folders = fs.readdirSync(commandsPath);
    console.log('Found folders:', folders);
    
    for (const folder of folders) {
        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const files = fs.readdirSync(folderPath);
            console.log(`\n📁 ${folder}: ${files.length} files`);
            console.log('Files:', files);
            
            for (const file of files) {
                if (file.endsWith('.js')) {
                    console.log(`\n  📄 ${file}:`);
                    const content = fs.readFileSync(path.join(folderPath, file), 'utf8');
                    
                    // Check for required exports
                    if (!content.includes('module.exports')) {
                        console.log('    ❌ No module.exports found');
                    }
                    if (!content.includes('data:')) {
                        console.log('    ❌ No data property');
                    }
                    if (!content.includes('execute:')) {
                        console.log('    ❌ No execute function');
                    }
                    
                    // Try to load it
                    try {
                        const cmd = require(path.join(folderPath, file));
                        console.log(`    ✅ Loads successfully`);
                        console.log(`    Name: ${cmd.data?.name || 'Missing'}`);
                    } catch (e) {
                        console.log(`    ❌ Load error: ${e.message}`);
                    }
                }
            }
        }
    }
}
EOF

node debug.js