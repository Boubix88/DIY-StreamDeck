using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using OpenHardwareMonitor.Hardware;

namespace OHMBridge
{
    class Program
    {
        static void Main(string[] args)
        {
            Computer computer = new Computer()
            {
                CPUEnabled = true,
                GPUEnabled = true,
                RAMEnabled = true,
                MainboardEnabled = false,
                FanControllerEnabled = false,
                HDDEnabled = false
            };
            computer.Open();
            System.Threading.Thread.Sleep(100); // Laisse le temps à l'init

            var info = new Dictionary<string, object>();

            foreach (var hw in computer.Hardware)
            {
                hw.Update();
                if (hw.HardwareType == HardwareType.CPU)
                {
                    var cpu = new Dictionary<string, object>();
                    foreach (var sensor in hw.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Temperature && sensor.Name.ToLower().Contains("package"))
                            cpu["temperature"] = sensor.Value;
                        if (sensor.SensorType == SensorType.Clock && sensor.Name.ToLower().Contains("core #1"))
                            cpu["frequency"] = sensor.Value;
                    }
                    cpu["processCount"] = System.Diagnostics.Process.GetProcesses().Length;
                    info["cpu"] = cpu;
                }
                else if (hw.HardwareType == HardwareType.GpuNvidia || hw.HardwareType == HardwareType.GpuAti)
                {
                    var gpu = new Dictionary<string, object>();
                    foreach (var sensor in hw.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Temperature && sensor.Name.ToLower().Contains("core"))
                            gpu["temperature"] = sensor.Value;
                        if (sensor.SensorType == SensorType.Clock && sensor.Name.ToLower().Contains("core"))
                            gpu["frequency"] = sensor.Value;
                        if (sensor.SensorType == SensorType.SmallData && sensor.Name.ToLower().Contains("memory used"))
                            gpu["vramUsed"] = sensor.Value;
                        if (sensor.SensorType == SensorType.SmallData && sensor.Name.ToLower().Contains("memory total"))
                            gpu["vramTotal"] = sensor.Value;
                    }
                    info["gpu"] = gpu;
                }
                else if (hw.HardwareType == HardwareType.RAM)
                {
                    var ram = new Dictionary<string, object>();
                    foreach (var sensor in hw.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Data && sensor.Name.ToLower().Contains("memory used"))
                            ram["used"] = sensor.Value;
                        if (sensor.SensorType == SensorType.Data && sensor.Name.ToLower().Contains("memory total"))
                            ram["total"] = sensor.Value;
                    }
                    if (ram.Count == 0) info["ram"] = null;
                    else info["ram"] = ram;
                }
            }

            // Réseau: juste l'IP locale (pour l'instant)
            // --- Débit réseau (rx/tx/rate) ---
            var netInfo = new Dictionary<string, object>();
            var statsNow = new Dictionary<string, (long rx, long tx, string ip)>();
            foreach (var ni in System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces())
            {
                var stats = ni.GetIPv4Statistics();
                var props = ni.GetIPProperties();
                foreach (var addr in props.UnicastAddresses)
                {
                    if (addr.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork && !addr.Address.ToString().StartsWith("169.254"))
                    {
                        statsNow[ni.Name] = (stats.BytesReceived, stats.BytesSent, addr.Address.ToString());
                    }
                }
            }
            // Charger l'état précédent
            string tmpPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "ohmbridge_net.json");
            var prevStats = new Dictionary<string, (long rx, long tx, DateTime time)>();
            DateTime lastTime = DateTime.UtcNow;
            if (System.IO.File.Exists(tmpPath))
            {
                try
                {
                    var prev = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(System.IO.File.ReadAllText(tmpPath));
                    if (prev != null && prev.ContainsKey("time"))
                        lastTime = DateTime.Parse(prev["time"].ToString());
                    foreach (var kv in prev)
                    {
                        if (kv.Key == "time") continue;
                        var arr = kv.Value.ToString().Split(',');
                        if (arr.Length >= 2)
                        {
                            long rx = long.Parse(arr[0]);
                            long tx = long.Parse(arr[1]);
                            prevStats[kv.Key] = (rx, tx, lastTime);
                        }
                    }
                }
                catch { }
            }
            DateTime now = DateTime.UtcNow;
            foreach (var kv in statsNow)
            {
                long rxRate = 0, txRate = 0;
                if (prevStats.ContainsKey(kv.Key))
                {
                    var prev = prevStats[kv.Key];
                    double dt = (now - prev.time).TotalSeconds;
                    if (dt > 0)
                    {
                        rxRate = (long)((kv.Value.rx - prev.rx) / dt);
                        txRate = (long)((kv.Value.tx - prev.tx) / dt);
                    }
                }
                netInfo[kv.Key] = new Dictionary<string, object> {
                    { "ip", kv.Value.ip },
                    { "rx", kv.Value.rx },
                    { "tx", kv.Value.tx },
                    { "rxRate", rxRate },
                    { "txRate", txRate }
                };
            }
            // Sauvegarder l'état courant
            var saveDict = new Dictionary<string, object>();
            foreach (var kv in statsNow)
                saveDict[kv.Key] = kv.Value.rx + "," + kv.Value.tx;
            saveDict["time"] = now.ToString("o");
            System.IO.File.WriteAllText(tmpPath, Newtonsoft.Json.JsonConvert.SerializeObject(saveDict));
            info["network"] = netInfo;

            string json = JsonConvert.SerializeObject(info);
            Console.WriteLine(json);
        }
    }
}
