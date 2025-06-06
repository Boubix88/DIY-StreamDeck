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
#define DIRECT_MODE_INPUT(base, mask) ((*((base) + 1)) &= ~(mask))
#define DIRECT_MODE_OUTPUT(base, mask) ((*((base) + 1)) |= (mask))
#define DIRECT_WRITE_LOW(base, mask) ((*((base) + 2)) &= ~(mask))
#define DIRECT_WRITE_HIGH(base, mask) ((*((base) + 2)) |= (mask))

// --- Définition des constantes et types ---
#define BOUTON_KEYS A1
#define BOUTON_SCREEN 6
#define BOUTON_VOL_UP 3
#define BOUTON_VOL_DOWN 2
#define NB_BUTTONS 4

#define TFT_DC 7
#define TFT_CS 10  //14
#define TFT_RST 8

#define NB_LED 14
#define PIN_LED 9

#define MODE_STATIC 1
#define MODE_SCROLLING_STATIC 2
#define MODE_SCROLLING_RGB 3
// Utiliser un tableau statique de taille fixe (assez grand pour nos besoins)
#define MAX_COLOR_DATA_SIZE 10

// --- Objets globaux ---
Adafruit_GC9A01A tft = Adafruit_GC9A01A(TFT_CS, TFT_DC, TFT_RST);
WS2812 LED(NB_LED);  // 14 LEDs
cRGB value;

char lastScreen = 'c';
char currentScreen = '?';
uint8_t indexLed = 0;

// Registres et masques pour l'accès direct aux pins
volatile uint8_t* screenButtonReg;
uint8_t screenButtonMask;
volatile uint8_t* volUpButtonReg;
uint8_t volUpButtonMask;
volatile uint8_t* volDownButtonReg;
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
  // Afficher les valeurs reçues pour débogage
  /*Serial.print(F("setStaticLedColor - R: "));
  Serial.print(r);
  Serial.print(F(" G: "));
  Serial.print(g);
  Serial.print(F(" B: "));
  Serial.println(b);*/

  // Désactiver les interruptions pendant la mise à jour des LEDs
  noInterrupts();

  value.r = r;
  value.g = g;
  value.b = b;

  // Afficher la valeur qui sera utilisée
  /*Serial.print(F("Valeur définie - R: "));
  Serial.print(value.r);
  Serial.print(F(" G: "));
  Serial.print(value.g);
  Serial.print(F(" B: "));
  Serial.println(value.b);*/

  // Mettre à jour toutes les LEDs
  for (uint8_t i = 0; i < NB_LED; i++) {
    LED.set_crgb_at(i, value);
  }

  // Synchroniser les LEDs
  LED.sync();

  // Réactiver les interruptions après la mise à jour
  interrupts();

  //Serial.println(F("Mise à jour des LEDs terminée"));
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
  static uint8_t buffer[1024];  // Augmenté la taille du buffer
  static size_t bufferPos = 0;
  static bool inMessage = false;
  static unsigned long lastDataTime = 0;
  static bool messageComplete = false;

  // Lire les données disponibles
  while (Serial.available() > 0 && bufferPos < sizeof(buffer) - 1) {
    uint8_t c = Serial.read();
    buffer[bufferPos++] = c;
    lastDataTime = millis();
    
    // Détection du début d'un message (0xB9 est le premier octet du message)
    if (c == 0xB9 && !inMessage) {
      inMessage = true;
      bufferPos = 1;  // On garde le 0xB9
      messageComplete = false;
    }
  }

  // Vérifier si on a un message complet
  if (inMessage) {
    // Attendre un peu pour être sûr d'avoir tout le message
    if (millis() - lastDataTime > 50) {  // Augmenté le timeout à 50ms
      messageComplete = true;
    }
    
    // Si le buffer est presque plein, traiter quand même
    if (bufferPos >= sizeof(buffer) - 1) {
      messageComplete = true;
    }

    if (messageComplete && bufferPos > 0) {
      // Afficher les premiers octets pour debug
      Serial.print(F("\n--- Traitement des données ---\nTaille du message: "));
      Serial.print(bufferPos);
      Serial.println(F(" octets"));
      Serial.print(F("CBOR brut (16 premiers octets): "));
      for (int i = 0; i < min(16, (int)bufferPos); i++) {
        if (buffer[i] < 0x10) Serial.print('0');
        Serial.print(buffer[i], HEX);
        Serial.print(' ');
      }
      Serial.println();

      // Parser le CBOR
      CborParser parser;
      CborValue root;
      CborError err = cbor_parser_init(buffer, bufferPos, 0, &parser, &root);

      if (err != CborNoError) {
        Serial.print(F("Erreur CBOR: "));
        Serial.println(cbor_error_string(err));
      } else {
        // Afficher le type de la racine
        CborType type = cbor_value_get_type(&root);
        Serial.print(F("Type racine: "));
        switch (type) {
          case CborArrayType: Serial.println(F("Array")); break;
          case CborMapType: Serial.println(F("Map")); break;
          case CborIntegerType: Serial.println(F("Integer")); break;
          case CborByteStringType: Serial.println(F("Byte String")); break;
          case CborTextStringType: Serial.println(F("Text String")); break;
          case CborTagType: Serial.println(F("Tag")); break;
          case CborSimpleType: Serial.println(F("Simple Type")); break;
          case CborBooleanType: Serial.println(F("Boolean")); break;
          case CborNullType: Serial.println(F("Null")); break;
          case CborUndefinedType: Serial.println(F("Undefined")); break;
          default: Serial.println(F("Inconnu")); break;
        }

        // Si c'est une map, essayer d'extraire les données
        if (cbor_value_is_map(&root)) {
          CborValue screenValue;
          if (cbor_value_map_find_value(&root, "s", &screenValue) == CborNoError) {
            if (cbor_value_is_map(&screenValue)) {
              displayDataCBOR_minimal(screenValue);
            } else {
              Serial.println(F("La valeur de 's' n'est pas une map"));
            }
          } else {
            Serial.println(F("Clé 's' non trouvée dans la racine"));
          }
          
          // Gestion des couleurs RGB
          CborValue colorValue;
          if (cbor_value_map_find_value(&root, "c", &colorValue) == CborNoError) {
            if (cbor_value_is_array(&colorValue)) {
              CborValue colorElement;
              cbor_value_enter_container(&colorValue, &colorElement);
              
              uint8_t r = 0, g = 0, b = 0, mode = 0, speed = 0;
              int i = 0;
              
              while (!cbor_value_at_end(&colorElement)) {
                int val = 0;
                cbor_value_get_int(&colorElement, &val);
                
                switch (i) {
                  case 0: mode = (uint8_t)val; break;
                  case 1: r = (uint8_t)val; break;
                  case 2: g = (uint8_t)val; break;
                  case 3: b = (uint8_t)val; break;
                  case 4: speed = (uint8_t)val; break;
                }
                
                cbor_value_advance(&colorElement);
                i++;
              }
              
              // Appliquer la couleur
              if (mode == 1) { // Mode couleur statique
                setStaticLedColor(r, g, b);
              }
            }
          }
        }
      }
      
      // Réinitialiser pour le prochain message
      inMessage = false;
      bufferPos = 0;
      Serial.println(F("--- Fin du traitement ---"));
    }
  }
}

// Fonction pour afficher les données CBOR
void displayDataCBOR(CborValue& data) {
  Serial.println(F("Traitement des données d'écran..."));

  // Désactiver les interruptions pendant l'affichage
  noInterrupts();

  // Vérifier si c'est un écran système
  CborValue screenValue;
  if (cbor_value_map_find_value(&data, "s", &screenValue) == CborNoError && cbor_value_is_map(&screenValue)) {
    Serial.println(F("Données système détectées"));

    // Effacer l'écran si nécessaire
    if (lastScreen != 's') {
      clearScreen();
      lastScreen = 's';
    }

    // Afficher le titre
    CborValue titleValue;
    if (cbor_value_map_find_value(&screenValue, "title", &titleValue) == CborNoError) {
      if (cbor_value_is_text_string(&titleValue)) {
        char title[50];
        size_t len;
        cbor_value_calculate_string_length(&titleValue, &len);
        if (len < sizeof(title)) {
          cbor_value_copy_text_string(&titleValue, title, &len, NULL);
          writeText(10, 10, 2, GC9A01A_WHITE, title);
        }
      }
    }

    // Afficher les items
    CborValue itemsValue;
    if (cbor_value_map_find_value(&screenValue, "items", &itemsValue) == CborNoError && cbor_value_is_array(&itemsValue)) {

      size_t itemCount = 0;
      cbor_value_get_array_length(&itemsValue, &itemCount);
      Serial.print(F("Nombre d'items: "));
      Serial.println(itemCount);

      CborValue itemIt;
      cbor_value_enter_container(&itemsValue, &itemIt);

      int yPos = 40;  // Position Y de départ pour les items

      while (!cbor_value_at_end(&itemIt) && cbor_value_is_map(&itemIt)) {
        CborValue labelValue, valueValue;

        // Récupérer le label
        if (cbor_value_map_find_value(&itemIt, "label", &labelValue) == CborNoError && cbor_value_is_text_string(&labelValue)) {
          char label[30];
          size_t len;
          cbor_value_calculate_string_length(&labelValue, &len);
          if (len < sizeof(label)) {
            cbor_value_copy_text_string(&labelValue, label, &len, NULL);
            writeText(10, yPos, 1, GC9A01A_WHITE, label);
            writeText(10, yPos, 1, GC9A01A_WHITE, ": ");
          }
        }

        // Récupérer la valeur
        if (cbor_value_map_find_value(&itemIt, "value", &valueValue) == CborNoError) {
          char valueStr[20];

          if (cbor_value_is_text_string(&valueValue)) {
            size_t len;
            cbor_value_calculate_string_length(&valueValue, &len);
            if (len < sizeof(valueStr)) {
              cbor_value_copy_text_string(&valueValue, valueStr, &len, NULL);
              writeText(70, yPos, 1, GC9A01A_WHITE, valueStr);
            }
          } else if (cbor_value_is_integer(&valueValue)) {
            int value;
            cbor_value_get_int(&valueValue, &value);
            sprintf(valueStr, "%d", value);
            writeText(70, yPos, 1, GC9A01A_WHITE, valueStr);
          } else if (cbor_value_is_float(&valueValue)) {
            double value;
            cbor_value_get_double(&valueValue, &value);
            dtostrf(value, 0, 1, valueStr);  // 1 décimale
            writeText(70, yPos, 1, GC9A01A_WHITE, valueStr);
          }
        }

        yPos += 20;  // Espacement entre les lignes
        cbor_value_advance(&itemIt);
      }

      cbor_value_leave_container(&itemsValue, &itemIt);
    }

    // Réactiver les interruptions après l'affichage
    interrupts();
    return;
  }

  // Gestion des textes (ancien système)
  CborValue textValue;
  /*if (cbor_value_map_find_value(&data, "t", &textValue) == CborNoError) {
    //Serial.println(F("Clé 't' trouvée"));

    if (cbor_value_is_map(&textValue)) {
      //Serial.println(F("Données de texte valides (map)"));

      // Récupération de la couleur du texte
      uint16_t textColor = 0xFFFF;  // Blanc par défaut
      CborValue colorValue;
      if (cbor_value_map_find_value(&textValue, "c", &colorValue) == CborNoError) {
        Serial.println(F("Clé 'c' (couleur) trouvée"));

        if (cbor_value_is_text_string(&colorValue)) {
          size_t len;
          char colorStr[8] = { 0 };  // Initialisation à zéro
          cbor_value_calculate_string_length(&colorValue, &len);
          if (len < sizeof(colorStr)) {
            cbor_value_copy_text_string(&colorValue, colorStr, &len, NULL);
            colorStr[len] = '\0';  // Assure la terminaison de la chaîne
            Serial.print(F("Couleur du texte: "));
            Serial.println(colorStr);
            textColor = hexToColor565(colorStr);
          } else {
            Serial.println(F("Erreur: Chaîne de couleur trop longue"));
          }
        } else {
          Serial.println(F("Attention: La valeur de couleur n'est pas une chaîne"));
        }
      }

      // Gestion des textes
      CborValue textArrayValue;
      if (cbor_value_map_find_value(&textValue, "t", &textArrayValue) == CborNoError) {
        Serial.println(F("Clé 't' (tableau de textes) trouvée"));

        if (cbor_value_is_array(&textArrayValue)) {
          size_t textCount = 0;
          cbor_value_get_array_length(&textArrayValue, &textCount);
          Serial.print(F("Nombre de textes à afficher: "));
          Serial.println(textCount);

          CborValue arrayIt;
          CborError enterErr = cbor_value_enter_container(&textArrayValue, &arrayIt);
          if (enterErr != CborNoError) {
            Serial.print(F("ERREUR: Impossible d'entrer dans le conteneur: "));
            Serial.println(enterErr);
            return;
          }

          int textIndex = 0;
          const int MAX_TEXTS = 20;  // Sécurité contre les boucles infinies
          Serial.println(F("Début du traitement des textes..."));

          while (!cbor_value_at_end(&arrayIt) && textIndex < MAX_TEXTS) {
            textIndex++;
            Serial.print(F("\n--- Traitement du texte #"));
            /*Serial.print(textIndex);
            Serial.println(" ---");
            Serial.flush();

            // Vérification de l'état du conteneur
            /*Serial.print(F("Type de l'élément: "));
            if (cbor_value_is_array(&arrayIt)) {
              Serial.println(F("Tableau"));
            } else if (cbor_value_is_map(&arrayIt)) {
              Serial.println(F("Map"));
            } else if (cbor_value_is_text_string(&arrayIt)) {
              Serial.println(F("Texte"));
            } else if (cbor_value_is_integer(&arrayIt)) {
              Serial.println(F("Entier"));
            } else {
              Serial.println(F("Type inconnu"));
            }

            // Vérification de la mémoire
            Serial.print(F("Mémoire libre: "));
            Serial.println(freeMemory());

            // Petite pause pour la communication série
            delay(5);

            // L'incrémentation est déjà faite au début de la boucle

            // Afficher le type de la valeur courante
            Serial.print(F("Type de la valeur: "));
            if (cbor_value_is_array(&arrayIt)) {
              //Serial.println(F("Tableau"));
            } else if (cbor_value_is_map(&arrayIt)) {
              //Serial.println(F("Map"));
            } else if (cbor_value_is_text_string(&arrayIt)) {
              //Serial.println(F("Chaine de texte"));
            } else if (cbor_value_is_integer(&arrayIt)) {
              //Serial.println(F("Entier"));
            } else {
              //Serial.println(F("Type inconnu"));
              // Avancer à l'élément suivant en cas de type inconnu
              cbor_value_advance(&arrayIt);
              continue;
            }

            // Vérifier la mémoire disponible
            Serial.print(F("Memoire libre: "));
            Serial.println(freeMemory());

            if (cbor_value_is_array(&arrayIt)) {
              CborValue lineIt;
              CborError err = cbor_value_enter_container(&arrayIt, &lineIt);
              if (err != CborNoError) {
                Serial.print(F("Erreur entrée conteneur: "));
                Serial.println(err);
                break;
              }

              // Lire les 4 éléments de la ligne
              int x = 0, y = 0, size = 1;  // Taille par défaut à 1
              char content[100] = "";      // Augmenté la taille du buffer

              // X
              if (!cbor_value_at_end(&lineIt) && cbor_value_is_integer(&lineIt)) {
                cbor_value_get_int(&lineIt, &x);
                cbor_value_advance(&lineIt);
                Serial.print(F("X: "));
                Serial.println(x);
              }

              // Y
              if (!cbor_value_at_end(&lineIt) && cbor_value_is_integer(&lineIt)) {
                cbor_value_get_int(&lineIt, &y);
                cbor_value_advance(&lineIt);
                Serial.print(F("Y: "));
                Serial.println(y);
              }

              // Size
              if (!cbor_value_at_end(&lineIt) && cbor_value_is_integer(&lineIt)) {
                cbor_value_get_int(&lineIt, &size);
                cbor_value_advance(&lineIt);
                Serial.print(F("Taille: "));
                Serial.println(size);
              }

              // Content
              if (!cbor_value_at_end(&lineIt)) {
                Serial.print(F("Type du contenu: "));
                if (cbor_value_is_text_string(&lineIt)) {
                  Serial.println(F("Chaine de texte"));
                  size_t len;
                  CborError err = cbor_value_calculate_string_length(&lineIt, &len);
                  if (err != CborNoError) {
                    Serial.print(F("Erreur calcul longueur: "));
                    Serial.println(err);
                  } else {
                    Serial.print(F("Longueur du texte: "));
                    Serial.println(len);
                    if (len < sizeof(content)) {
                      Serial.print(F("Tentative de copie du texte... "));
                      err = cbor_value_copy_text_string(&lineIt, content, &len, &lineIt);
                      Serial.print(F("Résultat: "));
                      Serial.println(err == CborNoError ? "Succès" : "Échec");
                      
                      if (err != CborNoError) {
                        Serial.print(F("Erreur copie texte: "));
                        Serial.println(err);
                        // Essayer de récupérer le type actuel après l'erreur
                        Serial.print(F("Type après erreur: "));
                        if (cbor_value_is_text_string(&lineIt)) Serial.println(F("Texte"));
                        else if (cbor_value_is_integer(&lineIt)) Serial.println(F("Entier"));
                        else if (cbor_value_is_float(&lineIt)) Serial.println(F("Flottant"));
                        else if (cbor_value_is_byte_string(&lineIt)) Serial.println(F("Octets"));
                        else if (cbor_value_is_array(&lineIt)) Serial.println(F("Tableau"));
                        else if (cbor_value_is_map(&lineIt)) Serial.println(F("Map"));
                        else Serial.println(F("Inconnu"));
                      } else {
                        content[len] = '\0';  // Assure la terminaison
                        Serial.print(F("Texte: \""));
                        Serial.print(content);
                        Serial.println(F("\""));
                        writeText(x, y, size, textColor, content);
                      }
                    } else {
                      Serial.print(F("Erreur: Texte trop long (max: "));
                      Serial.print(sizeof(content) - 1);
                      Serial.print(F("): "));
                      Serial.println(len);
                    }
                  }
                } else {
                  Serial.print(F("Type inattendu (attendu: texte), type actuel: "));
                  if (cbor_value_is_integer(&lineIt)) Serial.println(F("Entier"));
                  else if (cbor_value_is_float(&lineIt)) Serial.println(F("Flottant"));
                  else if (cbor_value_is_byte_string(&lineIt)) Serial.println(F("Octets"));
                  else if (cbor_value_is_array(&lineIt)) Serial.println(F("Tableau"));
                  else if (cbor_value_is_map(&lineIt)) Serial.println(F("Map"));
                  else Serial.println(F("Inconnu"));
                }
                cbor_value_advance(&lineIt);
              }

              // Sortir du tableau de ligne
              cbor_value_leave_container(&arrayIt, &lineIt);
              Serial.println("Sortie du conteneur de ligne");
            } else {
              Serial.println("ERREUR: Le conteneur n'est pas un tableau");
            }

            // Avancer à l'élément suivant
            Serial.println("Avancement à l'élément suivant...");
            CborError advanceErr = cbor_value_advance(&arrayIt);
            if (advanceErr != CborNoError) {
              Serial.print(F("ERREUR avancement: "));
              Serial.println(advanceErr);
              // Essayer de se remettre en cas d'erreur
              cbor_value_leave_container(&textArrayValue, &arrayIt);
              interrupts();
              return;
            }
          }

          // Sortir du tableau de textes
          cbor_value_leave_container(&textArrayValue, &arrayIt);
        }
      }

      // Gestion des SVG
      CborValue svgValue;
      /*if (cbor_value_map_find_value(&data, "v", &svgValue) == CborNoError && cbor_value_is_array(&svgValue)) {

        // Vérifier si on doit effacer la zone des SVG
        CborValue vcValue;
        bool clearSvgArea = false;
        if (cbor_value_map_find_value(&data, "vC", &vcValue) == CborNoError && cbor_value_is_boolean(&vcValue) && cbor_value_get_boolean(&vcValue, &clearSvgArea) == CborNoError && clearSvgArea) {
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
            char path[200] = "";    // Taille maximale pour le chemin SVG
            char colorStr[8] = "";  // Assez grand pour "#RRGGBB\0"

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
  }*/
}

// --- Parsing CBOR minimaliste pour debug ---
void displayDataCBOR_minimal(CborValue &screen) {
  if (!cbor_value_is_map(&screen)) {
      Serial.println(F("Erreur: 'screen' n'est pas une map"));
      return;
  }

  CborValue textValue, vectorValue;
  
  // Traiter les textes
  if (cbor_value_map_find_value(&screen, "t", &textValue) == CborNoError && 
      cbor_value_is_map(&textValue)) {
      
      CborValue textArray, colorValue;
      
      // Récupérer le tableau de textes
      if (cbor_value_map_find_value(&textValue, "t", &textArray) == CborNoError && 
          cbor_value_is_array(&textArray)) {
          
          CborValue textItem;
          cbor_value_enter_container(&textArray, &textItem);
          
          while (!cbor_value_at_end(&textItem)) {
              if (cbor_value_is_array(&textItem)) {
                  CborValue textElement;
                  cbor_value_enter_container(&textItem, &textElement);
                  
                  int x = 0, y = 0, size = 0;
                  char text[64] = {0};
                  int i = 0;
                  
                  while (!cbor_value_at_end(&textElement)) {
                      if (i == 0) cbor_value_get_int(&textElement, &x);
                      else if (i == 1) cbor_value_get_int(&textElement, &y);
                      else if (i == 2) cbor_value_get_int(&textElement, &size);
                      else if (i == 3 && cbor_value_is_text_string(&textElement)) {
                          size_t len = sizeof(text) - 1;
                          cbor_value_copy_text_string(&textElement, text, &len, NULL);
                      }
                      
                      cbor_value_advance(&textElement);
                      i++;
                  }
                  
                  // Afficher le texte
                  Serial.print(F("Texte: x="));
                  Serial.print(x);
                  Serial.print(F(" y="));
                  Serial.print(y);
                  Serial.print(F(" taille="));
                  Serial.print(size);
                  Serial.print(F(" contenu="));
                  Serial.println(text);
                  
                  writeText(x, y, size, GC9A01A_WHITE, text);
                  
                  cbor_value_leave_container(&textItem, &textElement);
              }
              cbor_value_advance(&textItem);
          }
          cbor_value_leave_container(&textArray, &textItem);
      }
      
      // Récupérer la couleur du texte
      if (cbor_value_map_find_value(&textValue, "c", &colorValue) == CborNoError && 
          cbor_value_is_text_string(&colorValue)) {
          char colorStr[16] = {0};
          size_t len = sizeof(colorStr) - 1;
          cbor_value_copy_text_string(&colorValue, colorStr, &len, NULL);
          Serial.print(F("Couleur texte: #"));
          Serial.println(colorStr);
      }
  }
  
  // Traiter les vecteurs (SVG)
  if (cbor_value_map_find_value(&screen, "v", &vectorValue) == CborNoError && 
      cbor_value_is_array(&vectorValue)) {
      
      CborValue vectorItem;
      cbor_value_enter_container(&vectorValue, &vectorItem);
      
      while (!cbor_value_at_end(&vectorItem)) {
          if (cbor_value_is_array(&vectorItem)) {
              CborValue svgElement;
              cbor_value_enter_container(&vectorItem, &svgElement);
              
              char svgPath[512] = {0};
              char colorStr[16] = {0};
              int i = 0;
              
              while (!cbor_value_at_end(&svgElement)) {
                  if (i == 0 && cbor_value_is_text_string(&svgElement)) {
                      size_t len = sizeof(svgPath) - 1;
                      cbor_value_copy_text_string(&svgElement, svgPath, &len, NULL);
                  }
                  else if (i == 1 && cbor_value_is_text_string(&svgElement)) {
                      size_t len = sizeof(colorStr) - 1;
                      cbor_value_copy_text_string(&svgElement, colorStr, &len, NULL);
                  }
                  
                  cbor_value_advance(&svgElement);
                  i++;
              }
              
              // Dessiner le SVG
              Serial.print(F("SVG Path: "));
              Serial.println(svgPath);
              Serial.print(F("Couleur SVG: #"));
              Serial.println(colorStr);
              
              uint16_t color = hexToColor565(colorStr);
              drawSVGPath(svgPath, color);
              
              cbor_value_leave_container(&vectorItem, &svgElement);
          }
          cbor_value_advance(&vectorItem);
      }
      cbor_value_leave_container(&vectorValue, &vectorItem);
  }
}

uint16_t hexToColor565(const char* hexColor) {
  if (!hexColor || *hexColor == '\0') {
    return 0xFFFF;  // Retourne blanc en cas d'erreur
  }

  // Sauter le # s'il est présent
  if (hexColor[0] == '#') {
    hexColor++;
  }

  // Vérifier la longueur minimale
  size_t len = strlen(hexColor);
  if (len < 3) {    // Au moins 3 caractères nécessaires (R, G, B)
    return 0xFFFF;  // Retourne blanc en cas d'erreur
  }

  // Vérifier que tous les caractères sont hexadécimaux
  for (size_t i = 0; i < len && i < 6; i++) {
    if (!isxdigit(hexColor[i])) {
      return 0xFFFF;  // Retourne blanc en cas d'erreur
    }
  }

  // Convertir la chaîne hexadécimale en valeurs RGB
  char* endptr;
  long number = strtol(hexColor, &endptr, 16);

  // Vérifier la conversion
  if (endptr == hexColor) {
    return 0xFFFF;  // Aucun chiffre valide trouvé
  }

  // Extraire les composants RVB
  uint8_t r, g, b;
  if (len <= 4) {
    // Format court: #RGB ou #RGBA
    r = (number >> 8) & 0x0F;
    g = (number >> 4) & 0x0F;
    b = number & 0x0F;
    // Étendre les 4 bits à 8 bits
    r = (r << 4) | r;
    g = (g << 4) | g;
    b = (b << 4) | b;
  } else {
    // Format long: #RRGGBB ou #RRGGBBAA
    r = (number >> 16) & 0xFF;
    g = (number >> 8) & 0xFF;
    b = number & 0xFF;
  }

  // Convertir en format 565 (5-6-5 bits)
  // 5 bits pour le rouge, 6 pour le vert, 5 pour le bleu
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

void drawSVGPath(const char* svgPath, uint16_t color) {
  uint8_t x = 0, y = 0;            // Position actuelle
  uint8_t xStart = 0, yStart = 0;  // Point de départ pour fermer le chemin

  const char* p = svgPath;
  while (*p) {
    char cmd = *p++;  // Lire la commande
    skipSeparators(p);

    switch (cmd) {
      case 'H':
        {  // Ligne horizontale
          uint8_t x1 = strtol(p, &p, 10);
          tft.drawFastHLine(x, y, x1 - x, color);
          x = x1;
          break;
        }
      case 'V':
        {  // Ligne verticale
          uint8_t y1 = strtol(p, &p, 10);
          tft.drawFastVLine(x, y, y1 - y, color);
          y = y1;
          break;
        }
      case 'L':
        {  // LineTo
          uint8_t x1 = strtol(p, &p, 10);
          uint8_t y1 = strtol(p, &p, 10);
          tft.drawLine(x, y, x1, y1, color);
          x = x1;
          y = y1;
          break;
        }
      case 'M':
        {  // MoveTo
          x = strtol(p, &p, 10);
          y = strtol(p, &p, 10);
          xStart = x;
          yStart = y;
          break;
        }
      case 'Z':
        {  // ClosePath
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

  // Initialisation de la communication série avec un timeout
  Serial.begin(115200, SERIAL_8N1);
  Serial.setTimeout(100);  // Définir un timeout court pour éviter les blocages

  Serial.setTimeout(50);  // Timeout court
  Serial.flush();  // Vide les buffers

  // begin HID connection
  Consumer.begin();

  // Initialisation des leds
  LED.setOutput(PIN_LED);
  LED.setColorOrderGRB();
  value.r = 0, value.g = 0, value.b = 0;

  // On initialise l'ecran
  tft.begin();

  // Vider le buffer série au démarrage
  while (Serial.available() > 0) {
    Serial.read();
  }

  tft.setSPISpeed(40000000);
  clearScreen();

  // Attente de la connexion au port série
  while (!Serial) {
    startScreen();
  }
}

// Fonction pour vérifier la mémoire disponible
#ifdef __arm__
// should use uinstd.h to define sbrk but Due causes a conflict
extern "C" char* sbrk(int incr);
#else   // __ARM__
extern char* __brkval;
extern char __bss_end;
#endif  // __arm__

int freeMemory() {
  char top;
#ifdef __arm__
  return &top - reinterpret_cast<char*>(sbrk(0));
#elif defined(CORE_TEENSY) || (ARDUINO > 103 && ARDUINO != 151)
  return &top - __brkval;
#else   // __arm__
  return __brkval ? &top - __brkval : &top - &__bss_end;
#endif  // __arm__
}

// Fonction pour vider le buffer série (utilisée uniquement en cas d'erreur)
void clearSerialBuffer() {
  // Ne vider que si le buffer est plein pour éviter de perdre des données
  if (Serial.available() > 100) {  // Si plus de 100 octets en attente
    while (Serial.available() > 0) {
      Serial.read();
    }
    Serial.println(F("Buffer série nettoyé (trop de données en attente)"));
  }
}

void loop() {
  // Vérifier périodiquement l'état du port série
  /*static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 1000) {  // Toutes les secondes
    if (!Serial) {
      // Si le port est déconnecté, on réinitialise la communication
      Serial.end();
      delay(100);
      Serial.begin(115200);
      clearSerialBuffer();
    }
    lastCheck = millis();
  }*/

  // Vérifier les boutons
  //checkBtnPressed();

  // Traiter les données reçues
  if (Serial.available() > 0) {
    processReceivedData();
  }

  // Ne plus vider le buffer automatiquement pour éviter de perdre des données
  // Les données sont maintenant traitées au fur et à mesure dans processReceivedData()
}
