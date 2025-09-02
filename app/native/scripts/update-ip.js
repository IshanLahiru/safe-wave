#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to get the current network IP address
function getNetworkIP() {
  try {
    // Use ifconfig to get network interfaces
    const ifconfigOutput = execSync('ifconfig', { encoding: 'utf8' });
    const lines = ifconfigOutput.split('\n');
    
    // Look for 192.168.x.x addresses first (most common for local development)
    for (const line of lines) {
      if (line.includes('inet ') && !line.includes('127.0.0.1')) {
        const match = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          const ip = match[1];
          if (ip.startsWith('192.168.')) {
            return ip;
          }
        }
      }
    }
    
    // Fallback to other private IP ranges
    for (const line of lines) {
      if (line.includes('inet ') && !line.includes('127.0.0.1')) {
        const match = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          const ip = match[1];
          if (ip.startsWith('10.') || ip.startsWith('172.')) {
            return ip;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting IP via ifconfig:', error.message);
  }
  
  return null;
}

// Function to update the config file
function updateConfigFile(newIP) {
  const configPath = path.join(__dirname, '..', 'services', 'config.ts');
  
  try {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Replace all instances of the old IP with the new IP
    const oldIPPattern = /192\.168\.\d+\.\d+/g;
    const updatedContent = configContent.replace(oldIPPattern, newIP);
    
    // Write the updated content back to the file
    fs.writeFileSync(configPath, updatedContent, 'utf8');
    
    console.log(`✅ Successfully updated config.ts with new IP: ${newIP}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating config file:', error.message);
    return false;
  }
}

// Function to validate IP address format
function isValidIP(ip) {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

// Main execution
function main() {
  console.log('🔍 Finding your network IP address...');
  
  const newIP = getNetworkIP();
  
  if (!newIP) {
    console.error('❌ Could not determine network IP address');
    console.log('💡 Make sure you are connected to a network');
    process.exit(1);
  }
  
  if (!isValidIP(newIP)) {
    console.error(`❌ Invalid IP address format: ${newIP}`);
    process.exit(1);
  }
  
  console.log(`🌐 Found network IP: ${newIP}`);
  
  // Update the config file
  const success = updateConfigFile(newIP);
  
  if (success) {
    console.log('\n📱 Configuration updated successfully!');
    console.log(`🔗 Backend URL: http://${newIP}:9000`);
    console.log(`📚 API Docs: http://${newIP}:9000/docs`);
    console.log(`🏥 Health Check: http://${newIP}:9000/health/`);
    console.log('\n💡 Next steps:');
    console.log('1. Start your backend server: cd services/backend && python main.py');
    console.log('2. Test the connection in your app');
    console.log('3. If needed, restart your React Native development server');
  } else {
    console.error('❌ Failed to update configuration');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { getNetworkIP, updateConfigFile, isValidIP }; 
