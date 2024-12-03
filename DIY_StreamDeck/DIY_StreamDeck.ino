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

#define DEG2RAD 0.0174532925

const uint8_t MODE_STATIC = 1;
const uint8_t MODE_SCROLLING_STATIC = 2;
const uint8_t MODE_SCROLLING_RGB = 3;

// --- Objets globaux ---
Adafruit_GC9A01A tft = Adafruit_GC9A01A(TFT_CS, TFT_DC, TFT_RST);
WS2812 LED(NB_LED); // 14 LEDs
cRGB value;

char lastScreen = 'c';
char currentScreen = '?';

// Variables pour le chrono
unsigned long MS; 
unsigned long start;
unsigned long tmpStart;
const long resetInterval = 4;  // Intervalle de temps pour réinitialiser le timer

uint8_t lastVolume = 0;
//uint8_t lastCpuTemp = 0;
//uint8_t lastGpuTemp = 0;

uint8_t indexLed = 0;
uint8_t iterationDispVol = 0;

const uint8_t TEXT_SIZE_WIDTH = 6;
const uint8_t TEXT_SIZE_HEIGHT = 8;

//Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NB_LED,PIN_LED, NEO_GRB + NEO_KHZ800);

void clearScreen() {
  // On efface l'écran
  tft.fillScreen(GC9A01A_BLACK);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, const char* text) {
    size_t length = strlen(text);
    //tft.fillRect(x, y, length * size * TEXT_SIZE_WIDTH, size * TEXT_SIZE_HEIGHT, GC9A01A_BLACK);
    tft.setCursor(x, y);
    tft.setTextSize(size);
    //tft.setTextColor(color);
    tft.setTextColor(color, GC9A01A_BLACK);
    tft.println(text);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, const String& text) {
    size_t length = text.length();
    tft.fillRect(x, y, length * size * TEXT_SIZE_WIDTH, size * TEXT_SIZE_HEIGHT, GC9A01A_BLACK);
    tft.setCursor(x, y);
    tft.setTextSize(size);
    tft.setTextColor(color);
    tft.println(text);
}

void writeText(uint8_t x, uint8_t y, uint8_t size, uint16_t color, char character) {
    size_t length = 1; // Un seul caractère
    tft.fillRect(x, y, length * size * TEXT_SIZE_WIDTH, size * TEXT_SIZE_HEIGHT, GC9A01A_BLACK);
    tft.setCursor(x, y);
    tft.setTextSize(size);
    tft.setTextColor(color);
    tft.println(character);
}


void startScreen() {
    // On remet toutes les anciennes valeurs à 0 pour pas que l'affichage bug
    //lastVolume = lastCpuTemp = lastGpuTemp = iterationDispVol = 0;
    lastVolume = iterationDispVol = 0;

    writeText(40, 115, 2, GC9A01A_WHITE, "Connection ...");

    value.r = 0, value.g = 0, value.b = 0;
    for(uint8_t i=0; i<NB_LED; i++){ // On parcour toute les leds pour les éteindre
      LED.set_crgb_at(i, value);
      LED.sync();
    }

    // Chargement led bleue
    for(uint8_t i=0; i<NB_LED; i++){ // On parcour toute les leds
      if (Serial.available() > 0) { // Si on detecte une connexion au PC
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

void fillArc(uint8_t x, uint8_t y, uint8_t start_angle, uint8_t seg_count, uint8_t rx, uint8_t ry, uint8_t w, uint8_t colour){
    const uint8_t seg = 3; // Segments are 3 degrees wide = 120 segments for 360 degrees
    const uint8_t inc = 3; // Draw segments every 3 degrees, increase to 6 for segmented ring

    // Calculate first pair of coordinates for segment start
    float sx = cos((start_angle - 90) * DEG2RAD);
    float sy = sin((start_angle - 90) * DEG2RAD);
    uint8_t x0 = sx * (rx - w) + x;
    uint8_t y0 = sy * (ry - w) + y;
    uint8_t x1 = sx * rx + x;
    uint8_t y1 = sy * ry + y;

  // Draw colour blocks every inc degrees
  for (uint8_t i = start_angle; i < start_angle + seg * seg_count; i += inc) {
    // Calculate pair of coordinates for segment end
    float sx2 = cos((i + seg - 90) * DEG2RAD);
    float sy2 = sin((i + seg - 90) * DEG2RAD);
    uint8_t x2 = sx2 * (rx - w) + x;
    uint8_t y2 = sy2 * (ry - w) + y;
    uint8_t x3 = sx2 * rx + x;
    uint8_t y3 = sy2 * ry + y;

    tft.fillTriangle(x0, y0, x1, y1, x2, y2, colour);
    tft.fillTriangle(x1, y1, x2, y2, x3, y3, colour);

    // Copy segment end to sgement start for next segment
    x0 = x2;
    y0 = y2;
    x1 = x3;
    y1 = y3;
  }
}

void displayVolume(uint8_t receivedVolume){
    // Calcul de l'angle pour représenter le volume
    uint8_t volumeAngle = map(receivedVolume, 0, 100, 0, 360); // Volume en pourcentage vers angle en degre

    /*Serial.print("Angle : ");
    Serial.println(volumeAngle);*/

    // Centre du cercle
    uint8_t centerX = tft.width() / 2;
    uint8_t centerY = tft.height() / 2;

    // Si le volume de base est à 0 OU on est si on entre pour la première fois dans la fonction
    if (lastVolume == 0 || iterationDispVol == 0) {
      // On dessine l'arc pour le volume du son
      clearScreen();
      //fillArc(centerX, centerY, 0, volumeAngle/3, centerX, centerY, 20, GC9A01A_BLUE);
    }

    // on affiche seulement si le volume est différent de la dernière fois
    if (lastVolume != receivedVolume && lastVolume != 0) {
      // Calculer la différence entre le volume actuel et le volume reçu
      int8_t volumeDifference = receivedVolume - lastVolume;
      uint8_t newVolumeAngle = map(abs(volumeDifference), 0, 100, 0, 360); // Volume en pourcentage vers angle en degre

      // Si le volume augmente, Dessinez l'arc supplémentaire
      if (volumeDifference > 0) {
          //fillArc(centerX, centerY, volumeAngle, newVolumeAngle / 3, centerX, centerY, 20, GC9A01A_BLUE);
      }
      // Si le volume diminue, effacez une partie de l'arc en noir
      else if (volumeDifference < 0) {
          //fillArc(centerX, centerY, volumeAngle - newVolumeAngle, newVolumeAngle / 3, centerX, centerY, 20, GC9A01A_BLACK);
          //fillArc(centerX, centerY, volumeAngle - newVolumeAngle - 3, newVolumeAngle / 3 + 1, centerX, centerY, 22, GC9A01A_BLACK);
      }

      // Afficher l'icône de volume au milieu de l'écran
      //tft.drawXBitmap(70, 30, volume_icon, volume_icon_width, volume_icon_height, GC9A01A_WHITE);
      //drawScaledBitmap(70, 35, volume_icon, volume_icon_width, volume_icon_height, 3);
      drawSVGPath("M149 26 L153 26 L156 30 L156 52V144L154 147 L150 148 L136 142 L116 126 L104 109V68L114 51 L131 34ZM73 61H97V116H73V61", tft.color565(255, 255, 255));

      // Afficher le texte du volume en dessous de l'icône
      tft.fillRect(70, 150, 90, 60, GC9A01A_BLACK);
      writeText(receivedVolume < 10 ? 100 : 70, 150, 8, GC9A01A_WHITE, receivedVolume); // Afficher le volume, Si volume [0;9] x => 100 sinon x => 70
    }

    iterationDispVol++;
}

void setStaticLedColor(uint8_t r, uint8_t g, uint8_t b) {
    //pixels.clear(); //On éteuint8_t les leds allumé
    value.r = r; value.g = g; value.b = b;
    for(uint8_t i=0; i < NB_LED; i++){ // On parcour toute les leds
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
    indexLed += wait/10;
  } else if (indexLed >= 256) {
    indexLed = 0;
  }
}

cRGB Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  cRGB color = {0, 0, 0};

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

  if (indexLed >= 0 && indexLed < 256*5) { // 5 cycles of all colors on wheel
    for(uint8_t i=0; i< NB_LED; i++) {
      LED.set_crgb_at(i, Wheel(((i * 256 / NB_LED) + indexLed) & 255));
    }
    LED.sync();
    indexLed += wait/10;
  } else if (indexLed >= 256*5) {
    indexLed = 0;
  }
}

void processReceivedData() {
  // Obtient le temps actuel
  MS = millis()-start;
  uint8_t seconde = (MS / 1000) % 60;;

  /*Serial.print(F("Arduino : "));
  Serial.print((MS / 1000) / 60);
  Serial.print(F(" : "));
  Serial.print((MS / 1000) % 60);
  Serial.print(F(" : "));
  Serial.println(MS % 1000);*/

  // Vérifie si le port série est prêt à être écrit
  if (Serial.availableForWrite()) {
    /*Serial.print(F("Arduino : "));
    Serial.print(seconde);
    Serial.print(F(" <= "));
    Serial.print(resetInterval);
    Serial.print(F("  ---  ecran : "));
    Serial.print(currentScreen);
    Serial.print(F("   ----   Start : "));
    Serial.println(start);*/
    /*Serial.print(F("Index LED : "));
    Serial.println(indexLed);*/
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

    // Vérification du type de données reçu
    uint8_t volume = jsonDocument["vol"];
    if (/*jsonDocument.containsKey("volume") || */(currentScreen == 'v'/* && milliS != -1*/) || lastVolume != volume) {
      /*lastCpuTemp = 0;
      lastGpuTemp = 0; 
    
      // On réactive le chrono
      if (start == 0 || start == tmpStart) {
        start = millis();
      } else if (seconde > resetInterval) { // Si les 3s sont ecoulées alors on réinitialise millis
        //milliS = -1;
        start = millis();
        currentScreen = 'c';
      } else {
        currentScreen = 'v';
      }

      if (lastScreen == 't' || lastScreen == 'c') {
        clearScreen();
      }

      //previousMillis = currentMillis;  // Sauvegarde le temps actuel

      // Si le JSON contient la clé "volume", on récupère la valeur du volume
      volume = jsonDocument["volume"];
      displayVolume(volume);
      lastVolume = volume;
      lastScreen = 'v';*/
    } 
    if (jsonDocument.containsKey("screen")) {
      iterationDispVol = 0;

      if (lastScreen == 'v' || lastScreen == 'c') {
        clearScreen();
        lastScreen = 'i';
      }

      // ChatGPT = Gérer ici la logique d'affichage des données du JSON
      displayData(jsonDocument["screen"]);
    }

    // Si on recois l'odre de clear l'ecran
    if (jsonDocument.containsKey("clear")) {
      if (jsonDocument["clear"] == 1) clearScreen();
    }
    
    // Gestion de la couleur du ruban
    if (jsonDocument.containsKey("c")) {
        JsonObject colorData = jsonDocument["c"];
        switch (colorData["Mode"].as<uint8_t>()) {
            case MODE_STATIC:
                setStaticLedColor(colorData["R"], colorData["G"], colorData["B"]);
                break;
            case MODE_SCROLLING_STATIC:
                rainbow(colorData["S"]);
                break;
            case MODE_SCROLLING_RGB:
                rainbowCycle(colorData["S"]);
                break;
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
  if (data.containsKey("txt")) {
    JsonObject textData = data["txt"];
    uint16_t textColor = tft.color565(
        textData["c"]["R"], textData["c"]["G"], textData["c"]["B"]);

    // Accéder directement aux éléments du texte sans créer un objet JSON
    JsonArray textLines = textData["txt"].as<JsonArray>();

    for (JsonVariant line : textLines) {
      uint8_t x = line["x"];
      uint8_t y = line["y"];
      uint8_t size = line["s"];
      const char* content = line["c"];
      
      writeText(x, y, size, textColor, content);
    }
  }

  // Gestion des SVG
  if (data.containsKey("svg")) {
    JsonArray svgData = data["svg"].as<JsonArray>();

    if (data["svgC"] == 1) tft.fillRect(0, 60, 240, 115, GC9A01A_BLACK);

    // Itérer directement sur les éléments du tableau SVG
    for (JsonVariant svg : svgData) {
      uint16_t svgColor = tft.color565(svg["c"]["R"], svg["c"]["G"], svg["c"]["B"]);
      const char* path = svg["p"];
      
      drawSVGPath(path, svgColor);
    }

    // On clear la partie du SVG
    /*if (data.containsKey("svgC")) {
        if (data["svgC"] == 1) {
          for (JsonVariant svg : svgData) {
            const char* path = svg["p"];
            
            drawSVGPath(path, GC9A01A_BLACK);
          }
        }
    }*/
  }
}

void setup() {
  // Initialisation du bouton 1
  pinMode(BOUTON_PLAY,INPUT_PULLUP);

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
  clearScreen();
  
  // Attente de la connexion au port série
  while (!Serial) {
    startScreen();
  }

  start = 0;
  tmpStart = start;
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

void drawSVGPath(const char *svgPath, uint16_t color) {
  uint16_t x = 0, y = 0;       // Position actuelle
  uint16_t xStart = 0, yStart = 0; // Point de départ pour fermer le chemin

  const char *p = svgPath;
  while (*p) {
    char cmd = *p++; // Lire la commande

    // Ignorer les séparateurs
    while (*p == ' ' || *p == ',') p++;

    if (cmd == 'M') { // MoveTo
      x = strtol(p, &p, 10);
      y = strtol(p, &p, 10);
      xStart = x;
      yStart = y;
    } 
    else if (cmd == 'L') { // LineTo
      uint16_t x1 = strtol(p, &p, 10);
      uint16_t y1 = strtol(p, &p, 10);
      tft.drawLine(x, y, x1, y1, color);
      x = x1;
      y = y1;
    } 
    else if (cmd == 'H') { // Ligne horizontale
      uint16_t x1 = strtol(p, &p, 10);
      tft.drawLine(x, y, x1, y, color);
      x = x1;
    } 
    else if (cmd == 'V') { // Ligne verticale
      uint16_t y1 = strtol(p, &p, 10);
      tft.drawLine(x, y, x, y1, color);
      y = y1;
    } 
    else if (cmd == 'Z') { // ClosePath
      tft.drawLine(x, y, xStart, yStart, color);
      x = xStart;
      y = yStart;
    }
    while (*p == ' ' || *p == ',') p++; // Sauter les séparateurs
  }
}