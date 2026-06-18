from rembg import remove
from PIL import Image

for file in ["assets/bg_layer_mountains.png", "assets/bg_layer_hills.png"]:
    print("Processing", file)
    with open(file, 'rb') as i:
        with open("tmp.png", 'wb') as o:
            input_bytes = i.read()
            output_bytes = remove(input_bytes)
            o.write(output_bytes)
    import shutil
    shutil.move("tmp.png", file)
print("Done")
