import customtkinter
from tkinter import PhotoImage


import customtkinter
from tkinter import PhotoImage

def create_gpu_view(app):
    # Create a frame to display the CPU temperature
    gpu_frame = customtkinter.CTkFrame(app, width=200, height=200)
    gpu_frame.place(x=170, y=5)

    # Add the label for the title
    cpu_label = customtkinter.CTkLabel(gpu_frame, text="GPU", font=("Arial", 16))
    cpu_label.grid(row=0, column=0, columnspan=1, pady=5)

    # Add the icon for the GPU
    gpu_icon = PhotoImage(file="assets/icon_gpu_py.png")
    gpu_icon = gpu_icon.subsample(3)
    gpu_icon_label = customtkinter.CTkLabel(gpu_frame, image=gpu_icon)
    # Hide the label text
    gpu_icon_label.configure(text="")
    gpu_icon_label.grid(row=0, column=1, padx=10, pady=5)

    # Add the label to display the GPU temperature
    gpu_temp_label = customtkinter.CTkLabel(gpu_frame, text="", font=("Arial", 20))
    gpu_temp_label.grid(row=1, column=0, padx=10, pady=5)

    # Add the label to display the GPU usage
    gpu_usage_label = customtkinter.CTkLabel(gpu_frame, text="", font=("Arial", 16))
    gpu_usage_label.grid(row=1, column=1, padx=10, pady=5)

    # Add the label to display the GPU frequency
    gpu_frequency_label = customtkinter.CTkLabel(gpu_frame, text="", font=("Arial", 16))
    gpu_frequency_label.grid(row=2, column=0, padx=10, pady=5)

    # Add the label to display gpu memory
    gpu_memory_label = customtkinter.CTkLabel(gpu_frame, text="", font=("Arial", 16))
    gpu_memory_label.grid(row=2, column=1, padx=10, pady=5)

    return gpu_temp_label, gpu_usage_label, gpu_frequency_label, gpu_memory_label