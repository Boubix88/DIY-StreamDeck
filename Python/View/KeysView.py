import customtkinter
from tkinter import PhotoImage
import fileManger as file
from tkinter import Menu, filedialog
import subprocess
from PIL import Image
from io import BytesIO
import os

# Variables globales pour les images combinées, les assignations et les images combinées
combined_images_shadow, assignments, combined_images, keyboard_key_image = None, None, None, None


# Fonction pour créer la vue des touches
def create_keys_view(app):
    global combined_images_shadow, assignments, combined_images, keyboard_key_image

    # Load the software assignments from the JSON file
    assignments = file.load_json_assignement("assignments.json")

    # Create a tab view
    keys_frame = customtkinter.CTkFrame(app, width=300, height=240)
    keys_frame.place(x=325, y=5)

    # Configure the grid to ensure the frame has a minimum size
    keys_frame.grid_propagate(False)

    # Add the frame to the tab view as a new tab
    keys_label = customtkinter.CTkLabel(keys_frame, text="Assignations des touches", font=("Arial", 16))
    keys_label.grid(row=0, column=0, columnspan=6, pady=5)

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
            label = customtkinter.CTkLabel(keys_frame, image=keyboard_key_image)
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
            label.grid(row=i + 1, column=j, padx=10, pady=5)

    # Fonction qui extrait l'icône d'un fichier .exe
def extract_icon_from_exe(icon_in_path, icon_name, icon_out_path, out_width = 56, out_height = 56):
    import win32ui
    import win32gui
    import win32con
    import win32api
    from PIL import Image
    import pythoncom
    import win32com.client

    print("Extracting icon from exe: ", icon_in_path)

    if icon_in_path.lower().endswith(".lnk"):
        print("Extracting icon from shortcut")
        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortcut(icon_in_path)
        icon_location = shortcut.IconLocation
        print("Icon location: ", icon_location)
        return icon_location

    elif icon_in_path.lower().endswith(".exe"):
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
    
    return "assets/icon.png"


# Fonction pour créer les fonctions des labels
def create_functions(label, menu, i, j):
    global combined_images_shadow, assignments, combined_images, keyboard_key_image
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