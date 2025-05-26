// Aide : https://www.waveshare.com/wiki/1.28inch_LCD_Module#Resources
// Aide : https://dronebotworkshop.com/gc9a01/
// Création des SVG : https://yqnn.github.io/svg-path-editor/

#include <Adafruit_GFX.h>
#include <Adafruit_GC9A01A.h>
#include <HID-Project.h>
#include <HID-Settings.h>
#include <WS2812.h>
// Utilisation de la bibliothèque TinyCBOR de TOKITA Hiroshi
#include <cbor.h>

// Registres pour accès direct aux ports
#define PIN_TO_BASEREG(pin) (portInputRegister(digitalPinToPort(pin)))
#define PIN_TO_BITMASK(pin) (digitalPinToBitMask(pin))
#define DIRECT_READ(base, mask) (((*(base)) & (mask)) ? HIGH : LOW)
#define DIRECT_MODE_INPUT(base, mask) ((*((base)+1)) &= ~(mask))
#define DIRECT_MODE_OUTPUT(base, mask) ((*((base)+1)) |= (mask))
#define DIRECT_WRITE_LOW(base, mask) ((*((base)+2)) &= ~(mask))
#define DIRECT_WRITE_HIGH(base, mask) ((*((base)+2)) |= (mask))

// --- Définition des constantes et types ---
#define BOUTON_KEYS A1
#define BOUTON_SCREEN 6
#define BOUTON_VOL_UP 3
#define BOUTON_VOL_DOWN 2
#define NB_BUTTONS 4

#define TFT_DC 7
#define TFT_CS 10 //14
#define TFT_RST 8

#define NB_LED 14
#define PIN_LED 9

#define MODE_STATIC 1
#define MODE_SCROLLING_STATIC 2
#define MODE_SCROLLING_RGB 3

// --- Objets globaux ---
Adafruit_GC9A01A tft = Adafruit_GC9A01A(TFT_CS, TFT_DC, TFT_RST);
WS2812 LED(NB_LED);  // 14 LEDs
cRGB value;

char lastScreen = 'c';
char currentScreen = '?';
uint8_t indexLed = 0;

// Registres et masques pour l'accès direct aux pins
volatile uint8_t *screenButtonReg;
uint8_t screenButtonMask;
volatile uint8_t *volUpButtonReg;
uint8_t volUpButtonMask;
volatile uint8_t *volDownButtonReg;
uint8_t volDownButtonMask;

void clearScreen() {
  tft.fillScreen(GC9A01A_BLACK);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, const char* text) {
  tft.setCursor(x, y);
  tft.setTextSize(size);
  tft.setTextColor(color, GC9A01A_BLACK);
  tft.println(text);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, const String& text) {
  tft.setCursor(x, y);
  tft.setTextSize(size);
  tft.setTextColor(color, GC9A01A_BLACK);
  tft.println(text);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, char character) {
  tft.setCursor(x, y);
  tft.setTextSize(size);
  tft.setTextColor(color, GC9A01A_BLACK);
  tft.println(character);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, const __FlashStringHelper* text) {
  char buffer[20];
  strcpy_P(buffer, (PGM_P)text);
  writeText(x, y, size, color, buffer);
}

void startScreen() {
  writeText(40, 115, 2, GC9A01A_WHITE, F("Connection ..."));

  value.r = 0, value.g = 0, value.b = 0;
  for (uint8_t i = 0; i < NB_LED; i++) {  // On parcour toute les leds pour les éteindre
    LED.set_crgb_at(i, value);
    LED.sync();
  }

  // Chargement led bleue
  for (uint8_t i = 0; i < NB_LED; i++) {  // On parcour toute les leds
    if (Serial.available() > 0) {         // Si on detecte une connexion au PC
      return;
    } else {
      for (uint8_t j = 0; j < 255; j++) {
        value.b = j;
        LED.set_crgb_at(i, value);
        LED.sync();
        delay(1);
      }
      delay(1);
    }
  }
}

void setStaticLedColor(uint8_t r, uint8_t g, uint8_t b) {
  // Désactiver les interruptions pendant la mise à jour des LEDs
  noInterrupts();
  
  value.r = r;
  value.g = g;
  value.b = b;
  for (uint8_t i = 0; i < NB_LED; i++) {  // On parcourt toutes les leds
    LED.set_crgb_at(i, value);
  }

  LED.sync();
  
  // Réactiver les interruptions après la mise à jour
  interrupts();
}

void rainbow(uint8_t wait) {
  if (indexLed >= 0 && indexLed < 256) {
    // Désactiver les interruptions pendant la mise à jour des LEDs
    noInterrupts();
    
    for (uint8_t i = 0; i < NB_LED; i++) {
      LED.set_crgb_at(i, Wheel((i + indexLed) & 255));
    }
    LED.sync();
    
    // Réactiver les interruptions après la mise à jour
    interrupts();
    
    indexLed += wait / 10;
  } else if (indexLed >= 256) {
    indexLed = 0;
  }
}

cRGB Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  cRGB color = { 0, 0, 0 };

  if (WheelPos < 85) {
    color.r = 255 - WheelPos * 3;
    color.b = WheelPos * 3;
  } else if (WheelPos < 170) {
    WheelPos -= 85;
    color.g = WheelPos * 3;
    color.b = 255 - WheelPos * 3;
  } else {
    WheelPos -= 170;
    color.r = WheelPos * 3;
    color.g = 255 - WheelPos * 3;
  }
  return color;
}

void rainbowCycle(uint8_t wait) {
  if (indexLed >= 0 && indexLed < 256 * 5) {  // 5 cycles of all colors on wheel
    // Désactiver les interruptions pendant la mise à jour des LEDs
    noInterrupts();
    
    for (uint8_t i = 0; i < NB_LED; i++) {
      LED.set_crgb_at(i, Wheel(((i * 256 / NB_LED) + indexLed) & 255));
    }
    LED.sync();
    
    // Réactiver les interruptions après la mise à jour
    interrupts();
    
    indexLed += wait / 10;
  } else if (indexLed >= 256 * 5) {
    indexLed = 0;
  }
}

void processReceivedData() {
  // Vérifie si le port série est prêt à être écrit
  if (Serial.availableForWrite()) {
    // Afficher le debug ici
  }

  if (Serial.available() > 0) {
    // Désactiver les interruptions pendant la lecture des données
    noInterrupts();
    
    // Lecture des données CBOR
    uint8_t buffer[512]; // Buffer pour stocker les données CBOR
    size_t bytesRead = Serial.readBytesUntil('\n', buffer, sizeof(buffer) - 1);
    
    // Réactiver les interruptions après la lecture
    interrupts();
    
    // Décodage CBOR avec TinyCBOR
    CborParser parser;
    CborValue it;
    CborError err = cbor_parser_init(buffer, bytesRead, 0, &parser, &it);
    
    if (err == CborNoError && cbor_value_is_map(&it)) {
      // Traitement des données CBOR
      CborValue screenValue;
      if (cbor_value_map_find_value(&it, "s", &screenValue) == CborNoError && !cbor_value_is_null(&screenValue)) {
        if (lastScreen == 'c') {
          clearScreen();
          lastScreen = 's';
        }
        
        // Traitement des données d'écran
        displayDataCBOR(screenValue);
      }
      
      // Si on reçoit l'ordre de clear l'écran
      CborValue clearValue;
      bool clearScreenBool = false;
      if (cbor_value_map_find_value(&it, "clr", &clearValue) == CborNoError && 
          cbor_value_is_boolean(&clearValue) && 
          cbor_value_get_boolean(&clearValue, &clearScreenBool) == CborNoError && 
          clearScreen) {
        clearScreen();
      }
      
      // Gestion de la couleur du ruban
      CborValue colorValue;
      if (cbor_value_map_find_value(&it, "c", &colorValue) == CborNoError && 
          cbor_value_is_array(&colorValue)) {
        
        // Déterminer la taille du tableau
        size_t colorDataSize = 0;
        cbor_value_get_array_length(&colorValue, &colorDataSize);
        
        if (colorDataSize > 0) {
          // Allouer dynamiquement un tableau de taille adéquate
          uint8_t* colorData = (uint8_t*)malloc(colorDataSize * sizeof(uint8_t));
          if (colorData) {
            // Entrer dans le tableau
            CborValue arrayIt;
            cbor_value_enter_container(&colorValue, &arrayIt);
            
            // Remplir le tableau dynamique avec les valeurs
            for (size_t i = 0; i < colorDataSize && !cbor_value_at_end(&arrayIt); i++) {
              if (cbor_value_is_integer(&arrayIt)) {
                int value;
                cbor_value_get_int(&arrayIt, &value);
                colorData[i] = (uint8_t)value;
              }
              cbor_value_advance(&arrayIt);
            }
            
            // Sortir du tableau
            cbor_value_leave_container(&colorValue, &arrayIt);
            
            // Utiliser le tableau pour traiter les données
            switch (colorData[0]) {
              case MODE_STATIC:
                setStaticLedColor(colorData[1], colorData[2], colorData[3]);
                break;
              case MODE_SCROLLING_STATIC:
                rainbow(colorData[5]);
                break;
              case MODE_SCROLLING_RGB:
                rainbowCycle(colorData[5]);
                break;
            }
            
            // Libérer la mémoire allouée dynamiquement
            free(colorData);
          }
        }
      }
    }
  } else {
    if (lastScreen != 'c') {
      clearScreen();
    }
    
    startScreen();
    lastScreen = 'c';
  }
}

// Fonction pour afficher les données CBOR
void displayDataCBOR(CborValue &data) {
  // Désactiver les interruptions pendant l'affichage
  noInterrupts();
  
  // Gestion des textes
  CborValue textValue;
  if (cbor_value_map_find_value(&data, "t", &textValue) == CborNoError && 
      cbor_value_is_map(&textValue)) {
    
    // Récupération de la couleur du texte
    uint16_t textColor = 0xFFFF; // Blanc par défaut
    CborValue colorValue;
    if (cbor_value_map_find_value(&textValue, "c", &colorValue) == CborNoError && 
        cbor_value_is_text_string(&colorValue)) {
      
      size_t len;
      char colorStr[8]; // Assez grand pour "#RRGGBB\0"
      cbor_value_calculate_string_length(&colorValue, &len);
      if (len < sizeof(colorStr)) {
        cbor_value_copy_text_string(&colorValue, colorStr, &len, NULL);
        textColor = hexToColor565(colorStr);
      }
    }

    // Gestion des textes
    CborValue textArrayValue;
    if (cbor_value_map_find_value(&textValue, "t", &textArrayValue) == CborNoError && 
        cbor_value_is_array(&textArrayValue)) {
      
      CborValue arrayIt;
      cbor_value_enter_container(&textArrayValue, &arrayIt);
      
      while (!cbor_value_at_end(&arrayIt)) {
        if (cbor_value_is_array(&arrayIt)) {
          // Traiter chaque ligne de texte
          CborValue lineIt;
          cbor_value_enter_container(&arrayIt, &lineIt);
          
          // Lire les 4 éléments de la ligne
          int x = 0, y = 0, size = 0;
          char content[50] = ""; // Taille maximale pour le contenu texte
          
          // X
          if (!cbor_value_at_end(&lineIt) && cbor_value_is_integer(&lineIt)) {
            cbor_value_get_int(&lineIt, &x);
            cbor_value_advance(&lineIt);
          }
          
          // Y
          if (!cbor_value_at_end(&lineIt) && cbor_value_is_integer(&lineIt)) {
            cbor_value_get_int(&lineIt, &y);
            cbor_value_advance(&lineIt);
          }
          
          // Size
          if (!cbor_value_at_end(&lineIt) && cbor_value_is_integer(&lineIt)) {
            cbor_value_get_int(&lineIt, &size);
            cbor_value_advance(&lineIt);
          }
          
          // Content
          if (!cbor_value_at_end(&lineIt) && cbor_value_is_text_string(&lineIt)) {
            size_t len;
            cbor_value_calculate_string_length(&lineIt, &len);
            if (len < sizeof(content)) {
              cbor_value_copy_text_string(&lineIt, content, &len, NULL);
              writeText(x, y, size, textColor, content);
            }
          }
          
          // Sortir du tableau de ligne
          cbor_value_leave_container(&arrayIt, &lineIt);
        }
        cbor_value_advance(&arrayIt);
      }
      
      // Sortir du tableau de textes
      cbor_value_leave_container(&textArrayValue, &arrayIt);
    }
  }

  // Gestion des SVG
  CborValue svgValue;
  if (cbor_value_map_find_value(&data, "v", &svgValue) == CborNoError && 
      cbor_value_is_array(&svgValue)) {
    
    // Vérifier si on doit effacer la zone des SVG
    CborValue vcValue;
    bool clearSvgArea = false;
    if (cbor_value_map_find_value(&data, "vC", &vcValue) == CborNoError && 
        cbor_value_is_boolean(&vcValue) && 
        cbor_value_get_boolean(&vcValue, &clearSvgArea) == CborNoError && 
        clearSvgArea) {
      tft.fillRect(0, 60, 240, 115, GC9A01A_BLACK);
    }

    // Traitement des éléments SVG
    CborValue arrayIt;
    cbor_value_enter_container(&svgValue, &arrayIt);
    
    while (!cbor_value_at_end(&arrayIt)) {
      if (cbor_value_is_array(&arrayIt)) {
        // Traiter chaque SVG
        CborValue svgIt;
        cbor_value_enter_container(&arrayIt, &svgIt);
        
        // Lire le chemin SVG et la couleur
        char path[200] = ""; // Taille maximale pour le chemin SVG
        char colorStr[8] = ""; // Assez grand pour "#RRGGBB\0"
        
        // Path
        if (!cbor_value_at_end(&svgIt) && cbor_value_is_text_string(&svgIt)) {
          size_t len;
          cbor_value_calculate_string_length(&svgIt, &len);
          if (len < sizeof(path)) {
            cbor_value_copy_text_string(&svgIt, path, &len, NULL);
            cbor_value_advance(&svgIt);
            
            // Color
            if (!cbor_value_at_end(&svgIt) && cbor_value_is_text_string(&svgIt)) {
              size_t colorLen;
              cbor_value_calculate_string_length(&svgIt, &colorLen);
              if (colorLen < sizeof(colorStr)) {
                cbor_value_copy_text_string(&svgIt, colorStr, &colorLen, NULL);
                uint16_t svgColor = hexToColor565(colorStr);
                
                // Dessiner le SVG
                drawSVGPath(path, svgColor);
              }
            }
          }
        }
        
        // Sortir du tableau SVG
        cbor_value_leave_container(&arrayIt, &svgIt);
      }
      cbor_value_advance(&arrayIt);
    }
    
    // Sortir du tableau de SVGs
    cbor_value_leave_container(&svgValue, &arrayIt);
  }
  
  // Réactiver les interruptions après l'affichage
  interrupts();
}

uint16_t hexToColor565(const char* hexColor) {
  // Optimisation pour la conversion de couleur hexadécimale
  uint32_t rgb = strtol(hexColor, NULL, 16);  // Convertir la chaîne hexadécimale directement

  // Conversion directe sans allocations supplémentaires
  uint8_t r = (rgb >> 16) & 0xFF;
  uint8_t g = (rgb >> 8) & 0xFF;
  uint8_t b = rgb & 0xFF;

  return tft.color565(r, g, b);  // Retourner la couleur dans le format attendu
}

void drawSVGPath(const char* svgPath, uint16_t color) {
  uint8_t x = 0, y = 0;            // Position actuelle
  uint8_t xStart = 0, yStart = 0;  // Point de départ pour fermer le chemin

  const char* p = svgPath;
  while (*p) {
    char cmd = *p++;  // Lire la commande
    skipSeparators(p);

    switch (cmd) {
      case 'H': {  // Ligne horizontale
        uint8_t x1 = strtol(p, &p, 10);
        tft.drawFastHLine(x, y, x1 - x, color);
        x = x1;
        break;
      }
      case 'V': {  // Ligne verticale
        uint8_t y1 = strtol(p, &p, 10);
        tft.drawFastVLine(x, y, y1 - y, color);
        y = y1;
        break;
      }
      case 'L': {  // LineTo
        uint8_t x1 = strtol(p, &p, 10);
        uint8_t y1 = strtol(p, &p, 10);
        tft.drawLine(x, y, x1, y1, color);
        x = x1;
        y = y1;
        break;
      }
      case 'M': {  // MoveTo
        x = strtol(p, &p, 10);
        y = strtol(p, &p, 10);
        xStart = x;
        yStart = y;
        break;
      }
      case 'Z': {  // ClosePath
        tft.drawLine(x, y, xStart, yStart, color);
        x = xStart;
        y = yStart;
        break;
      }
    }

    skipSeparators(p);  // Nettoyer les séparateurs pour la prochaine commande
  }
}

void skipSeparators(const char*& p) {
  while (*p == ' ' || *p == ',') p++;
}

void checkBtnPressed() {
  // Utilisation d'accès direct aux registres pour une lecture plus rapide
  if (DIRECT_READ(screenButtonReg, screenButtonMask) == LOW) {
    // On change d'ecran
    Serial.println(F("screen_change"));
  }

  if (DIRECT_READ(volUpButtonReg, volUpButtonMask) == LOW) {
    Consumer.write(MEDIA_VOLUME_UP);
    return;
  }
  
  if (DIRECT_READ(volDownButtonReg, volDownButtonMask) == LOW) {
    Consumer.write(MEDIA_VOLUME_DOWN);
    return;
  }

  uint16_t key = analogRead(BOUTON_KEYS);
}

void setup() {
  // Initialisation des boutons avec accès direct aux registres
  pinMode(BOUTON_SCREEN, INPUT_PULLUP);
  pinMode(BOUTON_VOL_UP, INPUT_PULLUP);
  pinMode(BOUTON_VOL_DOWN, INPUT_PULLUP);
  
  // Initialisation des registres et masques pour l'accès direct
  screenButtonReg = PIN_TO_BASEREG(BOUTON_SCREEN);
  screenButtonMask = PIN_TO_BITMASK(BOUTON_SCREEN);
  volUpButtonReg = PIN_TO_BASEREG(BOUTON_VOL_UP);
  volUpButtonMask = PIN_TO_BITMASK(BOUTON_VOL_UP);
  volDownButtonReg = PIN_TO_BASEREG(BOUTON_VOL_DOWN);
  volDownButtonMask = PIN_TO_BITMASK(BOUTON_VOL_DOWN);

  // Initialisation de la communication série
  Serial.begin(2000000);

  // begin HID connection
  Consumer.begin();

  // Initialisation des leds
  LED.setOutput(PIN_LED);
  LED.setColorOrderGRB();
  value.r = 0, value.g = 0, value.b = 0;

  // On initialise l'ecran
  tft.begin();
  tft.setSPISpeed(40000000);
  clearScreen();

  // Attente de la connexion au port série
  while (!Serial) {
    startScreen();
  }
}

void loop() {
  // Boutons
  checkBtnPressed();

  // On recoit des données donc on affiche le volume
  processReceivedData();
}
