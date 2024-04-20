from ctypes import cast, POINTER
from venv import logger
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
import serial
from math import ceil
from time import sleep
from serial.tools.list_ports import comports
import clr
clr.AddReference(r'OpenHardwareMonitorLib') 
from OpenHardwareMonitor.Hardware import Computer
import json
            
# Main
old_volume = 0
ser = None

# Connexion à l'Arduino
def connectToArduino():
    global ser

     # Configuration du port série
    port = None

    # On récupère le port série de l'Arduino
    for port in comports():
        # Si le nom du port contient Arduino on le sélectionne
        if "Arduino" in port.description:
            print("Arduino trouvé au port", port.device)
            port = port.device
            break

    ser = serial.Serial(port, 2000000)  # Remplacez 'COMX' par le port COM utilisé par votre Arduino
    return ser

# Ferme la connexion à l'Arduino
def closeConnection():
    global ser
    ser.close()

# Envoi la température à l'Arduino
def getTemp(cpu_temp_label, gpu_temp_label):
    global ser
    c = Computer()
    c.CPUEnabled = True # get the Info about CPU
    c.GPUEnabled = True # get the Info about GPU
    c.Open()

    # On envoie la température à l'Arduino en json
    #temp_json = '{"cpu":' + str(c.Hardware[0].Sensors[7].get_Value()) + ', "gpu":' + str(c.Hardware[1].Sensors[8].get_Value()) + '}'
    temp_json = {"cpu" : str(c.Hardware[0].Sensors[7].get_Value()), "gpu": str(c.Hardware[1].Sensors[8].get_Value())}
    #ser.write((temp_json + '\n').encode())
    #print("Température:", temp_json)

    # On ecrit la température dans les labels
    cpu_temp_label.configure(text=str(c.Hardware[0].Sensors[7].get_Value()) + " °C")
    gpu_temp_label.configure(text=str(c.Hardware[1].Sensors[8].get_Value()) + " °C")

    # On met a jour les valeurs
    c.Hardware[0].Update()
    c.Hardware[1].Update()

    return temp_json

    #sleep(0.5)


# On récupère le volume du système
def get_system_volume():
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(
        IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = cast(interface, POINTER(IAudioEndpointVolume))
    return volume.GetMasterVolumeLevelScalar() * 100


# Envoie le volume à l'Arduino
def getVolume():
    global ser
    global old_volume

    # On envoie le volume à l'Arduino
    if (ceil(get_system_volume()) != old_volume):
        old_volume = ceil(get_system_volume())

        current_volume = ceil(get_system_volume())

        # On envoie le volume à l'Arduino en json
        #vol_json = '{"volume":' + str(current_volume) + '}'
        vol_json = {"volume": str(current_volume)}
        #ser.write((vol_json + '\n').encode())
        #print("Volume:", vol_json)
        return str(current_volume)
    
    return 0

    # On met un delai de 100ms
    #sleep(0.1)

# Envoie de la couleur à l'Arduino
def getColor(color):
    global ser

    # On envoie la couleur à l'Arduino en json
    color_json = '{"color":' + str(color) + '}'
    #ser.write((color_json + '\n').encode())
    #print("Couleur:", color_json)
    return color_json

    # On met un delai de 100ms
    #sleep(0.1)

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
    ser.write((json_data + '\n').encode())
    print("Données:", json_data)

    # On met un delai de 100ms
    #sleep(0.1)

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