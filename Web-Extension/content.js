// Content script that runs on all pages
console.log('DeepGuardian content script loaded');

// Check for media elements on the page
function checkForMediaElements() {
  const mediaElements = {
    images: Array.from(document.querySelectorAll('img')),
    videos: Array.from(document.querySelectorAll('video')),
    audios: Array.from(document.querySelectorAll('audio'))
  };
  
  return mediaElements;
}

// Add detection indicators to media elements
function addDetectionIndicators(mediaElements) {
  // Create stylesheet for our indicators
  const style = document.createElement('style');
  style.textContent = `
    .deepguardian-indicator {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      z-index: 9999;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .deepguardian-indicator.real {
      background-color: #10B981;
    }
    .deepguardian-indicator.fake {
      background-color: #EF4444;
    }
    .deepguardian-indicator.warning {
      background-color: #F59E0B;
    }
    .deepguardian-indicator-container {
      position: relative;
      display: inline-block;
    }
  `;
  document.head.appendChild(style);
  
  // Process images
  mediaElements.images.forEach(img => {
    // Skip small images (likely icons)
    if (img.naturalWidth < 50 || img.naturalHeight < 50) return;
    
    // Skip if already processed
    if (img.closest('.deepguardian-indicator-container')) return;
    
    // Create container
    const container = document.createElement('div');
    container.className = 'deepguardian-indicator-container';
    
    // Clone the image to maintain original styling
    const clonedImg = img.cloneNode(true);
    
    // Replace the image with the container
    img.parentNode.replaceChild(container, img);
    container.appendChild(clonedImg);
    
    // Add indicator (initially gray while processing)
    const indicator = document.createElement('div');
    indicator.className = 'deepguardian-indicator warning';
    indicator.textContent = '?';
    container.appendChild(indicator);
    
    // Analyze the image
    analyzeMediaElement('image', img.src).then(result => {
      if (!result) return;
      
      // Update indicator based on result
      const deepfakeProbability = result.deepfakeProbability || 0;
      if (deepfakeProbability >= 75) {
        indicator.className = 'deepguardian-indicator fake';
        indicator.textContent = '!';
      } else if (deepfakeProbability >= 50) {
        indicator.className = 'deepguardian-indicator warning';
        indicator.textContent = '!';
      } else {
        indicator.className = 'deepguardian-indicator real';
        indicator.textContent = '✓';
      }
      
      // Add tooltip with more info
      indicator.title = `Deepfake Probability: ${Math.round(deepfakeProbability)}%`;
      
      // Add click handler to show detailed analysis
      indicator.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          action: 'showAnalysis',
          type: 'image',
          result: result
        });
      });
    });
  });
  
  // Process videos
  mediaElements.videos.forEach(video => {
    // Skip if already processed
    if (video.closest('.deepguardian-indicator-container')) return;
    
    // Create container
    const container = document.createElement('div');
    container.className = 'deepguardian-indicator-container';
    container.style.position = 'relative';
    
    // Replace the video with the container
    video.parentNode.replaceChild(container, video);
    container.appendChild(video);
    
    // Add indicator
    const indicator = document.createElement('div');
    indicator.className = 'deepguardian-indicator warning';
    indicator.textContent = '?';
    container.appendChild(indicator);
    
    // Analyze the video
    if (video.poster) {
      analyzeMediaElement('image', video.poster).then(result => {
        if (!result) return;
        
        // Update indicator based on result
        const deepfakeProbability = result.deepfakeProbability || 0;
        if (deepfakeProbability >= 75) {
          indicator.className = 'deepguardian-indicator fake';
          indicator.textContent = '!';
        } else if (deepfakeProbability >= 50) {
          indicator.className = 'deepguardian-indicator warning';
          indicator.textContent = '!';
        } else {
          indicator.className = 'deepguardian-indicator real';
          indicator.textContent = '✓';
        }
        
        // Add tooltip with more info
        indicator.title = `Deepfake Probability: ${Math.round(deepfakeProbability)}%`;
        
        // Add click handler to show detailed analysis
        indicator.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            action: 'showAnalysis',
            type: 'video',
            result: result
          });
        });
      });
    }
  });
}

// Analyze a media element
function analyzeMediaElement(type, src) {
  return new Promise((resolve) => {
    // In a real implementation, this would communicate with the local server
    // For now, we'll simulate a response
    
    // Skip analysis for common placeholder images
    if (type === 'image' && (src.includes('placeholder') || src.includes('dummy'))) {
      resolve(null);
      return;
    }
    
    // Simulate a random result
    setTimeout(() => {
      const deepfakeProbability = Math.random() * 100;
      
      if (type === 'image') {
        resolve({
          deepfakeProbability,
          authenticityConfidence: 100 - deepfakeProbability,
          image: src
        });
      } else if (type === 'video') {
        resolve({
          deepfakeProbability,
          authenticityConfidence: 100 - deepfakeProbability,
          video: src
        });
      }
    }, 800);
  });
}

// Initialize the content script
function init() {
  const mediaElements = checkForMediaElements();
  addDetectionIndicators(mediaElements);
  
  // Observe DOM changes to handle dynamically added media
  const observer = new MutationObserver(mutations => {
    const mediaElements = checkForMediaElements();
    addDetectionIndicators(mediaElements);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start the extension
init();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeCurrentPage') {
    const mediaElements = checkForMediaElements();
    const results = [];
    
    // Analyze all media elements
    mediaElements.images.forEach(img => {
      if (img.naturalWidth >= 50 && img.naturalHeight >= 50) {
        analyzeMediaElement('image', img.src).then(result => {
          if (result) results.push(result);
        });
      }
    });
    
    mediaElements.videos.forEach(video => {
      if (video.poster) {
        analyzeMediaElement('image', video.poster).then(result => {
          if (result) results.push(result);
        });
      }
    });
    
    // Return results after a short delay
    setTimeout(() => {
      sendResponse({ results });
    }, 2000);
    
    return true; // Keep the message channel open for async response
  }
});