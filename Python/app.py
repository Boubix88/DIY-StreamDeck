import customtkinter
from customtkinter import CTkSlider
from tkinter import colorchooser, Canvas, PhotoImage
import StreamDeck as sd
import threading
from time import sleep
import fileManger as file

# Initialisation des variables globales pour les valeurs RVB et la luminosité
brightness = 100  # Luminosité initiale

# On charge le json
colorData = file.load_json("data.json")
rgb_values = [colorData["R"], colorData["G"], colorData["B"]] # Valeurs RVB initiales (bleu par défaut)

# Fonction pour convertir les valeurs RVB en format hexadécimal
def rgb_to_hex(r, g, b):
    """Convertit les valeurs RVB en format hexadécimal."""
    return "#{:02x}{:02x}{:02x}".format(r, g, b)

# Mise à jour de la couleur d'aperçu en fonction des valeurs RVB
def update_color_preview():
    hex_color = "#{:02x}{:02x}{:02x}".format(*rgb_values)
    preview_canvas.itemconfig(preview_square, fill=hex_color)
    preview_canvas.config(bg=hex_color)
    print("Couleur:", hex_color)

    # On applique la couleur à l'Arduino
    apply_changes()


# Mise à jour de la valeur RVB en fonction des sliders
def update_rgb(component, value, var):
    global rgb_values
    rgb_values[component] = int(value)
    update_color_preview()
    var.set(int(value))  # Met à jour la valeur de l'étiquette avec la valeur actuelle

# Mise à jour de la luminosité
def set_brightness(value, var):
    global brightness
    brightness = int(value)
    var.set(int(value))  # Met à jour la valeur de l'étiquette avec la valeur actuelle

    # On applique la couleur à l'Arduino
    apply_changes()

# Envoi des valeurs RVB et de luminosité à l'Arduino
def apply_changes():
    global ser, rgb_values, brightness, colorData
    colorData = {"Mode" : 1, "R": int(rgb_values[0] * (brightness / 100)), "G": int(rgb_values[1] * (brightness / 100)), "B": int(rgb_values[2] * (brightness / 100))}
    file.save_json(colorData, "data.json")

# Mise à jour de la vitesse de défilement RGB
def update_static_speed(value):
    global colorData, rgb_values, brightness
    # on met à jour la valeur de la variable
    static_speed_var.set(int(value))
    colorData = {"Mode" : 2, "R": int(rgb_values[0] * (brightness / 100)), "G": int(rgb_values[1] * (brightness / 100)), "B": int(rgb_values[2] * (brightness / 100)), "Speed": int(value)}
    file.save_json(colorData, "data.json")

# Mise à jour de la vitesse de défilement RGB
def update_scroll_speed(value):
    global colorData, rgb_values, brightness
    # on met à jour la valeur de la variable
    scroll_speed_var.set(int(value))
    colorData = {"Mode" : 3, "R": int(rgb_values[0] * (brightness / 100)), "G": int(rgb_values[1] * (brightness / 100)), "B": int(rgb_values[2] * (brightness / 100)), "Speed": int(value)}
    file.save_json(colorData, "data.json")

def on_close():
    # Ajoutez ici le code que vous souhaitez exécuter avant la fermeture de l'application
    print("L'application se ferme.")

    try:
        sd.closeConnection()
        pass
    except OSError:
        print("Erreur lors de la fermeture de la caonnexion.")
        pass

    # Fermez la fenêtre principale
    app.destroy()


# ========================================= Création de l'interface graphique ========================================= #
# Création de la fenêtre principale
app = customtkinter.CTk()
app.title('DIY StreamDeck')
app.geometry("854x480")

# Associez la fonction on_close à l'événement de fermeture de la fenêtre
app.protocol("WM_DELETE_WINDOW", on_close)


# Création de l'écran d'accueil avec le TabView sur la gauche
tab_view = customtkinter.CTkTabview(app, width=400, height=310)
tab_view.place(x=20, y=0)

# Onglet "Defilement RGB"
scrolling_rgb_tab = tab_view.add("Defilement RGB")
scroll_speed_label = customtkinter.CTkLabel(scrolling_rgb_tab, text="Vitesse")  # Label pour la vitesse de défilement
scroll_speed_label.grid(row=4, column=0, padx=10, pady=5)

scroll_speed_slider = CTkSlider(scrolling_rgb_tab, from_=0, to=100, number_of_steps=5, command=update_scroll_speed)
scroll_speed_slider.set(50)  # Valeur par défaut
scroll_speed_slider.grid(row=4, column=1, columnspan=2, padx=10, pady=5)

scroll_speed_var = customtkinter.IntVar()  # Variable pour la valeur du slider de luminosité
scroll_speed_var.set(20)  # Initialisation à 0
scroll_speed_value_label = customtkinter.CTkLabel(scrolling_rgb_tab, textvariable=scroll_speed_var)  # Étiquette pour la valeur du defilement RGB
scroll_speed_value_label.grid(row=4, column=3, padx=5, pady=5)

# Onglet "RGB statique"
static_rgb_tab = tab_view.add("RGB statique")
static_speed_label = customtkinter.CTkLabel(static_rgb_tab, text="Vitesse")  # Label pour la vitessse de défilement
static_speed_label.grid(row=4, column=0, padx=10, pady=5)

static_speed_slider = CTkSlider(static_rgb_tab, from_=0, to=100, number_of_steps=5, command=update_static_speed)
static_speed_slider.set(30)  # Valeur par défaut
static_speed_slider.grid(row=4, column=1, columnspan=2, padx=10, pady=5)

static_speed_var = customtkinter.IntVar()  # Variable pour la valeur du slider de luminosité
static_speed_var.set(20)  # Initialisation à 0
static_speed_value_label = customtkinter.CTkLabel(static_rgb_tab, textvariable=static_speed_var)  # Étiquette pour la valeur du defilement RGB
static_speed_value_label.grid(row=4, column=3, padx=5, pady=5)

# Onglet "Couleur fixe"
fixed_color_tab = tab_view.add("Couleur fixe")

# Création d'un canvas pour l'aperçu de couleur
preview_canvas = Canvas(fixed_color_tab, width=100, height=30)
preview_canvas.grid(row=0, column=0, columnspan=4, padx=10, pady=10)

# Carré pour l'aperçu de couleur
preview_square = preview_canvas.create_rectangle(0, 0, 100, 50, fill=rgb_to_hex(*rgb_values))

# Création des sliders RVB et de luminosité avec les étiquettes pour les valeurs
rgb_sliders = []
slider_labels = []  # Stocke les étiquettes pour les valeurs des sliders
slider_vars = []  # Stocke les variables pour les valeurs des sliders
for i, color in enumerate(["Rouge", "Vert", "Bleu"]):
    label = customtkinter.CTkLabel(fixed_color_tab, text=color)
    label.grid(row=i+1, column=0, padx=10, pady=5)

    var = customtkinter.IntVar()  # Variable pour la valeur du slider
    var.set(255)  # Initialisation à 255
    slider = CTkSlider(fixed_color_tab, from_=0, to=255, number_of_steps=255, command=lambda value, var=var, i=i: update_rgb(i, value, var))
    slider.set(rgb_values[i])  # Initialisation à 255
    slider.grid(row=i+1, column=1, columnspan=2, padx=10, pady=5)
    rgb_sliders.append(slider)

    value_label = customtkinter.CTkLabel(fixed_color_tab, textvariable=var)  # Étiquette pour la valeur du slider
    value_label.grid(row=i+1, column=3, padx=5, pady=5)
    slider_labels.append(value_label)  # Ajoute l'étiquette à la liste
    slider_vars.append(var)  # Ajoute la variable à la liste

# Slider luminosité
brightness_label = customtkinter.CTkLabel(fixed_color_tab, text="Luminosité")  # Label pour la luminosité
brightness_label.grid(row=4, column=0, padx=10, pady=5)

brightness_var = customtkinter.IntVar()  # Variable pour la valeur du slider de luminosité
brightness_var.set(100)  # Initialisation à 0
brightness_slider = CTkSlider(fixed_color_tab, from_=0, to=100, number_of_steps=100, command=lambda value, var=brightness_var: set_brightness(value, var))
brightness_slider.set(100)  # Initialisation à 0
brightness_slider.grid(row=4, column=1, columnspan=2, padx=10, pady=5)

brightness_value_label = customtkinter.CTkLabel(fixed_color_tab, textvariable=brightness_var)  # Étiquette pour la valeur du slider de luminosité
brightness_value_label.grid(row=4, column=3, padx=5, pady=5)
slider_labels.append(brightness_value_label)  # Ajoute l'étiquette à la liste
slider_vars.append(brightness_var)  # Ajoute la variable à la liste


# ========================================= Ajout de la température CPU et GPU ========================================= #
# Create a frame  
temp_frame = customtkinter.CTkFrame(master=app, width=400, height=220)  
temp_frame.place(x=20, y=330)  

# Ajout de l'icône CPU
cpu_icon = PhotoImage(file="assets/icon_cpu_py.png")
cpu_icon = cpu_icon.subsample(3)
cpu_icon_label = customtkinter.CTkLabel(temp_frame, image=cpu_icon)
# On cache le texte du label
cpu_icon_label.configure(text="")
cpu_icon_label.grid(row=0, column=0, padx=10, pady=5)

# Ajout de l'étiquette pour afficher la température CPU
cpu_temp_label = customtkinter.CTkLabel(temp_frame, text="", font=("Arial", 20))
cpu_temp_label.grid(row=1, column=0, padx=10, pady=5)

# Ajout de l'icône carte graphique
gpu_icon = PhotoImage(file="assets/icon_gpu_py.png")
gpu_icon = gpu_icon.subsample(3)
gpu_icon_label = customtkinter.CTkLabel(temp_frame, image=gpu_icon)
# On cache le texte du label
gpu_icon_label.configure(text="")
gpu_icon_label.grid(row=0, column=1, padx=10, pady=5)

# Ajout de l'étiquette pour afficher la température GPU
gpu_temp_label = customtkinter.CTkLabel(temp_frame, text="", font=("Arial", 20))
gpu_temp_label.grid(row=1, column=1, padx=10, pady=5)




# ========================================= Envoi des données ========================================= #
# Fonction pour gérer l'envoi des données à l'Arduino
def send_data():
    global ser
    global colorData

    while True:
        temp = sd.getTemp(cpu_temp_label, gpu_temp_label)
        vol = sd.getVolume()
        sd.readSerial()
        sd.sendToArduino(temp, vol, colorData) # On envoie les données à l'Arduino

        # Ajoutez un délai entre chaque envoi si nécessaire
        # time.sleep(1)
        #sleep(0.5)



# ========================================= Programme principal ========================================= #
# Main du programme
def main():
    global old_volume
    global ser
    global colorData

    try:
        sd.connectToArduino()
        pass
    except OSError:
        print("Erreur lors de la connexion à l'Arduino.")
        pass


    # Créez un thread pour envoyer les données à l'Arduino
    send_data_thread = threading.Thread(target=send_data)
    send_data_thread.daemon = True  # Permet à ce thread de se terminer lorsque le programme principal se termine
    send_data_thread.start()  # Démarre le thread pour l'envoi continu des données

    app.mainloop()  # Lance l'interface graphique



if __name__ == "__main__":
    main()