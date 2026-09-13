from PIL import Image, ImageDraw

def draw_icon(size, path):
    img = Image.new("RGBA", (size, size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    pad = int(size * 0.06)
    d.rounded_rectangle([pad, pad, size-pad, size-pad], radius=int(size*0.22), fill="#FDF3E3")

    cx, cy = size*0.5, size*0.44
    rx, ry = size*0.22, size*0.26

    d.ellipse([cx-rx*0.62, cy-ry*0.98, cx+rx*0.38, cy+ry*0.32], fill="#9CD1F5")
    d.ellipse([cx-rx*0.38, cy-ry*0.98, cx+rx*0.62, cy+ry*0.32], fill="#F9A8C9")

    hi_r = size*0.03
    d.ellipse([cx-rx*0.15-hi_r, cy-ry*0.55-hi_r, cx-rx*0.15+hi_r, cy-ry*0.55+hi_r], fill="#FFFFFF")

    kx, ky = cx, cy+ry*0.32
    d.polygon([(kx-size*0.02, ky), (kx+size*0.02, ky), (kx, ky+size*0.045)], fill="#E0679A")

    sx, sy = kx, ky+size*0.045
    pts = []
    import math
    n = 5
    for i in range(n):
        t = i / (n-1)
        x = sx + math.sin(t*math.pi*3) * size*0.03
        y = sy + t * size*0.18
        pts.append((x,y))
    d.line(pts, fill="#E0679A", width=max(2,int(size*0.012)))

    img.save(path, "PNG")

draw_icon(192, "/home/claude/photobooth/public/icons/icon-192.png")
draw_icon(512, "/home/claude/photobooth/public/icons/icon-512.png")
print("done")
