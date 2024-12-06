import customtkinter
from tkinter import Canvas

# Variables globales pour l'écran d'affichage
canvas, screen = None, 0

# Fonction pour créer l'écran d'affichage
def create_display_view(app):
    global canvas
    # Créez un canvas pour afficher l'écran avec une forme ronde
    canvas = Canvas(app, width=200, height=200, bg=app.cget("bg"), highlightthickness=0)
    canvas.place(x=790, y=40)

    # Dessinez un cercle sur le canvas
    mask = canvas.create_oval(0, 0, 200, 200, fill="black")

    # Appliquez le masque au canvas
    canvas.tag_lower(mask)

    # Ajouter un bouton pour changer d'écran
    screen_button = customtkinter.CTkButton(app, text="Changer d'écran", command=lambda: setCurrentScreen())
    screen_button.place(x=820, y=10)


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
                x = int(svg_path[i])
                while i < len(svg_path) and svg_path[i].isdigit():
                    i += 1
                    print("\nY: ", svg_path[i] + "\n")
                y = int(svg_path[i])
                while i < len(svg_path) and svg_path[i].isdigit():
                    i += 1
                x_start, y_start = x, y
                coords.append((x, y))
            elif cmd == 'L':  # LineTo
                x1 = int(svg_path[i])
                while i < len(svg_path) and svg_path[i].isdigit():
                    i += 1
                y1 = int(svg_path[i])
                while i < len(svg_path) and svg_path[i].isdigit():
                    i += 1
                coords.append((x1, y1))
                x, y = x1, y1
            elif cmd == 'H':  # Horizontal Line
                x1 = int(svg_path[i])
                while i < len(svg_path) and svg_path[i].isdigit():
                    i += 1
                coords.append((x1, y))
                x = x1
            elif cmd == 'V':  # Vertical Line
                y1 = int(svg_path[i])
                while i < len(svg_path) and svg_path[i].isdigit():
                    i += 1
                coords.append((x, y1))
                y = y1
            elif cmd == 'Z':  # ClosePath
                coords.append((x_start, y_start))
                x, y = x_start, y_start

            while i < len(svg_path) and (svg_path[i] == ' ' or svg_path[i] == ','):
                i += 1

        return coords
    

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
    '''for item in data["v"]:
        svg_path = item[0]
        color = "#" + item[1]
        coords = svg_to_tkinter_coords(svg_path)
        print("SVG : ", coords)
        canvas.create_polygon(coords, fill=color)
    print("Test: ",data["v"])'''