
import re

with open("src/pages/HomePage.jsx", "r") as f:
    content = f.read()

# 1. Add import
if "import SyncClockCard" not in content:
    content = content.replace("import { Activity,", "import SyncClockCard from \"../components/SyncClockCard\";\nimport { Activity,")

# 2. Remove currentTime state
content = re.sub(r"  const \[currentTime, setCurrentTime\] = useState\(new Date\(\)\);\n", "", content)

# 3. Remove timer from useEffect
content = content.replace("    const timer = setInterval(() => setCurrentTime(new Date()), 1000);\n", "")
content = content.replace("      clearInterval(timer);\n", "")

# 4. Remove formatting logic
formatting_regex = r"  // Retro Digital Clock Formatting\n.*?const digitalTime = `\$\{hours\}:\$\{minutes\}:\$\{seconds\}`;"
content = re.sub(formatting_regex, "", content, flags=re.DOTALL)

# 5. Replace JSX
jsx_start = "        {/* 3D Layered Digital Clock with Animated Compliance Ring */}"
jsx_end = "              </div>\n            </div>\n          </div>"

if jsx_start in content and jsx_end in content:
    start_idx = content.find(jsx_start)
    end_idx = content.find(jsx_end, start_idx) + len(jsx_end)
    content = content[:start_idx] + "        {/* 3D Layered Digital Clock with Animated Compliance Ring */}\n        <div className=\"mb-4\">\n          <SyncClockCard />\n        </div>" + content[end_idx:]

with open("src/pages/HomePage.jsx", "w") as f:
    f.write(content)

