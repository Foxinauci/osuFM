let currentSongId = null; // Track the latest song ID
let currentRequest = null; // Store the current fetch request
let currentImageRequest = null; // Store the current image loading request
let audioPlayer = document.getElementById('audio-player');
let seekBar = document.getElementById('seek-bar');
let currentTimeDisplay = document.getElementById('current-time');
let playPauseBtn = document.getElementById('playPauseBtn');
let volumeBar = document.getElementById('volume-bar');  // Volume bar element

// Function to format time (mm:ss)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Play/pause functionality
playPauseBtn.addEventListener('click', function () {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = 'Pause';
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = 'Play';
    }
});

// Update seekbar and time display
audioPlayer.addEventListener('timeupdate', function () {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;

    // Update the seekbar and current time display
    if (!isNaN(duration) && duration > 0) { // Prevent NaN errors if the duration isn't loaded yet
        seekBar.value = (currentTime / duration) * 100;
        currentTimeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
});

// Allow user to seek through the song
seekBar.addEventListener('input', function () {
    const duration = audioPlayer.duration;
    const newTime = (seekBar.value / 100) * duration;
    audioPlayer.currentTime = newTime;
});

// Autoplay next song when current one ends
audioPlayer.addEventListener('ended', function () {
    loadRandomSong();
});

// Preload song data
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

        // Set the audio source
        audioPlayer.src = data.audio;

        // Once the audio is ready, we can update the play button
        audioPlayer.onloadeddata = function () {
            // If the audio is not already playing, set the button text to Play
            if (audioPlayer.paused) {
                playPauseBtn.textContent = 'Play';
            } else {
                playPauseBtn.textContent = 'Pause'; // If it's playing, show Pause
            }
        };

        // Auto-play the song when it's loaded
        audioPlayer.play();

        // Update the background image (if available)
        if (data.background) {
            preloadImage(data.background, function (url) {
                if (currentSongId === data.audio) {
                    document.body.style.backgroundImage = 'none'; // Clear previous background
                    document.body.style.transition = "background-image 300ms ease-in-out";
                    document.body.style.backgroundImage = `url(${url})`;
                }
            });
        }

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error("Failed to fetch song:", error);
        }
    }
}

// Preload image helper function
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

// Set the initial volume bar value to the current volume of the audio player
volumeBar.value = audioPlayer.volume * 100;  // Convert the volume to percentage

// Volume Control: Adjust audio volume based on volume bar
volumeBar.addEventListener("input", function() {
    audioPlayer.volume = volumeBar.value; // Convert the volume back to 0-1 range
});

// Load a song when the page opens
loadRandomSong();
