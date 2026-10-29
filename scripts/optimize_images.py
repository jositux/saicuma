#!/usr/bin/env python3
"""Recomprime las fotos de public/ que pesan de más, sin pérdida visible de calidad.

- JPEG progresivo, calidad 80 (máx. 1600 px).
- Si una foto con mucho detalle pierde calidad (PSNR < 34 dB), prueba calidad 92;
  si tampoco alcanza o no se ahorra espacio, la deja como está.
- Las fotos ya optimizadas (progresivas) no se vuelven a tocar.

Uso:  pnpm optimize-images
Necesita: pillow
"""
import io
import math
import os

from PIL import Image, ImageChops, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
MAX_SIDE = 1600
MIN_BYTES = 150_000
MIN_PSNR = 34.0


def psnr(a, b):
    stat = ImageStat.Stat(ImageChops.difference(a, b).point(lambda v: v * v))
    mse = sum(stat.mean) / 3
    return 99.0 if mse == 0 else 10 * math.log10(255 ** 2 / mse)


def encode(im, **opts):
    buf = io.BytesIO()
    im.save(buf, 'JPEG', optimize=True, progressive=True, **opts)
    return buf.getvalue()


before = after = count = kept = 0
for dirpath, _, files in os.walk(PUBLIC):
    for name in files:
        if not name.lower().endswith(('.jpg', '.jpeg')):
            continue
        path = os.path.join(dirpath, name)
        size = os.path.getsize(path)
        if size < MIN_BYTES:
            continue
        try:
            with Image.open(path) as src:
                if src.info.get('progressive') or src.info.get('progression'):
                    continue
                im = src.convert('RGB')
            im.thumbnail((MAX_SIDE, MAX_SIDE))
            data = encode(im, quality=80)
            ref = im
            if psnr(Image.open(io.BytesIO(data)).convert('RGB'), ref) < MIN_PSNR:
                data = encode(im, quality=92, subsampling=0)
                if psnr(Image.open(io.BytesIO(data)).convert('RGB'), ref) < MIN_PSNR + 4:
                    kept += 1
                    continue
        except Exception as e:  # imagen dañada: se deja como está
            print('omitida', path, e)
            continue
        if len(data) < size:
            with open(path, 'wb') as f:
                f.write(data)
            before, after, count = before + size, after + len(data), count + 1
        else:
            kept += 1

print(f'{count} recomprimidas ({before / 1e6:.0f} MB -> {after / 1e6:.0f} MB), {kept} sin cambios')
