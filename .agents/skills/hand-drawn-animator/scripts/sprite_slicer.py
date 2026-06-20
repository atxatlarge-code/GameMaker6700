import argparse
import os
from PIL import Image

def remove_background(img, threshold=240):
    """
    Replaces near-white pixels with transparent pixels.
    """
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # If the pixel is near-white (R, G, and B all above threshold)
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # Replace with transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    return img

def slice_sprite_sheet(input_path, output_dir, prefix, rows, cols, remove_bg):
    if not os.path.exists(input_path):
        print(f"Error: Could not find input file {input_path}")
        return

    try:
        img = Image.open(input_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    if remove_bg:
        print("Removing white background...")
        img = remove_background(img)

    width, height = img.size
    frame_w = width // cols
    frame_h = height // rows

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    frame_idx = 0
    for r in range(rows):
        for c in range(cols):
            left = c * frame_w
            top = r * frame_h
            right = left + frame_w
            bottom = top + frame_h
            
            frame = img.crop((left, top, right, bottom))
            output_path = os.path.join(output_dir, f"{prefix}_{frame_idx}.png")
            frame.save(output_path)
            print(f"Saved {output_path}")
            frame_idx += 1
            
    print(f"Successfully sliced {frame_idx} frames into {output_dir}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Slice a sprite sheet into individual frames.')
    parser.add_argument('--input', required=True, help='Path to the input sprite sheet image')
    parser.add_argument('--output_dir', required=True, help='Directory to save the output frames')
    parser.add_argument('--prefix', required=True, help='Prefix for the output frame filenames')
    parser.add_argument('--rows', type=int, required=True, help='Number of rows in the sprite sheet')
    parser.add_argument('--cols', type=int, required=True, help='Number of columns in the sprite sheet')
    parser.add_argument('--remove_bg', action='store_true', help='Remove white background from the image')
    
    args = parser.parse_args()
    
    slice_sprite_sheet(args.input, args.output_dir, args.prefix, args.rows, args.cols, args.remove_bg)
