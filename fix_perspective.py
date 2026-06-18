from PIL import Image

def process(filename, in_path):
    print("Processing", filename)
    img = Image.open(in_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    w, h = img.size
    seamless = Image.new("RGBA", (w*2, h))
    seamless.paste(img, (0, 0))
    seamless.paste(img.transpose(Image.FLIP_LEFT_RIGHT), (w, 0))
    
    seamless.save(filename, "PNG")

process("assets/bg_layer_mountains.png", "/Users/jaketrigg/.gemini/antigravity/brain/56e332c9-09d7-43f2-a27f-04bf0a5878c4/bg_layer_mountains_1781737562832.png")
process("assets/bg_layer_hills.png", "/Users/jaketrigg/.gemini/antigravity/brain/56e332c9-09d7-43f2-a27f-04bf0a5878c4/bg_layer_hills_1781737578021.png")
print("Done")
