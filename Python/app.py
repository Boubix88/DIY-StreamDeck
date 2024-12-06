import StreamDeck as sd
import customtkinter
import threading
from time import sleep
from spotify_api import getSpotifyInfo  # Remplacez par le nom de votre fonction
import time
import network as net
import types
import View.CpuView as CpuView
import View.GpuView as GpuView
import View.SpotifyView as SpotifyView
import View.RgbView as RgbView
import View.KeysView as KeysView
import View.DisplayView as DisplayView

last_screen = 0
old_volume = 0
timer_volume_screen = 0.0
start_timer_volume_screen = 0.0
changed_volume = False

# On définit les constantes pour les ecrans
const_screen = types.SimpleNamespace()
const_screen.CPU_INFO = 0
const_screen.GPU_INFO = 1
const_screen.SPOTIFY_INFO = 2
const_screen.NETWORK_INFO = 3
const_screen.VOLUME_INFO = 4


def on_close():
    # Ajoutez ici le code que vous souhaitez exécuter avant la fermeture de l'application
    print("L'application se ferme.")

    try:
        sd.closeConnection()
        pass
    except (OSError, System.NullReferenceException, System.AccessViolationException):  # Fix: Replace "NullReferenceError" with "ReferenceError"
        print("Erreur lors de la fermeture de la connexion.")
        pass

    # Fermez la fenêtre principale
    app.destroy()


# =============================== Création de l'interface graphique ================================ #
# Création de la fenêtre principale
app = customtkinter.CTk()
app.title('DIY StreamDeck')
app.geometry("1000x450")
app.iconbitmap("assets/icon.ico")
app.protocol("WM_DELETE_WINDOW", on_close)


# ========================================= Ajout du RGB ============================================ #
RgbView.create_rgb_view(app)


# ================================= Ajout de la température CPU ===================================== #
cpu_temp_label, cpu_usage_label, cpu_frequency_label, cpu_process_count_label = CpuView.create_cpu_view(app)


# ================================= Ajout de la température CPU ===================================== #
gpu_temp_label, gpu_usage_label, gpu_frequency_label, gpu_memory_label = GpuView.create_gpu_view(app)


# ======================================= Ajout des touches ========================================= #
KeysView.create_keys_view(app)


# =================================== Afficher les infos Spotify ==================================== #
SpotifyView.create_spotify_view(app)


# ===================================== Affichage de l'écran ======================================== #
DisplayView.create_display_view(app)


# ======================================= Envoi des données ========================================= #
# Fonction pour gérer l'envoi des données à l'Arduino
def send_data():
    global last_screen, old_volume, timer_volume_screen, start_timer_volume_screen, changed_volume

    while True:
        try:
            # Check if the play/pause button was pressed
            if sd.isPlayPausePressed():
                clear = True
            else:
                clear = False
            
            vol = sd.get_system_volume()
            sd.readSerial()

            colorData = RgbView.get_color_data()

            # Get all screen
            screen = DisplayView.getCurrentScreen()
            cpu_info = sd.getCPUInfo(cpu_temp_label, cpu_usage_label, cpu_frequency_label, cpu_process_count_label)
            gpu_info = sd.getGPUInfo(gpu_temp_label, gpu_usage_label, gpu_frequency_label, gpu_memory_label)
            spotify_info = getSpotifyInfo()
            network_info = net.getNetworkInfo()
            volume_info = sd.generate_volume_path(vol)

            clear = last_screen != screen and not changed_volume
                
            screen_data = None
            match screen:
                case const_screen.CPU_INFO:
                    screen_data = cpu_info
                    last_screen = screen
                    pass
                case const_screen.GPU_INFO:
                    screen_data = gpu_info
                    last_screen = screen
                    pass
                case const_screen.SPOTIFY_INFO:
                    screen_data = spotify_info
                    last_screen = screen
                    pass
                case const_screen.NETWORK_INFO:
                    screen_data = network_info
                    last_screen = screen
                    pass
                case const_screen.VOLUME_INFO:
                    screen_data = volume_info
                    if not changed_volume:
                        last_screen = screen
                    pass
                case _:
                    screen_data = None
                    pass

            actual_time = time.time()

            # Check if the volume has changed
            if vol != old_volume and screen != const_screen.VOLUME_INFO:
                screen = const_screen.VOLUME_INFO  # Set screen to volume screen
                start_timer_volume_screen = actual_time
                timer_volume_screen = actual_time - start_timer_volume_screen
                changed_volume = True
                clear = True
            elif changed_volume and timer_volume_screen < 3.0:
                if screen != const_screen.VOLUME_INFO:
                    timer_volume_screen = 0.0
                    start_timer_volume_screen = 0.0
                    screen = last_screen
                    changed_volume = False
                    clear = True
                else :
                    screen = const_screen.VOLUME_INFO  # Set screen to volume screen
                    timer_volume_screen = actual_time - start_timer_volume_screen

            old_volume = vol

            # Check if the volume screen has been displayed for more than 3 seconds and reset the screen
            if timer_volume_screen > 3.0:
                timer_volume_screen = 0.0
                start_timer_volume_screen = 0.0
                screen = last_screen
                changed_volume = False
                clear = True

            # Mettez à jour l'affichage avec les données JSON
            DisplayView.update_display(screen_data)

            # On envoie les données à l'Arduino
            sd.sendToArduino(screen_data, vol, colorData, clear) 
        except (OSError):
            print("Erreur lors de la connexion à l'Arduino.")
            #messagebox.showinfo("Erreur", "En attente de connexion ...")
            #show_toast("En attente de connexion ...")x
            try:
                sd.connectToArduino()
                pass
            except (OSError):
                print("Erreur lors de la connexion à l'Arduino.")
                pass

        # Ajoutez un délai entre chaque envoi si nécessaire
        # time.sleep(1)
        #sleep(0.5)



# ========================================= Programme principal ========================================= #
# Main du programme
def main():
    global old_volume

    try:
        sd.setTkinter(app)
        sd.connectToArduino()
        pass
    except (OSError):
        print("Erreur lors de la connexion à l'Arduino.")
        pass

    sd.start_cpu_thread()  # Démarre le thread pour la lecture des infos CPU
    sd.start_gpu_thread()  # Démarre le thread pour la lecture des infos GPU
    net.start_network_thread() # Démarre le thread pour la lecture des infos réseau
    old_volume = sd.get_system_volume()  # Get the system volume

    # Créez un thread pour envoyer les données à l'Arduino
    send_data_thread = threading.Thread(target=send_data)
    send_data_thread.daemon = True  # Permet à ce thread de se terminer lorsque le programme principal se termine
    send_data_thread.start()  # Démarre le thread pour l'envoi continu des données
    

    # Créer un thread pour affiche les données Spotify
    display_spotify_data = threading.Thread(target=SpotifyView.update_spotify_info)
    display_spotify_data.daemon = True
    display_spotify_data.start()

    app.mainloop()  # Lance l'interface graphique



if __name__ == "__main__":
    main()