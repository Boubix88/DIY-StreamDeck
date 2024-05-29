from io import BytesIO
import customtkinter
from customtkinter import CTkSlider
from tkinter import colorchooser, Canvas, PhotoImage, Menu, filedialog
from PIL import Image, ImageTk
import StreamDeck as sd
import threading
from time import sleep
import fileManger as file
import System
import subprocess
import os


# Initialisation des variables globales pour les valeurs RVB et la luminosité depuis le JSON
colorData = file.load_json("data.json")
rgb_values = [colorData["R"], colorData["G"], colorData["B"]] # Valeurs RVB initiales (bleu par défaut)
brightness = colorData["Brightness"]  # Luminosité initiale
color_speed = colorData["Speed"]  # Vitesse de défilement RGB initiale

# Fonction pour convertir les valeurs RVB en format hexadécimal
def rgb_to_hex(r, g, b):
    """Convertit les valeurs RVB en format hexadécimal."""
    return "#{:02x}{:02x}{:02x}".format(r, g, b)

# Mise à jour de la couleur d'aperçu en fonction des valeurs RVB
def update_color_preview():
    hex_color = "#{:02x}{:02x}{:02x}".format(*rgb_values)
    preview_canvas.itemconfig(preview_square, fill=hex_color)
    preview_canvas.config(bg=hex_color)
    #print("Couleur:", hex_color)

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
    colorData = {"Mode" : 1, "R": int(rgb_values[0]), "G": int(rgb_values[1]), "B": int(rgb_values[2]),"Brightness": brightness, "Speed": 20}
    file.save_json(colorData, "data.json")

# Mise à jour de la vitesse de défilement RGB
def update_static_speed(value):
    global colorData, rgb_values, brightness
    # on met à jour la valeur de la variable
    static_speed_var.set(int(value))
    colorData = {"Mode" : 2, "R": int(rgb_values[0]), "G": int(rgb_values[1]), "B": int(rgb_values[2]), "Brightness": brightness, "Speed": int(value)}
    file.save_json(colorData, "data.json")

# Mise à jour de la vitesse de défilement RGB
def update_scroll_speed(value):
    global colorData, rgb_values, brightness
    # on met à jour la valeur de la variable
    scroll_speed_var.set(int(value))
    colorData = {"Mode" : 3, "R": int(rgb_values[0]), "G": int(rgb_values[1]), "B": int(rgb_values[2]), "Brightness": brightness, "Speed": int(value)}
    file.save_json(colorData, "data.json")

def on_close():
    # Ajoutez ici le code que vous souhaitez exécuter avant la fermeture de l'application
    print("L'application se ferme.")

    try:
        sd.closeConnection()
        pass
    except (OSError, System.NullReferenceException, System.AccessViolationException):  # Fix: Replace "NullReferenceError" with "ReferenceError"
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

scroll_speed_slider = CTkSlider(scrolling_rgb_tab, from_=1, to=100, number_of_steps=20, command=update_scroll_speed)
scroll_speed_slider.set(color_speed)  # Valeur par défaut
scroll_speed_slider.grid(row=4, column=1, columnspan=2, padx=10, pady=5)

scroll_speed_var = customtkinter.IntVar()  # Variable pour la valeur du slider de luminosité
scroll_speed_var.set(color_speed)  # Initialisation à 0
scroll_speed_value_label = customtkinter.CTkLabel(scrolling_rgb_tab, textvariable=scroll_speed_var)  # Étiquette pour la valeur du defilement RGB
scroll_speed_value_label.grid(row=4, column=3, padx=5, pady=5)

# Onglet "RGB statique"
static_rgb_tab = tab_view.add("RGB statique")
static_speed_label = customtkinter.CTkLabel(static_rgb_tab, text="Vitesse")  # Label pour la vitessse de défilement
static_speed_label.grid(row=4, column=0, padx=10, pady=5)

static_speed_slider = CTkSlider(static_rgb_tab, from_=1, to=100, number_of_steps=20, command=update_static_speed)
static_speed_slider.set(color_speed)  # Valeur par défaut
static_speed_slider.grid(row=4, column=1, columnspan=2, padx=10, pady=5)

static_speed_var = customtkinter.IntVar()  # Variable pour la valeur du slider de luminosité
static_speed_var.set(color_speed)  # Initialisation à 0
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
brightness_var.set(brightness)  # Initialisation à 0
brightness_slider = CTkSlider(fixed_color_tab, from_=0, to=100, number_of_steps=100, command=lambda value, var=brightness_var: set_brightness(value, var))
brightness_slider.set(brightness)  # Initialisation à 0
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



# ========================================= Ajout des touches ========================================= #
# Load the software assignments from the JSON file
assignments = file.load_json_assignement("assignments.json")

# Fonction pour combiner une image de fond avec une image superposée
def combine_images(background_path, overlay_path, overlay_size=(32, 32)):
    background = Image.open(background_path)
    overlay = Image.open(overlay_path)

    background = background.convert("RGBA")
    overlay = overlay.convert("RGBA")

    # Resize the overlay image
    overlay = overlay.resize(overlay_size)

    # Calculate the position to center the overlay on the background
    bg_width, bg_height = background.size
    ov_width, ov_height = overlay_size
    position = ((bg_width - ov_width) // 2, (bg_height - ov_height) // 2)

    # Paste the overlay onto the background
    background.paste(overlay, position, overlay)

     # Save the combined image to a BytesIO object
    image_data = BytesIO()
    background.save(image_data, format='PNG')
    
    # Create a PhotoImage from the BytesIO object
    combined_photo_image = PhotoImage(data=image_data.getvalue())

    return combined_photo_image

# Fonction qui extrait l'icône d'un fichier .exe
def extract_icon_from_exe(icon_in_path, icon_name, icon_out_path, out_width = 56, out_height = 56):
    import win32ui
    import win32gui
    import win32con
    import win32api
    from PIL import Image

    print("Extracting icon from exe: ", icon_in_path)

    ico_x = win32api.GetSystemMetrics(win32con.SM_CXICON)
    ico_y = win32api.GetSystemMetrics(win32con.SM_CYICON)

    large, small = win32gui.ExtractIconEx(icon_in_path,0)
    win32gui.DestroyIcon(small[0])

    hdc = win32ui.CreateDCFromHandle( win32gui.GetDC(0) )
    hbmp = win32ui.CreateBitmap()
    hbmp.CreateCompatibleBitmap( hdc, ico_x, ico_x )
    hdc = hdc.CreateCompatibleDC()

    hdc.SelectObject( hbmp )
    hdc.DrawIcon( (0,0), large[0] )

    bmpstr = hbmp.GetBitmapBits(True)
    icon = Image.frombuffer(
        'RGBA',
        (32,32),
        bmpstr, 'raw', 'BGRA', 0, 1
    )

    full_outpath = os.path.join(icon_out_path, "{}.png".format(icon_name))
    icon.resize((out_width, out_height))
    icon.save(full_outpath)
    #return the final path to the image
    return full_outpath

def create_functions(label, menu, i, j):
    # Create a function to show a shadow when the mouse is over the label
    def enter(event):
        if (f"{i},{j}" in assignments):
            combined_image = combine_images("assets/keyboard_key_1.png", f"temp_icons/temp{i},{j}.png")
            # Add the combined image to the dictionary
            combined_images_shadow[f"{i},{j}"] = combined_image
            # Set the label's image to the combined image
            label.configure(image=combined_image)
            label.image = combined_image
        else:
            label.configure(image=PhotoImage(file="assets/keyboard_key_1.png"))

    # Create a function to hide the shadow when the mouse leaves the label
    def leave(event):
        if (f"{i},{j}" in assignments):
            combined_image = combine_images("assets/keyboard_key_1_old.png", f"temp_icons/temp{i},{j}.png")
            # Add the combined image to the dictionary
            combined_images[f"{i},{j}"] = combined_image
            # Set the label's image to the combined image
            label.configure(image=combined_image)
            label.image = combined_image
        else:
            label.configure(image=PhotoImage(file="assets/keyboard_key_1_old.png"))

    # Create a function to show the menu when the label is clicked
    def click(event):
        # On affiche la touche enfoncee
        if (f"{i},{j}" in assignments):
            combined_image = combine_images("assets/keyboard_key_shadow_1.png", f"temp_icons/temp{i},{j}.png", overlay_size=(27, 27))
            # Add the combined image to the dictionary
            combined_images_shadow[f"{i},{j}"] = combined_image
            # Set the label's image to the combined image
            label.configure(image=combined_image)
            label.image = combined_image
        else:
            label.configure(image=PhotoImage(file="assets/keyboard_key_shadow_1.png"))

        menu.post(event.x_root, event.y_root)

    # Create a function to assign a software to the label
    def assign_software(i = i, j = j):
        # Open a file dialog to choose a .exe file
        filepath = filedialog.askopenfilename(filetypes=[("Executable files", "*.exe")])
        if filepath:
            # Save the filepath in the label
            label.filepath = filepath
            # Save the filepath in the assignments
            assignments[f"{i},{j}"] = filepath
            # Save the assignments in the JSON file
            file.save_json(assignments, "assignments.json")
            # Extract the icon from the .exe file
            extract_icon_from_exe(filepath, f"temp{i},{j}", "temp_icons")
            # Combine the keyboard key image and the software icon
            combined_image = combine_images("assets/keyboard_key_1.png", f"temp{i},{j}.png")
            # Add the combined image to the dictionary
            combined_images[f"{i},{j}"] = combined_image
            # Set the label's image to the combined image
            label.configure(image=combined_image)
            label.image = combined_image

    # Create a function to launch the software assigned to the label
    def launch_software(i = i, j = j):
        if hasattr(label, "filepath"):
            # Launch the software
            subprocess.Popen(label.filepath)

    # Create a function to delete the software assigned to the label
    def delete():
        try:
            # Remove the filepath from the label
            del label.filepath
            # Remove the filepath from the assignments
            del assignments[f"{i},{j}"]
            # Save the assignments in the JSON file
            file.save_json(assignments, "assignments.json")
            # Set the label's image to the keyboard key image
            label.configure(image=keyboard_key_image)
            label.image = keyboard_key_image
        except AttributeError:
            pass

    # Add the functions to the menu
    menu.add_command(label="Lancer ...", command=launch_software)
    menu.add_command(label="Assigner un logiciel à lancer ...", command=assign_software)
    menu.add_command(label="Supprimer l'assignation", command=delete)

    return enter, leave, click

# Create a tab view
tab_view = customtkinter.CTkTabview(master=app, width=300, height=250)
tab_view.place(x=460, y=0)

# Add the frame to the tab view as a new tab
tab_keys = tab_view.add("Assignations des touches")

# Load the images
keyboard_key_image = PhotoImage(file="assets/keyboard_key.png")
keyboard_key_image = keyboard_key_image.subsample(2)
keyboard_key_image_shadow = PhotoImage(file="assets/keyboard_key_shadow.png")
keyboard_key_image_shadow = keyboard_key_image_shadow.subsample(2)

# Create a dictionary to store the combined images
combined_images = {}
combined_images_shadow = {}

# Create a 4x3 grid of labels with the same image
for i in range(3):  # For each row
    for j in range(4):  # For each column
        # Create a label with the image
        label = customtkinter.CTkLabel(tab_keys, image=keyboard_key_image)
        # Hide the label text
        label.configure(text="")

        # Create a menu
        menu = Menu(label, tearoff=0)

        # Create the functions
        enter, leave, click = create_functions(label, menu, i, j)

        # Bind the functions to the events
        label.bind("<Enter>", enter)
        label.bind("<Leave>", leave)
        label.bind("<Button-1>", click)

        # Assign the software from the assignments
        key = f"{i},{j}"
        if key in assignments:
            label.filepath = assignments[key]
            icon_path = extract_icon_from_exe(label.filepath, f"temp{key}", "temp_icons")

            # Combine the keyboard key image and the software icon
            combined_image = combine_images("assets/keyboard_key_1_old.png", icon_path)

            # Add the combined image to the dictionary
            combined_images[key] = combined_image
            
            # Set the label's image to the combined image
            label.configure(image=combined_image)
            label.image = combined_image  # Keep a reference to the image object

        # Place the label in the grid
        label.grid(row=i, column=j, padx=10, pady=5)



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
    except (OSError):
        print("Erreur lors de la connexion à l'Arduino.")
        pass

    sd.start_temp_thread()  # Démarre le thread pour la lecture de la température

    # Créez un thread pour envoyer les données à l'Arduino
    send_data_thread = threading.Thread(target=send_data)
    send_data_thread.daemon = True  # Permet à ce thread de se terminer lorsque le programme principal se termine
    send_data_thread.start()  # Démarre le thread pour l'envoi continu des données

    app.mainloop()  # Lance l'interface graphique



if __name__ == "__main__":
    main()