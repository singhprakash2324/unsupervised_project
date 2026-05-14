import numpy as np
import rasterio
from rasterio.transform import from_origin
import os

def generate_synthetic_field(output_path, width=512, height=512):
    """
    Generates a synthetic multi-spectral GeoTIFF representing a crop field.
    Bands:
    1: Red
    2: Green
    3: Blue
    4: NIR (Near-Infrared)
    5: Red-Edge
    6: Thermal (Surface Temperature)
    """
    
    # Base reflectance values for healthy vegetation
    # Red: 0.05, Green: 0.15, Blue: 0.05, NIR: 0.5, Red-Edge: 0.3, Thermal: 25C (normalized)
    
    # Create base layers with some noise
    def create_layer(base_val, noise_scale=0.02):
        return base_val + np.random.normal(0, noise_scale, (height, width))

    red = create_layer(0.05)
    green = create_layer(0.15)
    blue = create_layer(0.05)
    nir = create_layer(0.5)
    red_edge = create_layer(0.3)
    thermal = create_layer(25.0, noise_scale=0.5) # Thermal in Celsius

    # Define zones
    # Zone 1: Water Stressed (Lower NIR, Higher Thermal, Lower Red-Edge)
    # Zone 2: Dry Soil / Sparse Crop (Higher Red, Lower Green, Lower NIR, Higher Thermal)
    # Zone 3: Healthy / Over-irrigated (High NIR, Low Thermal)

    # Create masks for zones (using simple geometric shapes for demo)
    y, x = np.ogrid[:height, :width]
    
    # Zone 1: Central stressed patch
    dist_from_center = np.sqrt((x - width/2)**2 + (y - height/2)**2)
    mask1 = dist_from_center < 100
    nir[mask1] -= 0.2
    thermal[mask1] += 5.0
    red_edge[mask1] -= 0.1
    green[mask1] -= 0.05

    # Zone 2: Top-right dry patch
    mask2 = (x > width*0.7) & (y < height*0.3)
    red[mask2] += 0.1
    green[mask2] -= 0.05
    nir[mask2] -= 0.3
    thermal[mask2] += 8.0

    # Zone 3: Bottom-left lush patch
    mask3 = (x < width*0.3) & (y > height*0.7)
    nir[mask3] += 0.1
    thermal[mask3] -= 3.0
    green[mask3] += 0.05

    # Add some texture/gradient
    gradient = np.linspace(0, 0.05, width)
    for i in range(height):
        nir[i, :] += gradient

    # Clip values to realistic ranges [0, 1] for spectral bands
    red = np.clip(red, 0, 1)
    green = np.clip(green, 0, 1)
    blue = np.clip(blue, 0, 1)
    nir = np.clip(nir, 0, 1)
    red_edge = np.clip(red_edge, 0, 1)
    
    # Scale to uint16 for GeoTIFF storage (common format)
    def scale_to_uint16(arr):
        return (arr * 65535).astype(np.uint16)

    # Thermal needs different scaling if we want to keep precision
    # But for simplicity, let's just store as float32 or scaled uint16
    thermal_scaled = ((thermal - 15) / 25 * 65535).astype(np.uint16) # Scale 15C-40C to 0-65535

    # Geo-transform (arbitrary location)
    transform = from_origin(-122.0, 37.0, 0.00001, 0.00001)
    
    new_dataset = rasterio.open(
        output_path,
        'w',
        driver='GTiff',
        height=height,
        width=width,
        count=6,
        dtype='uint16',
        crs='+proj=latlong',
        transform=transform,
    )

    new_dataset.write(scale_to_uint16(red), 1)
    new_dataset.write(scale_to_uint16(green), 2)
    new_dataset.write(scale_to_uint16(blue), 3)
    new_dataset.write(scale_to_uint16(nir), 4)
    new_dataset.write(scale_to_uint16(red_edge), 5)
    new_dataset.write(thermal_scaled, 6)
    new_dataset.close()
    
    print(f"Synthetic field generated at {output_path}")

def generate_second_field(output_path, width=512, height=512):
    # Completely different baseline
    red = np.random.normal(0.1, 0.05, (height, width))
    green = np.random.normal(0.2, 0.05, (height, width))
    blue = np.random.normal(0.1, 0.05, (height, width))
    nir = np.random.normal(0.3, 0.1, (height, width)) # Low NIR overall
    red_edge = np.random.normal(0.15, 0.05, (height, width))
    thermal = np.random.normal(30.0, 2.0, (height, width)) # Very hot overall

    # Add a single healthy vertical strip
    y, x = np.ogrid[:height, :width]
    mask = np.broadcast_to((x > width*0.4) & (x < width*0.6), (height, width))
    nir[mask] = 0.7
    thermal[mask] = 20.0
    
    red = np.clip(red, 0, 1)
    green = np.clip(green, 0, 1)
    blue = np.clip(blue, 0, 1)
    nir = np.clip(nir, 0, 1)
    red_edge = np.clip(red_edge, 0, 1)
    
    thermal_scaled = ((thermal - 15) / 25 * 65535).astype(np.uint16)
    
    transform = from_origin(-122.0, 37.0, 0.00001, 0.00001)
    new_dataset = rasterio.open(
        output_path, 'w', driver='GTiff', height=height, width=width,
        count=6, dtype='uint16', crs='+proj=latlong', transform=transform
    )
    new_dataset.write((red * 65535).astype(np.uint16), 1)
    new_dataset.write((green * 65535).astype(np.uint16), 2)
    new_dataset.write((blue * 65535).astype(np.uint16), 3)
    new_dataset.write((nir * 65535).astype(np.uint16), 4)
    new_dataset.write((red_edge * 65535).astype(np.uint16), 5)
    new_dataset.write(thermal_scaled, 6)
    new_dataset.close()
    print(f"Synthetic field 2 generated at {output_path}")

if __name__ == "__main__":
    os.makedirs("sample_data", exist_ok=True)
    generate_synthetic_field("sample_data/synthetic_field.tif")
    generate_second_field("sample_data/synthetic_field_2.tif")
