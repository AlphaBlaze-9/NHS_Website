# Bridgeland NHS · Service Card Lookup

A small static website that lets NHS members enter their Student ID
and pull their current service credits, meeting attendance, strikes,
permission slip status, and stole eligibility — sourced live from the
NHS officer Google Sheet.

Built in Bridgeland Bears navy + orange with an editorial / varsity
profile feel (Fraunces display, Manrope body, JetBrains Mono accents).

---

## Files

```
nhs-tracker/
├── index.html      ← page structure
├── styles.css      ← all the design
├── script.js       ← sheet fetching + lookup logic
└── README.md       ← this file
```

No build step, no framework, no installs. Just three files.

---

## How to run it locally

You can't just double-click `index.html` and have it work, because
browsers block `fetch()` from `file://` URLs. You need to serve the
folder. The easiest way:

```bash
# from inside the nhs-tracker folder:
python3 -m http.server 8000
```

Then open http://localhost:8000

(Or use the VS Code "Live Server" extension and click *Go Live*.)

---

## How to host it for free

Drop the folder onto any static host. All of these work:

- **GitHub Pages** — push to a repo, enable Pages in settings
- **Netlify** — drag the folder onto netlify.com/drop
- **Vercel** — `vercel deploy` from inside the folder
- **Cloudflare Pages** — connect a GitHub repo

---

## IMPORTANT: Make the sheet readable

The site fetches data using Google Sheets' public CSV endpoint.
That only works if the sheet is shared so anyone with the link
can view it.

In the Google Sheet:

1. Click **Share** (top right)
2. Under "General access" change *Restricted* → *Anyone with the link*
3. Make sure the role on the right says **Viewer**
4. Click **Done**

If you want the sheet private but the website still working, you'd
need to set up a small backend (Apps Script web app, or a Cloudflare
Worker hitting the Sheets API with a service account). Out of scope
for this static version.

---

## Configuring tab names / columns

Open `script.js` and edit the `CONFIG` object at the top:

```js
const CONFIG = {
  SHEET_ID: "170sqCq8Zv_l8ujMF1oRH5xofTErOoQOKtXBwteHxOGY",
  TABS: {
    "25-26": "25-26 Inductees",
    "26-27": "26-27 Inductees",
    EVENTS: "25/26 Search",
  },
  REQUIREMENTS: {
    juniorSenior: { service: 9, attendance: 8 },
    seniorOnly:   { service: 3, attendance: 3 },
  },
  COLUMNS: {
    studentId:   ["Student ID", "S Number", "ID", ...],
    name:        ["Name", "Student Name", ...],
    service:     ["Service Credits", "Service", ...],
    attendance:  ["Meetings Attended", "Meetings", ...],
    strikes:     ["Strikes", "Strike Count"],
    permission:  ["Permission Slip", "Perm Slip"],
    stole:       ["Stole Eligible", "Stole"],
    grade:       ["Grade", "Grade Level", "Class", "Year"],
  },
};
```

- **TABS**: must match the tab names at the bottom of the sheet exactly
- **COLUMNS**: the script tries each candidate name and uses whichever
  one your sheet actually has, so multiple variants are fine
- **REQUIREMENTS**: edit if the chapter's bylaws change

---

## Deep-linking

You can pre-fill a Student ID with a URL parameter:

```
https://yoursite.com/?id=S00012345
```

The site will run the lookup automatically.

---

## Design notes

- **Type:** Fraunces (variable serif with `opsz`, `SOFT`, `WONK` axes
  in play) for display, Manrope for UI, JetBrains Mono for labels
  and numbers.
- **Colors:** Bridgeland navy `#0c1f47`, orange `#ee6b1a`, warm cream
  `#f3ece0`. The grain overlay is a pure SVG noise filter, no images.
- **Layout:** intentional asymmetry on the hero, varsity-style box
  shadows on the cards, animated SVG progress rings.
- **No frameworks:** just HTML/CSS/JS. ~25KB total.

---

If anything breaks or you want changes (more stats shown, different
year labels, a dark mode, etc.) — happy to iterate.
