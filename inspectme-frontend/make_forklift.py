import re

def rewrite_forklift(template_path, target_path):
    with open(template_path, 'r') as f:
        content = f.read()

    # Imports and naming
    content = content.replace("EarthmovingPage", "VehiclesForkliftDailyInspectionPage")
    
    # Change items
    items_block = """const FORKLIFT_ITEMS = [
  { key: 'lubricationAdequate', label: 'Lubrication adequate' },
  { key: 'switchesGaugesBrakes', label: 'Switches, Gauges, and Brakes in good working order' },
  { key: 'hoistingAndHorn', label: 'Hoisting mechanisms and Horn in good working order' },
  { key: 'lights', label: 'Lights in good working order' },
  { key: 'pedalsRimsTyresPipes', label: 'Pedal rubbers, Wheel rims and tyres, and All pipes in good condition' },
  { key: 'wheelNutsAndBolts', label: 'Wheel nuts and bolts secure' },
  { key: 'oilCoolantLevelsAndLeaks', label: 'Oil and coolant levels and leaks' },
  { key: 'fanbeltsConditionTension', label: 'Fanbelt/s in good condition and correct tension' },
  { key: 'capsAndBatteryMounting', label: 'Caps (i.e. oil, petrol, etc.) and Battery mounting secure' },
  { key: 'controlLevers', label: 'Control levers in good working order' },
  { key: 'compartmentSeatBelt', label: 'Compartment/seat and Safety belt in good condition' },
  { key: 'hydraulicOilLevel', label: 'Hydraulic oil level correct' },
  { key: 'gasShutOffAndHose', label: 'Gas shut-off valve operational/hose not damaged' },
  { key: 'gasTankMountings', label: 'Gas tank mountings secure' },
  { key: 'reverseSirenAndBeacon', label: 'Reverse siren and Beacon or strobe warning light' }
]"""

    metadata_block = """const ITEM_METADATA = {};"""

    content = re.sub(r'const EM_CODES = \[.*?\]', '', content, flags=re.DOTALL)
    content = re.sub(r'const EM_ITEMS = \[.*?\]', items_block, content, flags=re.DOTALL)
    content = re.sub(r'const ITEM_METADATA = \{.*?\};', metadata_block, content, flags=re.DOTALL)

    # State replacements
    content = content.replace("em: buildInitialDeviationState(EM_ITEMS),", "forklift: buildInitialDeviationState(FORKLIFT_ITEMS),")
    content = content.replace("deviations.em", "deviations.forklift")
    content = content.replace("EM_ITEMS", "FORKLIFT_ITEMS")
    content = content.replace("EM_CODES", "[]")
    
    # Text replacements
    content = content.replace("Earthmoving (TLBs)", "Vehicles / Forklift Daily Inspection")
    content = content.replace("EARTHMOVING_EQUIPMENT", "VEHICLES_FORKLIFT_DAILY_INSPECTION")
    
    # Form data replacements
    content = content.replace("    area: '',\\n    inspector: '',\\n    year: String(new Date().getFullYear()),", "    regNo: '',\\n    dateFrom: '',\\n    dateTo: '',\\n    driver: '',\\n    timeOut: '',\\n    timeIn: '',")
    content = content.replace("    area: '',", "    regNo: '',\\n    dateFrom: '',\\n    dateTo: '',\\n    driver: '',\\n    timeOut: '',\\n    timeIn: '',")
    content = content.replace("    inspector: '',", "")
    content = content.replace("    year: String(new Date().getFullYear()),", "")

    content = content.replace("if (!formData.area.trim()) errors.push('AREA is required.')", "if (!formData.regNo.trim()) errors.push('REG. No is required.')")
    content = content.replace("if (!formData.inspector.trim()) errors.push('INSPECTOR is required.')", "")
    content = content.replace("if (!formData.year.trim()) errors.push('YEAR is required.')", "")

    # Payload replacement
    payload_replacement = """        formPayload: {
          details: {
            regNo: formData.regNo,
            dateFrom: formData.dateFrom,
            dateTo: formData.dateTo,
            driver: formData.driver,
            timeOut: formData.timeOut,
            timeIn: formData.timeIn,
          },
          itemStatus: Object.keys(deviations.forklift).reduce((acc, key) => {
            const status = deviations.forklift[key].status;
            acc[key] = status === 'pass' ? 'OK' : status === 'fail' ? 'DEF' : status === 'na' ? 'N/A' : '';
            return acc;
          }, {}),
        },"""
    content = re.sub(r'formPayload: \{.*?\},\n        \},', payload_replacement, content, flags=re.DOTALL)

    # UI Inputs replacements
    ui_inputs = """              <label htmlFor="regNo" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">REG. No</label>
              <input type="text" id="regNo" value={formData.regNo || ''} onChange={(e) => updateField('regNo', e.target.value)} className="mb-4 w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="dateFrom" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">DATE FROM</label>
                  <input type="date" id="dateFrom" value={formData.dateFrom || ''} onChange={(e) => updateField('dateFrom', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label htmlFor="dateTo" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">DATE TO</label>
                  <input type="date" id="dateTo" value={formData.dateTo || ''} onChange={(e) => updateField('dateTo', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <label htmlFor="driver" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">DRIVER</label>
              <input type="text" id="driver" value={formData.driver || ''} onChange={(e) => updateField('driver', e.target.value)} className="mb-4 w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="timeOut" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">TIME OUT</label>
                  <input type="time" id="timeOut" value={formData.timeOut || ''} onChange={(e) => updateField('timeOut', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label htmlFor="timeIn" className="mb-1.5 block text-sm font-semibold text-slate-700 ml-1">TIME IN</label>
                  <input type="time" id="timeIn" value={formData.timeIn || ''} onChange={(e) => updateField('timeIn', e.target.value)} className="w-full rounded-full border-none bg-white/40 px-4 py-2.5 text-sm text-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),_inset_-3px_-3px_6px_rgba(255,255,255,0.9)] backdrop-blur-sm outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>"""

    content = re.sub(r'<label htmlFor="area".*?</div>\s*</div>', ui_inputs, content, flags=re.DOTALL)
    
    # Hide issues UI and fix buttons
    content = content.replace("{itemState.status === 'fail' && (", "{false && (")
    content = content.replace("Pass\\n                    </button>", "OK\\n                    </button>")
    content = content.replace("Fail\\n                    </button>", "DEF\\n                    </button>")
    content = content.replace(">Pass<", ">OK<")
    content = content.replace(">Fail<", ">DEF<")

    content = content.replace("renderSection('em'", "renderSection('forklift'")

    with open(target_path, 'w') as f:
        f.write(content)

rewrite_forklift('src/pages/EarthmovingPage.jsx', 'src/pages/VehiclesForkliftDailyInspectionPage.jsx')

