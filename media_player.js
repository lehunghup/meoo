let mediaData = [];
let viewedItems = new Set(JSON.parse(localStorage.getItem('viewedItems') || '[]'));
let currentVideoIndex = -1;
let playlist = [];

function loadCSV() {
    console.log('Starting loadCSV');
    // Thay <repository> bằng tên repository thực tế, ví dụ: media-player
    const csvUrl = 'https://raw.githubusercontent.com/lehunghup/meoo/main/data.csv';
    fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Raw CSV data:', data);
            if (!data.trim()) {
                throw new Error('CSV file is empty');
            }
            mediaData = parseCSV(data);
            console.log('Parsed mediaData:', mediaData);
            if (mediaData.length === 0) {
                throw new Error('No valid data parsed from CSV');
            }
            renderMedia();
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            const container = document.getElementById('mediaContainer');
            if (container) {
                container.innerHTML = `<p>Failed to load media data: ${error.message}. Please check the CSV URL or file content.</p>`;
            }
        });
}

function parseCSV(csvText) {
    try {
        const rows = csvText.trim().split('\n').slice(1); // Bỏ dòng tiêu đề
        const result = rows
            .map((row, index) => {
                // Phân tách cẩn thận để xử lý dấu phẩy trong title
                const cols = row.split(',').map(item => item.trim());
                if (cols.length < 19) {
                    console.warn(`Invalid row at index ${index + 1}: ${row}`);
                    return null;
                }
                const [id, , , , , , , , , , thumb, title, url, , , , , , size_formatted] = cols;
                if (!id || !title || !url || !thumb || !size_formatted) {
                    console.warn(`Missing required fields in row ${index + 1}: ${row}`);
                    return null;
                }
                return { id, title, url, thumb, size_formatted };
            })
            .filter(item => item !== null);
        return result;
    } catch (error) {
        console.error('Error parsing CSV:', error);
        return [];
    }
}

function renderMedia() {
    console.log('Rendering media, mediaData:', mediaData);
    const container = document.getElementById('mediaContainer');
    if (!container) {
        console.error('mediaContainer not found');
        return;
    }
    container.innerHTML = '';
    if (mediaData.length === 0) {
        container.innerHTML = '<p>No media available.</p>';
        return;
    }
    mediaData.forEach((item, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        thumbnail.innerHTML = `
            <img src="${item.thumb}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150';">
            <p>${item.title}</p>
            ${viewedItems.has(item.id) ? '<span style="color: green;">✔ Viewed</span>' : ''}
        `;
        thumbnail.onclick = () => handleThumbnailClick(index);
        container.appendChild(thumbnail);
    });
}

function createPlaylist(startIndex) {
    playlist = mediaData.slice(startIndex, startIndex + 10);
    console.log('Created playlist:', playlist);
}

function playVideo(url, title, id, index) {
    console.log('Playing video:', { url, title, id, index });
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    const videoTitle = document.getElementById('videoTitle');
    currentVideoIndex = index;

    video.src = '';
    videoTitle.textContent = title;

    video.onended = playNextVideo;

    video.onpause = () => {
        if (video.currentTime > 0) {
            localStorage.setItem(`videoTime_${id}`, video.currentTime);
        }
    };

    video.onerror = (error) => {
        if (video.src && !video.paused && video.currentSrc !== '') {
            console.error(`Failed to load video: ${url}`, error);
            playNextVideo();
        } else {
            console.log(`Video load ignored: ${url}`);
            closeModal();
        }
    };

    video.onloadeddata = () => {
        modal.style.display = 'flex';
        const savedTime = localStorage.getItem(`videoTime_${id}`);
        if (savedTime) {
            video.currentTime = parseFloat(savedTime);
        }
        video.play().catch(err => {
            console.error(`Failed to play video: ${url}`, err);
            playNextVideo();
        });
        if (!viewedItems.has(id)) {
            markAsViewed(id);
        }
    };

    video.src = url;
    video.load();
}

function playNextVideo() {
    const currentPlaylistIndex = playlist.findIndex(item => item.id === mediaData[currentVideoIndex].id);
    if (currentPlaylistIndex < playlist.length - 1) {
        const nextVideo = playlist[currentPlaylistIndex + 1];
        const nextIndex = mediaData.findIndex(item => item.id === nextVideo.id);
        console.log('Playing next video:', nextVideo);
        playVideo(nextVideo.url, nextVideo.title, nextVideo.id, nextIndex);
    } else {
        alert('Đã phát hết danh sách phát.');
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    
    if (video.currentTime > 0 && mediaData[currentVideoIndex]) {
        localStorage.setItem(`videoTime_${mediaData[currentVideoIndex].id}`, video.currentTime);
    }

    video.onerror = null;
    video.onended = null;
    video.onpause = null;
    video.pause();
    video.src = '';
    video.load();
    document.getElementById('videoTitle').textContent = '';
    modal.style.display = 'none';
    currentVideoIndex = -1;
    playlist = [];
}

function markAsViewed(id) {
    if (!viewedItems.has(id)) {
        viewedItems.add(id);
        localStorage.setItem('viewedItems', JSON.stringify([...viewedItems]));
        renderMedia();
    }
}

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

function handleThumbnailClick(index) {
    console.log('Thumbnail clicked, index:', index);
    createPlaylist(index);
    const video = playlist[0];
    playVideo(video.url, video.title, video.id, index);
}

document.getElementById('videoModal').onclick = function (e) {
    if (e.target === this) closeModal();
};

window.onload = () => {
    console.log('Page loaded, calling loadCSV');
    loadCSV();
};
