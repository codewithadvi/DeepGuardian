// Background script for the extension
console.log('DeepGuardian background script loaded');

// Store analysis results
const analysisHistory = [];

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'analyzeMedia') {
    handleMediaAnalysis(request, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'getHistory') {
    sendResponse({ history: analysisHistory });
    return true;
  }
  
  if (request.action === 'clearHistory') {
    analysisHistory.length = 0;
    sendResponse({ success: true });
    return true;
  }
});

// Handle media analysis requests
function handleMediaAnalysis(request, sendResponse) {
  const { type, data } = request;
  
  // In a real implementation, this would communicate with the local server
  // For now, we'll simulate a response
  setTimeout(() => {
    let result;
    
    // Generate a realistic fake result based on media type
    if (type === 'image') {
      const deepfakeProbability = Math.random() * 100;
      const isDeepfake = deepfakeProbability > 70;
      
      result = {
        success: true,
        type: 'image',
        deepfakeProbability,
        authenticityConfidence: 100 - deepfakeProbability,
        timestamp: new Date().toISOString(),
        image: data,
        image_models: {
          cnn: {
            confidence: 1 - (deepfakeProbability * 0.01),
            label: isDeepfake ? 'fake' : 'real',
            reason: isDeepfake ? 'Inconsistent lighting patterns detected' : 'No anomalies detected'
          },
          zeroshot: {
            confidence: 1 - (deepfakeProbability * 0.01),
            label: isDeepfake ? 'Fake' : 'Real',
            reason: {
              classification_scores: {
                "a computer-generated deepfake": isDeepfake ? deepfakeProbability * 0.01 : 0,
                "an AI-generated synthetic image": isDeepfake ? (100 - deepfakeProbability) * 0.005 : 0,
                "a real human photo": isDeepfake ? 0 : 1 - (deepfakeProbability * 0.01),
                "a cartoon illustration": 0,
                "a fake or AI-generated hand-drawn sketch": 0,
                "a real hand-drawn sketch": 0
              }
            }
          }
        },
        overall: {
          label: isDeepfake ? 'fake' : 'real',
          fake_by: isDeepfake ? ['zeroshot'] : [],
          real_by: isDeepfake ? [] : ['cnn'],
          model_confidences: {
            cnn: {
              confidence: 1 - (deepfakeProbability * 0.01),
              label: isDeepfake ? 'fake' : 'real',
              reason: isDeepfake ? 'Inconsistent lighting patterns detected' : 'No anomalies detected'
            },
            zeroshot: {
              confidence: 1 - (deepfakeProbability * 0.01),
              label: isDeepfake ? 'Fake' : 'Real',
              reason: {
                classification_scores: {
                  "a computer-generated deepfake": isDeepfake ? deepfakeProbability * 0.01 : 0,
                  "an AI-generated synthetic image": isDeepfake ? (100 - deepfakeProbability) * 0.005 : 0,
                  "a real human photo": isDeepfake ? 0 : 1 - (deepfakeProbability * 0.01),
                  "a cartoon illustration": 0,
                  "a fake or AI-generated hand-drawn sketch": 0,
                  "a real hand-drawn sketch": 0
                }
              }
            }
          }
        }
      };
    } 
    else if (type === 'video') {
      const deepfakeProbability = Math.random() * 100;
      const isDeepfake = deepfakeProbability > 70;
      
      result = {
        success: true,
        type: 'video',
        deepfakeProbability,
        authenticityConfidence: 100 - deepfakeProbability,
        timestamp: new Date().toISOString(),
        video: data,
        video_models: {
          rppg: {
            confidence: 1 - (deepfakeProbability * 0.01),
            label: isDeepfake ? 'fake' : 'real',
            reason: isDeepfake ? 'Inconsistent blood flow patterns detected' : 'Natural blood flow patterns observed'
          },
          lipsync: {
            confidence: 1 - (deepfakeProbability * 0.01),
            label: isDeepfake ? 'mismatch' : 'match',
            reason: isDeepfake ? 'Lip movements don\'t match audio' : 'Lip movements match audio perfectly'
          }
        },
        overall: {
          label: isDeepfake ? 'fake' : 'real',
          fake_by: isDeepfake ? ['rppg'] : [],
          real_by: isDeepfake ? [] : ['rppg'],
          model_confidences: {
            rppg: {
              confidence: 1 - (deepfakeProbability * 0.01),
              label: isDeepfake ? 'fake' : 'real',
              reason: isDeepfake ? 'Inconsistent blood flow patterns detected' : 'Natural blood flow patterns observed'
            },
            lipsync: {
              confidence: 1 - (deepfakeProbability * 0.01),
              label: isDeepfake ? 'mismatch' : 'match',
              reason: isDeepfake ? 'Lip movements don\'t match audio' : 'Lip movements match audio perfectly'
            }
          }
        }
      };
    }
    else if (type === 'audio') {
      const fakeProbability = Math.random() * 100;
      const isFake = fakeProbability > 70;
      
      result = {
        success: true,
        type: 'audio',
        fakeProbability,
        authenticityConfidence: 100 - fakeProbability,
        timestamp: new Date().toISOString(),
        audio: data,
        audio_models: {
          voice_analysis: {
            confidence: 1 - (fakeProbability * 0.01),
            label: isFake ? 'synthetic' : 'real',
            reason: isFake ? 'Inconsistent vocal patterns detected' : 'Natural vocal patterns observed'
          }
        },
        overall: {
          label: isFake ? 'fake' : 'real',
          fake_by: isFake ? ['voice_analysis'] : [],
          real_by: isFake ? [] : ['voice_analysis'],
          model_confidences: {
            voice_analysis: {
              confidence: 1 - (fakeProbability * 0.01),
              label: isFake ? 'synthetic' : 'real',
              reason: isFake ? 'Inconsistent vocal patterns detected' : 'Natural vocal patterns observed'
            }
          }
        }
      };
    }
    
    // Save to history
    analysisHistory.unshift(result);
    if (analysisHistory.length > 10) {
      analysisHistory.pop();
    }
    
    sendResponse({ result });
  }, 1500); // Simulate processing time
}