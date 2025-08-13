document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      const tabId = tab.dataset.tab;
      tabContents.forEach(content => {
        content.style.display = tabId === content.id.replace('-tab', '') ? 'block' : 'none';
      });
    });
  });
  
  // Analyze current page button
  const analyzePageBtn = document.getElementById('analyze-page');
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const resultsContentEl = document.getElementById('results-content');
  
  analyzePageBtn.addEventListener('click', () => {
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing page...';
    statusEl.style.color = '#4a90e2';
    resultsEl.style.display = 'none';
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
          return document.title;
        }
      }, () => {
        chrome.runtime.sendMessage({
          action: 'analyzeCurrentPage'
        }, (response) => {
          if (response && response.results) {
            displayResults(response.results);
          } else {
            statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> No media found to analyze';
            statusEl.style.color = '#e53e3e';
          }
        });
      });
    });
  });
  
  // Analyze image button
  document.getElementById('analyze-image').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
          const images = Array.from(document.querySelectorAll('img'))
            .filter(img => img.naturalWidth >= 50 && img.naturalHeight >= 50)
            .map(img => img.src);
          return images;
        }
      }, (results) => {
        if (results && results[0] && results[0].result && results[0].result.length > 0) {
          // Take the first image for analysis
          const imageSrc = results[0].result[0];
          
          statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing image...';
          statusEl.style.color = '#4a90e2';
          resultsEl.style.display = 'none';
          
          chrome.runtime.sendMessage({
            action: 'analyzeMedia',
            type: 'image',
            data: imageSrc
          }, (response) => {
            if (response && response.result) {
              displayResults([response.result]);
            } else {
              statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Analysis failed';
              statusEl.style.color = '#e53e3e';
            }
          });
        } else {
          statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> No images found on page';
          statusEl.style.color = '#e53e3e';
        }
      });
    });
  });
  
  // Analyze video button
  document.getElementById('analyze-video').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
          const videos = Array.from(document.querySelectorAll('video'))
            .filter(video => video.poster)
            .map(video => ({
              src: video.src,
              poster: video.poster
            }));
          return videos;
        }
      }, (results) => {
        if (results && results[0] && results[0].result && results[0].result.length > 0) {
          // Take the first video for analysis
          const video = results[0].result[0];
          
          statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing video...';
          statusEl.style.color = '#4a90e2';
          resultsEl.style.display = 'none';
          
          chrome.runtime.sendMessage({
            action: 'analyzeMedia',
            type: 'video',
            data: video.poster
          }, (response) => {
            if (response && response.result) {
              // Add video src to result for display
              response.result.video = video.src;
              displayResults([response.result]);
            } else {
              statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Analysis failed';
              statusEl.style.color = '#e53e3e';
            }
          });
        } else {
          statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> No videos found on page';
          statusEl.style.color = '#e53e3e';
        }
      });
    });
  });
  
  // Analyze audio button
  document.getElementById('analyze-audio').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => {
          const audios = Array.from(document.querySelectorAll('audio'))
            .map(audio => audio.src);
          return audios;
        }
      }, (results) => {
        if (results && results[0] && results[0].result && results[0].result.length > 0) {
          // Take the first audio for analysis
          const audioSrc = results[0].result[0];
          
          statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing audio...';
          statusEl.style.color = '#4a90e2';
          resultsEl.style.display = 'none';
          
          chrome.runtime.sendMessage({
            action: 'analyzeMedia',
            type: 'audio',
            data: audioSrc
          }, (response) => {
            if (response && response.result) {
              displayResults([response.result]);
            } else {
              statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Analysis failed';
              statusEl.style.color = '#e53e3e';
            }
          });
        } else {
          statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> No audio found on page';
          statusEl.style.color = '#e53e3e';
        }
      });
    });
  });
  
  // Clear history button
  document.getElementById('clear-history').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'clearHistory'
    }, () => {
      document.getElementById('history-content').innerHTML = '<p class="empty">No analysis history yet</p>';
    });
  });
  
  // Load history
  chrome.runtime.sendMessage({
    action: 'getHistory'
  }, (response) => {
    if (response && response.history && response.history.length > 0) {
      displayHistory(response.history);
    }
  });
  
  // Settings
  document.getElementById('confidence-threshold').addEventListener('input', (e) => {
    document.getElementById('threshold-value').textContent = e.target.value + '%';
  });
  
  document.getElementById('save-settings').addEventListener('click', () => {
    const autoScan = document.getElementById('auto-scan').checked;
    const showIndicators = document.getElementById('show-indicators').checked;
    const confidenceThreshold = document.getElementById('confidence-threshold').value;
    const apiServer = document.getElementById('api-server').value;
    
    // Save settings
    chrome.storage.local.set({
      autoScan,
      showIndicators,
      confidenceThreshold,
      apiServer
    }, () => {
      const status = document.createElement('div');
      status.className = 'status';
      status.innerHTML = '<i class="fas fa-check-circle"></i> Settings saved!';
      status.style.color = '#48bb78';
      
      document.querySelector('.settings').appendChild(status);
      
      setTimeout(() => {
        status.remove();
      }, 2000);
    });
  });
  
  // Load saved settings
  chrome.storage.local.get([
    'autoScan',
    'showIndicators',
    'confidenceThreshold',
    'apiServer'
  ], (settings) => {
    if (settings.autoScan !== undefined) {
      document.getElementById('auto-scan').checked = settings.autoScan;
    }
    if (settings.showIndicators !== undefined) {
      document.getElementById('show-indicators').checked = settings.showIndicators;
    }
    if (settings.confidenceThreshold) {
      document.getElementById('confidence-threshold').value = settings.confidenceThreshold;
      document.getElementById('threshold-value').textContent = settings.confidenceThreshold + '%';
    }
    if (settings.apiServer) {
      document.getElementById('api-server').value = settings.apiServer;
    }
  });
  
  // Display results
  function displayResults(results) {
    resultsContentEl.innerHTML = '';
    
    results.forEach(result => {
      const resultCard = document.createElement('div');
      resultCard.className = 'result-card';
      
      // Determine confidence level
      let confidence;
      let confidenceClass;
      let resultText;
      let resultIcon;
      
      if (result.type === 'image') {
        confidence = result.deepfakeProbability || 0;
        if (confidence >= 75) {
          confidenceClass = 'confidence-high';
          resultText = 'Synthetic Image Detected';
          resultIcon = 'fa-exclamation-circle';
        } else if (confidence >= 50) {
          confidenceClass = 'confidence-medium';
          resultText = 'Requires Manual Review';
          resultIcon = 'fa-exclamation-triangle';
        } else {
          confidenceClass = 'confidence-low';
          resultText = 'Authentic Image';
          resultIcon = 'fa-check-circle';
        }
        
        resultCard.innerHTML = `
          <div class="result-header">
            <h3>Image Analysis</h3>
            <span class="result-summary ${confidence >= 75 ? 'fake' : confidence >= 50 ? 'warning' : 'real'}">
              <i class="fas ${resultIcon}"></i> ${resultText}
            </span>
          </div>
          <img src="${result.image}" class="media-preview">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Deepfake Probability:</span>
              <strong>${Math.round(confidence)}%</strong>
            </div>
            <div class="confidence">
              <div class="confidence-level ${confidenceClass}" style="width: ${confidence}%"></div>
            </div>
          </div>
        `;
      } 
      else if (result.type === 'video') {
        confidence = result.deepfakeProbability || 0;
        if (confidence >= 75) {
          confidenceClass = 'confidence-high';
          resultText = 'Deepfake Detected';
          resultIcon = 'fa-exclamation-circle';
        } else if (confidence >= 50) {
          confidenceClass = 'confidence-medium';
          resultText = 'Requires Manual Review';
          resultIcon = 'fa-exclamation-triangle';
        } else {
          confidenceClass = 'confidence-low';
          resultText = 'Authentic Video';
          resultIcon = 'fa-check-circle';
        }
        
        resultCard.innerHTML = `
          <div class="result-header">
            <h3>Video Analysis</h3>
            <span class="result-summary ${confidence >= 75 ? 'fake' : confidence >= 50 ? 'warning' : 'real'}">
              <i class="fas ${resultIcon}"></i> ${resultText}
            </span>
          </div>
          <img src="${result.video}" class="media-preview">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Deepfake Probability:</span>
              <strong>${Math.round(confidence)}%</strong>
            </div>
            <div class="confidence">
              <div class="confidence-level ${confidenceClass}" style="width: ${confidence}%"></div>
            </div>
          </div>
        `;
      }
      else if (result.type === 'audio') {
        confidence = result.fakeProbability || 0;
        if (confidence >= 75) {
          confidenceClass = 'confidence-high';
          resultText = 'Synthetic Audio Detected';
          resultIcon = 'fa-exclamation-circle';
        } else if (confidence >= 50) {
          confidenceClass = 'confidence-medium';
          resultText = 'Requires Manual Review';
          resultIcon = 'fa-exclamation-triangle';
        } else {
          confidenceClass = 'confidence-low';
          resultText = 'Authentic Audio';
          resultIcon = 'fa-check-circle';
        }
        
        resultCard.innerHTML = `
          <div class="result-header">
            <h3>Audio Analysis</h3>
            <span class="result-summary ${confidence >= 75 ? 'fake' : confidence >= 50 ? 'warning' : 'real'}">
              <i class="fas ${resultIcon}"></i> ${resultText}
            </span>
          </div>
          <div style="background: #edf2f7; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 10px;">
            <i class="fas fa-microphone" style="font-size: 2rem; color: #4a90e2;"></i>
            <p style="margin-top: 10px; font-size: 0.9rem;">Audio Analysis</p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Synthetic Probability:</span>
              <strong>${Math.round(confidence)}%</strong>
            </div>
            <div class="confidence">
              <div class="confidence-level ${confidenceClass}" style="width: ${confidence}%"></div>
            </div>
          </div>
        `;
      }
      
      resultsContentEl.appendChild(resultCard);
    });
    
    statusEl.style.display = 'none';
    resultsEl.style.display = 'block';
  }
  
  // Display history
  function displayHistory(history) {
    const historyContent = document.getElementById('history-content');
    historyContent.innerHTML = '';
    
    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'result-card';
      
      // Format the timestamp
      const date = new Date(item.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Determine confidence level
      let confidence;
      let confidenceClass;
      let resultText;
      
      if (item.type === 'image') {
        confidence = item.deepfakeProbability || 0;
        if (confidence >= 75) {
          confidenceClass = 'confidence-high';
          resultText = 'Synthetic Image';
        } else if (confidence >= 50) {
          confidenceClass = 'confidence-medium';
          resultText = 'Requires Review';
        } else {
          confidenceClass = 'confidence-low';
          resultText = 'Authentic Image';
        }
        
        historyItem.innerHTML = `
          <div class="result-header">
            <h3>${resultText}</h3>
            <span style="color: var(--dark-gray); font-size: 0.8rem;">${formattedDate}</span>
          </div>
          <img src="${item.image}" class="media-preview">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Deepfake Probability:</span>
              <strong>${Math.round(confidence)}%</strong>
            </div>
            <div class="confidence">
              <div class="confidence-level ${confidenceClass}" style="width: ${confidence}%"></div>
            </div>
          </div>
        `;
      } 
      else if (item.type === 'video') {
        confidence = item.deepfakeProbability || 0;
        if (confidence >= 75) {
          confidenceClass = 'confidence-high';
          resultText = 'Deepfake Detected';
        } else if (confidence >= 50) {
          confidenceClass = 'confidence-medium';
          resultText = 'Requires Review';
        } else {
          confidenceClass = 'confidence-low';
          resultText = 'Authentic Video';
        }
        
        historyItem.innerHTML = `
          <div class="result-header">
            <h3>${resultText}</h3>
            <span style="color: var(--dark-gray); font-size: 0.8rem;">${formattedDate}</span>
          </div>
          <img src="${item.video}" class="media-preview">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Deepfake Probability:</span>
              <strong>${Math.round(confidence)}%</strong>
            </div>
            <div class="confidence">
              <div class="confidence-level ${confidenceClass}" style="width: ${confidence}%"></div>
            </div>
          </div>
        `;
      }
      else if (item.type === 'audio') {
        confidence = item.fakeProbability || 0;
        if (confidence >= 75) {
          confidenceClass = 'confidence-high';
          resultText = 'Synthetic Audio';
        } else if (confidence >= 50) {
          confidenceClass = 'confidence-medium';
          resultText = 'Requires Review';
        } else {
          confidenceClass = 'confidence-low';
          resultText = 'Authentic Audio';
        }
        
        historyItem.innerHTML = `
          <div class="result-header">
            <h3>${resultText}</h3>
            <span style="color: var(--dark-gray); font-size: 0.8rem;">${formattedDate}</span>
          </div>
          <div style="background: #edf2f7; padding: 10px; border-radius: 6px; text-align: center; margin-bottom: 10px;">
            <i class="fas fa-microphone" style="font-size: 2rem; color: #4a90e2;"></i>
            <p style="margin-top: 10px; font-size: 0.9rem;">Audio Analysis</p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Synthetic Probability:</span>
              <strong>${Math.round(confidence)}%</strong>
            </div>
            <div class="confidence">
              <div class="confidence-level ${confidenceClass}" style="width: ${confidence}%"></div>
            </div>
          </div>
        `;
      }
      
      historyContent.appendChild(historyItem);
    });
  }
});