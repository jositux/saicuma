#!/usr/bin/env python3
"""Genera content/*.json y public/ a partir del export de saicuma.org (_export/).

Uso:   pnpm extract        (o: python3 scripts/extract_saicuma.py)
Necesita: beautifulsoup4
"""
import json
import os
import re
import shutil
import unicodedata
from urllib.parse import quote, unquote, urlsplit

from bs4 import BeautifulSoup, Comment

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = os.path.join(ROOT, '_export')
HTML = os.path.join(EXPORT, 'html')
ASSETS = os.path.join(EXPORT, 'assets')
OUT = os.path.join(ROOT, 'content')
PUBLIC = os.path.join(ROOT, 'public')

TYPE_SLUG = {'Persona': 'persona', 'Colectivo': 'colectivo', 'Institución': 'institucion'}
LINK_FIELDS = {
    'field-name-field-other-facebook': 'facebook',
    'field-name-field-other-twitter': 'twitter',
    'field-name-field-other-flickr': 'flickr',
    'field-name-field-other-pinterest': 'pinterest',
    'field-name-field-other-google-plus': 'googleplus',
    'field-name-field-other-web': 'web',
    'field-name-field-other-mail': 'email',
    'field-name-field-other-phone': 'phone',
}
used_assets = set()


def soup(path):
    with open(path, encoding='utf-8') as f:
        return BeautifulSoup(f.read(), 'html.parser')


def asset(url):
    """URL de un archivo del sitio -> ruta local (sin ?itok, NFC y codificada)."""
    if not url:
        return None
    path = unquote(urlsplit(url).path)
    if not path.startswith('/sites/') and not path.startswith('/misc/'):
        return None
    path = unicodedata.normalize('NFC', path)
    if not os.path.exists(os.path.join(ASSETS, path.lstrip('/'))):
        return None
    used_assets.add(path)
    return quote(path, safe="/-._~!$&'()*+,;=:@")


def slug_of(href):
    return unquote(href.rstrip('/').split('/')[-1])


def text(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).strip() if el else ''


def field(scope, name):
    return scope.select_one(f'div.field.{name} .field-items') if scope else None


def links_in(el):
    return [a['href'] for a in el.select('a[href]')] if el else []


def disciplines_of(scope):
    el = scope.select_one('.field-name-field-discipline .textformatter-list') if scope else None
    if not el:
        return []
    raw = text(el).rstrip('.')
    return [d.strip() for d in raw.split(',') if d.strip()]


def teaser(row):
    a = row.select_one('.field-name-real-name a')
    return slug_of(a['href']) if a else None


def clean_html(el):
    if not el:
        return ''
    for t in el.select('script, style, form'):
        t.decompose()
    for c in el.find_all(string=lambda x: isinstance(x, Comment)):
        c.extract()
    for a in el.find_all('a', href=True):
        a['rel'] = 'noopener noreferrer'
        a['target'] = '_blank'
    html = el.decode_contents().strip()
    return html


def profile(slug):
    s = soup(os.path.join(HTML, 'users', slug + '.html'))
    p = s.select_one('.pane-user-profile')
    if not p:
        return None
    head = p.select_one('.group-header')
    name = text(head.select_one('.field-name-real-name-no-link h3')) if head else ''
    type_label = text(p.select_one('.group-header .type-icon')) or 'Persona'

    data = p.select_one('.entity-profile2:not(.profile2-works)')
    works = p.select_one('.profile2-works')

    def val(name_):
        el = field(data, name_)
        return text(el) if el else ''

    def href(name_):
        el = field(data, name_)
        hs = links_in(el)
        return hs[0] if hs else ''

    email_el = p.select_one('.group-left .field-name-e-mail .field-email .field-item') or \
        p.select_one('.field-name-e-mail .field-email .field-item')
    email = text(email_el)
    if '@' not in email:
        email = ''

    pic = p.select_one('.field-name-user-picture-by-role img')
    picture = asset(pic['src']) if pic else None

    links = {}
    if works:
        for cls, key in LINK_FIELDS.items():
            el = field(works, cls)
            if not el:
                continue
            hs = links_in(el)
            links[key] = hs[0] if hs else text(el)

    gallery = []
    for a in p.select('.view-work-gallery a.colorbox'):
        img = a.find('img')
        full, thumb = asset(a['href']), asset(img['src']) if img else None
        if full or thumb:
            gallery.append({'full': full or thumb, 'thumb': thumb or full,
                            'width': int(img['width']) if img and str(img.get('width', '')).isdigit() else None,
                            'height': int(img['height']) if img and str(img.get('height', '')).isdigit() else None})

    related = []
    rel = s.find('h2', string='Relacionados')
    if rel:
        block = rel.find_parent(class_=re.compile(r'\bview\b'))
        for row in block.select('.views-row'):
            r = teaser(row)
            if r:
                related.append(r)

    desc = works.select_one('.field-name-field-description .field-item') if works else None

    return {
        'slug': slug,
        'name': name or text(s.select_one('#page-title')),
        'type': TYPE_SLUG.get(type_label, 'persona'),
        'disciplines': disciplines_of(p),
        'city': val('field-name-field-city'),
        'contactName': val('field-name-field-contact-name'),
        'category': val('field-name-field-category'),
        'dependency': val('field-name-field-dependency'),
        'address': val('field-name-field-address'),
        'phone': val('field-name-field-phone'),
        'email': email,
        'web': href('field-name-field-web') or val('field-name-field-web'),
        'picture': picture,
        'bio': clean_html(desc),
        'links': links,
        'gallery': gallery,
        'related': related,
    }


def options(select):
    out = []
    for o in select.find_all('option'):
        if o['value'] == 'All':
            continue
        label = re.sub(r'\s*\(\d+\)$', '', o.get_text(strip=True))
        out.append({'id': o['value'], 'name': label})
    return out


def page(name):
    s = soup(os.path.join(HTML, name + '.html'))
    main = s.select_one('#main')
    title = text(main.select_one('h1'))
    body = main.select_one('.field-name-body .field-item') or main.select_one('.node .content') or main
    for t in body.select('script, style, form, h1, .breadcrumb'):
        t.decompose()
    return {'slug': name, 'title': title, 'html': clean_html(body)}


def main():
    # Orden del listado original
    order = []
    for i in range(6):
        s = soup(os.path.join(HTML, f'principal_page_{i}.html'))
        for row in s.select('.view-user-filter-list .view-content > .views-row'):
            sl = teaser(row)
            if sl and sl not in order:
                order.append(sl)
    all_slugs = sorted(f[:-5] for f in os.listdir(os.path.join(HTML, 'users')))
    order += [s for s in all_slugs if s not in order]

    profiles = [p for p in (profile(s) for s in order) if p]
    known = {p['slug'] for p in profiles}
    for p in profiles:
        p['related'] = [r for r in p['related'] if r in known and r != p['slug']]

    idx = soup(os.path.join(HTML, 'index.html'))
    taxonomies = {
        'disciplines': options(idx.select_one('select[name=discipline]')),
        'cities': options(idx.select_one('select[name=city]')),
    }

    # Imágenes por defecto según el tipo de perfil
    for name in ('rol-persona.png', 'rol-colectivo.png', 'rol-institucion-ong.png', 'saicuma2.png'):
        used_assets.add(f'/sites/all/themes/saicuma2014/images/{name}')

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'profiles.json'), 'w', encoding='utf-8') as f:
        json.dump(profiles, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'taxonomies.json'), 'w', encoding='utf-8') as f:
        json.dump(taxonomies, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'pages.json'), 'w', encoding='utf-8') as f:
        json.dump([page('acerca-de'), page('contact')], f, ensure_ascii=False, indent=1)

    copied = 0
    for path in sorted(used_assets):
        src = os.path.join(ASSETS, path.lstrip('/'))
        if os.path.exists(src):
            dst = os.path.join(PUBLIC, path.lstrip('/'))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            copied += 1
    print(f'{len(profiles)} perfiles, {copied} archivos copiados a public/')


if __name__ == '__main__':
    main()
