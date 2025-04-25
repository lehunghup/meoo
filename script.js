let mediaData = [];
let viewedItems = new Set(JSON.parse(localStorage.getItem('viewedItems') || '[]'));
let currentVideoIndex = -1; // Theo dõi index của video đang phát

// Load CSV file from GitHub repository
function loadCSV() {
    // ... (phần code loadCSV giữ nguyên) ...
}

// Render media grid
function renderMedia() {
    // ... (phần code renderMedia giữ nguyên) ...
}

// Play video in modal
function playVideo(url, title, id, index) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    const videoTitle = document.getElementById('videoTitle');
    currentVideoIndex = index; // Cập nhật index video hiện tại

    // Reset video
    video.src = '';
    videoTitle.textContent = title;

    // Thêm trình lắng nghe sự kiện 'ended'
    video.onended = playNextVideo;

    video.onerror = (error) => {
        if (video.src && !video.paused && video.currentSrc !== '') {
            console.error(`Failed to load video: ${url}`, error);
            alert('Failed to load video. Please check the URL or try another video.');
        } else {
            console.log(`Video load ignored (likely due to modal close): ${url}`);
        }
        closeModal();
    };

    video.onloadeddata = () => {
        modal.style.display = 'flex';
        video.play().catch(err => {
            console.error(`Failed to play video: ${url}`, err);
            alert('Failed to play video. Please check the video format or try another.');
            closeModal();
        });
        // Auto-mark as viewed
        if (!viewedItems.has(id)) {
            markAsViewed(id);
        }
    };

    // Tải nguồn video
    video.src = url;
    video.load();
}

// Phát video tiếp theo
function playNextVideo() {
    if (mediaData && mediaData.length > 0 && currentVideoIndex < mediaData.length - 1) {
        const nextIndex = currentVideoIndex + 1;
        const nextVideo = mediaData[nextIndex];
        playVideo(nextVideo.url, nextVideo.title, nextVideo.id, nextIndex);
    } else {
        alert('Đã phát video cuối cùng.');
        closeModal(); // Tự động đóng modal hoặc có thể lặp lại danh sách
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    video.onerror = null;
    video.onended = null; // Xóa trình lắng nghe sự kiện 'ended' khi đóng modal
    video.pause();
    video.src = '';
    video.load();
    document.getElementById('videoTitle').textContent = '';
    modal.style.display = 'none';
    currentVideoIndex = -1; // Reset index khi đóng modal
}

// Mark item as viewed/unviewed
function markAsViewed(id) {
    if (viewedItems.has(id)) {
        viewedItems.delete(id);
    } else {
        viewedItems.add(id);
    }
    localStorage.setItem('viewedItems', JSON.stringify([...viewedItems]));
    renderMedia();
}

// Sort media
function sortMedia() {
    const sortKey = document.getElementById('sort').value;
    mediaData.sort((a, b) => {
        if (sortKey === 'size_formatted') {
            const sizeA = parseFloat(a.size_formatted) || 0;
            const sizeB = parseFloat(b.size_formatted) || 0;
            return sizeB - sizeA;
        }
        return a[sortKey]?.localeCompare(b[sortKey]) || 0;
    });
    renderMedia();
}

// Close modal when clicking outside
document.getElementById('videoModal').onclick = function (e) {
    if (e.target === this) closeModal();
};

// Load CSV when the page loads
window.onload = loadCSV;