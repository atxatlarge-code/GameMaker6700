from PIL import Image

def make_seamless(filename, in_path, feather=200):
    print("Processing", filename)
    img = Image.open(in_path).convert("RGBA")
    
    # 1. Remove white sky
    data = img.getdata()
    new_data = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    w, h = img.size
    
    # 2. Swap halves
    left_half = img.crop((0, 0, w//2, h))
    right_half = img.crop((w//2, 0, w, h))
    
    seamless = Image.new("RGBA", (w, h))
    seamless.paste(right_half, (0, 0))
    seamless.paste(left_half, (w//2, 0))
    
    # Now the seam is exactly at x = w//2
    # We want to crossfade between right_half's right edge and left_half's left edge
    # These were the original edges of the image!
    
    # Let's take the original left edge and right edge
    orig_left = img.crop((0, 0, feather, h))
    orig_right = img.crop((w - feather, 0, w, h))
    
    # We will blend them over the center seam (w//2 - feather//2 to w//2 + feather//2)
    # The center seam is at x = w//2.
    # Pixels from (w//2 - feather//2) to w//2 come from orig_right (the right edge of original image)
    # Pixels from w//2 to (w//2 + feather//2) come from orig_left
    
    blend_img = seamless.copy()
    pixels = blend_img.load()
    orig_pixels = img.load()
    
    # Crossfade around the seam
    # The seam is at x_seam = w//2
    # We blend over a width of `feather`. Let's blend from x = w//2 - feather//2 to w//2 + feather//2
    half_feather = feather // 2
    for y in range(h):
        for x in range(feather):
            # alpha goes from 0 to 1 as we move left to right
            alpha = x / feather
            
            # The left side of the fade should be the original right side
            # The right side of the fade should be the original left side
            
            x_seam = (w//2 - half_feather) + x
            
            # Pixel from right side of original image
            r1, g1, b1, a1 = orig_pixels[w - feather + x, y]
            
            # Pixel from left side of original image
            r2, g2, b2, a2 = orig_pixels[x, y]
            
            # Blend
            r = int(r1 * (1 - alpha) + r2 * alpha)
            g = int(g1 * (1 - alpha) + g2 * alpha)
            b = int(b1 * (1 - alpha) + b2 * alpha)
            a = int(a1 * (1 - alpha) + a2 * alpha)
            
            pixels[x_seam, y] = (r, g, b, a)

    blend_img.save(filename, "PNG")

make_seamless("assets/bg_layer_mountains.png", "/Users/jaketrigg/.gemini/antigravity/brain/56e332c9-09d7-43f2-a27f-04bf0a5878c4/bg_layer_mountains_1781737562832.png", 250)
make_seamless("assets/bg_layer_hills.png", "/Users/jaketrigg/.gemini/antigravity/brain/56e332c9-09d7-43f2-a27f-04bf0a5878c4/bg_layer_hills_1781737578021.png", 250)
print("Done")
