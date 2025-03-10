let currentSongId = null; // Track the latest song ID
let currentRequest = null; // Store the current fetch request
let currentImageRequest = null; // Store the current image loading request

let isSongLoaded = false; // Flag to track if the song has been properly loaded
let isMetadataLoaded = false; // Flag to check if metadata is loaded

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

        // Once the audio metadata is loaded, allow the play button to work
        audioPlayer.onloadedmetadata = function () {
            isMetadataLoaded = true; // Song metadata is loaded
            document.getElementById('playPauseBtn').disabled = false; // Enable the play button
            document.getElementById('playPauseBtn').textContent = 'Play'; // Set play button to "Play"

            // Display the total duration of the song
            const duration = formatTime(audioPlayer.duration);
            document.getElementById('duration-time').textContent = duration;
            
            // Set initial time as 0:00
            document.getElementById('current-time').textContent = "0:00 / " + duration;
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

// Play/Pause Button Functionality
document.getElementById('playPauseBtn').addEventListener('click', function () {
    const audioPlayer = document.getElementById('audio-player');

    if (!isMetadataLoaded) {
        console.log("Song metadata is not ready yet");
        return; // Don't attempt to play if the song metadata is not loaded
    }

    if (audioPlayer.paused) {
        audioPlayer.play();
        this.textContent = 'Pause';
    } else {
        audioPlayer.pause();
        this.textContent = 'Play';
    }
});

// Handle the time updates and seekbar
document.getElementById('audio-player').addEventListener('timeupdate', function () {
    const audioPlayer = document.getElementById('audio-player');
    const seekBar = document.getElementById('seek-bar');

    // Update the seekbar position based on current time
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    seekBar.value = progress;

    // Update the current time display
    const currentTime = formatTime(audioPlayer.currentTime);
    const duration = formatTime(audioPlayer.duration);
    document.getElementById('current-time').textContent = `${currentTime} / ${duration}`;
});

// Format time in minutes:seconds format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Seek functionality
document.getElementById('seek-bar').addEventListener('input', function () {
    const audioPlayer = document.getElementById('audio-player');
    const seekBar = document.getElementById('seek-bar');

    // Set the current time of the audio player based on the seekbar
    audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
});

// Load a song when the page opens
loadRandomSong();
