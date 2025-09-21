// Analysis History Management
const AnalysisHistory = {
    // Storage key prefixes for different analysis types
    STORAGE_KEYS: {
        DEEPFAKE: 'deepfake_analysis_history',
        AUDIO: 'audio_analysis_history',
        IMAGE: 'image_analysis_history',
        MISINFO: 'misinfo_analysis_history'
    },
    // Maximum number of items to store
    MAX_ITEMS: 10,
    // Save a new analysis result
    saveAnalysis: function (type, result) {
        const key = this.STORAGE_KEYS[type.toUpperCase()];
        if (!key) return;
        // Add timestamp and ID if not present
        const analysis = {
            id: 'analysis_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            timestamp: new Date().toISOString(),
            ...result
        };
        // Get existing history
        let history = this.getHistory(type);
        // Add new analysis to beginning
        history.unshift(analysis);
        // Keep only MAX_ITEMS
        if (history.length > this.MAX_ITEMS) {
            history = history.slice(0, this.MAX_ITEMS);
        }
        // Save back to localStorage
        localStorage.setItem(key, JSON.stringify(history));
        // Return the updated history
        return history;
    },
    // Get analysis history for a type
    getHistory: function (type) {
        const key = this.STORAGE_KEYS[type.toUpperCase()];
        if (!key) return [];
        try {
            const history = localStorage.getItem(key);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Error reading analysis history:', e);
            return [];
        }
    },
    // Initialize history display for a page
    initHistoryDisplay: function (type, containerId) {
        const history = this.getHistory(type);
        this.renderHistory(history, containerId, type);
    },
    // Render history into a container
    renderHistory: function (history, containerId, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        // Create grid container if it doesn't exist
        let gridContainer = container.querySelector('.analysis-grid');
        if (!gridContainer) {
            gridContainer = document.createElement('div');
            gridContainer.className = 'analysis-grid';
            container.appendChild(gridContainer);
        } else {
            gridContainer.innerHTML = '';
        }
        if (history.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-history';
            emptyMessage.style.gridColumn = '1 / -1';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--dark-gray)';
            emptyMessage.style.padding = '20px';
            emptyMessage.innerHTML = '<i class="fas fa-history" style="font-size: 48px; margin-bottom: 10px; color: var(--light-gray);"></i><p>No analysis history yet</p>';
            gridContainer.appendChild(emptyMessage);
            return;
        }
        // Create cards for each analysis
        history.forEach(item => {
            const card = this.createAnalysisCard(item, type);
            gridContainer.appendChild(card);
        });
    },
    // Create a single analysis card
    createAnalysisCard: function (item, type) {
        const card = document.createElement('div');
        card.className = 'analysis-card';
        // Format the timestamp
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        // Determine confidence level class
        let confidenceClass = 'confidence-low';
        let resultText = '';
        let resultIcon = '';
        let resultColor = '';
        // Handle different analysis types
        if (type === 'deepfake') {
            const deepfakeProbability = item.deepfakeProbability || 0;
            if (deepfakeProbability >= 70) {
                confidenceClass = 'confidence-high';
                resultText = 'Deepfake Detected';
                resultIcon = 'times-circle';
                resultColor = 'danger';
            } else if (deepfakeProbability >= 30) {
                confidenceClass = 'confidence-medium';
                resultText = 'Requires Manual Review';
                resultIcon = 'exclamation-triangle';
                resultColor = 'warning';
            } else {
                confidenceClass = 'confidence-low';
                resultText = 'Authentic Content';
                resultIcon = 'check-circle';
                resultColor = 'success';
            }
            card.innerHTML = `
                <div class="analysis-header">
                    <i class="fas fa-user-secret"></i>
                    <h3>${item.id.substring(0, 12)}</h3>
                </div>
                <div class="analysis-content">
                    <p style="font-style: italic; color: var(--dark-gray); margin-bottom: 15px;">${item.description || 'Video analysis'}</p>
                    <div style="margin: 15px 0 5px;">
                        <span>Deepfake Probability:</span>
                        <strong style="float: right;">${Math.round(deepfakeProbability)}%</strong>
                    </div>
                    <div class="confidence">
                        <div class="confidence-level ${confidenceClass}" style="width: ${deepfakeProbability}%"></div>
                    </div>
                    <p style="color: var(--${resultColor}); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-${resultIcon}"></i> ${resultText}
                    </p>
                    <p style="color: var(--dark-gray); font-size: 12px; margin-top: 5px; text-align: right;">
                        ${formattedDate}
                    </p>
                </div>
            `;
        }
        else if (type === 'audio') {
            const authenticityConfidence = item.authenticityConfidence || 0;
            if (authenticityConfidence < 30) {
                confidenceClass = 'confidence-high';
                resultText = 'Synthetic Audio Detected';
                resultIcon = 'times-circle';
                resultColor = 'danger';
            } else if (authenticityConfidence < 70) {
                confidenceClass = 'confidence-medium';
                resultText = 'Requires Manual Review';
                resultIcon = 'exclamation-triangle';
                resultColor = 'warning';
            } else {
                confidenceClass = 'confidence-low';
                resultText = 'Authentic Audio';
                resultIcon = 'check-circle';
                resultColor = 'success';
            }
            card.innerHTML = `
                <div class="analysis-header">
                    <i class="fas fa-microphone-alt"></i>
                    <h3>${item.id.substring(0, 12)}</h3>
                </div>
                <div class="analysis-content">
                    <p style="font-style: italic; color: var(--dark-gray); margin-bottom: 15px;">${item.description || 'Audio analysis'}</p>
                    <div style="margin: 15px 0 5px;">
                        <span>Authenticity Confidence:</span>
                        <strong style="float: right;">${Math.round(authenticityConfidence)}%</strong>
                    </div>
                    <div class="confidence">
                        <div class="confidence-level ${confidenceClass}" style="width: ${authenticityConfidence}%"></div>
                    </div>
                    <p style="color: var(--${resultColor}); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-${resultIcon}"></i> ${resultText}
                    </p>
                    <p style="color: var(--dark-gray); font-size: 12px; margin-top: 5px; text-align: right;">
                        ${formattedDate}
                    </p>
                </div>
            `;
        }
        else if (type === 'image') {
            const authenticityConfidence = item.authenticityConfidence || 0;
            const deepfakeProbability = 100 - authenticityConfidence;
            if (deepfakeProbability >= 75) {
                confidenceClass = 'confidence-high';
                resultText = 'Synthetic Image Detected';
                resultIcon = 'times-circle';
                resultColor = 'danger';
            } else if (deepfakeProbability >= 50) {
                confidenceClass = 'confidence-medium';
                resultText = 'Requires Manual Review';
                resultIcon = 'exclamation-triangle';
                resultColor = 'warning';
            } else {
                confidenceClass = 'confidence-low';
                resultText = 'Authentic Image';
                resultIcon = 'check-circle';
                resultColor = 'success';
            }
            card.innerHTML = `
                <div class="analysis-header">
                    <i class="fas fa-image"></i>
                    <h3>${item.id.substring(0, 12)}</h3>
                </div>
                <div class="analysis-content">
                    ${item.image ? `<img src="${item.image}" alt="Analysis preview" class="result-img" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">` : ''}
                    <p style="font-style: italic; color: var(--dark-gray); margin-bottom: 15px;">${item.description || 'Image analysis'}</p>
                    <div style="margin: 15px 0 5px;">
                        <span>Deepfake Probability:</span>
                        <strong style="float: right;">${Math.round(deepfakeProbability)}%</strong>
                    </div>
                    <div class="confidence">
                        <div class="confidence-level ${confidenceClass}" style="width: ${deepfakeProbability}%"></div>
                    </div>
                    <p style="color: var(--${resultColor}); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-${resultIcon}"></i> ${resultText}
                    </p>
                    <p style="color: var(--dark-gray); font-size: 12px; margin-top: 5px; text-align: right;">
                        ${formattedDate}
                    </p>
                </div>
            `;
        }
        else if (type === 'misinfo') {
            const misinfoConfidence = item.misinfoConfidence || 0;
            if (misinfoConfidence >= 75) {
                confidenceClass = 'confidence-high';
                resultText = 'Likely Misinformation';
                resultIcon = 'times-circle';
                resultColor = 'danger';
            } else if (misinfoConfidence >= 50) {
                confidenceClass = 'confidence-medium';
                resultText = 'Likely Misinformation';
                resultIcon = 'exclamation-triangle';
                resultColor = 'warning';
            } else {
                confidenceClass = 'confidence-low';
                resultText = 'Likely Authentic';
                resultIcon = 'check-circle';
                resultColor = 'success';
            }
            card.innerHTML = `
                <div class="analysis-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${item.id.substring(0, 12)}</h3>
                </div>
                <div class="analysis-content">
                    <p style="font-style: italic; color: var(--dark-gray); margin-bottom: 15px;">"${item.text ? (item.text.substring(0, 60) + '...') : 'Text analysis'}"</p>
                    <div style="margin: 15px 0 5px;">
                        <span>Misinformation Confidence:</span>
                        <strong style="float: right;">${Math.round(misinfoConfidence)}%</strong>
                    </div>
                    <div class="confidence">
                        <div class="confidence-level ${confidenceClass}" style="width: ${misinfoConfidence}%"></div>
                    </div>
                    <p style="color: var(--${resultColor}); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-${resultIcon}"></i> ${resultText}
                    </p>
                    <p style="color: var(--dark-gray); font-size: 12px; margin-top: 5px; text-align: right;">
                        ${formattedDate}
                    </p>
                </div>
            `;
        }
        return card;
    }
};

// Initialize page navigation
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    // Set active page based on URL hash
    function setActivePage() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        const targetPage = document.getElementById(`${hash}-page`);

        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === hash) {
                link.classList.add('active');
            }
        });

        // Show target page, hide others
        pages.forEach(page => {
            if (page.id === `${hash}-page`) {
                page.style.display = 'block';
            } else {
                page.style.display = 'none';
            }
        });

        // Initialize history displays for active page
        if (hash === 'deepfake-detection') {
            AnalysisHistory.initHistoryDisplay('deepfake', 'deepfake-results-history');
        } else if (hash === 'audio-verification') {
            AnalysisHistory.initHistoryDisplay('audio', 'audio-results-history');
        } else if (hash === 'image-verification') {
            AnalysisHistory.initHistoryDisplay('image', 'image-results-history');
        } else if (hash === 'misinformation-detector') {
            AnalysisHistory.initHistoryDisplay('misinfo', 'misinfo-results-history');
        }
    }

    // Handle nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.hash = this.dataset.page;
            setActivePage();
        });
    });

    // Handle hash changes
    window.addEventListener('hashchange', setActivePage);

    // Initial page setup
    setActivePage();

    // Initialize all history displays
    AnalysisHistory.initHistoryDisplay('deepfake', 'deepfake-results-history');
    AnalysisHistory.initHistoryDisplay('audio', 'audio-results-history');
    AnalysisHistory.initHistoryDisplay('image', 'image-results-history');
    AnalysisHistory.initHistoryDisplay('misinfo', 'misinfo-results-history');

    // Initialize dashboard metrics
    const totalAnalyses = document.getElementById('total-analyses');
    const deepfakeAnalyses = document.getElementById('deepfake-analyses');
    const audioAnalyses = document.getElementById('audio-analyses');
    const imageAnalyses = document.getElementById('image-analyses');
    const misinfoAnalyses = document.getElementById('misinfo-analyses');

    // Get all analysis history
    const deepfakeHistory = AnalysisHistory.getHistory('deepfake');
    const audioHistory = AnalysisHistory.getHistory('audio');
    const imageHistory = AnalysisHistory.getHistory('image');
    const misinfoHistory = AnalysisHistory.getHistory('misinfo');

    // Calculate total
    const total = deepfakeHistory.length + audioHistory.length +
        imageHistory.length + misinfoHistory.length;

    // Update dashboard metrics
    if (totalAnalyses) totalAnalyses.textContent = total;
    if (deepfakeAnalyses) deepfakeAnalyses.textContent = deepfakeHistory.length;
    if (audioAnalyses) audioAnalyses.textContent = audioHistory.length;
    if (imageAnalyses) imageAnalyses.textContent = imageHistory.length;
    if (misinfoAnalyses) misinfoAnalyses.textContent = misinfoHistory.length;

    // Initialize history displays for dashboard
    AnalysisHistory.initHistoryDisplay('deepfake', 'dashboard-deepfake-history');
    AnalysisHistory.initHistoryDisplay('audio', 'dashboard-audio-history');
    AnalysisHistory.initHistoryDisplay('image', 'dashboard-image-history');
    AnalysisHistory.initHistoryDisplay('misinfo', 'dashboard-misinfo-history');

    // Initialize verification modules
    initImageVerification();
    initAudioVerification();
    initVideoVerification();
    initMisinformationDetector();
});

// Initialize Image Verification functionality
function initImageVerification() {
    const imageUploadBox = document.getElementById('image-upload-box');
    const imageFileInput = document.getElementById('image-file-input');
    const imageSelectBtn = document.getElementById('image-select-btn');
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const imagePreview = document.getElementById('image-preview');
    const uploadedImage = document.getElementById('uploaded-image');
    const imageRetakeBtn = document.getElementById('image-retake-btn');
    const analyzeImageBtn = document.getElementById('analyze-image-btn');
    const imageAnalysisResults = document.getElementById('image-analysis-results');
    const imageUploadStatus = document.getElementById('image-upload-status');
    const selectedImage = document.getElementById('selected-image');

    // Only initialize if elements exist
    if (!imageUploadBox || !imageFileInput || !imageSelectBtn || !imageUploadBtn ||
        !imagePreview || !uploadedImage || !imageRetakeBtn || !analyzeImageBtn ||
        !imageAnalysisResults || !imageUploadStatus || !selectedImage) {
        return;
    }

    // Select image button - opens file picker
    imageSelectBtn.addEventListener('click', function () {
        imageFileInput.click();
    });

    // When file is selected, show the file name and enable upload button
    imageFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            // Show selected file info
            selectedImage.innerHTML = `
                <div style="background: rgba(74, 144, 226, 0.08); padding: 10px; border-radius: 8px;">
                    <i class="fas fa-file-image" style="color: var(--accent); margin-right: 8px;"></i>
                    <span>${file.name} (${Math.round(file.size / 1024)} KB)</span>
                </div>
            `;
            selectedImage.style.display = 'block';
            // Show upload button
            imageUploadBtn.style.display = 'inline-block';
        }
    });

    imageRetakeBtn.addEventListener('click', function () {
        imagePreview.style.display = 'none';
        imageUploadBox.style.display = 'block';
        imageFileInput.value = '';
        selectedImage.style.display = 'none';
        imageUploadBtn.style.display = 'none';
        imageAnalysisResults.style.display = 'none';
    });

    // Upload image button - actually sends the file to the server
    imageUploadBtn.addEventListener('click', function () {
        const file = imageFileInput.files[0];
        if (!file) {
            alert('Please select an image file first');
            return;
        }

        // Show uploading status
        imageUploadStatus.style.display = 'block';
        imageUploadStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Uploading ${file.name}...</div>`;
        imageUploadStatus.style.color = '#4a90e2';

        // Disable upload button during upload
        imageUploadBtn.disabled = true;
        imageUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        // Create form data with the image file
        const formData = new FormData();
        formData.append('file', file);

        // Send to our upload endpoint
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Server response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`Upload failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`Upload failed with status ${response.status}: ${text.substring(0, 100)}...`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                // Update status
                imageUploadStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle" style="color: #48bb78;"></i> ${data.fileName} uploaded successfully!</div>`;
                imageUploadStatus.style.color = '#48bb78';

                // Show image preview
                imagePreview.style.display = 'block';
                imageUploadBox.style.display = 'none';

                // FIXED: Use data.webPath instead of incorrect server-side code
                uploadedImage.src = data.webPath;

                // Clear status after 5 seconds
                setTimeout(() => {
                    imageUploadStatus.style.display = 'none';
                }, 5000);

                // Re-enable upload button
                imageUploadBtn.disabled = false;
                imageUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Image';
            })
            .catch(error => {
                console.error('❌ Upload error:', error);
                imageUploadStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle" style="color: #e53e3e;"></i> Error: ${error.message}</div>`;
                imageUploadStatus.style.color = '#e53e3e';

                // Re-enable upload button
                imageUploadBtn.disabled = false;
                imageUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Image';

                // Clear status after 5 seconds
                setTimeout(() => {
                    imageUploadStatus.style.display = 'none';
                }, 5000);
            });
    });

    analyzeImageBtn.addEventListener('click', function () {
        if (!imageFileInput.files[0]) {
            alert('Please upload an image first');
            return;
        }

        analyzeImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeImageBtn.disabled = true;

        // Show analyzing status
        imageUploadStatus.style.display = 'block';
        imageUploadStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Sending to image detection API...</div>`;
        imageUploadStatus.style.color = '#4a90e2';

        // Create form data with the image file
        const formData = new FormData();
        formData.append('image', imageFileInput.files[0]);

        // Send to OUR proxy endpoint (not directly to friend's API)
        fetch('/api/proxy/image', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('API error response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`API request failed with status ${response.status}`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Image API response:', data);
                // Process the API response
                processImageAnalysis(data);

                // Update status
                imageUploadStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle" style="color: #48bb78;"></i> Analysis complete!</div>`;
                imageUploadStatus.style.color = '#48bb78';

                // Clear status after 5 seconds
                setTimeout(() => {
                    imageUploadStatus.style.display = 'none';
                }, 5000);

                // Show results
                imageAnalysisResults.style.display = 'block';
                analyzeImageBtn.innerHTML = '<i class="fas fa-redo"></i> Analyze Again';
                analyzeImageBtn.disabled = false;
            })
            .catch(error => {
                console.error('❌ Analysis error:', error);
                imageUploadStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle" style="color: #e53e3e;"></i> Analysis failed: ${error.message}</div>`;
                imageUploadStatus.style.color = '#e53e3e';

                // Show error in the results section
                const imageResultSummary = document.getElementById('image-result-summary');
                if (imageResultSummary) {
                    imageResultSummary.innerHTML = `
                    <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-times-circle"></i> Analysis Error
                    </p>
                    <p style="color: var(--dark-gray); margin-top: 10px;">
                        Failed to analyze image: ${error.message}
                    </p>
                `;
                    imageAnalysisResults.style.display = 'block';
                }

                // Reset button
                analyzeImageBtn.innerHTML = '<i class="fas fa-redo"></i> Try Again';
                analyzeImageBtn.disabled = false;

                // Clear status after 5 seconds
                setTimeout(() => {
                    imageUploadStatus.style.display = 'none';
                }, 5000);
            });
    });
}

// Initialize Audio Verification functionality
function initAudioVerification() {
    const audioUploadBox = document.getElementById('audio-upload-box');
    const audioFileInput = document.getElementById('audio-file-input');
    const audioSelectBtn = document.getElementById('audio-select-btn');
    const audioUploadBtn = document.getElementById('audio-upload-btn');
    const audioPreview = document.getElementById('audio-preview');
    const uploadedAudio = document.getElementById('uploaded-audio');
    const audioRetakeBtn = document.getElementById('audio-retake-btn');
    const analyzeAudioBtn = document.getElementById('analyze-audio-btn');
    const audioAnalysisResults = document.getElementById('audio-analysis-results');
    const audioUploadStatus = document.getElementById('audio-upload-status');
    const selectedAudio = document.getElementById('selected-audio');

    // Only initialize if elements exist
    if (!audioUploadBox || !audioFileInput || !audioSelectBtn || !audioUploadBtn ||
        !audioPreview || !uploadedAudio || !audioRetakeBtn || !analyzeAudioBtn ||
        !audioAnalysisResults || !audioUploadStatus || !selectedAudio) {
        return;
    }

    // Select audio button - opens file picker
    audioSelectBtn.addEventListener('click', function () {
        audioFileInput.click();
    });

    // When file is selected, show the file name and enable upload button
    audioFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            // Show selected file info
            selectedAudio.innerHTML = `
                <div style="background: rgba(74, 144, 226, 0.08); padding: 10px; border-radius: 8px;">
                    <i class="fas fa-file-audio" style="color: var(--accent); margin-right: 8px;"></i>
                    <span>${file.name} (${Math.round(file.size / 1024)} KB)</span>
                </div>
            `;
            selectedAudio.style.display = 'block';
            // Show upload button
            audioUploadBtn.style.display = 'inline-block';
            // Set audio source
            const audioUrl = URL.createObjectURL(file);
            uploadedAudio.src = audioUrl;
        }
    });

    audioRetakeBtn.addEventListener('click', function () {
        audioPreview.style.display = 'none';
        audioUploadBox.style.display = 'block';
        audioFileInput.value = '';
        selectedAudio.style.display = 'none';
        audioUploadBtn.style.display = 'none';
        audioAnalysisResults.style.display = 'none';
    });

    // Upload audio button - actually sends the file to the server
    audioUploadBtn.addEventListener('click', function () {
        const file = audioFileInput.files[0];
        if (!file) {
            alert('Please select an audio file first');
            return;
        }

        // Show uploading status
        audioUploadStatus.style.display = 'block';
        audioUploadStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Uploading ${file.name}...</div>`;
        audioUploadStatus.style.color = '#4a90e2';

        // Disable upload button during upload
        audioUploadBtn.disabled = true;
        audioUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        // Create form data with the audio file
        const formData = new FormData();
        formData.append('file', file);

        // Send to our upload endpoint
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Server response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`Upload failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`Upload failed with status ${response.status}: ${text.substring(0, 100)}...`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                // Update status
                audioUploadStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle" style="color: #48bb78;"></i> ${data.fileName} uploaded successfully!</div>`;
                audioUploadStatus.style.color = '#48bb78';

                // Show audio preview
                audioPreview.style.display = 'block';
                audioUploadBox.style.display = 'none';

                // Use the correct URL to access the audio
                uploadedAudio.src = data.webPath;

                // Clear status after 5 seconds
                setTimeout(() => {
                    audioUploadStatus.style.display = 'none';
                }, 5000);

                // Re-enable upload button
                audioUploadBtn.disabled = false;
                audioUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Audio';
            })
            .catch(error => {
                console.error('❌ Upload error:', error);
                audioUploadStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle" style="color: #e53e3e;"></i> Error: ${error.message}</div>`;
                audioUploadStatus.style.color = '#e53e3e';

                // Re-enable upload button
                audioUploadBtn.disabled = false;
                audioUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Audio';

                // Clear status after 5 seconds
                setTimeout(() => {
                    audioUploadStatus.style.display = 'none';
                }, 5000);
            });
    });

    analyzeAudioBtn.addEventListener('click', function () {
        if (!audioFileInput.files[0]) {
            alert('Please upload an audio file first');
            return;
        }

        analyzeAudioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeAudioBtn.disabled = true;

        // Show analyzing status
        audioUploadStatus.style.display = 'block';
        audioUploadStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Sending to audio detection API...</div>`;
        audioUploadStatus.style.color = '#4a90e2';

        // Create form data with the audio file
        const formData = new FormData();
        formData.append('audio', audioFileInput.files[0]);

        // Send to OUR proxy endpoint
        fetch('/api/proxy/audio', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('API error response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`API request failed with status ${response.status}`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Audio API response:', data);
                // Process the API response
                processAudioAnalysis(data);

                // Update status
                audioUploadStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle" style="color: #48bb78;"></i> Analysis complete!</div>`;
                audioUploadStatus.style.color = '#48bb78';

                // Clear status after 5 seconds
                setTimeout(() => {
                    audioUploadStatus.style.display = 'none';
                }, 5000);

                // Show results
                audioAnalysisResults.style.display = 'block';
                analyzeAudioBtn.innerHTML = '<i class="fas fa-redo"></i> Analyze Again';
                analyzeAudioBtn.disabled = false;
            })
            .catch(error => {
                console.error('❌ Audio analysis error:', error);
                audioUploadStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle" style="color: #e53e3e;"></i> Analysis failed: ${error.message}</div>`;
                audioUploadStatus.style.color = '#e53e3e';

                // Show error in the results section
                const audioResultSummary = document.getElementById('audio-result-summary');
                if (audioResultSummary) {
                    audioResultSummary.innerHTML = `
                    <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-times-circle"></i> Analysis Error
                    </p>
                    <p style="color: var(--dark-gray); margin-top: 10px;">
                        Failed to analyze audio: ${error.message}
                    </p>
                `;
                    audioAnalysisResults.style.display = 'block';
                }

                // Reset button
                analyzeAudioBtn.innerHTML = '<i class="fas fa-redo"></i> Try Again';
                analyzeAudioBtn.disabled = false;

                // Clear status after 5 seconds
                setTimeout(() => {
                    audioUploadStatus.style.display = 'none';
                }, 5000);
            });
    });
}

// Initialize Video Verification functionality
function initVideoVerification() {
    const videoUploadBox = document.getElementById('video-upload-box');
    const videoFileInput = document.getElementById('video-file-input');
    const videoSelectBtn = document.getElementById('video-select-btn');
    const videoUploadBtn = document.getElementById('video-upload-btn');
    const videoPreview = document.getElementById('video-preview');
    const uploadedVideo = document.getElementById('uploaded-video');
    const videoRetakeBtn = document.getElementById('video-retake-btn');
    const analyzeVideoBtn = document.getElementById('analyze-video-btn');
    const videoAnalysisResults = document.getElementById('analysis-results');
    const videoUploadStatus = document.getElementById('video-upload-status');
    const selectedFile = document.getElementById('selected-file');

    // Only initialize if elements exist
    if (!videoUploadBox || !videoFileInput || !videoSelectBtn || !videoUploadBtn ||
        !videoPreview || !uploadedVideo || !videoRetakeBtn || !analyzeVideoBtn ||
        !videoAnalysisResults || !videoUploadStatus || !selectedFile) {
        return;
    }

    // Select video button - opens file picker
    videoSelectBtn.addEventListener('click', function () {
        videoFileInput.click();
    });

    // When file is selected, show the file name and enable upload button
    videoFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            // Show selected file info
            selectedFile.innerHTML = `
                <div style="background: rgba(74, 144, 226, 0.08); padding: 10px; border-radius: 8px;">
                    <i class="fas fa-file-video" style="color: var(--accent); margin-right: 8px;"></i>
                    <span>${file.name} (${Math.round(file.size / 1024 / 1024)} MB)</span>
                </div>
            `;
            selectedFile.style.display = 'block';
            // Show upload button
            videoUploadBtn.style.display = 'inline-block';
            // Set video source
            const videoUrl = URL.createObjectURL(file);
            uploadedVideo.src = videoUrl;
        }
    });

    videoRetakeBtn.addEventListener('click', function () {
        videoPreview.style.display = 'none';
        videoUploadBox.style.display = 'block';
        videoFileInput.value = '';
        selectedFile.style.display = 'none';
        videoUploadBtn.style.display = 'none';
        videoAnalysisResults.style.display = 'none';
    });

    // Upload video button - actually sends the file to the server
    videoUploadBtn.addEventListener('click', function () {
        const file = videoFileInput.files[0];
        if (!file) {
            alert('Please select a video file first');
            return;
        }

        // Show uploading status
        videoUploadStatus.style.display = 'block';
        videoUploadStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Uploading ${file.name}...</div>`;
        videoUploadStatus.style.color = '#4a90e2';

        // Disable upload button during upload
        videoUploadBtn.disabled = true;
        videoUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        // Create form data with the video file
        const formData = new FormData();
        formData.append('file', file);

        // Send to our upload endpoint
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Server response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`Upload failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`Upload failed with status ${response.status}: ${text.substring(0, 100)}...`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                // Update status
                videoUploadStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle" style="color: #48bb78;"></i> ${data.fileName} uploaded successfully!</div>`;
                videoUploadStatus.style.color = '#48bb78';

                // Show video preview
                videoPreview.style.display = 'block';
                videoUploadBox.style.display = 'none';

                // Use the correct URL to access the video
                uploadedVideo.src = data.webPath;

                // Clear status after 5 seconds
                setTimeout(() => {
                    videoUploadStatus.style.display = 'none';
                }, 5000);

                // Re-enable upload button
                videoUploadBtn.disabled = false;
                videoUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Video';
            })
            .catch(error => {
                console.error('❌ Upload error:', error);
                videoUploadStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle" style="color: #e53e3e;"></i> Error: ${error.message}</div>`;
                videoUploadStatus.style.color = '#e53e3e';

                // Re-enable upload button
                videoUploadBtn.disabled = false;
                videoUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Video';

                // Clear status after 5 seconds
                setTimeout(() => {
                    videoUploadStatus.style.display = 'none';
                }, 5000);
            });
    });

    analyzeVideoBtn.addEventListener('click', function () {
        if (!videoFileInput.files[0]) {
            alert('Please upload a video first');
            return;
        }

        analyzeVideoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeVideoBtn.disabled = true;

        // Show analyzing status
        videoUploadStatus.style.display = 'block';
        videoUploadStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> Sending to video detection API...</div>`;
        videoUploadStatus.style.color = '#4a90e2';

        // Create form data with the video file
        const formData = new FormData();
        formData.append('video', videoFileInput.files[0]);

        // Send to OUR proxy endpoint
        fetch('/api/proxy/deepfake', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('API error response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`API request failed with status ${response.status}`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Video API response:', data);
                // Process the API response
                processVideoAnalysis(data);

                // Update status
                videoUploadStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle" style="color: #48bb78;"></i> Analysis complete!</div>`;
                videoUploadStatus.style.color = '#48bb78';

                // Clear status after 5 seconds
                setTimeout(() => {
                    videoUploadStatus.style.display = 'none';
                }, 5000);

                // Show results
                videoAnalysisResults.style.display = 'block';
                analyzeVideoBtn.innerHTML = '<i class="fas fa-redo"></i> Analyze Again';
                analyzeVideoBtn.disabled = false;
            })
            .catch(error => {
                console.error('❌ Video analysis error:', error);
                videoUploadStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle" style="color: #e53e3e;"></i> Analysis failed: ${error.message}</div>`;
                videoUploadStatus.style.color = '#e53e3e';

                // Show error in the results section
                const resultSummary = document.getElementById('result-summary');
                if (resultSummary) {
                    resultSummary.innerHTML = `
                    <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-times-circle"></i> Analysis Error
                    </p>
                    <p style="color: var(--dark-gray); margin-top: 10px;">
                        Failed to analyze video: ${error.message}
                    </p>
                `;
                    videoAnalysisResults.style.display = 'block';
                }

                // Reset button
                analyzeVideoBtn.innerHTML = '<i class="fas fa-redo"></i> Try Again';
                analyzeVideoBtn.disabled = false;

                // Clear status after 5 seconds
                setTimeout(() => {
                    videoUploadStatus.style.display = 'none';
                }, 5000);
            });
    });
}

// Initialize Misinformation Detector functionality
function initMisinformationDetector() {
    const misinformationText = document.getElementById('misinformation-text');
    const analyzeTextBtn = document.getElementById('analyze-text-btn');
    const misinformationResults = document.getElementById('misinformation-results');

    // Only initialize if elements exist
    if (!misinformationText || !analyzeTextBtn) {
        return;
    }

    const analysisStatus = document.getElementById('analysis-status') || (() => {
        const statusEl = document.createElement('div');
        statusEl.id = 'analysis-status';
        statusEl.style.marginTop = '10px';
        statusEl.style.display = 'none';
        analyzeTextBtn.parentNode.insertBefore(statusEl, analyzeTextBtn.nextSibling);
        return statusEl;
    })();

    // Character counter
    misinformationText.addEventListener('input', function () {
        const counter = document.getElementById('text-counter');
        if (counter) {
            counter.textContent = `${this.value.length}/2000 characters`;
        }
    });

    analyzeTextBtn.addEventListener('click', function () {
        const text = misinformationText.value.trim();
        if (!text) {
            showAnalysisStatus('Please enter text to analyze', 'error');
            return;
        }

        // Show loading state
        analyzeTextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeTextBtn.disabled = true;
        showAnalysisStatus('Sending to misinformation detection API...', 'info');

        // 👉 STEP 1: SET UP TIMEOUT (120 seconds instead of 30)
        const controller = new AbortController();
        const timeoutMs = 120000; // 2 minutes - adjust as needed
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // Create the request payload
        const payload = { text: text };

        // 👉 STEP 2: MAKE FETCH WITH TIMEOUT CONTROL
        fetch('/api/proxy/misinformation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal // Connect abort signal
        })
            .then(response => {
                clearTimeout(timeoutId); // Clear timeout on success

                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('❌ API error response:', text);
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
                        } catch (e) {
                            throw new Error(`API request failed with status ${response.status}: ${text.substring(0, 100)}...`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Misinformation API response:', data);

                // Process the API response
                processMisinformationAnalysis(data, text);

                // Hide status after success
                setTimeout(() => {
                    showAnalysisStatus('', 'success', 3000);
                }, 3000);

                // Show results
                const misinformationResults = document.getElementById('misinformation-results');
                if (misinformationResults) {
                    misinformationResults.style.display = 'block';
                }

                analyzeTextBtn.innerHTML = '<i class="fas fa-redo"></i> Analyze Again';
                analyzeTextBtn.disabled = false;
            })
            .catch(error => {
                clearTimeout(timeoutId); // Always clear timeout

                // 👉 STEP 3: FIX ERROR HANDLING (check if elements exist first)
                console.error('❌ Analysis error:', error);

                // Show error in status
                showAnalysisStatus(`Error: ${error.message}`, 'error');

                // 👉 CRITICAL FIX: Check if misinfoResultSummary exists before accessing it
                const misinfoResultSummary = document.getElementById('misinfo-result-summary');
                const misinformationResults = document.getElementById('misinformation-results');

                if (misinfoResultSummary) {
                    if (error.name === 'AbortError') {
                        misinfoResultSummary.innerHTML = `
                    <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-clock"></i> Request Timed Out
                    </p>
                    <p style="color: var(--dark-gray); margin-top: 10px;">
                        The analysis took too long. This may happen with long text inputs or server load.
                        Try shorter text or check back later.
                    </p>
                `;
                    } else {
                        misinfoResultSummary.innerHTML = `
                    <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                        <i class="fas fa-times-circle"></i> Analysis Failed
                    </p>
                    <p style="color: var(--dark-gray); margin-top: 10px;">
                        ${error.message}
                    </p>
                `;
                    }

                    if (misinformationResults) {
                        misinformationResults.style.display = 'block';
                    }
                }

                // Reset button
                analyzeTextBtn.innerHTML = '<i class="fas fa-redo"></i> Try Again';
                analyzeTextBtn.disabled = false;
            });
    });

    // Function to show analysis status
    function showAnalysisStatus(message, type, timeout = 5000) {
        if (!analysisStatus) return;
        if (!message) {
            analysisStatus.style.display = 'none';
            return;
        }

        analysisStatus.style.display = 'block';

        // Set styling based on type
        switch (type) {
            case 'info':
                analysisStatus.style.color = '#4a90e2';
                analysisStatus.innerHTML = `<div class="uploading"><i class="fas fa-spinner fa-spin"></i> ${message}</div>`;
                break;
            case 'success':
                analysisStatus.style.color = '#48bb78';
                analysisStatus.innerHTML = `<div class="upload-success"><i class="fas fa-check-circle"></i> ${message}</div>`;
                break;
            case 'error':
                analysisStatus.style.color = '#e53e3e';
                analysisStatus.innerHTML = `<div class="upload-error"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
                break;
        }

        // Auto-hide after timeout for success messages
        if (type === 'success' && timeout > 0) {
            setTimeout(() => {
                if (analysisStatus.style.color === '#48bb78') {
                    analysisStatus.style.display = 'none';
                }
            }, timeout);
        }
    }
}

// Function to process the image analysis results from the API
function processImageAnalysis(data) {
    const imageConfidenceValue = document.getElementById('image-confidence-value');
    const imageConfidenceLevel = document.getElementById('image-confidence-level');
    const imageResultSummary = document.getElementById('image-result-summary');

    // Model result elements
    const cnnResult = document.getElementById('cnn-result');
    const cnnConfidence = document.getElementById('cnn-confidence');
    const cnnConfidenceBar = document.getElementById('cnn-confidence-bar');
    const cnnScore = document.getElementById('cnn-score');
    const cnnReason = document.getElementById('cnn-reason');
    const zeroshotResult = document.getElementById('zeroshot-result');
    const zeroshotConfidence = document.getElementById('zeroshot-confidence');
    const zeroshotConfidenceBar = document.getElementById('zeroshot-confidence-bar');
    const zeroshotScore = document.getElementById('zeroshot-score');
    const zeroshotReason = document.getElementById('zeroshot-reason');
    const zeroshotScoresContainer = document.getElementById('zeroshot-scores-container');

    // Check for errors in the API response
    if (!data || !data.image_models) {
        if (imageResultSummary) {
            imageResultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Analysis Error
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Invalid API response format. Expected image_models field.
                </p>
            `;
        }
        return;
    }

    // Process CNN model results
    if (data.image_models.cnn) {
        const cnnConfidenceValue = data.image_models.cnn.confidence * 100;
        const cnnConfidenceDisplay = Math.round(cnnConfidenceValue);

        // Update CNN metric display
        if (cnnConfidence) {
            cnnConfidence.textContent = `${cnnConfidenceDisplay}%`;
        }
        if (cnnConfidenceBar) {
            cnnConfidenceBar.style.width = `${cnnConfidenceValue}%`;
            cnnConfidenceBar.style.background = data.image_models.cnn.label.toLowerCase() === 'real' ? 'var(--success)' : 'var(--danger)';
        }
        if (cnnScore) {
            cnnScore.textContent = `${cnnConfidenceDisplay}%`;
        }
        if (cnnResult) {
            cnnResult.textContent = data.image_models.cnn.label.toUpperCase();
            cnnResult.style.color = data.image_models.cnn.label.toLowerCase() === 'real' ? 'var(--success)' : 'var(--danger)';
        }
        if (cnnReason) {
            cnnReason.textContent = data.image_models.cnn.reason || 'No reason provided';
        }
    }

    // Process ZeroShot model results
    if (data.image_models.zeroshot) {
        const zeroshotConfidenceValue = data.image_models.zeroshot.confidence * 100;
        const zeroshotConfidenceDisplay = Math.round(zeroshotConfidenceValue);

        // Update ZeroShot metric display
        if (zeroshotConfidence) {
            zeroshotConfidence.textContent = `${zeroshotConfidenceDisplay}%`;
        }
        if (zeroshotConfidenceBar) {
            zeroshotConfidenceBar.style.width = `${zeroshotConfidenceValue}%`;
            zeroshotConfidenceBar.style.background = data.image_models.zeroshot.label.toLowerCase() === 'fake' ? 'var(--danger)' : 'var(--success)';
        }
        if (zeroshotScore) {
            zeroshotScore.textContent = `${zeroshotConfidenceDisplay}%`;
        }
        if (zeroshotResult) {
            zeroshotResult.textContent = data.image_models.zeroshot.label.toUpperCase();
            zeroshotResult.style.color = data.image_models.zeroshot.label.toLowerCase() === 'fake' ? 'var(--danger)' : 'var(--success)';
        }

        // Process and display classification scores if available
        if (data.image_models.zeroshot.reason &&
            data.image_models.zeroshot.reason.classification_scores) {
            const scores = data.image_models.zeroshot.reason.classification_scores;

            // Create HTML for scores display
            let scoresHTML = '<div class="classification-scores">';
            scoresHTML += '<h6 style="margin: 15px 0 10px; color: var(--primary);">Classification Scores:</h6>';

            // Sort scores by value (descending)
            const sortedScores = Object.entries(scores)
                .sort((a, b) => b[1] - a[1])
                .filter(([_, value]) => value > 0.001); // Only show scores > 0.1%

            // Generate HTML for each score
            for (const [label, value] of sortedScores) {
                const percentage = Math.round(value * 1000) / 10;
                const isDeepfake = label.includes('deepfake') ||
                    label.includes('synthetic') ||
                    label.includes('fake') ||
                    label.includes('AI-generated');

                scoresHTML += `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="font-size: 13px; color: ${isDeepfake ? 'var(--danger)' : 'var(--success)'};">
                                ${label}
                            </span>
                            <strong style="font-size: 13px; color: ${isDeepfake ? 'var(--danger)' : 'var(--success)'};">
                                ${percentage}%
                            </strong>
                        </div>
                        <div class="confidence" style="height: 6px; margin-bottom: 8px;">
                            <div class="confidence-level" style="
                                width: ${value * 100}%; 
                                background: ${isDeepfake ? 'var(--danger)' : 'var(--success)'};
                                border-radius: 3px;
                            "></div>
                        </div>
                    </div>
                `;
            }

            scoresHTML += '</div>';

            // Update the scores container
            if (zeroshotScoresContainer) {
                zeroshotScoresContainer.innerHTML = scoresHTML;
                zeroshotScoresContainer.style.display = 'block';
            }

            // Update the reason text to be more informative
            if (zeroshotReason) {
                const deepfakeScore = (scores["a computer-generated deepfake"] || 0) +
                    (scores["an AI-generated synthetic image"] || 0);
                const realScore = scores["a real human photo"] || 0;

                if (deepfakeScore > 0.9) {
                    zeroshotReason.textContent = `High probability of deepfake detected (${Math.round(deepfakeScore * 100)}%)`;
                } else if (deepfakeScore > 0.5) {
                    zeroshotReason.textContent = `Moderate probability of deepfake detected (${Math.round(deepfakeScore * 100)}%)`;
                } else {
                    zeroshotReason.textContent = `Low probability of deepfake detected (${Math.round(deepfakeScore * 100)}%)`;
                }
            }
        } else if (zeroshotReason) {
            zeroshotReason.textContent = data.image_models.zeroshot.reason || 'No detailed reason provided';
        }
    }

    // Calculate overall deepfake probability with higher weight for zeroshot (70%)
    let overallConfidence = 0;

    // Calculate CNN deepfake probability (convert to 0-1 scale where 1 = fake)
    let cnnDeepfakeProbability = 0;
    if (data.image_models.cnn) {
        cnnDeepfakeProbability = data.image_models.cnn.label.toLowerCase() === 'real' ?
            (1 - data.image_models.cnn.confidence) :
            data.image_models.cnn.confidence;
    }

    // Calculate ZeroShot deepfake probability
    let zeroshotDeepfakeProbability = 0;
    if (data.image_models.zeroshot) {
        // Use the classification scores if available for more accurate calculation
        if (data.image_models.zeroshot.reason &&
            data.image_models.zeroshot.reason.classification_scores) {
            const scores = data.image_models.zeroshot.reason.classification_scores;
            const deepfakeScore = (scores["a computer-generated deepfake"] || 0) +
                (scores["an AI-generated synthetic image"] || 0);
            const realScore = scores["a real human photo"] || 0;

            // Calculate deepfake probability from the scores
            zeroshotDeepfakeProbability = deepfakeScore / (deepfakeScore + realScore + 0.0001);
        } else {
            // Fall back to the confidence value
            zeroshotDeepfakeProbability = data.image_models.zeroshot.label.toLowerCase() === 'fake' ?
                data.image_models.zeroshot.confidence :
                (1 - data.image_models.zeroshot.confidence);
        }
    }

    // Calculate overall deepfake probability with weighted average
    // 70% weight to ZeroShot, 30% weight to CNN
    overallConfidence = (zeroshotDeepfakeProbability * 0.7) + (cnnDeepfakeProbability * 0.3);

    // Convert to percentage (0-100)
    overallConfidence = overallConfidence * 100;

    // Cap the confidence between 0-100
    overallConfidence = Math.max(0, Math.min(100, overallConfidence));

    // Update overall confidence display
    if (imageConfidenceValue) imageConfidenceValue.textContent = Math.round(overallConfidence) + '%';
    if (imageConfidenceLevel) {
        imageConfidenceLevel.style.width = overallConfidence + '%';
        // Set color based on confidence
        if (overallConfidence >= 75) {
            imageConfidenceLevel.style.background = 'var(--danger)';
        } else if (overallConfidence >= 50) {
            imageConfidenceLevel.style.background = 'var(--warning)';
        } else {
            imageConfidenceLevel.style.background = 'var(--success)';
        }
    }

    // Update result summary
    if (imageResultSummary) {
        if (overallConfidence >= 75) {
            imageResultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Synthetic Image Detected
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Strong evidence of synthetic image detected. This image is likely AI-generated and should not be trusted for verification purposes.
                </p>
            `;
        } else if (overallConfidence >= 50) {
            imageResultSummary.innerHTML = `
                <p style="color: var(--warning); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-exclamation-triangle"></i> Requires Manual Review
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Some indicators suggest possible synthetic manipulation. A human reviewer should examine this image for further verification.
                </p>
            `;
        } else {
            imageResultSummary.innerHTML = `
                <p style="color: var(--success); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-check-circle"></i> Authentic Image
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    The image shows no signs of synthetic manipulation. All visual characteristics are consistent with genuine photography.
                </p>
            `;
        }
    }

    // Save to analysis history
    AnalysisHistory.saveAnalysis('image', {
        type: 'image',
        authenticityConfidence: 100 - overallConfidence, // Authenticity = 100 - deepfake probability
        deepfakeProbability: overallConfidence,
        description: 'Image analysis for identity verification',
        image: document.getElementById('uploaded-image').src
    });

    // Refresh history display
    AnalysisHistory.initHistoryDisplay('image', 'image-results-history');
}

// Function to process the audio analysis results from the API
// Function to process the audio analysis results from the API
function processAudioAnalysis(data) {
    const audioConfidenceValue = document.getElementById('audio-confidence-value');
    const audioConfidenceLevel = document.getElementById('audio-confidence-level');
    const audioResultSummary = document.getElementById('audio-result-summary');

    // Result elements
    const audioResult = document.getElementById('audio-result');
    const audioResultConfidence = document.getElementById('audio-result-confidence');
    const audioResultConfidenceBar = document.getElementById('audio-result-confidence-bar');
    const audioResultConfidenceScore = document.getElementById('audio-result-confidence-score');
    const audioReason = document.getElementById('audio-reason');

    // Check for errors in the API response
    if (!data || !data.audio_models || !data.audio_models.voice_analysis) {
        if (audioResultSummary) {
            audioResultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Analysis Error
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Invalid API response format. Expected audio_models with voice_analysis.
                </p>
            `;
        }
        return;
    }

    const model = data.audio_models.voice_analysis;
    const confidencePercentage = Math.round(model.confidence * 100);
    const isSynthetic = model.label === 'synthetic';

    // FIXED: Calculate authenticity confidence properly
    // If it's synthetic, authenticity confidence = 100 - model confidence
    // If it's authentic, authenticity confidence = model confidence
    const authenticityConfidence = isSynthetic ? confidencePercentage : (100 - confidencePercentage);

    // Update main authenticity confidence display
    if (audioConfidenceValue) audioConfidenceValue.textContent = `${authenticityConfidence}%`;

    if (audioConfidenceLevel) {
        audioConfidenceLevel.style.width = `${authenticityConfidence}%`;
        // Set color based on confidence (authenticity)
        if (authenticityConfidence >= 75) {
            audioConfidenceLevel.style.background = 'var(--success)';
        } else if (authenticityConfidence >= 50) {
            audioConfidenceLevel.style.background = 'var(--warning)';
        } else {
            audioConfidenceLevel.style.background = 'var(--danger)';
        }
    }

    // Update result elements - showing the model's confidence in its specific label
    if (audioResult) {
        audioResult.textContent = model.label.toUpperCase();
        audioResult.style.color = isSynthetic ? 'var(--danger)' : 'var(--success)';
    }

    if (audioResultConfidence) {
        audioResultConfidence.textContent = `${confidencePercentage}%`;
    }

    if (audioResultConfidenceBar) {
        audioResultConfidenceBar.style.width = `${confidencePercentage}%`;
        audioResultConfidenceBar.style.background = isSynthetic ? 'var(--danger)' : 'var(--success)';
    }

    if (audioResultConfidenceScore) {
        audioResultConfidenceScore.textContent = `${confidencePercentage}%`;
    }

    if (audioReason) {
        audioReason.textContent = model.reason || 'No reason provided';
    }

    // Update result summary
    if (audioResultSummary) {
        if (isSynthetic) {
            audioResultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Synthetic Audio Detected
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    This audio shows strong indicators of being synthetic. It should not be trusted for verification purposes.
                </p>
            `;
        } else {
            audioResultSummary.innerHTML = `
                <p style="color: var(--success); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-check-circle"></i> Authentic Audio
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    This audio shows no signs of being synthetic. All characteristics are consistent with genuine audio.
                </p>
            `;
        }
    }

    // FIXED: Save the correct authenticity confidence to history
    AnalysisHistory.saveAnalysis('audio', {
        type: 'audio',
        authenticityConfidence: authenticityConfidence,
        fakeProbability: 100 - authenticityConfidence,
        description: 'Audio analysis for voice verification',
        audio: document.getElementById('uploaded-audio').src
    });

    // Refresh history display
    AnalysisHistory.initHistoryDisplay('audio', 'audio-results-history');
}
// Function to process the video analysis results from the API
function processVideoAnalysis(data) {
    const probabilityValue = document.getElementById('probability-value');
    const confidenceLevel = document.getElementById('confidence-level');
    const resultSummary = document.getElementById('result-summary');

    // RPPG elements
    const rppgResult = document.getElementById('rppg-result');
    const rppgConfidence = document.getElementById('rppg-confidence');
    const rppgConfidenceBar = document.getElementById('rppg-confidence-bar');
    const rppgScore = document.getElementById('rppg-score');
    const rppgReason = document.getElementById('rppg-reason');

    // Lip sync elements
    const lipsyncResult = document.getElementById('lipsync-result');
    const lipsyncConfidence = document.getElementById('lipsync-confidence');
    const lipsyncConfidenceBar = document.getElementById('lipsync-confidence-bar');
    const lipsyncScore = document.getElementById('lipsync-score');
    const lipsyncReason = document.getElementById('lipsync-reason');

    // Check for errors in the API response
    if (!data || !data.video_models) {
        if (resultSummary) {
            resultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Analysis Error
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Invalid API response format. Expected video_models field.
                </p>
            `;
        }
        return;
    }

    // Process RPPG analysis
    if (data.video_models.rppg) {
        const rppgConfidenceValue = data.video_models.rppg.confidence * 100;
        const rppgConfidenceDisplay = Math.round(rppgConfidenceValue);

        // Update RPPG metric display
        if (rppgConfidence) {
            rppgConfidence.textContent = `${rppgConfidenceDisplay}%`;
        }

        if (rppgConfidenceBar) {
            rppgConfidenceBar.style.width = `${rppgConfidenceValue}%`;
            rppgConfidenceBar.style.background = data.video_models.rppg.label.toLowerCase() === 'real' ? 'var(--success)' : 'var(--danger)';
        }

        if (rppgScore) {
            rppgScore.textContent = `${rppgConfidenceDisplay}%`;
        }

        if (rppgResult) {
            rppgResult.textContent = data.video_models.rppg.label.toUpperCase();
            rppgResult.style.color = data.video_models.rppg.label.toLowerCase() === 'real' ? 'var(--success)' : 'var(--danger)';
        }

        if (rppgReason) {
            rppgReason.textContent = data.video_models.rppg.reason || 'No reason provided';
        }
    }

    // Process Lip Sync analysis
    if (data.video_models.lipsync && data.video_models.lipsync.label !== 'error') {
        const lipsyncConfidenceValue = data.video_models.lipsync.confidence * 100;
        const lipsyncConfidenceDisplay = Math.round(lipsyncConfidenceValue);

        // Update Lip Sync metric display
        if (lipsyncConfidence) {
            lipsyncConfidence.textContent = `${lipsyncConfidenceDisplay}%`;
        }

        if (lipsyncConfidenceBar) {
            lipsyncConfidenceBar.style.width = `${lipsyncConfidenceValue}%`;
            lipsyncConfidenceBar.style.background = data.video_models.lipsync.label.toLowerCase() === 'match' ? 'var(--success)' : 'var(--danger)';
        }

        if (lipsyncScore) {
            lipsyncScore.textContent = `${lipsyncConfidenceDisplay}%`;
        }

        if (lipsyncResult) {
            lipsyncResult.textContent = data.video_models.lipsync.label.toUpperCase();
            lipsyncResult.style.color = data.video_models.lipsync.label.toLowerCase() === 'match' ? 'var(--success)' : 'var(--danger)';
        }

        if (lipsyncReason) {
            lipsyncReason.textContent = data.video_models.lipsync.reason || 'No reason provided';
        }
    } else {
        // Handle lipsync error
        if (lipsyncResult) {
            lipsyncResult.textContent = 'ERROR';
            lipsyncResult.style.color = 'var(--danger)';
        }

        if (lipsyncConfidence) {
            lipsyncConfidence.textContent = 'N/A';
        }

        if (lipsyncConfidenceBar) {
            lipsyncConfidenceBar.style.width = '0%';
            lipsyncConfidenceBar.style.background = 'var(--danger)';
        }

        if (lipsyncScore) {
            lipsyncScore.textContent = 'N/A';
        }

        if (lipsyncReason) {
            lipsyncReason.textContent = data.video_models.lipsync?.reason || 'Lip sync analysis failed';
        }
    }

    // Calculate overall deepfake probability
    let overallConfidence = 0;

    // Calculate RPPG deepfake probability (convert to 0-1 scale where 1 = fake)
    let rppgDeepfakeProbability = 0;
    if (data.video_models.rppg) {
        rppgDeepfakeProbability = data.video_models.rppg.label.toLowerCase() === 'real' ?
            (1 - data.video_models.rppg.confidence) :
            data.video_models.rppg.confidence;
    }

    // Calculate Lip Sync deepfake probability
    let lipsyncDeepfakeProbability = 0;
    if (data.video_models.lipsync) {
        lipsyncDeepfakeProbability = data.video_models.lipsync.label.toLowerCase() === 'match' ?
            (1 - data.video_models.lipsync.confidence) :
            data.video_models.lipsync.confidence;
    }

    // Calculate overall deepfake probability with weighted average
    // 60% weight to RPPG, 40% weight to Lip Sync
    overallConfidence = (rppgDeepfakeProbability * 0.6) + (lipsyncDeepfakeProbability * 0.4);

    // Convert to percentage (0-100)
    overallConfidence = overallConfidence * 100;

    // Cap the confidence between 0-100
    overallConfidence = Math.max(0, Math.min(100, overallConfidence));

    // Update overall confidence display
    if (probabilityValue) probabilityValue.textContent = Math.round(overallConfidence) + '%';

    if (confidenceLevel) {
        confidenceLevel.style.width = overallConfidence + '%';
        // Set color based on confidence
        if (overallConfidence >= 75) {
            confidenceLevel.style.background = 'var(--danger)';
        } else if (overallConfidence >= 50) {
            confidenceLevel.style.background = 'var(--warning)';
        } else {
            confidenceLevel.style.background = 'var(--success)';
        }
    }

    // Update result summary
    if (resultSummary) {
        if (overallConfidence >= 75) {
            resultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Deepfake Detected
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Strong evidence of deepfake detected. This video is likely synthetic and should not be trusted for verification purposes.
                </p>
            `;
        } else if (overallConfidence >= 50) {
            resultSummary.innerHTML = `
                <p style="color: var(--warning); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-exclamation-triangle"></i> Requires Manual Review
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Some indicators suggest possible deepfake manipulation. A human reviewer should examine this video for further verification.
                </p>
            `;
        } else {
            resultSummary.innerHTML = `
                <p style="color: var(--success); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-check-circle"></i> Authentic Video
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    The video shows no signs of deepfake manipulation. All characteristics are consistent with genuine video.
                </p>
            `;
        }
    }

    // Save to analysis history
    AnalysisHistory.saveAnalysis('deepfake', {
        type: 'deepfake',
        authenticityConfidence: 100 - overallConfidence,
        deepfakeProbability: overallConfidence,
        description: 'Video analysis for identity verification',
        video: document.getElementById('uploaded-video').src
    });

    // Refresh history display
    AnalysisHistory.initHistoryDisplay('deepfake', 'deepfake-results-history');
}

// Function to process the misinformation analysis results from the API
function processMisinformationAnalysis(data, originalText) {
    const misinfoConfidenceValue = document.getElementById('misinfo-confidence-value');
    const misinfoConfidenceLevel = document.getElementById('misinfo-confidence-level');
    const misinfoResultSummary = document.getElementById('misinfo-result-summary');
    const sourcesList = document.getElementById('sources-list');

    // Check for errors in the API response
    if (!data || !data.text_model || !data.text_model.confidence ||
        !data.text_model.label || !data.text_model.sources) {
        if (misinfoResultSummary) {
            misinfoResultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Analysis Error
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    Invalid API response format. Expected text_model with confidence, label, and sources.
                </p>
            `;
        }
        return;
    }

    const model = data.text_model;
    const confidencePercentage = Math.round(model.confidence * 100);

    // Update confidence display
    if (misinfoConfidenceValue) misinfoConfidenceValue.textContent = `${confidencePercentage}%`;

    if (misinfoConfidenceLevel) {
        misinfoConfidenceLevel.style.width = `${confidencePercentage}%`;
        // Set color based on confidence
        if (confidencePercentage >= 75) {
            misinfoConfidenceLevel.style.background = 'var(--danger)';
        } else if (confidencePercentage >= 50) {
            misinfoConfidenceLevel.style.background = 'var(--warning)';
        } else {
            misinfoConfidenceLevel.style.background = 'var(--success)';
        }
    }

    // Update result summary
    if (misinfoResultSummary) {
        if (model.label === 'fake') {
            misinfoResultSummary.innerHTML = `
                <p style="color: var(--danger); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-times-circle"></i> Likely Misinformation
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    This content shows strong indicators of misinformation. Our system found inconsistencies with verified sources.
                </p>
            `;
        } else {
            misinfoResultSummary.innerHTML = `
                <p style="color: var(--success); font-weight: 600; margin-top: 8px;">
                    <i class="fas fa-check-circle"></i> Likely Authentic
                </p>
                <p style="color: var(--dark-gray); margin-top: 10px;">
                    This content aligns with verified information from trusted sources.
                </p>
            `;
        }
    }

    // Clear previous sources
    if (sourcesList) {
        sourcesList.innerHTML = '';

        // Add sources
        if (model.sources && model.sources.length > 0) {
            model.sources.forEach(source => {
                const sourceElement = document.createElement('div');
                sourceElement.className = 'source-item';
                sourceElement.style.marginBottom = '20px';
                sourceElement.style.padding = '15px';
                sourceElement.style.borderRadius = '8px';
                sourceElement.style.background = 'rgba(74, 144, 226, 0.08)';

                // Clean the link (remove trailing spaces)
                const cleanLink = source.link ? source.link.trim() : '#';

                sourceElement.innerHTML = `
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <i class="fas fa-link" style="color: var(--accent); margin-right: 8px;"></i>
                        <a href="${cleanLink}" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 600;">Source Link</a>
                    </div>
                    <p style="color: var(--dark-gray); line-height: 1.5; margin: 0;">
                        ${source.snippet || 'No snippet available'}
                    </p>
                `;

                sourcesList.appendChild(sourceElement);
            });
        } else {
            sourcesList.innerHTML = `
                <p style="color: var(--dark-gray);">No verification sources found for this claim.</p>
            `;
        }
    }

    // Save to analysis history
    AnalysisHistory.saveAnalysis('misinfo', {
        type: 'misinfo',
        misinfoConfidence: confidencePercentage,
        description: 'Misinformation analysis for news verification',
        text: originalText
    });

    // Refresh history display
    AnalysisHistory.initHistoryDisplay('misinfo', 'misinfo-results-history');
}
