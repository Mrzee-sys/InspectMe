
import re

with open("src/pages/CategorySelPage.jsx", "r") as f:
    content = f.read()

# Replace the quick launchpad section with nothing
new_content = re.sub(r"        \{\/\* [^\n]*Inspection Launchpad.*?\n        <\/div>\n", "", content, flags=re.DOTALL)

with open("src/pages/CategorySelPage.jsx", "w") as f:
    f.write(new_content)

