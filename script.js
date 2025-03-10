function preloadImage(url) {
    const img = new Image();
    img.src = url;
}

async function loadRandomSong() {
    try {
        const response = await fetch('https://mathicloud.com/random-song');
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching song:", data.error);
            return;
        }

        // Update the song title and artist
        document.getElementById('song-title').textContent = data.title;
        document.getElementById('song-artist').textContent = data.artist;

        // Update the audio source and play the song
        const audioPlayer = document.getElementById('audio-player');
        audioPlayer.src = data.audio;
        audioPlayer.play();  // Play the song automatically

        // Set the background image and preload it
        if (data.background) {
            document.body.style.backgroundImage = `url(${data.background})`;
            preloadImage(data.background, function(url) {
                document.body.style.transition = "background-image 1s ease-in-out";
                document.body.style.backgroundImage = `url(${url})`;
            });
        }

        // Add an event listener to load the next song when the current one ends
        audioPlayer.onended = function() {
            loadRandomSong();  // Call the function again to load the next song
        };

    } catch (error) {
        console.error("Failed to fetch song:", error);
    }
}

// Load a song when the page opens
loadRandomSong();
