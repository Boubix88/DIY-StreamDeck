from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
import threading
from venv import logger
import serial
from math import ceil
import time
from serial.tools.list_ports import comports
import pythonnet
pythonnet.load()
import clr
clr.AddReference('OpenHardwareMonitorLib')
import customtkinter
from OpenHardwareMonitor.Hardware import Computer
from OpenHardwareMonitor.Hardware import SensorType
import json
import psutil

# Main
old_volume = 0
ser = None
app = None

# Variable globale pour contrôler l'exécution de la boucle
keep_reading_cpu = True
keep_reading_gpu = True
connexion_label = None

# Variables globales pour stocker les dernières températures lues
last_cpu_temp = None
last_usage_cpu = None
last_frequency_cpu = None
last_process_count_cpu = None

last_gpu_temp = None
last_usage_gpu = None
last_frequency_gpu = None
last_memory_used_gpu = None

# Création de l'objet Computer et démarrage de la lecture des températures
c = Computer()
c.CPUEnabled = True
c.GPUEnabled = True
c.Open()

# Fonction pour set l'application
def setTkinter(a):
    global app, connexion_label
    app = a

    # Create the label
    connexion_label = customtkinter.CTkLabel(app, text=" ⚠️ En attente de connexion ... ", text_color="white", fg_color="orange", corner_radius=5)
    connexion_label.pack(side="top")

# Connexion à l'Arduino
def connectToArduino():
    global ser, connexion_label

    # Configuration du port série
    port = None

    # On récupère le port série de l'Arduino
    try:
        for p in comports():
            # Si le nom du port contient Arduino on le sélectionne
            if "Arduino" in p.description:
                print("Arduino trouvé au port", p.device)
                port = p.device

                # On cache le label de connexion
                connexion_label.pack_forget()
                break
    except Exception as e:
        print("Erreur lors de la recherche du port série:", e)
        return None
    
    if port is None:
        print("Aucun port Arduino trouvé.")
        return None
    
    try:
        if ser and ser.is_open:
            ser.close()
        ser = serial.Serial(port, 2000000)
    except serial.SerialException as e:
        print("Erreur lors de l'ouverture du port série:", e)
        return None

    return ser


# Ferme la connexion à l'Arduino
def closeConnection():
    global ser
    stop_reading_cpu()
    stop_reading_gpu()

    if ser != None and ser.is_open:
        ser.close()
        print("Connexion fermée.")

# Fonction pour arrêter la lecture des températures
def stop_reading_cpu():
    global keep_reading_cpu
    keep_reading_cpu = False

# Fonction pour arrêter la lecture des températures
def stop_reading_gpu():
    global keep_reading_gpu
    keep_reading_gpu = False

def get_process_count():
    # Obtenir la liste de tous les processus en cours d'exécution
    process_list = psutil.pids()
    # Retourner le nombre de processus
    return len(process_list)

# On met a jour les valeurs
def read_cpu_info():
    global last_cpu_temp, last_usage_cpu, last_frequency_cpu, last_process_count_cpu, keep_reading_cpu
    while keep_reading_cpu:
        last_cpu_temp = c.Hardware[0].Sensors[13].get_Value()
        last_usage_cpu = c.Hardware[0].Sensors[21].get_Value()
        last_frequency_cpu = round(c.Hardware[0].Sensors[14].get_Value() / 1000, 1)
        last_process_count_cpu = get_process_count()
        c.Hardware[0].Update()
        time.sleep(1)
    c.Close()

def read_gpu_info():
    global last_gpu_temp, last_frequency_gpu, last_memory_used_gpu, last_usage_gpu, keep_reading_gpu

    while keep_reading_gpu:
        last_gpu_temp = c.Hardware[1].Sensors[0].get_Value()
        last_frequency_gpu = round(c.Hardware[1].Sensors[1].get_Value() / 1000, 1)
        last_memory_used_gpu = round(c.Hardware[1].Sensors[11].get_Value() / 1000, 1)
        last_usage_gpu = c.Hardware[1].Sensors[6].get_Value()
        c.Hardware[1].Update()
        time.sleep(1)
    c.Close()

# On récupère les informations du CPU
#def getCPUInfo(cpu_temp_label, cpu_usage_label, cpu_frequency_label, cpu_process_count_label):
def getCPUInfo(cpu_temp_label):
    global last_cpu_temp, last_usage_cpu, last_frequency_cpu, last_process_count_cpu

    # On ecrit les valeurs dans les labels
    cpu_temp_label.configure(text=str(last_cpu_temp) + " °C")
    '''cpu_usage_label.configure(text=str(last_usage_cpu) + " %")
    cpu_frequency_label.configure(text=str(last_frequency_cpu) + " GHz")
    cpu_process_count_label.configure(text=str(last_process_count_cpu))'''

    return {
        "txt": {
            "c": {
                "R": 255,
                "G": 255,
                "B": 255
            },
            "txt": [
                {
                    "x": 20,
                    "y": 60,
                    "s": 3,
                    "c": str(round(float(last_cpu_temp))) + "\x09C"
                },
                {
                    "x": 160,
                    "y": 60,
                    "s": 3,
                    "c": str(round(float(last_usage_cpu))) + " %"
                },
                {
                    "x": 20,
                    "y": 170,
                    "s": 3,
                    "c": str(float(last_frequency_cpu)) + " GHz"
                },
                {
                    "x": 160,
                    "y": 170,
                    "s": 3,
                    "c": str(round(float(last_process_count_cpu)))
                },
                {
                    "x": 92,
                    "y": 112,
                    "s": 4,
                    "c": "CPU"
                }
            ]
            },
            "svg": [
                {
                    "p": "M73 87H175V160H73ZM78 92V155H170V92Z",
                    "c": {
                        "R": 255,
                        "G": 255,
                        "B": 255
                    }
                }
            ],
            "svgC": bool(False)
        }

# On récupère les informations du GPU
#def getGPUInfo(gpu_temp_label, gpu_usage_label, gpu_frequency_label, gpu_memory_label):
def getGPUInfo(gpu_temp_label):
    global last_gpu_temp, last_usage_gpu, last_frequency_gpu, last_memory_used_gpu

    # On ecrit les valeurs dans les labels
    gpu_temp_label.configure(text=str(last_gpu_temp) + " °C")
    '''gpu_usage_label.configure(text=str(last_usage_gpu) + " %")
    gpu_frequency_label.configure(text=str(last_frequency_gpu) + " MHz")
    gpu_memory_label.configure(text=str(last_memory_used_gpu) + " MB")'''

    return {
        "txt": {
            "c": {
                "R": 255,
                "G": 255,
                "B": 255
            },
            "txt": [
                {
                    "x": 20,
                    "y": 60,
                    "s": 3,
                    "c": str(round(float(last_gpu_temp))) + "\x09C"
                },
                {
                    "x": 160,
                    "y": 60,
                    "s": 3,
                    "c": str(round(float(last_usage_gpu))) + " %"
                },
                {
                    "x": 20,
                    "y": 170,
                    "s": 3,
                    "c": str(float(last_frequency_gpu)) + " GHz"
                },
                {
                    "x": 160,
                    "y": 170,
                    "s": 3,
                    "c": str(float(last_memory_used_gpu)) + " Go"
                },
                {
                    "x": 92,
                    "y": 112,
                    "s": 4,
                    "c": "GPU"
                }
            ]
            },
            "svg": [
                {
                    "p": "M73 87H175V160H73ZM78 92V155H170V92Z",
                    "c": {
                        "R": 255,
                        "G": 255,
                        "B": 255
                    }
                }
            ],
            "svgC": bool(False)
        }


# On récupère le volume du système
def get_system_volume():
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(
        IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = cast(interface, POINTER(IAudioEndpointVolume))
    return volume.GetMasterVolumeLevelScalar() * 100

def isPlayPausePressed():
    # On vérifie si un evenement touche play/pause pressée est arrivé sur le pc
    #return keyboard.press_and_release('play/pause')
    return False

# Envoie le volume à l'Arduino
def getVolume():
    current_volume = get_system_volume()
    return str(round(current_volume))


# Envoie les données à l'Arduino
def sendToArduino(screen_data, vol, color, clear):
    global ser, connexion_label

    data = {
        "screen": screen_data,
        "vol": vol,
        "c": color,
        "clear": bool(clear)
    }

    # Convertir le dictionnaire en chaîne JSON
    json_data = json.dumps(data)

    # Envoyer les données à l'Arduino en tant que chaîne encodée
    try:
        if (ser is None or not ser.is_open):
            print("Le port série n'est pas ouvert.")
            connexion_label.pack(side="top")  # Show the label
            connectToArduino()
        elif ser.is_open:
            ser.write((json_data + '\n').encode())
        else:
            print("Le port série n'est pas ouvert.")
    except serial.SerialException as e:
        print("Erreur lors de l'envoi des données à l'Arduino:", e)
        connexion_label.pack(side="top")  # Show the label
        connectToArduino()
    #print("Données envoyées à l'Arduino:", json_data)

# Affiche ce que l'Arduino envoie sur le port série
def readSerial():
    global ser

    # On lit ce que l'Arduino envoie si le port série est ouvert
    try:
        if ser and ser.is_open and ser.in_waiting > 0:
            data = ser.readline().decode().strip()  # Lecture des données du port série
            print("Arduino : ", data)
    except serial.SerialException as e:
        print("Erreur lors de la lecture du port série:", e)
        pass


# Démarrer un thread séparé pour lire les températures
def start_cpu_thread():
    temp_thread = threading.Thread(target=read_cpu_info, args=())
    temp_thread.daemon = True
    temp_thread.start()

def start_gpu_thread():
    temp_thread = threading.Thread(target=read_gpu_info, args=())
    temp_thread.daemon = True
    temp_thread.start()