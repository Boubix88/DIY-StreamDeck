import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

# Remplacez par vos propres informations d'authentification
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')

# Scopes nécessaires pour accéder aux informations de lecture
scope = 'user-read-playback-state'

# Authentification
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=CLIENT_ID,
                                               client_secret=CLIENT_SECRET,
                                               redirect_uri=REDIRECT_URI,
                                               scope=scope))

# Variable globale pour stocker l'URL de l'image de l'album
current_album_image_url = None

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_current_playback():
    global current_album_image_url
    current_playback = sp.current_playback()

    if current_playback is not None and current_playback['is_playing']:
        track = current_playback['item']
        artist = track['artists'][0]['name']
        track_name = track['name']
        progress_ms = current_playback['progress_ms']
        duration_ms = track['duration_ms']
        album_image_url = track['album']['images'][0]['url']  # URL de l'image de l'album

        progress_min, progress_sec = divmod(progress_ms // 1000, 60)
        duration_min, duration_sec = divmod(duration_ms // 1000, 60)

        # Vérifiez si l'URL de l'image de l'album a changé
        if album_image_url != current_album_image_url:
            current_album_image_url = album_image_url
            # Téléchargez l'image de l'album en local
            response = requests.get(album_image_url)
            img_data = response.content
            local_image_path = os.path.join("temp_icons", f"spotify_album.png")
            with open(local_image_path, "wb") as img_file:
                img_file.write(img_data)
        else:
            local_image_path = os.path.join("temp_icons", f"spotify_album.png")

        return track_name, artist, progress_min, progress_sec, duration_min, duration_sec, local_image_path
    else:
        return None, None, None, None, None, None, None

'''while True:
    clear_console()
    get_current_playback()
    time.sleep(1)  # Mettre à jour toutes les secondes'''