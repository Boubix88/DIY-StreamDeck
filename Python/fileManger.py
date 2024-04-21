import json

# Save data to a json file
def save_json(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f)


# Load data from a json file
def load_json(filename):
    # On vérifie si le fichier existe : 
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"Mode" : 1, "R": 0, "G": 0, "B": 255} # Valeur par défaut