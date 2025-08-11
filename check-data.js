// 数据恢复检查脚本
// 在浏览器开发者工具的Console中运行这个脚本

async function checkStorageData() {
  console.log('=== 检查Chrome存储中的数据 ===');
  
  try {
    const allData = await chrome.storage.local.get();
    console.log('所有存储的数据:', allData);
    
    // 检查中文数据
    const zhKeys = Object.keys(allData).filter(key => key.includes('-zh'));
    console.log('中文数据键:', zhKeys);
    
    // 检查英文数据
    const enKeys = Object.keys(allData).filter(key => key.includes('-en'));
    console.log('英文数据键:', enKeys);
    
    // 检查旧版本数据
    const legacyKeys = Object.keys(allData).filter(key => 
      key.includes('job-assistant') && !key.includes('-zh') && !key.includes('-en')
    );
    console.log('旧版本数据键:', legacyKeys);
    
    // 检查具体数据
    for (const key of [...zhKeys, ...enKeys, ...legacyKeys]) {
      const data = allData[key];
      if (Array.isArray(data)) {
        console.log(`${key}: ${data.length} 条记录`);
        if (data.length > 0) {
          console.log('  示例数据:', data[0]);
        }
      } else if (typeof data === 'object') {
        console.log(`${key}:`, data);
      }
    }
    
    // 检查备份数据
    const backups = allData['job-assistant-backups'];
    if (backups && Array.isArray(backups)) {
      console.log('备份数据:', backups.length, '个备份');
      backups.forEach((backup, index) => {
        console.log(`  备份 ${index + 1}:`, backup.metadata?.description, backup.metadata?.exportDate);
      });
    }
    
    return allData;
  } catch (error) {
    console.error('检查数据时出错:', error);
  }
}

// 运行检查
checkStorageData();