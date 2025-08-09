// Background service worker for the Job Assistant extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Assistant extension installed');
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to the manifest configuration
  console.log('Extension icon clicked on tab:', tab.url);
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  // Handle different message types if needed in the future
  switch (request.action) {
    case 'ping':
      sendResponse({ status: 'pong' });
      break;
    default:
      sendResponse({ status: 'unknown action' });
  }
  
  return true; // Keep the message channel open for async responses
});

// Keep the service worker active
chrome.runtime.onStartup.addListener(() => {
  console.log('Job Assistant extension started');
});

export {};