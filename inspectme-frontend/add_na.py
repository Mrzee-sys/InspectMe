import glob
import re

files = glob.glob('src/pages/*Page.jsx')
fleet_files = ['src/pages/EarthmovingPage.jsx', 'src/pages/DumpTrucksPage.jsx', 'src/pages/MobileCranesPage.jsx', 'src/pages/ElevatingPlatformsPage.jsx']

for file in fleet_files:
    with open(file, 'r') as f:
        content = f.read()

    # 1. Update the submit accumulator map
    content = content.replace("} else if (itemState.status === 'fail') {", """} else if (itemState.status === 'na') {
          accumulator[item.label] = 'N/A'
        } else if (itemState.status === 'fail') {""")

    # 2. Add the N/A button
    na_btn = """                    <button
                      type="button"
                      onClick={() => handleStatusChange(sectionKey, item.key, 'na')}
                      className={"rounded-full px-3 py-1 text-[11px] font-bold transition-all " + (itemState.status === 'na' ? 'bg-slate-400 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800')}
                    >
                      N/A
                    </button>"""
                    
    content = content.replace("Fail\n                    </button>", f"Fail\n                    </button>\n{na_btn}")
    
    with open(file, 'w') as f:
        f.write(content)

