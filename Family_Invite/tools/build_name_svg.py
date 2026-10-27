"""Build real Pinyon Script outlines with hand-traced pen masks.

Usage: python3 tools/build_name_svg.py /path/to/PinyonScript-Regular.ttf
Requires fonttools. The generated fragment is embedded in index.html.
The browser needs neither this script nor a font parser.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

# Pen trajectories in a 200px em, baseline 200; each letter gets its own mask.
# Broad downstrokes and fine flourishes expose the original font silhouette.
PENS = {
    'A': [(12, 'M8 183 C-12 177 -8 211 30 195 C82 175 161 74 205 63'),
          (23, 'M205 63 L93 200'),
          (10, 'M104 178 C108 126 73 101 45 123 C16 145 48 187 108 179 C145 175 172 150 172 128')],
    'h': [(21, 'M100 45 L-6 200'),
          (20, 'M-5 197 C25 159 68 125 75 137 C84 144 48 179 45 190 C36 214 76 196 100 162')],
    'm': [(19, 'M10 161 C48 112 56 131 32 164 L7 197 M7 197 C55 147 76 125 85 137 C94 146 56 181 49 198 M49 198 C98 146 118 124 124 139 C129 151 91 181 98 194 C109 210 135 183 151 161')],
    'e': [(18, 'M9 173 C58 154 69 139 56 135 C34 125 0 164 6 190 C14 217 55 191 77 161')],
    'd': [(19, 'M68 149 C75 125 46 131 20 158 C-12 192 2 209 23 190 C63 159 111 84 149 45'),
          (21, 'M149 45 L51 181 C22 219 63 203 100 161')],
    'D': [(11, 'M115 84 C113 120 78 144 48 143 C0 143 42 79 84 68 C132 52 178 75 161 131 C150 172 117 203 62 198 C36 196 -10 175 3 192 C21 217 78 174 110 132 C138 95 164 72 195 71'),
          (22, 'M158 85 C126 113 108 149 78 176 C54 198 28 202 10 200')],
    'r': [(14, 'M3 170 Q22 152 28 129 Q30 119 26 131 Q21 142 59 147'),
          (22, 'M59 147 C39 164 11 192 26 197 C41 202 65 180 78 161')],
    'i': [(21, 'M37 135 L0 181 C-22 213 18 199 53 161'),
          (19, 'M56 106 L57 106')],
    'n': [(19, 'M11 161 C47 118 51 134 30 164 L7 197 M7 197 C55 146 80 126 87 138 C95 151 49 184 58 194 C72 207 100 179 112 161')],
    '&': [(11, 'M61 186 C31 153 43 121 61 129 C91 141 53 188 55 193 C76 195 114 201 115 165'),
          (21, 'M55 195 C81 155 103 127 129 105')],
    'a': [(19, 'M63 148 C73 125 40 130 13 164 C-12 194 7 210 35 178 L65 136 M65 136 L25 190 C23 211 61 187 80 161')],
    'Y': [(13, 'M91 72 C85 103 37 139 29 116 C22 87 84 52 111 63 C150 79 68 126 66 152 C61 183 115 141 139 111'),
          (22, 'M181 76 C149 85 121 138 92 178 C64 213 33 230 10 216'),
          (11, 'M10 216 C-7 207 8 194 12 201')],
    's': [(12, 'M9 165 L43 126'),
          (22, 'M43 126 C25 158 55 187 19 198'),
          (11, 'M19 198 C-23 210 -14 171 1 181 M31 182 C45 185 59 172 69 162')],
    'f': [(13, 'M12 169 C51 148 118 75 120 52 C122 30 101 49 88 65'),
          (21, 'M88 65 L-27 250 C-59 293 11 287 16 189'),
          (11, 'M16 189 C16 163 4 155 16 155 M13 177 C26 193 57 181 78 162')],
    'l': [(21, 'M98 45 L5 179 C-15 212 24 201 56 162')],
    'E': [(12, 'M17 90 C33 139 140 122 146 87 C155 49 96 61 78 81'),
          (21, 'M78 81 C42 117 64 132 83 137'),
          (15, 'M83 137 C87 128 62 126 46 132 C-22 153 -6 201 34 198 C74 198 104 162 75 153 C43 141 18 201 36 226')],
    'y': [(21, 'M45 135 L5 180 C-13 212 26 198 83 144'),
          (21, 'M93 135 C46 191 8 249 -21 267'),
          (12, 'M-21 267 C-57 290 -69 264 -19 239 C23 219 68 194 99 162')],
    'S': [(13, 'M116 68 C82 51 22 82 34 112 C47 151 138 139 168 96 C197 48 142 60 121 89'),
          (23, 'M142 71 C108 95 84 142 60 174 C35 207 8 203 3 191'),
          (11, 'M3 191 C-5 179 9 176 10 184')],
    'o': [(19, 'M61 139 C41 116 -11 174 10 194 C38 215 77 145 59 136'),
          (12, 'M59 167 C35 189 62 195 85 161')],
    'u': [(21, 'M38 135 L0 180 C-21 212 25 196 80 142 M84 135 L44 183 C27 212 64 199 99 161')],
    't': [(21, 'M69 90 L5 180 C-15 214 24 200 54 161'),
          (11, 'M32 115 H83')],
    ':': [(22, 'M41 144 L42 144'), (22, 'M15 190 L16 190')],
    ')': [(16, 'M62 63 C89 111 63 179 -8 217')],
}


def word_svg(font, word, label, extra_class=''):
    glyphs = font.getGlyphSet()
    scale = 200 / font['head'].unitsPerEm
    cmap = font.getBestCmap()
    advance = 0
    parts = []
    for index, letter in enumerate(word):
        glyph_name = cmap[ord(letter)]
        if letter.isspace():
            advance += font['hmtx'][glyph_name][0] * scale
            continue
        pen = SVGPathPen(glyphs, ntos=lambda n: f'{n:.2f}'.rstrip('0').rstrip('.'))
        glyphs[glyph_name].draw(TransformPen(pen, (scale, 0, 0, -scale, 0, 200)))
        mask_id = f'pen-{label}-{index}'
        strokes = ''.join(f'<path data-pen fill="none" stroke="white" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" d="{path}"/>' for width, path in PENS[letter])
        parts.append(f'<g data-letter="{letter}" transform="translate({advance + 14:.2f} 0)"><defs><mask id="{mask_id}" maskUnits="userSpaceOnUse" x="-70" y="0" width="350" height="330">{strokes}</mask></defs><path class="letter-fill" d="{pen.getCommands()}"/></g>')
        advance += font['hmtx'][glyph_name][0] * scale
    return f'<svg class="name-svg {extra_class}" viewBox="0 0 {advance + 28:.2f} 230" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' + ''.join(parts) + '</svg>'


if __name__ == '__main__':
    font = TTFont(sys.argv[1])
    fragment = '\n'.join(word_svg(font, word, label, cls) for word, label, cls in [('Ahmed','ahmed',''),('&','and','ampersand'),('Darine','darine','')])
    Path(__file__).with_name('names.fragment.html').write_text(fragment)
