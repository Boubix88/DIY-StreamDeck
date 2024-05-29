from ctypes import cast, POINTER
import threading
from venv import logger
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
import serial
from math import ceil
import time
from serial.tools.list_ports import comports
import clr
clr.AddReference(r'OpenHardwareMonitorLib') 
from OpenHardwareMonitor.Hardware import Computer
from OpenHardwareMonitor.Hardware import SensorType
import json
            
# Main
old_volume = 0
ser = None

# Variables globales pour stocker les dernières températures lues
last_cpu_temp = None
last_gpu_temp = None

# Connexion à l'Arduino
def connectToArduino():
    global ser

     # Configuration du port série
    port = None

    # On récupère le port série de l'Arduino

    try:
        for port in comports():
            # Si le nom du port contient Arduino on le sélectionne
            if "Arduino" in port.description:
                print("Arduino trouvé au port", port.device)
                port = port.device
                break
    except Exception as e:
        print("Erreur lors de la recherche du port série:", e)
        return None
    
    ser = serial.Serial(port, 2000000)  # Remplacez 'COMX' par le port COM utilisé par votre Arduino
    return ser


# Ferme la connexion à l'Arduino
def closeConnection():
    global ser
    if ser != None and ser.is_open:
        ser.close()
        print("Connexion fermée.")

# Fonction pour lire les températures à intervalles réguliers
def read_temps():
    global last_cpu_temp, last_gpu_temp
    while True:
        c = Computer()
        c.CPUEnabled = True
        c.GPUEnabled = True
        c.Open()
        last_cpu_temp = c.Hardware[0].Sensors[7].get_Value()
        last_gpu_temp = c.Hardware[1].Sensors[0].get_Value()
        # On met a jour les valeurs
        c.Hardware[0].Update()
        c.Hardware[1].Update()
        c.Close()
        time.sleep(1)  # Attendre 5 secondes avant de lire à nouveau

# Envoi la température à l'Arduino
def getTemp(cpu_temp_label, gpu_temp_label):
    global last_cpu_temp, last_gpu_temp

    # On envoie la température à l'Arduino en json
    temp_json = {"cpu" : str(last_cpu_temp), "gpu": str(last_gpu_temp)}

    # On ecrit la température dans les labels
    cpu_temp_label.configure(text=str(last_cpu_temp) + " °C")
    gpu_temp_label.configure(text=str(last_gpu_temp) + " °C")

    return temp_json


# On récupère le volume du système
def get_system_volume():
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(
        IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = cast(interface, POINTER(IAudioEndpointVolume))
    return volume.GetMasterVolumeLevelScalar() * 100


# Envoie le volume à l'Arduino
def getVolume():
    current_volume = get_system_volume()
    return str(round(current_volume))


# Envoie les données à l'Arduino
def sendToArduino(temp, vol, color):
    global ser

    # Création du dictionnaire pour les données
    data = {
        "temperature": temp,
        "volume": vol,
        "color": color
    }

    # Convertir le dictionnaire en chaîne JSON
    json_data = json.dumps(data)

    # Envoyer les données à l'Arduino en tant que chaîne encodée
    try:
        if (ser != None and ser.is_open):
            ser.write((json_data + '\n').encode())
        else:
            print("Le port série n'est pas ouvert.")
    except (serial.SerialException, None) as e: #plus tard on affichera sur l'interface graphique un message d'erreur
        print("Erreur lors de l'envoi des données à l'Arduino:", e)
        pass
    #print("Données:", json_data)


# Affiche ce que l'Arduino envoie sur le port série
def readSerial():
    global ser

    # On lit ce que l'Arduino envoie si le port série est ouvert
    try:
        if ser and ser.is_open and ser.in_waiting > 0:
            data = ser.readline().decode().strip()  # Lecture des données du port série
            print(data)
    except serial.SerialException as e:
        print("Erreur lors de la lecture du port série:", e)
        pass


# Démarrer un thread séparé pour lire les températures
def start_temp_thread():
    temp_thread = threading.Thread(target=read_temps)
    temp_thread.daemon = True
    temp_thread.start()