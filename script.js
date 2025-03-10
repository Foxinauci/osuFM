let currentSongId = null;
let currentRequest = null;
let currentImageRequest = null;

async function preloadImage(url, callback) {
    if (currentImageRequest) {
        currentImageRequest.abort(); // Cancel previous image loading
    }

    const controller = new AbortController();
    currentImageRequest = controller;

    const img = new Image();
    img.src = url;

    img.onload = function () {
        if (!controller.signal.aborted) {
            callback(url);
        }
    };
}

async function loadRandomSong() {
    try {
        // Cancel any previous fetch request
        if (currentRequest) {
            currentRequest.abort();
        }

        const controller = new AbortController();
        currentRequest = controller;

        // Fetch the song
        const response = await fetch('https://osufmapi.mathicloud.com/random-song', { signal: controller.signal });
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching song:", data.error);
            return;
        }

        // Set the current song ID
        currentSongId = data.audio; // Use the unique audio URL as an ID

        // Update the song title and artist
        document.getElementById('song-title').textContent = data.metadata.title;
        document.getElementById('song-artist').textContent = data.metadata.artist;

        console.log("Loading background:", data.background);

        // Set the audio source
        const audioPlayer = document.getElementById('audio-player');
        audioPlayer.src = data.audio;
        audioPlayer.play();

        // Update the total duration and current time
        const durationTimeElem = document.getElementById('current-time');
        audioPlayer.onloadedmetadata = () => {
            const totalDuration = formatTime(audioPlayer.duration);
            durationTimeElem.textContent = `0:00 / ${totalDuration}`;
        };

        // Update current time and seekbar
        audioPlayer.ontimeupdate = () => {
            const currentTime = formatTime(audioPlayer.currentTime);
            const totalDuration = formatTime(audioPlayer.duration);
            document.getElementById('current-time').textContent = `${currentTime} / ${totalDuration}`;
            document.getElementById('seek-bar').value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        };

        // Load and set the background only if the song ID is still the same
        if (data.background) {
            preloadImage(data.background, function (url) {
                if (currentSongId === data.audio) { // Ensure it's still the latest song
                    document.body.style.backgroundImage = 'none'; // Clear previous background
                    document.body.style.transition = "background-image 300ms ease-in-out";
                    document.body.style.backgroundImage = `url(${url})`;
                }
            });
        }

        // Add an event listener to load the next song when the current one ends
        audioPlayer.onended = function () {
            loadRandomSong(); // Call the function again to load the next song
        };

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Failed to fetch song:", error);
        }
    }
}

// Function to format time in MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Load a song when the page opens
loadRandomSong();
