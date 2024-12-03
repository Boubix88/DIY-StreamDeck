import psutil
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
import xml.etree.ElementTree as ET
import time
import threading

duration = 10
interval = 1
data_recv = []
data_sent = []
lock = threading.Lock()

def get_network_usage(interval=1):
    net_io = psutil.net_io_counters()
    bytes_sent = net_io.bytes_sent
    bytes_recv = net_io.bytes_recv
    time.sleep(interval)
    net_io = psutil.net_io_counters()
    bytes_sent_per_sec = (net_io.bytes_sent - bytes_sent) / interval
    bytes_recv_per_sec = (net_io.bytes_recv - bytes_recv) / interval
    return bytes_recv_per_sec, bytes_sent_per_sec

def collect_network_data():
    global data_recv, data_sent
    while True:
        recv, sent = get_network_usage(interval)
        with lock:
            data_recv.append(recv)
            data_sent.append(sent)
            if len(data_recv) > duration:
                data_recv.pop(0)
            if len(data_sent) > duration:
                data_sent.pop(0)

def plot_network_usage(data, label, color):
    times = np.arange(0, len(data), 1)
    plt.figure(figsize=(10, 5))
    plt.plot(times, data, label=label, color=color)
    plt.grid(False)
    plt.legend().set_visible(False)
    plt.axis('off')

    svg_buffer = BytesIO()
    plt.savefig(svg_buffer, format='svg')
    plt.close()
    svg_buffer.seek(0)
    svg_data = svg_buffer.getvalue().decode('utf-8')

    svg_root = ET.fromstring(svg_data)
    paths = []
    for path in svg_root.findall('.//{http://www.w3.org/2000/svg}path'):
        if 'd' in path.attrib:
            paths.append(path.attrib['d'])
    return paths

def get_network_usage_svg():
    with lock:
        download_paths = plot_network_usage(data_recv, 'Download', 'blue')
        upload_paths = plot_network_usage(data_sent, 'Upload', 'red')
    return download_paths, upload_paths

def scale_svg_paths(paths, max_width=180, translate_x=-5, translate_y=50):
    scaled_paths = []
    for path in paths:
        coords = []
        for command in path.split():
            try:
                coords.append(float(command))
            except ValueError:
                pass

        if coords:
            min_x = min(coords[::2])
            max_x = max(coords[::2])
            current_width = max_x - min_x
            scale_factor = max_width / current_width if current_width > 0 else 1

            scaled_path = []
            is_x = True
            for command in path.split():
                try:
                    coord = round(float(command) * scale_factor)
                    if is_x:
                        coord += translate_x
                    else:
                        coord += translate_y
                    scaled_path.append(str(round(coord)))
                    is_x = not is_x
                except ValueError:
                    scaled_path.append(command)
            scaled_paths.append(' '.join(scaled_path))
    return scaled_paths

def generate_grid(duration, max_width=180, max_height=100, translate_x=35, translate_y=60):
    grid_paths = []
    for i in range(0, duration, 5):
        x = i * (max_width / duration) + translate_x
        grid_paths.append(f"M{x} {translate_y} L{x} {max_height + translate_y}")
    for i in range(0, max_height, 20):
        y = max_height - i + translate_y
        grid_paths.append(f"M{translate_x} {y} L{max_width + translate_x} {y}")
    return grid_paths

def getSVGPaths():
    download_paths, upload_paths = get_network_usage_svg()
    download_paths_svg = scale_svg_paths(download_paths, max_width=180)
    upload_paths_svg = scale_svg_paths(upload_paths, max_width=180)

    grid_svg = generate_grid(duration)

    return download_paths_svg[1:], upload_paths_svg[1:], grid_svg

def getNetworkInfo():
    download_paths_svg, upload_paths_svg, grid_svg = getSVGPaths()
    '''print("Download")
    for path in download_paths_svg:
        print(path)

    print("Upload")
    for path in upload_paths_svg:
        print(path)

    print("Grid")
    for path in grid_svg:
        print(path)'''

    if data_recv and data_sent:
        download_speed = (data_recv[-1] / (1024 * 1024)) * 10  # Convert to Mbps
        upload_speed = (data_sent[-1] / (1024 * 1024)) * 10  # Convert to Mbps
    else:
        download_speed = 0
        upload_speed = 0

    return {
        "t": {
            "c": "FFFFFF",
            "t": [
                [
                    70,
                    20,
                    2,
                    f"\x19 {download_speed:.2f} Mbps"
                ],
                [
                    70,
                    40,
                    2,
                    f"\x18 {upload_speed:.2f} Mbps"
                ],
                [
                    86,
                    180,
                    2,
                    "Reseau"
                ]
            ]
        },
        "v": [
            [
                f"{grid_svg}",
                "FFFFFF"
            ],
            [
                f"{download_paths_svg}",
                "0000FF"
            ],
            [
                f"{upload_paths_svg}",
                "FF0000"
            ]
        ],
        "vC": bool(True)
    }

def start_network_thread():
    temp_thread = threading.Thread(target=collect_network_data, args=())
    temp_thread.daemon = True
    temp_thread.start()
