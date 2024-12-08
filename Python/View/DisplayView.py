import customtkinter
from tkinter import Canvas

# Variables globales pour l'écran d'affichage
canvas, screen = None, 0

# Fonction pour créer l'écran d'affichage
def create_display_view(app):
    global canvas
    # Créez un canvas pour afficher l'écran avec une forme ronde
    canvas = Canvas(app, width=200, height=200, bg=app.cget("bg"), highlightthickness=0)
    canvas.place(x=640, y=140)

    # Dessinez un cercle sur le canvas
    mask = canvas.create_oval(0, 0, 200, 200, fill="black")

    # Appliquez le masque au canvas
    canvas.tag_lower(mask)

    # Ajouter un bouton pour changer d'écran
    screen_button = customtkinter.CTkButton(app, text="Changer d'écran", command=lambda: setCurrentScreen())
    screen_button.place(x=670, y=100)


# Ajouter un bouton pour changer d'écran
def change_screen(new_screen):
    global screen
    screen = new_screen


def setCurrentScreen():
    global screen
    screen += 1 
    if screen >= 5:
        screen = 0


def getCurrentScreen():
    global screen
    return screen


# Fonction pour convertir les chemins SVG en coordonnées tkinter
def svg_to_tkinter_coords(svg_path):
    coords = []
    x, y = 0, 0
    x_start, y_start = 0, 0

    i = 0
    while i < len(svg_path):
        cmd = svg_path[i]
        i += 1

        while i < len(svg_path) and (svg_path[i] == ' ' or svg_path[i] == ','):
            i += 1

        if cmd == 'M':  # MoveTo
            x, y = '', ''
            while i < len(svg_path) and svg_path[i].isdigit():
                x += svg_path[i]
                i += 1
            while i < len(svg_path) and (svg_path[i] == ' ' or svg_path[i] == ','):
                i += 1
            while i < len(svg_path) and svg_path[i].isdigit():
                y += svg_path[i]
                i += 1
            x, y = int(x), int(y)
            x_start, y_start = x, y
            coords.append((x, y))
        elif cmd == 'L':  # LineTo
            x1, y1 = '', ''
            while i < len(svg_path) and svg_path[i].isdigit():
                x1 += svg_path[i]
                i += 1
            while i < len(svg_path) and (svg_path[i] == ' ' or svg_path[i] == ','):
                i += 1
            while i < len(svg_path) and svg_path[i].isdigit():
                y1 += svg_path[i]
                i += 1
            x1, y1 = int(x1), int(y1)
            coords.append((x1, y1))
            x, y = x1, y1
        elif cmd == 'H':  # Horizontal Line
            x1 = ''
            while i < len(svg_path) and svg_path[i].isdigit():
                x1 += svg_path[i]
                i += 1
            x1 = int(x1)
            coords.append((x1, y))
            x = x1
        elif cmd == 'V':  # Vertical Line
            y1 = ''
            while i < len(svg_path) and svg_path[i].isdigit():
                y1 += svg_path[i]
                i += 1
            y1 = int(y1)
            coords.append((x, y1))
            y = y1
        elif cmd == 'Z':  # ClosePath
            coords.append((x_start, y_start))
            x, y = x_start, y_start

        while i < len(svg_path) and (svg_path[i] == ' ' or svg_path[i] == ','):
            i += 1

    return coords


def split_svg_paths(svg_path):
    paths = []
    current_path = ''
    i = 0
    while i < len(svg_path):
        if svg_path[i] == 'M' and current_path:
            paths.append(current_path.strip())
            current_path = 'M'
        else:
            current_path += svg_path[i]
        i += 1
    if current_path:
        paths.append(current_path.strip())
    return paths
    

# Fonction pour appliquer la translation et le redimensionnement
def transform_coords(coords, translate_x=0, translate_y=0, scale_x=1, scale_y=1):
    transformed_coords = [(int(x * scale_x + translate_x), int(y * scale_y + translate_y)) for x, y in coords]
    return transformed_coords

      
# Fonction pour diviser les coordonnées en segments plus petits
def split_coords(coords, max_length=54):
    return [coords[i:i + max_length] for i in range(0, len(coords), max_length)]
            

# Fonction pour mettre à jour l'affichage de l'écran
def update_display(data):
    global canvas
    # Effacez l'écran
    canvas.delete("all")

    # Dessinez un cercle sur le canvas
    mask = canvas.create_oval(0, 0, 200, 200, fill="black")

    # Appliquez le masque au canvas
    canvas.tag_lower(mask)

    # Affichage des textes
    for item in data["t"]["t"]:
        canvas.create_text(int((item[0] + 30) * (200 / 240)), int((item[1] + 20) * (200 / 240)), text=item[3], font=("Helvetica", item[2]*5), fill="#" + data["t"]["c"])

    # Affichage des svg
    print("\nTest: ",data["v"])
    for item in data["v"]:
        svg_path = item[0]
        svg_paths = split_svg_paths(svg_path)
        color = "#" + item[1]
        for svg_path in svg_paths:
            print("\nSVG Path : ", svg_path)
            coords = svg_to_tkinter_coords(svg_path)
            transformed_coords = transform_coords(coords, translate_x=0, translate_y=0, scale_x=0.83, scale_y=0.83)
            #print("SVG : ", coords)
            flat_coords = [coord for point in transformed_coords for coord in point]  # Convertir la liste de tuples en liste plate
            #rint("Flat Coords : ", flat_coords)
            try:
                segments = split_coords(flat_coords, max_length=54)
                for segment in segments:
                    if len(segment) % 2 == 0:
                        canvas.create_polygon(segment, outline=color, fill='', width=1)
                    else:
                        print("Erreur : Nombre impair de coordonnées dans le segment")
            except Exception as e:
                print("Erreur lors de la création du polygone : ", e)