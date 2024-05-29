// Aide : https://www.waveshare.com/wiki/1.28inch_LCD_Module#Resources
// Aide : https://dronebotworkshop.com/gc9a01/

#include <Adafruit_GFX.h>
#include <Adafruit_GC9A01A.h>
#include <HID-Project.h>
#include <HID-Settings.h>
#include <ArduinoJson.h>
#include <ArduinoJson.hpp>
#include <WS2812.h>

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

#define icon_cpu_width 32
#define icon_cpu_height 32
const unsigned char icon_cpu[] PROGMEM = {
   0x00, 0x21, 0x84, 0x00, 0x80, 0x52, 0x4a, 0x01, 0x80, 0x52, 0x4a, 0x01,
   0x60, 0xfe, 0xff, 0x07, 0x10, 0x00, 0x00, 0x08, 0xc8, 0xff, 0xff, 0x13,
   0x28, 0x00, 0x00, 0x14, 0xae, 0x01, 0x00, 0x74, 0xa9, 0x00, 0x00, 0x94,
   0x2e, 0x00, 0x00, 0x74, 0x28, 0x00, 0x00, 0x14, 0x28, 0x00, 0x00, 0x14,
   0x2e, 0xcc, 0x49, 0x74, 0x29, 0x52, 0x4a, 0x94, 0x2e, 0x52, 0x4a, 0x74,
   0x28, 0xc2, 0x49, 0x14, 0x28, 0x42, 0x48, 0x14, 0x2e, 0x52, 0x48, 0x74,
   0x29, 0x52, 0x48, 0x94, 0x2e, 0x4c, 0x30, 0x74, 0x28, 0x00, 0x00, 0x14,
   0x28, 0x00, 0x00, 0x14, 0x2e, 0x00, 0x00, 0x74, 0x29, 0x00, 0x00, 0x94,
   0x2e, 0x00, 0x00, 0x74, 0x28, 0x00, 0x00, 0x14, 0xc8, 0xff, 0xff, 0x13,
   0x10, 0x00, 0x00, 0x08, 0xe0, 0xff, 0xff, 0x07, 0x80, 0x52, 0x4a, 0x01,
   0x80, 0x52, 0x4a, 0x01, 0x00, 0x21, 0x84, 0x00 };

#define icon_gpu_width 32
#define icon_gpu_height 32
const unsigned char icon_gpu[] PROGMEM = {
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x11, 0x00, 0x00, 0x00,
   0x16, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x00, 0xf4, 0xff, 0xff, 0x7f,
   0x16, 0x00, 0x00, 0x80, 0xd5, 0x00, 0x00, 0x80, 0x55, 0x00, 0x00, 0x80,
   0x15, 0x00, 0x00, 0x80, 0x15, 0x30, 0x27, 0x81, 0x16, 0x48, 0x29, 0x81,
   0x14, 0x48, 0x29, 0x81, 0x17, 0x08, 0x27, 0x81, 0x15, 0x68, 0x21, 0x81,
   0x15, 0x48, 0x21, 0x81, 0x15, 0x48, 0x21, 0x81, 0x15, 0x30, 0xc1, 0x80,
   0x15, 0x00, 0x00, 0x80, 0x15, 0x00, 0x00, 0x80, 0x16, 0x00, 0x00, 0x80,
   0xf4, 0xff, 0xff, 0x7f, 0x54, 0x92, 0x92, 0x24, 0x94, 0x7f, 0xfc, 0x1f,
   0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

#define volume_icon_width 32
#define volume_icon_height 32
const unsigned char volume_icon[] PROGMEM = {
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x07, 0x00,
   0x00, 0x80, 0x07, 0x00, 0x00, 0xe0, 0x07, 0x00, 0x00, 0xf0, 0x07, 0x0c,
   0x00, 0xf8, 0x07, 0x1c, 0x00, 0xfc, 0x07, 0x18, 0x00, 0xff, 0x87, 0x39,
   0x80, 0xff, 0x87, 0x73, 0xff, 0xff, 0x07, 0x63, 0xff, 0xff, 0x07, 0x67,
   0xff, 0xff, 0x07, 0xe6, 0xff, 0xff, 0x07, 0xc6, 0xff, 0xff, 0x07, 0xce,
   0xff, 0xff, 0x07, 0xcc, 0xff, 0xff, 0x07, 0xcc, 0xff, 0xff, 0x07, 0xce,
   0xff, 0xff, 0x07, 0xc6, 0xff, 0xff, 0x07, 0xe6, 0xff, 0xff, 0x07, 0x67,
   0xff, 0xff, 0x07, 0x63, 0x80, 0xff, 0x87, 0x73, 0x00, 0xff, 0x87, 0x39,
   0x00, 0xfc, 0x07, 0x18, 0x00, 0xf8, 0x07, 0x1c, 0x00, 0xf0, 0x07, 0x0c,
   0x00, 0xe0, 0x07, 0x00, 0x00, 0x80, 0x07, 0x00, 0x00, 0x00, 0x07, 0x00,
   0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00 };

Adafruit_GC9A01A tft = Adafruit_GC9A01A(TFT_CS, TFT_DC, TFT_RST);

char lastScreen = 'c';
char currentScreen = '?';

// Variables pour le chrono
unsigned long MS; 
unsigned long start;
unsigned long tmpStart;
const long resetInterval = 4;  // Intervalle de temps pour réinitialiser le timer

uint8_t lastVolume = 0;
uint8_t lastCpuTemp = 0;
uint8_t lastGpuTemp = 0;

uint8_t indexLed = 0;
uint8_t iterationDispVol = 0;

const unsigned char MODE_STATIC = 1;
const unsigned char MODE_SCROLLING_STATIC = 2;
const unsigned char MODE_SCROLLING_RGB = 3;

//Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NB_LED,PIN_LED, NEO_GRB + NEO_KHZ800);
WS2812 LED(NB_LED); // 14 LEDs
cRGB value;

void clearScreen() {
  // On efface l'écran
  tft.fillScreen(GC9A01A_BLACK);
}

template <typename T>
void writeText(int x, int y, int size, uint16_t color, T text) {
    tft.setCursor(x, y);
    tft.setTextSize(size);
    tft.setTextColor(color);
    tft.println(text);
}

void startScreen() {
    // On remet toutes les anciennes valeurs à 0 pour pas que l'affichage bug
    lastVolume = 0;
    lastCpuTemp = 0;
    lastGpuTemp = 0; 
    iterationDispVol = 0;

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

void drawScaledBitmap(int x, int y, const unsigned char* bitmap, int width, int height, int scale) {
    for(int i = 0; i < width; i++) {
        for(int j = 0; j < height; j++) {
            if(pgm_read_byte(bitmap + (j * width + i) / 8) & (128 >> (7 - ((j * width + i) % 8)))) {
                tft.fillRect(x + i * scale, y + j * scale, scale, scale, GC9A01A_WHITE);
            }
        }
    }
}

uint8_t fillArc(uint8_t x, uint8_t y, uint8_t start_angle, uint8_t seg_count, uint8_t rx, uint8_t ry, uint8_t w, uint8_t colour){
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
      fillArc(centerX, centerY, 0, volumeAngle/3, centerX, centerY, 20, GC9A01A_BLUE);
    }

    // on affiche seulement si le volume est différent de la dernière fois
    if (lastVolume != receivedVolume && lastVolume != 0) {
      // Calculer la différence entre le volume actuel et le volume reçu
      int8_t volumeDifference = receivedVolume - lastVolume;
      uint8_t newVolumeAngle = map(abs(volumeDifference), 0, 100, 0, 360); // Volume en pourcentage vers angle en degre

      // Si le volume augmente, Dessinez l'arc supplémentaire
      if (volumeDifference > 0) {
          fillArc(centerX, centerY, volumeAngle, newVolumeAngle / 3, centerX, centerY, 20, GC9A01A_BLUE);
      }
      // Si le volume diminue, effacez une partie de l'arc en noir
      else if (volumeDifference < 0) {
          //fillArc(centerX, centerY, volumeAngle - newVolumeAngle, newVolumeAngle / 3, centerX, centerY, 20, GC9A01A_BLACK);
          fillArc(centerX, centerY, volumeAngle - newVolumeAngle - 3, newVolumeAngle / 3 + 1, centerX, centerY, 22, GC9A01A_BLACK);
      }

      // Afficher l'icône de volume au milieu de l'écran
      //tft.drawXBitmap(70, 30, volume_icon, volume_icon_width, volume_icon_height, GC9A01A_WHITE);
      drawScaledBitmap(70, 35, volume_icon, volume_icon_width, volume_icon_height, 3);

      // Afficher le texte du volume en dessous de l'icône
      tft.fillRect(70, 150, 90, 60, GC9A01A_BLACK);
      writeText(receivedVolume < 10 ? 100 : 70, 150, 8, GC9A01A_WHITE, receivedVolume); // Afficher le volume, Si volume [0;9] x => 100 sinon x => 70
    }

    iterationDispVol++;
}

void displayTemp(uint8_t cpuTemp, uint8_t gpuTemp) {
    // Afficher l'icône de CPU en haut
    //tft.drawXBitmap(50, 53, icon_cpu, icon_cpu_width, icon_cpu_height, GC9A01A_WHITE);
    drawScaledBitmap(50, 45, icon_cpu, icon_cpu_width, icon_cpu_height, 2);

    if (cpuTemp != lastCpuTemp) {
      tft.fillRect(130, 60, 80, 80, GC9A01A_BLACK);
      writeText(130, 60, 5, GC9A01A_WHITE, cpuTemp); // Afficher la temperature cpu
    }
    
    // Afficher l'icône de GPU en bas
    //tft.drawXBitmap(50, 130, icon_gpu, icon_gpu_width, icon_gpu_height, GC9A01A_WHITE);
    drawScaledBitmap(50, 130, icon_gpu, icon_gpu_width, icon_gpu_height, 2);

    if (gpuTemp != lastGpuTemp){
      tft.fillRect(130, 145, 80, 80, GC9A01A_BLACK);
      writeText(130, 145, 5, GC9A01A_WHITE, gpuTemp); // Afficher la temperature gpu
    } 
}

void setStaticLedColor(uint8_t r, uint8_t g, uint8_t b) {
    //pixels.clear(); //On éteuint8_t les leds allumé
    for(uint8_t i=0; i < NB_LED; i++){ // On parcour toute les leds
      value.r = r; value.g = g; value.b = b;
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
  cRGB color;

  if (WheelPos < 85) {
    color.r = 255 - WheelPos * 3;
    color.g = 0;
    color.b = WheelPos * 3;
  } else if (WheelPos < 170) {
    WheelPos -= 85;
    color.r = 0;
    color.g = WheelPos * 3;
    color.b = 255 - WheelPos * 3;
  } else {
    WheelPos -= 170;
    color.r = WheelPos * 3;
    color.g = 255 - WheelPos * 3;
    color.b = 0;
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
    StaticJsonDocument<150> jsonDocument;
    DeserializationError error = deserializeJson(jsonDocument, Serial);

    if (error) {
      // Gestion des erreurs de lecture JSON
      /*Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());*/
      return;
    }

    // Vérification du type de données reçu
    uint8_t volume = jsonDocument["volume"];
    if (/*jsonDocument.containsKey("volume") || */(currentScreen == 'v'/* && milliS != -1*/) || lastVolume != volume) {
      lastCpuTemp = 0;
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
      lastScreen = 'v';
    } else if (jsonDocument.containsKey("temperature")/*jsonDocument.containsKey("cpu") && jsonDocument.containsKey("gpu")*/) {
      iterationDispVol = 0;

      if (lastScreen == 'v' || lastScreen == 'c') {
        clearScreen();
      }

      // Si le JSON contient les clés "cpu" et "gpu", on récupère les valeurs de température CPU et GPU
      uint8_t cpuTemp = jsonDocument["temperature"]["cpu"];
      uint8_t gpuTemp = jsonDocument["temperature"]["gpu"];
      displayTemp(cpuTemp, gpuTemp);
      lastScreen = 't';
      lastCpuTemp = cpuTemp;
      lastGpuTemp = gpuTemp;
    }
    
    // Gestion de la couleur du ruban
    if (jsonDocument.containsKey("color")) {
      // on verifie le type du RGB
      unsigned char mode = jsonDocument["color"]["Mode"];
      uint8_t speed = jsonDocument["color"]["Speed"];

      switch(mode){
        case MODE_STATIC: {// Mode statique
          uint8_t brightness = jsonDocument["color"]["Brightness"];
          uint8_t r = (uint8_t) jsonDocument["color"]["R"] * (brightness / 100.0);
          uint8_t g = (uint8_t) jsonDocument["color"]["G"] * (brightness / 100.0);
          uint8_t b = (uint8_t) jsonDocument["color"]["B"] * (brightness / 100.0);

          setStaticLedColor(r, g, b);
          break;
        }

        case MODE_SCROLLING_STATIC: {// Défilement statique
          rainbow(speed);
          break;
        }

        case MODE_SCROLLING_RGB: {// Défilement RGB
          rainbowCycle(speed);
          break;
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