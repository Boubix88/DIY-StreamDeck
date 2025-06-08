// Utilitaire pour lire et parser le JSON d'OpenHardwareMonitor
// Nécessite qu'OpenHardwareMonitor exporte régulièrement vers un fichier (ex: C:/temp/ohm.json)
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

const OHM_PATH = 'C:/temp/ohm.json'; // À adapter si besoin

type OhmSensor = {
  SensorType: string;
  Name: string;
  Value: number;
};
type OhmHardware = {
  HardwareType: string;
  Sensors: OhmSensor[];
};
type OhmJson = {
  Hardware: OhmHardware[];
};

function readOhmBridge(): any {
  try {
    const path = require('path');
    const exePath = path.join(__dirname, '../../OHMBridge/bin/Release/net48/OHMBridge.exe');
    const output = execSync(`"${exePath}"`, { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (e) {
    console.error('Erreur exécution OHMBridge.exe:', e);
    return { cpu: null, gpu: null, ram: null, network: null };
  }
}

function findSensor(hardware: OhmHardware | undefined, type: string, nameLike: string): OhmSensor | undefined {
  if (!hardware) return undefined;
  return hardware.Sensors.find((s: OhmSensor) => s.SensorType === type && s.Name.toLowerCase().includes(nameLike.toLowerCase()));
}

function getCpuInfo(ohm: OhmJson) {
  const cpu = ohm.Hardware.find((h) => h.HardwareType === 'CPU');
  const temp = findSensor(cpu, 'Temperature', 'package')?.Value ?? null;
  const freq = findSensor(cpu, 'Clock', 'core #1')?.Value ?? null;
  // Nombre de process via 'tasklist' (Windows)
  let processCount = null;
  try {
    const output = execSync('tasklist').toString();
    processCount = output.split('\n').filter(line => line.trim().length > 0).length - 3; // -3 header lines
  } catch (e) {
    processCount = null;
  }
  return { temperature: temp, frequency: freq, processCount };
}

function getGpuInfo(ohm: OhmJson) {
  const gpu = ohm.Hardware.find((h) => h.HardwareType === 'GPU');
  const temp = findSensor(gpu, 'Temperature', 'gpu core')?.Value ?? null;
  const freq = findSensor(gpu, 'Clock', 'gpu core')?.Value ?? null;
  const vramUsed = findSensor(gpu, 'Data', 'memory used')?.Value ?? null;
  const vramTotal = findSensor(gpu, 'Data', 'memory total')?.Value ?? null;
  return { temperature: temp, frequency: freq, vramUsed, vramTotal };
}

function getRamInfo(ohm: OhmJson) {
  const ram = ohm.Hardware.find((h) => h.HardwareType === 'RAM');
  const used = findSensor(ram, 'Data', 'memory used')?.Value ?? null;
  const total = findSensor(ram, 'Data', 'memory total')?.Value ?? null;
  // Fallback sur os.totalmem/os.freemem si OHM ne fournit pas
  return {
    used: used ?? (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024),
    total: total ?? os.totalmem() / (1024 * 1024 * 1024),
  };
}

function getNetworkInfo() {
  // Renvoie les octets cumulés par interface (à traiter côté front pour débit)
  // Note : Node.js ne fournit pas directement les octets reçus/envoyés, il faut utiliser un module natif ou wmic/powershell pour du débit temps réel
  // Ici, on retourne juste la liste des interfaces pour compatibilité future
  const ifaces = os.networkInterfaces();
  const stats: Record<string, { address: string }> = {};
  for (const [name, arr] of Object.entries(ifaces)) {
    if (!arr) continue;
    for (const net of arr) {
      if (net.family === 'IPv4' && !net.internal) {
        stats[name] = { address: net.address };
      }
    }
  }
  return stats;
  // Pour le débit, il faudrait utiliser un module comme 'node-os-utils' ou faire un wrapper PowerShell
}

export function getSystemInfo() {
  const ohm = readOhmBridge();
  
  return {
    cpu: ohm.cpu ?? null,
    gpu: ohm.gpu ?? null,
    ram: ohm.ram ?? null,
    network: ohm.network ?? null
  };
}
