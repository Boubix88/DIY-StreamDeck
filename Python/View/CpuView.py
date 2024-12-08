import customtkinter
from tkinter import PhotoImage


import customtkinter
from tkinter import PhotoImage

def create_cpu_view(app):
    # Create a frame to display the CPU temperature
    cpu_frame = customtkinter.CTkFrame(app, width=150, height=150)
    cpu_frame.place(x=5, y=5)

    # Configure the grid to ensure the frame has a minimum size
    cpu_frame.grid_propagate(False)

    # Add the label for the title
    cpu_label = customtkinter.CTkLabel(cpu_frame, text="CPU", font=("Arial", 16))
    cpu_label.grid(row=0, column=0, columnspan=1, pady=5)

    # Add the icon for the CPU
    cpu_icon = PhotoImage(file="assets/icon_cpu_py.png")
    cpu_icon = cpu_icon.subsample(3)
    cpu_icon_label = customtkinter.CTkLabel(cpu_frame, image=cpu_icon)
    # Hide the label text
    cpu_icon_label.configure(text="")
    cpu_icon_label.grid(row=0, column=1, padx=10, pady=5)

    # Add the label to display the CPU temperature
    cpu_temp_label = customtkinter.CTkLabel(cpu_frame, text="", font=("Arial", 16))
    cpu_temp_label.grid(row=1, column=0, padx=10, pady=5)

    # Add the label to display the CPU usage
    cpu_usage_label = customtkinter.CTkLabel(cpu_frame, text="", font=("Arial", 16))
    cpu_usage_label.grid(row=1, column=1, padx=10, pady=5)

    # Add the label to display the CPU frequency
    cpu_frequency_label = customtkinter.CTkLabel(cpu_frame, text="", font=("Arial", 16))
    cpu_frequency_label.grid(row=2, column=0, padx=10, pady=5)

    # Add the label to display the number of processes
    cpu_process_count_label = customtkinter.CTkLabel(cpu_frame, text="", font=("Arial", 16))
    cpu_process_count_label.grid(row=2, column=1, padx=10, pady=5)

    return cpu_temp_label, cpu_usage_label, cpu_frequency_label, cpu_process_count_label