// Aide : https://www.waveshare.com/wiki/1.28inch_LCD_Module#Resources
// Aide : https://dronebotworkshop.com/gc9a01/
// Création des SVG : https://yqnn.github.io/svg-path-editor/

#include <Adafruit_GFX.h>
#include <Adafruit_GC9A01A.h>
#include <HID-Project.h>
#include <HID-Settings.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>
#include <WS2812.h>

// --- Définition des constantes et types ---
#define BOUTON_PLAY 2
#define BOUTON_PREVIOUS 3
#define BOUTON_NEXT 4
#define PLAY 0x78

#define TFT_DC 7
#define TFT_CS 10
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
  //pixels.clear(); //On éteuint8_t les leds allumé
  value.r = r;
  value.g = g;
  value.b = b;
  for (uint8_t i = 0; i < NB_LED; i++) {  // On parcour toute les leds
    LED.set_crgb_at(i, value);
  }

  LED.sync();
}

void rainbow(uint8_t wait) {
  //Serial.println("Rainbow");

  if (indexLed >= 0 && indexLed < 256) {
    for (uint8_t i = 0; i < NB_LED; i++) {
      LED.set_crgb_at(i, Wheel((i + indexLed) & 255));
    }
    LED.sync();
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
  //Serial.println("Rainbow cycle");

  if (indexLed >= 0 && indexLed < 256 * 5) {  // 5 cycles of all colors on wheel
    for (uint8_t i = 0; i < NB_LED; i++) {
      LED.set_crgb_at(i, Wheel(((i * 256 / NB_LED) + indexLed) & 255));
    }
    LED.sync();
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
    // Lecture des données JSON envoyées par le port série
    JsonDocument jsonDocument;
    DeserializationError error = deserializeJson(jsonDocument, Serial);

    if (error) {
      // Gestion des erreurs de lecture JSON
      /*Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());*/
      return;
    }

   // On vérifie s'il y a un écran dans le JSON
    if (jsonDocument.containsKey("s")) {
      if (lastScreen == 'c') {
        clearScreen();
        lastScreen = 's';
      }

      // ChatGPT = Gérer ici la logique d'affichage des données du JSON
      displayData(jsonDocument["s"]);
    }

    // Si on recois l'odre de clear l'ecran
    if (jsonDocument.containsKey("clr")) {
      if (jsonDocument["clr"] == 1) clearScreen();
    }

    // Gestion de la couleur du ruban
    if (jsonDocument.containsKey("c")) {
      JsonArray colorDataArray = jsonDocument["c"];
      size_t colorDataSize = colorDataArray.size();  // Taille du tableau JSON

      // Allouer dynamiquement un tableau de taille adéquate
      uint8_t* colorData = (uint8_t*)malloc(colorDataSize * sizeof(uint8_t));
      if (colorData) {
        // Remplir le tableau dynamique avec les valeurs
        for (size_t i = 0; i < colorDataSize; i++) {
          colorData[i] = colorDataArray[i].as<uint8_t>();
        }

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
      } else {
        // Gestion d'erreur en cas d'échec d'allocation
        //Serial.println(F("Erreur : Allocation mémoire échouée pour colorData"));
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

// Fonction générique pour afficher les données d'une catégorie
void displayData(JsonObject data) {
  // Gestion des textes
  if (data.containsKey("t")) {
    JsonObject textData = data["t"];
    uint16_t textColor = hexToColor565(textData["c"]);  // Couleur compactée

    // Utilisation de .as() directement sans stocker dans un JsonArray
    for (JsonVariant line : textData["t"].as<JsonArray>()) {
      uint8_t x = line[0].as<uint8_t>();    // Récupérer les coordonnées
      uint8_t y = line[1].as<uint8_t>();
      uint8_t size = line[2].as<uint8_t>();
      const char* content = line[3].as<const char*>();  // Pas d'allocation supplémentaire

      writeText(x, y, size, textColor, content);
    }
  }

  // Gestion des SVG
  if (data.containsKey("v")) {
    JsonArray svgData = data["v"].as<JsonArray>();

    if (data["vC"] == 1) tft.fillRect(0, 60, 240, 115, GC9A01A_BLACK);

    // Optimisation pour l'itération sur les éléments SVG sans création de variables inutiles
    for (JsonVariant svg : svgData) {
      const char* path = svg[0].as<const char*>();   // Récupérer le chemin SVG
      uint16_t svgColor = hexToColor565(svg[1].as<const char*>());  // Convertir la couleur

      drawSVGPath(path, svgColor);
    }
  }
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


void setup() {
  // Initialisation du bouton 1
  pinMode(BOUTON_PLAY, INPUT_PULLUP);

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
  // Bouton PLAY/PAUSE
  if (digitalRead(BOUTON_PLAY) == LOW) {
    //Serial.println("Play/Pause");

    // On envoi la commande
    Consumer.write(MEDIA_PLAY_PAUSE);

    delay(200);
  }

  // On recoit des données donc on affiche le volume
  processReceivedData();
}

void drawSVGPath(const char* svgPath, uint16_t color) {
  uint8_t x = 0, y = 0;            // Position actuelle
  uint8_t xStart = 0, yStart = 0;  // Point de départ pour fermer le chemin

  const char* p = svgPath;
  while (*p) {
    char cmd = *p++;  // Lire la commande
    skipSeparators(p);

    switch (cmd) {
      case 'M': {  // MoveTo
        x = strtol(p, &p, 10);
        y = strtol(p, &p, 10);
        xStart = x;
        yStart = y;
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