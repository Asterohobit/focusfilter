import sys
import skia

if len(sys.argv) != 2:
    print("Usage: uv run icon-converter.py <size>")
    sys.exit(1)

size = int(sys.argv[1])
input_file = "focusfilter.svg"
output_file = f"focusfilter-{size}.png"

# Load SVG (correct way)
data = open(input_file, "rb").read()
stream = skia.MemoryStream(data)
svg = skia.SVGDOM.MakeFromStream(stream)

# Create surface
surface = skia.Surface(size, size)
canvas = surface.getCanvas()

# Get SVG size
container = svg.containerSize()
width = container.width() or size
height = container.height() or size

# Scale to fit
canvas.scale(size / width, size / height)

# Render
svg.render(canvas)

# Save PNG
image = surface.makeImageSnapshot()
image.save(output_file, skia.kPNG)

print(f"Saved {output_file}")