import customtkinter
from tkinter import PhotoImage


import customtkinter
from tkinter import PhotoImage

def create_ram_view(app):
    # Create a frame to display the CPU temperature
    ram_frame = customtkinter.CTkFrame(app, width=150, height=150)
    ram_frame.place(x=165, y=165)

    # Configure the grid to ensure the frame has a minimum size
    ram_frame.grid_propagate(False)

    # Add the label for the title
    ram_label = customtkinter.CTkLabel(ram_frame, text="RAM", font=("Arial", 16))
    ram_label.grid(row=0, column=0, columnspan=1, pady=5)

    # Add the icon for the GPU
    ram_icon = PhotoImage(file="assets/ram_logo.png")
    ram_icon = ram_icon.subsample(3)
    ram_icon_label = customtkinter.CTkLabel(ram_frame, image=ram_icon)
    # Hide the label text
    ram_icon_label.configure(text="")
    ram_icon_label.grid(row=0, column=1, padx=10, pady=5)

    # Add the label to display the ram usage
    ram_usage_label = customtkinter.CTkLabel(ram_frame, text="", font=("Arial", 16))
    ram_usage_label.grid(row=1, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

    return ram_usage_label