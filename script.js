function preloadImage(url, callback, retryCount = 3) {
    const img = new Image();
    img.src = url;

    // Onload callback
    img.onload = function() {
        callback(url);
    };

    // Onerror callback with retry mechanism
    img.onerror = function() {
        console.error("Failed to load image:", url);
        if (retryCount > 0) {
            console.log(`Retrying... Attempts left: ${retryCount}`);
            setTimeout(() => preloadImage(url, callback, retryCount - 1), 2000); // Retry after 2 seconds
        } else {
            console.error("Failed to load image after multiple attempts.");
            // Optionally, set a fallback image or handle error
            document.body.style.backgroundImage = "url('path/to/fallback-image.jpg')";
        }
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

        // Set a placeholder background initially
        document.body.style.backgroundImage = "url('path/to/loading-placeholder.jpg')";

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

    } catch (error) {
        console.error("Failed to fetch song:", error);
    }
}

// Load a song when the page opens
loadRandomSong();
