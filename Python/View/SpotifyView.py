import customtkinter
from PIL import Image
import time
import requests
import spotify_api as spotify

track_label, artist_label, progress_label, progress_bar, album_label = None, None, None, None, None

def create_spotify_view(app):
    global track_label, artist_label, progress_label, progress_bar, album_label

    # Créez une tab view
    spotify_frame = customtkinter.CTkFrame(app, width=300, height=150)
    spotify_frame.place(x=240, y=300)

    # Add the label for the title
    spotify_label = customtkinter.CTkLabel(spotify_frame, text="Spotify", font=("Arial", 16))
    spotify_label.grid(row=0, column=0, columnspan=2, pady=5)

    # Créez les labels pour afficher les informations Spotify
    album_label = customtkinter.CTkLabel(spotify_frame, text="")
    album_label.grid(row=1, column=0, rowspan=3, padx=0, pady=0)

    track_label = customtkinter.CTkLabel(spotify_frame, text="Track: ", wraplength=200)
    track_label.grid(row=1, column=1, sticky="w")

    artist_label = customtkinter.CTkLabel(spotify_frame, text="Artist: ")
    artist_label.grid(row=2, column=1, sticky="w")

    progress_label = customtkinter.CTkLabel(spotify_frame, text="Progress: ")
    progress_label.grid(row=3, column=1, sticky="w")

    # Créez une barre de progression
    progress_bar = customtkinter.CTkProgressBar(spotify_frame, width=300)
    progress_bar.grid(row=4, column=0, columnspan=2, padx=10, pady=10)
    progress_bar.set(0)  # Exemple de valeur de progression


# Fonction pour mettre à jour les informations Spotify
def update_spotify_info():
    global track_label, artist_label, progress_label, progress_bar, album_label
    
    while True:
        track_name, artist, progress_min, progress_sec, duration_min, duration_sec, album_image_url, _ = spotify.get_current_playback()
        
        if track_name and artist:
            # Mettez à jour les labels ou autres widgets avec les informations de la piste
            track_label.configure(text=f"{track_name}", font=("Helvetica", 16, "bold"))
            artist_label.configure(text=f"{artist}", font=("Helvetica", 12))

            progress_label.configure(text=f"{progress_min}:{progress_sec:02d} / {duration_min}:{duration_sec:02d}")

            # Calculez le pourcentage de progression
            total_progress_seconds = progress_min * 60 + progress_sec
            total_duration_seconds = duration_min * 60 + duration_sec
            progress_percentage = total_progress_seconds / total_duration_seconds

            # Mettez à jour la barre de progression
            progress_bar.set(progress_percentage)

            # Téléchargez et affichez l'image de l'album
            album_image = Image.open(album_image_url)
            album_photo = customtkinter.CTkImage(album_image, size=(80, 80))
            album_label.configure(image=album_photo)
            album_label.image = album_photo  # Gardez une référence à l'image pour éviter qu'elle soit garbage collected
        else:
            track_label.configure(text="Track: N/A")
            artist_label.configure(text="Artist: N/A")
            progress_label.configure(text="Progress: N/A")
        time.sleep(0.5)