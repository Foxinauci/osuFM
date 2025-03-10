function preloadImage(url, callback) {
    const img = new Image();
    img.src = url;
    img.onload = function() {
        callback(url);
    };
}

async function loadRandomSong() {
    try {
        const response = await fetch('https://osufmapi.mathicloud.com/random-song');
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching song:", data.error);
            return;
        }

        // Update the song title and artist from metadata
        document.getElementById('song-title').textContent = data.metadata.title;
        document.getElementById('song-artist').textContent = data.metadata.artist;

        // Update the audio source and play the song
        const audioPlayer = document.getElementById('audio-player');
        audioPlayer.src = data.audio;
        audioPlayer.play();  // Play the song automatically

        // Set the background image and preload it
        if (data.background) {
            preloadImage(data.background, function(url) {
                document.body.style.transition = "background-image 0.3s ease-in-out";
                document.body.style.backgroundImage = `url(${url})`;
            });
        }

        // Add an event listener to load the next song when the current one ends
        audioPlayer.onended = function() {
            loadRandomSong();  // Call the function again to load the next song
        };

        // Custom seekbar and time display functionality
        const seekbar = document.getElementById('audio-seekbar');
        const currentTimeDisplay = document.getElementById('current-time');

        // Update the seekbar when the audio's current time changes
        audioPlayer.addEventListener('timeupdate', function() {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            seekbar.value = progress;

            // Format current time (mm:ss)
            const minutes = Math.floor(audioPlayer.currentTime / 60);
            const seconds = Math.floor(audioPlayer.currentTime % 60);
            currentTimeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        });

        // Sync the audio playback position with the seekbar
        seekbar.addEventListener('input', function() {
            const seekTime = (seekbar.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        });

        // Play the audio when the page loads (or based on your desired event)
        audioPlayer.play();

    } catch (error) {
        console.error("Failed to fetch song:", error);
    }
}

// Load a song when the page opens
loadRandomSong();
