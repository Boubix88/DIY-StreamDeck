import * as si from 'systeminformation';

export interface CpuInfo {
  temperature: number;
  usage: number;
  frequency: number;
  processes: number;
  cores: number;
  physicalCores: number;
  manufacturer: string;
  brand: string;
}

export interface GpuInfo {
  temperature: number;
  usage: number;
  frequency: number;
  memory: number;
  memoryTotal: number;
  model: string;
  vendor: string;
}

export interface RamInfo {
  total: number;
  used: number;
  free: number;
  usage: number;
  active: number;
  available: number;
}

export interface NetworkInterfaceInfo {
  iface: string;
  ip4: string;
  ip6: string;
  mac: string;
  internal: boolean;
}

export interface NetworkInfo {
  download: number;
  upload: number;
  ip: string;
  status: string;
  interfaces: NetworkInterfaceInfo[];
}

export const getCpuInfo = async (): Promise<CpuInfo> => {
  try {
    const [cpu, currentLoad, cpuTemperature] = await Promise.all([
      si.cpu(),
      si.currentLoad(),
      si.cpuTemperature()
    ]);

    return {
      temperature: Math.round((cpuTemperature.main || 0) * 10) / 10,
      usage: Math.round((currentLoad.currentLoad || 0) * 10) / 10,
      frequency: Math.round((cpu.speed || 0) * 10) / 10,
      processes: currentLoad.cpus?.length || 0,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      manufacturer: cpu.manufacturer || '',
      brand: cpu.brand || ''
    };
  } catch (error) {
    console.error('Error getting CPU info:', error);
    throw error;
  }
};

export const getGpuInfo = async (): Promise<GpuInfo> => {
  try {
    const graphics = await si.graphics();
    const gpu = graphics.controllers[0] || {};

    return {
      temperature: Math.round((gpu.temperatureGpu || 0) * 10) / 10,
      usage: Math.round((gpu.utilizationGpu || 0) * 10) / 10,
      frequency: Math.round((gpu.clockCore || 0) / 10) / 100,
      memory: Math.round(((gpu as any).vramUsed || 0) / 1024), // Convertir en Mo
      memoryTotal: Math.round(((gpu as any).vram || 0) / 1024), // Convertir en Mo
      model: gpu.model || 'N/A',
      vendor: gpu.vendor || 'N/A'
    };
  } catch (error) {
    console.error('Error getting GPU info:', error);
    throw error;
  }
};

export const getRamInfo = async (): Promise<RamInfo> => {
  try {
    const mem = await si.mem();
    const total = Math.round(mem.total / (1024 * 1024));
    const used = Math.round((mem.used || 0) / (1024 * 1024));
    const available = Math.round((mem.available || 0) / (1024 * 1024));
    
    return {
      total,
      used,
      free: Math.max(0, total - used),
      available,
      active: Math.round((mem.active || 0) / (1024 * 1024)),
      usage: Math.round(((total - available) / total) * 100 * 10) / 10
    };
  } catch (error) {
    console.error('Error getting RAM info:', error);
    throw error;
  }
};

export const getNetworkInfo = async (): Promise<NetworkInfo> => {
  try {
    const [networkInterfaces, networkStats] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats()
    ]);
    
    const defaultInterface = networkInterfaces.find(intf => 
      !intf.internal && intf.ip4 && intf.ip4 !== '127.0.0.1'
    );
    
    const stats = networkStats.find(stat => stat.iface === defaultInterface?.iface) || {};
    
    return {
      download: Math.round((((stats as any).rx_sec || 0) / (1024 * 1024)) * 100) / 100,
      upload: Math.round((((stats as any).tx_sec || 0) / (1024 * 1024)) * 100) / 100,
      ip: defaultInterface?.ip4 || 'N/A',
      status: defaultInterface?.operstate === 'up' ? 'Connected' : 'Disconnected',
      interfaces: networkInterfaces.map(intf => ({
        iface: intf.iface,
        ip4: intf.ip4 || '',
        ip6: intf.ip6 || '',
        mac: intf.mac || '',
        internal: intf.internal || false
      }))
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    throw error;
  }
};

export const getAllSystemInfo = async () => {
  try {
    const [cpu, gpu, ram, network] = await Promise.all([
      getCpuInfo(),
      getGpuInfo(),
      getRamInfo(),
      getNetworkInfo()
    ]);

    return {
      cpu,
      gpu,
      ram,
      network,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error getting all system info:', error);
    throw error;
  }
};
