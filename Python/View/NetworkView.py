import customtkinter
from tkinter import PhotoImage


import customtkinter
from tkinter import PhotoImage

def create_network_view(app):
    # Create a frame to display the network information
    network_frame = customtkinter.CTkFrame(app, width=150, height=150)
    network_frame.place(x=5, y=165)

    # Configure the grid to ensure the frame has a minimum size
    network_frame.grid_propagate(False)

    # Add the icon for the network
    gpu_icon = PhotoImage(file="assets/network_icon.png")
    gpu_icon = gpu_icon.subsample(3)
    gpu_icon_label = customtkinter.CTkLabel(network_frame, image=gpu_icon)
    # Hide the label text
    gpu_icon_label.configure(text="")
    gpu_icon_label.grid(row=0, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

    # Add the label to display the GPU temperature
    network_download_label = customtkinter.CTkLabel(network_frame, text="", font=("Arial", 16))
    network_download_label.grid(row=1, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

    # Add the label to display the GPU frequency
    network_upload = customtkinter.CTkLabel(network_frame, text="", font=("Arial", 16))
    network_upload.grid(row=2, column=0, columnspan=2, padx=10, pady=5, sticky="ew")

    return network_download_label, network_upload