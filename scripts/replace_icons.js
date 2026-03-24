const fs = require('fs');
const path = require('path');

const targetDir = 'C:/nghien_cuu_khoa_hoc/smart-farm/SmartFarm';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(targetDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('react-native-vector-icons')) {
        content = content.replace(/import\s+(\w+)\s+from\s+['"]react-native-vector-icons\/([^'"]+)['"];?/g, "import $1 from '@expo/vector-icons/$2';");
        fs.writeFileSync(file, content);
        console.log(`Updated vector-icons in ${file}`);
    }
});
