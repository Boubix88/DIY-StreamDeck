import customtkinter
from tkinter import Canvas
from customtkinter import CTkSlider
import fileManger as file

# Variables globales pour les valeurs RVB et la luminosité
preview_canvas, preview_square, static_speed_var, scroll_speed_var, colorData, rgb_values, brightness, color_speed = None, None, None, None, None, None, None, None

def create_rgb_view(app):
    global preview_canvas, preview_square, static_speed_var, scroll_speed_var, rgb_values, brightness, color_speed, colorData
    # Initialisation des variables globales pour les valeurs RVB et la luminosité depuis le JSON
    colorData = file.load_json("data.json")
    rgb_values = [int(colorData[1]), int(colorData[2]), int(colorData[3])] # Valeurs RVB initiales (bleu par défaut)
    brightness = colorData[4]  # Luminosité initiale
    color_speed = colorData[5]  # Vitesse de défilement RGB initiale

    # Création de l'écran d'accueil avec le TabView sur la gauche
    tab_view = customtkinter.CTkTabview(app, width=400, height=250)
    tab_view.place(x=460, y=300)

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


# Fonction qui renvoi colorData
def get_color_data():
    global colorData
    return colorData


# Fonction pour convertir les valeurs RVB en format hexadécimal
def rgb_to_hex(r, g, b):
    """Convertit les valeurs RVB en format hexadécimal."""
    return "#{:02x}{:02x}{:02x}".format(r, g, b)

# Mise à jour de la couleur d'aperçu en fonction des valeurs RVB
def update_color_preview():
    global preview_canvas, preview_square, rgb_values
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
    # Mode, R, G, B, Br, S
    global rgb_values, brightness, colorData
    colorData = [1, int(rgb_values[0]), int(rgb_values[1]), int(rgb_values[2]), brightness, 20]
    file.save_json(colorData, "data.json")

# Mise à jour de la vitesse de défilement RGB
def update_static_speed(value):
    global colorData, rgb_values, brightness, static_speed_var
    # on met à jour la valeur de la variable
    static_speed_var.set(int(value))
    colorData = [2, int(rgb_values[0]), int(rgb_values[1]), int(rgb_values[2]), brightness, int(value)]
    file.save_json(colorData, "data.json")

# Mise à jour de la vitesse de défilement RGB
def update_scroll_speed(value):
    global colorData, rgb_values, brightness, scroll_speed_var
    # on met à jour la valeur de la variable
    scroll_speed_var.set(int(value))
    colorData = [3, int(rgb_values[0]), int(rgb_values[1]), int(rgb_values[2]), brightness, int(value)]
    file.save_json(colorData, "data.json")