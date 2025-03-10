let currentSongId = null; // Track the latest song ID
let currentRequest = null; // Store the current fetch request
let currentImageRequest = null; // Store the current image loading request
let isPlaying = false; // Track whether the audio is playing or paused
let audioPlayer = document.getElementById('audio-player'); // Reference to the audio player
let seekBar = document.getElementById('seek-bar'); // Reference to the seek bar
let playPauseBtn = document.getElementById('playPauseBtn'); // Play/Pause button
let trackInfo = document.getElementById('track-info'); // Track info display

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
        audioPlayer.src = data.audio;
        audioPlayer.play();
        isPlaying = true;
        updatePlayPauseButton();

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

        // Update track info
        trackInfo.textContent = `Track: ${data.metadata.title} - ${data.metadata.artist}`;

        // Update the seek bar every 0.1 seconds
        setInterval(updateSeekBar, 100);

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Failed to fetch song:", error);
        }
    }
}

// Update the seek bar based on audio playback
function updateSeekBar() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        seekBar.value = progress;
    }
}

// Sync seek bar with audio
seekBar.addEventListener('input', function () {
    const newTime = (seekBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = newTime;
});

// Toggle play/pause
playPauseBtn.addEventListener('click', function () {
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
    isPlaying = !isPlaying;
    updatePlayPauseButton();
});

// Update the play/pause button text
function updatePlayPauseButton() {
    if (isPlaying) {
        playPauseBtn.textContent = 'Pause';
    } else {
        playPauseBtn.textContent = 'Play';
    }
}

// Load a song when the page opens
loadRandomSong();
