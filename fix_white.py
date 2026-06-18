from PIL import Image
import os

for file in ["assets/bg_layer_mountains.png", "assets/bg_layer_hills.png"]:
    print("Processing", file)
    img = Image.open(file).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    # We generated with "solid pure white color", so it should be very close to 255,255,255.
    # We'll use a threshold to catch any slight compression artifacts
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(file, "PNG")
    print("Saved", file)
