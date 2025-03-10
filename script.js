let currentSongId = null; // Track the latest song ID
let currentRequest = null; // Store the current fetch request
let currentImageRequest = null; // Store the current image loading request
let audioPlayer = document.getElementById('audio-player');
let seekBar = document.getElementById('seek-bar');
let currentTimeDisplay = document.getElementById('current-time');
let playPauseBtn = document.getElementById('playPauseBtn');
let volumeBar = document.getElementById('volume-bar'); // Volume bar element
let selectFolderBtn = document.getElementById('select-folder-button'); // Button for folder selection
let songInfoDiv = document.getElementById('song-info'); // Display song info dynamically

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

// Volume Control: Adjust audio volume based on volume bar
volumeBar.addEventListener("input", function() {
    audioPlayer.volume = volumeBar.value; // Set the audio volume (range 0-1)
});

// Function to parse metadata from an .osu file
function parseOsuFileMetadata(osuData) {
    const metadataSection = osuData.split('[Metadata]')[1];
    const titleMatch = metadataSection.match(/Title:(.*?)(?=\r?\n|$)/);
    const artistMatch = metadataSection.match(/Artist:(.*?)(?=\r?\n|$)/);
    const audioFileMatch = osuData.match(/AudioFilename:(.*?)(?=\r?\n|$)/);

    return {
        title: titleMatch ? titleMatch[1].trim() : 'Unknown Title',
        artist: artistMatch ? artistMatch[1].trim() : 'Unknown Artist',
        audioFile: audioFileMatch ? audioFileMatch[1].trim() : 'unknown.mp3',
    };
}

// Function to display song info on the website
function displaySongInfo(title, artist, audioFile, folderHandle) {
    songInfoDiv.innerHTML = `
        <h3>${title} by ${artist}</h3>
        <audio controls>
            <source src="${folderHandle.name}/${audioFile}" type="audio/mp3">
            Your browser does not support the audio element.
        </audio>
    `;
}

// Handle folder selection
selectFolderBtn.addEventListener("click", selectOsuFolder);

async function selectOsuFolder() {
    try {
        // Ask the user to select their osu! song folder
        const dirHandle = await window.showDirectoryPicker();

        // Read the folders inside the osu! song folder
        const songFolders = [];
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'directory') {
                songFolders.push(entry.name);
            }
        }

        if (songFolders.length === 0) {
            alert("No osu! songs found in the selected folder.");
            return;
        }

        // Example: Let's assume we choose the first folder to process
        const selectedFolder = songFolders[0];
        const folderHandle = await dirHandle.getDirectoryHandle(selectedFolder);

        // Read .osu files in the selected folder
        const osuFiles = [];
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.osu')) {
                osuFiles.push(entry);
            }
        }

        if (osuFiles.length === 0) {
            alert("No .osu files found in the selected folder.");
            return;
        }

        // Process the first .osu file to get metadata
        const osuFile = osuFiles[0];
        const file = await osuFile.getFile();
        const osuData = await file.text();

        // Parse the osu! file and extract metadata
        const metadata = parseOsuFileMetadata(osuData);
        const audioFile = metadata.audioFile;
        const title = metadata.title;
        const artist = metadata.artist;

        // Display song info
        displaySongInfo(title, artist, audioFile, folderHandle);

        // Set the audio source
        audioPlayer.src = `${folderHandle.name}/${audioFile}`;

        // Once the audio is ready, we can update the play button
        audioPlayer.onloadeddata = function () {
            if (audioPlayer.paused) {
                playPauseBtn.textContent = 'Play';
            } else {
                playPauseBtn.textContent = 'Pause';
            }
        };

        // Auto-play the song when it's loaded
        audioPlayer.play();

    } catch (err) {
        console.error('Error accessing osu! folder:', err);
        alert('An error occurred while accessing your osu! folder.');
    }
}

// Load a song when the page opens
loadRandomSong();
