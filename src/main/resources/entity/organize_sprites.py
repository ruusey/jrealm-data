"""
Organize sprite sheets into clean, gap-free grids.

Uses row-band and column-gap projection to find individual sprites.
For tall bands (multi-row), subdivides by scanning for internal row gaps
within each column region.

Original files are never modified.
"""

from PIL import Image
import numpy as np
import os


def find_bands(alpha_2d, axis):
    """
    Find contiguous non-empty bands along an axis.
    axis=0: find row bands (groups of rows with content)
    axis=1: find column bands (groups of columns with content)
    Returns list of (start, end) inclusive indices.
    """
    if axis == 0:
        has = [bool(alpha_2d[i, :].any()) for i in range(alpha_2d.shape[0])]
    else:
        has = [bool(alpha_2d[:, i].any()) for i in range(alpha_2d.shape[1])]

    bands = []
    in_band = False
    for i in range(len(has)):
        if has[i] and not in_band:
            start = i
            in_band = True
        elif not has[i] and in_band:
            bands.append((start, i - 1))
            in_band = False
    if in_band:
        bands.append((start, len(has) - 1))
    return bands


def find_sprites_in_region(alpha_region, region_y_offset, region_x_offset, sprite_size):
    """
    Find individual sprites within a rectangular alpha region.
    First finds column blobs, then for each column blob, finds row sub-sprites.
    Returns list of (x0, y0, x1, y1) in absolute image coordinates.
    """
    h, w = alpha_region.shape
    sprites = []

    # Find column blobs
    col_bands = find_bands(alpha_region, axis=1)

    for cx0, cx1 in col_bands:
        # Within this column range, find row sub-sprites
        col_slice = alpha_region[:, cx0:cx1 + 1]
        row_bands = find_bands(col_slice, axis=0)

        for ry0, ry1 in row_bands:
            # Get tight bounding box within this sub-region
            sub = col_slice[ry0:ry1 + 1, :]
            ys, xs = np.where(sub > 0)
            if len(ys) == 0:
                continue
            tight_x0 = int(xs.min())
            tight_x1 = int(xs.max())
            tight_y0 = int(ys.min())
            tight_y1 = int(ys.max())

            abs_x0 = region_x_offset + cx0 + tight_x0
            abs_y0 = region_y_offset + ry0 + tight_y0
            abs_x1 = region_x_offset + cx0 + tight_x1 + 1
            abs_y1 = region_y_offset + ry0 + tight_y1 + 1

            sprites.append((abs_x0, abs_y0, abs_x1, abs_y1))

    return sprites


def group_into_rows(sprites, sprite_size):
    """Group sprites into rows by Y-center proximity."""
    if not sprites:
        return []

    sorted_sprites = sorted(sprites, key=lambda s: (s[1] + s[3]) / 2)

    rows = []
    current_row = [sorted_sprites[0]]
    current_y_center = (sorted_sprites[0][1] + sorted_sprites[0][3]) / 2

    for s in sorted_sprites[1:]:
        y_center = (s[1] + s[3]) / 2
        if abs(y_center - current_y_center) <= sprite_size * 0.6:
            current_row.append(s)
            # Update running average y center
            current_y_center = sum((s[1] + s[3]) / 2 for s in current_row) / len(current_row)
        else:
            rows.append(sorted(current_row, key=lambda s: s[0]))
            current_row = [s]
            current_y_center = y_center

    if current_row:
        rows.append(sorted(current_row, key=lambda s: s[0]))

    return rows


def organize_sheet(input_path, sprite_size, output_path):
    """Reorganize a sprite sheet into a clean grid."""
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    alpha = data[:, :, 3]
    w, h = img.size
    print(f"  Source: {w}x{h}, sprite size: {sprite_size}x{sprite_size}")

    # Find row bands in the full image
    row_bands = find_bands(alpha, axis=0)
    print(f"  Found {len(row_bands)} row bands")

    # Find all individual sprites
    all_sprites = []
    for ry0, ry1 in row_bands:
        region = alpha[ry0:ry1 + 1, :]
        sprites = find_sprites_in_region(region, ry0, 0, sprite_size)
        all_sprites.extend(sprites)

    print(f"  Found {len(all_sprites)} individual sprites")

    # Size stats
    sizes = [(x1 - x0, y1 - y0) for x0, y0, x1, y1 in all_sprites]
    widths = [s[0] for s in sizes]
    heights = [s[1] for s in sizes]
    print(f"  Size range: {min(widths)}x{min(heights)} to {max(widths)}x{max(heights)}")

    oversized = [s for s in sizes if s[0] > sprite_size or s[1] > sprite_size]
    if oversized:
        print(f"  {len(oversized)} sprites exceed {sprite_size}x{sprite_size}")

    # Group into rows
    rows = group_into_rows(all_sprites, sprite_size)
    print(f"  Organized into {len(rows)} rows")

    # Use cell_size: the smallest square that fits all sprites
    all_widths = [x1 - x0 for row in rows for x0, y0, x1, y1 in row]
    all_heights = [y1 - y0 for row in rows for x0, y0, x1, y1 in row]
    cell_size = max(max(all_widths), max(all_heights))
    print(f"  Largest sprite dimension: {cell_size}px -> using {cell_size}x{cell_size} cells")

    # Calculate output dimensions
    max_cols = max(len(row) for row in rows)
    out_w = max_cols * cell_size

    row_y_offsets = []
    current_y = 0
    for row in rows:
        row_y_offsets.append(current_y)
        current_y += cell_size

    out_h = current_y
    print(f"  Output: {out_w}x{out_h} ({max_cols} cols x {len(rows)} rows, {cell_size}px cells)")

    for i, row in enumerate(rows):
        print(f"    Row {i}: {len(row)} sprites")

    # Build output image
    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    for row_idx, row in enumerate(rows):
        ry = row_y_offsets[row_idx]

        for col_idx, (x0, y0, x1, y1) in enumerate(row):
            sw = x1 - x0
            sh = y1 - y0
            sprite_img = img.crop((x0, y0, x1, y1))

            # Center horizontally, bottom-align vertically within cell
            dx = col_idx * cell_size + (cell_size - sw) // 2
            dy = ry + (cell_size - sh)  # bottom-align
            out.paste(sprite_img, (dx, dy))

    out.save(output_path)
    print(f"  Saved to: {output_path}")


def main():
    base = os.path.dirname(os.path.abspath(__file__))

    sheets = [
        ("8-Bit_Remaster_Bosses.png", 16, "8-Bit_Remaster_Bosses_organized.png"),
        ("8-Bit_Remaster_Character.png", 8, "8-Bit_Remaster_Character_organized.png"),
    ]

    for src_name, sprite_size, dst_name in sheets:
        src = os.path.join(base, src_name)
        dst = os.path.join(base, dst_name)
        if not os.path.exists(src):
            print(f"SKIP: {src_name} not found")
            continue
        print(f"\nProcessing {src_name}...")
        organize_sheet(src, sprite_size, dst)

    print("\nDone! Originals are untouched.")


if __name__ == "__main__":
    main()
