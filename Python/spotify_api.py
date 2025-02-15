import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import requests
from dotenv import load_dotenv
import math
from requests.exceptions import HTTPError

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

# Remplacez par vos propres informations d'authentification
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')

print(f"CLIENT_ID: {CLIENT_ID}")
print(f"CLIENT_SECRET: {CLIENT_SECRET}")
print(f"REDIRECT_URI: {REDIRECT_URI}")

# Scopes nécessaires pour accéder aux informations de lecture
scope = 'user-read-playback-state'

# Authentification
try:
    sp_oauth = SpotifyOAuth(client_id=CLIENT_ID,
                            client_secret=CLIENT_SECRET,
                            redirect_uri=REDIRECT_URI,
                            scope=scope)
    sp = spotipy.Spotify(auth_manager=sp_oauth)
    print("Authentication successful")
except Exception as e:
    print(f"Error during authentication: {e}")
    cache_path = sp.cache_path
    if os.path.exists(cache_path):
        os.remove(cache_path)
        print(f"Deleted cache file: {cache_path}")

# Variable globale pour stocker l'URL de l'image de l'album
current_album_image_url = None

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_current_playback():
    global current_album_image_url, sp
    try:
        current_playback = sp.current_playback()
    except HTTPError as e:
        if e.response.status_code == 400:
            print("Failed to refresh access token. Re-authenticating...")
            try:
                token_info = sp.refresh_access_token(sp.cache_handler.get_cached_token()['refresh_token'])
                sp = spotipy.Spotify(auth=token_info['access_token'])
                current_playback = sp.current_playback()
            except Exception as e:
                print(f"Error during re-authentication: {e}")
                return "", "", 0, 0, 0, 0, None, False
        else:
            raise e

    if current_playback is not None and current_playback['is_playing']:
        track = current_playback.get('item')
        if track is None:
            return "", "", 0, 0, 0, 0, None, False

        artist = track['artists'][0]['name']
        track_name = track['name']
        progress_ms = current_playback['progress_ms']
        duration_ms = track['duration_ms']
        album_image_url = track['album']['images'][0]['url']  # URL de l'image de l'album

        progress_min, progress_sec = divmod(progress_ms // 1000, 60)
        duration_min, duration_sec = divmod(duration_ms // 1000, 60)

        # Vérifiez si l'URL de l'image de l'album a changé
        track_changed = album_image_url != current_album_image_url
        if track_changed:
            current_album_image_url = album_image_url
            # Téléchargez l'image de l'album en local
            response = requests.get(album_image_url)
            img_data = response.content
            local_image_path = os.path.join("temp_icons", f"spotify_album.png")
            with open(local_image_path, "wb") as img_file:
                img_file.write(img_data)
        else:
            local_image_path = os.path.join("temp_icons", f"spotify_album.png")

        return track_name, artist, progress_min, progress_sec, duration_min, duration_sec, local_image_path, track_changed
    else:
        return "", "", 0, 0, 0, 0, None, False

def getSpotifyInfo():
    track_name, artist, progress_min, progress_sec, duration_min, duration_sec, _, _ = get_current_playback()

    # Limiter la taille de l'artiste selon la largeur de l'écran
    max_width = 200  # Largeur maximale de l'écran en pixels
    max_chars = max_width // (6 * 2)  # Nombre maximal de caractères en fonction de la taille de la police

    if len(artist) > max_chars:
        artist = artist[:max_chars - 3] + '...'  # Tronquer et ajouter des points de suspension

    x_artist = math.fabs(128 - ((6 * len(artist) * 2) / 2) - 2 * 6)

    if duration_min == 0:
        progress = 0
    else:
        progress = int(150 * (progress_min * 60 + progress_sec) / (duration_min * 60 + duration_sec))
    progress = max(0, min(progress, 150))  # Clamp progress between 0 and 150

    if len(track_name) > max_chars:
        track_name = track_name[:max_chars - 3] + '...'

    x_track = math.fabs(128 - ((6 * len(track_name) * 2) / 2) - 2 * 6)

    return {
        "t": {
            "c": "FFFFFF",
            "t": [
                [
                    x_artist,
                    142,
                    2,
                    artist

                ],
                [
                    x_track,
                    165,
                    2,
                    track_name
                ],
                [
                    128 - (6 * 11 * 2) / 2 - 2 * 6,
                    205,
                    2,
                    f"{progress_min:02d}:{progress_sec:02d}/{duration_min:02d}:{duration_sec:02d}"
                ]
            ]
        },
        "v": [
            [
                f"M{45 + progress} 195 H192 Z M{45 + progress} 193 H195 Z M{45 + progress} 194 H195 Z M{45 + progress} 195 H195 Z",
                "FFFFFF"
            ],
            [
                f"M45 192 H{45 + progress} Z M45 193 H{45 + progress} Z M45 194 H{45 + progress} Z M45 195 H{45 + progress} Z",
                "329C24"
            ],
            [
                "M70 40L64 72L74 107L104 124H135L164 107L173 75L170 46L142 21H101ZM137 97L126 88H110L93 92L90 90L91 86L110 82H127L141 91V96ZM141 82L127 73H107L91 77H89L90 71L108 65H130L146 77V81ZM148 68L132 57H105L90 61H86V53L105 48H134L152 59L153 65L148 68Z",
                "329C24"
                
            ]
        ],
        "vC": bool(False)
    }

'''{
                    "path": "M160 76 H166 L169 71 L166 65 L143 52 L106 50 L83 57 L79 61 L81 68 H87 L106 62 L140 64 L160 76 M157 96 L160 92 L158 87 L138 75 L110 72 L87 79 L84 82 L85 87 H90 L110 82 L135 85 L152 95 Z M150 112 L152 110 L151 106 L134 96 L113 94 L89 99 L87 102 L88 105 L91 106 L113 101 L131 103 L146 112 Z M123 15 L158 20 L175 32 L186 49 L190 83 L186 118 L175 135 L158 146 L123 152 L88 146 L70 135 L60 118 L56 83 L60 48 L72 32 L89 20 L123 15 Z",
                    "color": {
                        "R": 50,
                        "G": 156,
                        "B": 36
                    }
                },'''

''' Spotify SVG qui marche : M63 41V92L97 127H144L180 96V44L147 17H98ZM141 98 L129 90H114L97 93 L95 87 L113 85H131L145 93ZM146 84 L132 76H112L96 77 L94 71 L112 69H134L150 78ZM153 67 L136 59H109L94 61 L90 54 L109 50H138L157 60 L153 67'''

''' Spotify SVG qui marche encore mieux : M70 40L64 72L74 107L104 124H135L164 107L173 75L170 46L142 21H101ZM137 97L126 88H110L93 92L90 90L91 86L110 82H127L141 91V96ZM141 82L127 73H107L91 77H89L90 71L108 65H130L146 77V81ZM148 68L132 57H105L90 61H86V53L105 48H134L152 59L153 65L148 68'''