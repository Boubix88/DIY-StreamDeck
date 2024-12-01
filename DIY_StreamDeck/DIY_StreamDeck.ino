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
    //startScreen();
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
  // Couleur
  //uint16_t color = tft.color565(255, 255, 255); // Blanc

  // Dessin du chemin SVG
  //drawSVGPath("M128 128 L100 10 L100 100 L10 100 Z", color);
  //drawSVGPath("M6 1 H8 V15 H6 L2 11 H0 V5 H2 L6 1Z", color);
  //drawSVGPath("M60 60 L100 60 L100 140 L60 140 L60 60 M120 140 L120 60 L180 20 L180 180 L120 140", color); // Icone volume
  //drawSVGPath("M149 26 L153 26 L156 30 L156 52V144L154 147 L150 148 L136 142 L116 126 L104 109V68L114 51 L131 34ZM73 61H97V116H73V61", color); // Celui la pas mal
  //drawSVGPath("M160 76 L163 77 L166 76 L169 74 L170 70 L169 67 L166 65 L143 52 L106 50 L83 57 L80 58 L79 61 L79 64 L80 67 L84 69 L87 68 L106 62 L140 64 L160 76 M161 93 L161 91 L160 88 L158 87 L138 75 L110 72 L87 79 L85 80 L84 82 L84 85 L85 87 L88 88 H90 L110 82 L135 85 L152 95 L155 97 L158 97 L160 95 Z M152 111 L153 109 L152 107 L151 106 L134 96 L113 94 L89 99 L87 100 L86 101 L85 103 L86 106 L88 107 L91 106 L113 101 L131 103 L146 112 L148 113 L151 112 L152 111 Z M123 15 L158 20 L175 32 L186 49 L190 83 L186 118 L175 135 L158 146 L123 152 L88 146 L70 135 L60 118 L56 83 L60 48 L72 32 L89 20 L123 15 Z", tft.color565(0, 255, 0));
  //drawSVGPath("M164 21 L164 21 L121 20 L79 21 L66 23 L58 28 L53 36 L50 70 L53 104 L58 112 L66 117 L121 120 L177 117 L185 112 L190 104 L193 70 L190 36 L185 29 L177 24 L164 21Z", tft.color565(255, 0, 0)); // youtub tour
  //drawSVGPath("M107 91 L144 70 L107 49V91Z", color); // youtube centre
  //drawSVGPath("M96 106 L59 135 L42 127V51L59 43 L96 72 L155 13 L194 28V150L155 165 L96 106ZM154 117V62L119 89 L154 117ZM60 107 L79 90 L60 71V107Z", tft.color565(0,0,255)); // VsCode
  //drawSVGPath("M181 26H53V154H181V26ZM163 43H70V136H163V43ZM98 61V55H81V61H86V83H81V90H98V83H93V61H98ZM111 90 L109 89 L104 85 L108 79 L111 82 L115 83 L118 82 L119 77V55H127V77L127 82 L126 85 L124 88 L121 90 L118 91 L114 91ZM115 120H80V126H115V120Z", color); // Inteliji
  //drawSVGPath("M55 26H94L97 27 L98 28 L100 30 L102 33 L104 35 L106 36H180V132H161V141H132V132H103V141H74V132H55V26ZM65 45H91L94 44 L95 43 L96 41 L95 38 L94 37 L91 36H65V45ZM170 45H107L104 46 L102 48 L99 52 L97 54 L94 55H65V122H74V84H161V122H170V45ZM151 93H84V132H93V103H141V132H151V93ZM132 112H103V122H132V112Z", tft.color565(249, 198, 59)); // File explorer
  //drawSVGPath("M154 93 L152 86 L147 81 L141 79 L135 81 L130 86 L129 93 L131 99 L135 103 L141 105 L148 103 L152 99ZM108 92 L106 85 L101 81 L95 79 L88 81 L83 86 L81 93 L83 99 L88 104 L95 106 L101 104 L106 99ZM167 43 L167 43 L177 61 L185 84 L189 105V123L188 126 L175 137 L153 143 L153 141 L148 136 L145 131V129L156 126 L157 124V122L155 121 L153 121 L136 126 L118 128 L99 126 L83 121H81L79 122V124L80 126 L91 129 L91 131 L88 137 L83 141 L83 143 L62 138 L48 126 L47 123V104L50 84 L57 61 L69 43 L69 43 L81 35 L97 33 L100 35 L101 41 L118 43 L135 41 L136 35 L139 33 L155 35 L167 43Z", tft.color565(0,0,255)); // Discord
  //drawSVGPath("M167 52 L170 45 L162 36 L147 34 L136 21 H96 L84 34 L70 36 L61 45 L64 52 L60 63 L73 112 L85 132 L108 148 L116 151 L123 148 L146 132 L158 112 L171 63 L167 52 Z M144 42 L158 63 L155 71 L144 83 L141 86 L141 90 L143 94 L143 99 L141 103 L135 105 L127 102 L120 96 L118 94 L119 91 L125 86 L130 83 L131 80 L130 75 L126 67 L127 64 L134 60 L142 57 L143 56 L142 55 L131 55 L123 57 L122 59 L122 61 L126 77 L125 80 L123 82 L116 83 L109 82 L107 80 L106 77 L110 61 L110 59 L108 57 L101 55 L88 55 L87 56 L88 57 L97 60 L104 64 L105 67 L101 75 L100 80 L102 83 L106 86 L113 91 L114 94 L112 96 L105 102 L96 105 L91 103 L88 99 L88 94 L90 90 L90 86 L87 83 L77 71 L73 63 L87 42 L102 44 L110 42 L116 41 L122 42 L130 44 L144 42 Z M133 110 L134 111 L133 113 L120 123 L116 124 L112 123 L100 113 L99 111 L100 110 L106 106 L116 103 L126 106 L132 109 Z", tft.color565(255, 32, 0)); // Brave
}

void drawSVGPath(const char *svgPath, uint16_t color) {
  // Variables pour stocker la position courante
  int x = 0, y = 0;       // Position actuelle
  int xStart = 0, yStart = 0; // Point de départ pour fermer le chemin

  // Lire chaque commande dans le chemin
  const char *p = svgPath;
  while (*p) {
    char cmd = *p++;

    if (cmd == 'M') { // MoveTo
      sscanf(p, "%d %d", &x, &y);
      xStart = x;
      yStart = y; // Enregistrer le point de départ
      while (*p && (*p == ' ' || *p == ',')) p++; // Avancer le pointeur
    } 
    else if (cmd == 'H') { // Ligne horizontale
      int x1;
      sscanf(p, "%d", &x1);
      tft.drawLine(x, y, x1, y, color); // Tracer la ligne
      x = x1; // Mettre à jour la position
      while (*p && (*p == ' ' || *p == ',')) p++;
    } 
    else if (cmd == 'V') { // Ligne verticale
      int y1;
      sscanf(p, "%d", &y1);
      tft.drawLine(x, y, x, y1, color); // Tracer la ligne
      y = y1; // Mettre à jour la position
      while (*p && (*p == ' ' || *p == ',')) p++;
    } 
    else if (cmd == 'L') { // Ligne diagonale
      int x1, y1;
      sscanf(p, "%d %d", &x1, &y1);
      tft.drawLine(x, y, x1, y1, color); // Tracer la ligne
      x = x1;
      y = y1;
      while (*p && (*p == ' ' || *p == ',')) p++;
    } 
    else if (cmd == 'Z') { // ClosePath
      tft.drawLine(x, y, xStart, yStart, color); // Retourner au point de départ
      x = xStart;
      y = yStart;
    }
    else if (cmd == 'C' || cmd == 'c') { // Courbe de Bézier cubique
      float x1, y1, x2, y2, x3, y3;
      sscanf(p, "%f,%f %f,%f %f,%f", &x1, &y1, &x2, &y2, &x3, &y3);
      if (cmd == 'c') { // Relative cubic Bézier curve
        x1 += x;
        y1 += y;
        x2 += x;
        y2 += y;
        x3 += x;
        y3 += y;
      }
      // Tracer la courbe de Bézier cubique (approximation)
      for (float t = 0; t <= 1; t += 0.01) {
        float xt = pow(1 - t, 3) * x + 3 * pow(1 - t, 2) * t * x1 + 3 * (1 - t) * pow(t, 2) * x2 + pow(t, 3) * x3;
        float yt = pow(1 - t, 3) * y + 3 * pow(1 - t, 2) * t * y1 + 3 * (1 - t) * pow(t, 2) * y2 + pow(t, 3) * y3;
        tft.drawPixel(xt, yt, color);
      }
      x = x3;
      y = y3;
      while (*p && *p != ' ' && *p != ',') p++;
    }
  }
}