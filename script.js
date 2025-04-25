let mediaData = [];
let viewedItems = new Set(JSON.parse(localStorage.getItem('viewedItems') || '[]'));
let currentVideoIndex = -1; // Theo dõi index của video đang phát trong mediaData
let playlist = []; // Danh sách phát hiện tại

// Load CSV file from GitHub repository
function loadCSV() {
    // ... (giữ nguyên code loadCSV) ...
}

// Render media grid
function renderMedia() {
    // ... (giữ nguyên code renderMedia) ...
}

// Tạo playlist từ video được chọn
function createPlaylist(startIndex) {
    playlist = mediaData.slice(startIndex, startIndex + 10); // Lấy tối đa 10 video
}

// Phát video trong modal
function playVideo(url, title, id, index) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    const videoTitle = document.getElementById('videoTitle');
    currentVideoIndex = index; // Cập nhật index video hiện tại trong mediaData

    // Reset video
    video.src = '';
    videoTitle.textContent = title;

    // Thêm trình lắng nghe sự kiện 'ended'
    video.onended = playNextVideo;

    // Lưu thời gian phát khi video tạm dừng
    video.onpause = () => {
        if (video.currentTime > 0) {
            localStorage.setItem(`videoTime_${id}`, video.currentTime);
        }
    };

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
        // Khôi phục thời gian phát cuối cùng
        const savedTime = localStorage.getItem(`videoTime_${id}`);
        if (savedTime) {
            video.currentTime = parseFloat(savedTime);
        }
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

// Phát video tiếp theo trong playlist
function playNextVideo() {
    const currentPlaylistIndex = playlist.findIndex(item => item.id === mediaData[currentVideoIndex].id);
    if (currentPlaylistIndex < playlist.length - 1) {
        const nextVideo = playlist[currentPlaylistIndex + 1];
        const nextIndex = mediaData.findIndex(item => item.id === nextVideo.id);
        playVideo(nextVideo.url, nextVideo.title, nextVideo.id, nextIndex);
    } else {
        alert('Đã phát hết danh sách phát.');
        closeModal(); // Đóng modal khi hết playlist
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    
    // Lưu thời gian phát hiện tại trước khi đóng modal
    if (video.currentTime > 0 && mediaData[currentVideoIndex]) {
        localStorage.setItem(`videoTime_${mediaData[currentVideoIndex].id}`, video.currentTime);
    }

    video.onerror = null;
    video.onended = null; // Xóa trình lắng nghe sự kiện 'ended'
    video.onpause = null; // Xóa trình lắng nghe sự kiện 'pause'
    video.pause();
    video.src = '';
    video.load();
    document.getElementById('videoTitle').textContent = '';
    modal.style.display = 'none';
    currentVideoIndex = -1; // Reset index khi đóng modal
    playlist = []; // Reset playlist
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

// Hàm xử lý khi nhấn vào thumbnail
function handleThumbnailClick(index) {
    createPlaylist(index); // Tạo playlist bắt đầu từ video được chọn
    const video = playlist[0]; // Phát video đầu tiên trong playlist
    playVideo(video.url, video.title, video.id, index);
}

// Load CSV when the page loads
window.onload = loadCSV;
