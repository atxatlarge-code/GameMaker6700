from PIL import Image

def blend_edges(in_path, out_path, feather=250):
    print("Processing", out_path)
    img = Image.open(in_path).convert("RGBA")
    
    data = list(img.getdata())
    new_data = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    w, h = img.size
    new_w = w - feather
    seamless = Image.new("RGBA", (new_w, h))
    
    pixels = seamless.load()
    orig = img.load()
    
    for y in range(h):
        for x in range(new_w):
            if x < feather:
                weight_left = x / feather
                weight_right = 1.0 - weight_left
                
                r_L, g_L, b_L, a_L = orig[x, y]
                r_R, g_R, b_R, a_R = orig[w - feather + x, y]
                
                r = int(r_L * weight_left + r_R * weight_right)
                g = int(g_L * weight_left + g_R * weight_right)
                b = int(b_L * weight_left + b_R * weight_right)
                a = int(a_L * weight_left + a_R * weight_right)
                
                pixels[x, y] = (r, g, b, a)
            else:
                r, g, b, a = orig[x, y]
                pixels[x, y] = (r, g, b, a)
                
    seamless.save(out_path, "PNG")

blend_edges("/Users/jaketrigg/.gemini/antigravity/brain/56e332c9-09d7-43f2-a27f-04bf0a5878c4/bg_layer_mountains_1781737562832.png", "assets/bg_layer_mountains.png")
blend_edges("/Users/jaketrigg/.gemini/antigravity/brain/56e332c9-09d7-43f2-a27f-04bf0a5878c4/bg_layer_hills_1781737578021.png", "assets/bg_layer_hills.png")
print("Done")
