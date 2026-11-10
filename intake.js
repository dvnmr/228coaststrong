/* Coast Strong intake — builds an English ticket client-side.
   Fixed answers are translated via data-en attributes on the options;
   free text is carried verbatim, labeled as the visitor's original words.
   ONE FORM (Nov 10, 2026): the hero form is the ICC Ocean Trash Data
   Card section (Ocean Conservancy Volunteer Ocean Trash Data Form, 2021):
   counts are numbers only and item names come from data-en, so the ticket
   is always in ICC English no matter which language the form is shown in.
   A dumping report is a collapsed secondary block inside the same form
   (it submits when the visitor fills what + where, or alongside ICC
   counts), and volunteering is a compact name-and-email section on the
   same page. Deep links still work: ?type=report opens the dumping
   details, ?type=volunteer scrolls to the volunteer section. */
(function () {
  "use strict";
  var LANG_NAMES = { en: "English", es: "Spanish", vi: "Vietnamese", fr: "French", de: "German", pl: "Polish" };
  var DEST = "228coaststrong@gmail.com";
  var lang = document.documentElement.lang || "en";

  var formReport = document.getElementById("formReport");
  var formVol = document.getElementById("formVolunteer");
  var ticketSection = document.getElementById("ticketSection");
  var ticketText = document.getElementById("ticketText");
  var sendLink = document.getElementById("sendLink");
  var copyBtn = document.getElementById("copyBtn");
  var errBox = document.getElementById("errBox");

  /* Deep links from the homepage keep working: ?type=report opens the
     dumping details, ?type=volunteer scrolls to the volunteer section. */
  var params = new URLSearchParams(window.location.search);
  var linkType = params.get("type");
  if (linkType === "volunteer") {
    var volSection = document.getElementById("volSection");
    if (volSection) volSection.scrollIntoView({ block: "start" });
  } else if (linkType === "report") {
    var dumpDetails = document.getElementById("dumpDetails");
    if (dumpDetails) { dumpDetails.open = true; dumpDetails.scrollIntoView({ block: "start" }); }
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function enOf(id) {
    var el = document.getElementById(id);
    if (!el || el.selectedIndex < 0) return "";
    var opt = el.options[el.selectedIndex];
    /* The "Choose…" placeholder options carry an empty value and an empty
       data-en; without this guard they fall through to their visible text
       and read as real answers — which used to make an empty ICC section
       look filled in (TOTAL ITEMS COUNTED: 0 on a plain dumping report). */
    if (!opt.value) return "";
    return (opt.getAttribute("data-en") || opt.textContent || "").trim();
  }
  function numVal(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var n = parseInt(el.value, 10);
    return (isNaN(n) || n < 0) ? 0 : n;
  }
  function given(v) { return v ? v : "(not given)"; }

  function present(subject, body) {
    ticketText.value = body;
    sendLink.href = "mailto:" + DEST + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    ticketSection.classList.add("show");
    ticketSection.scrollIntoView({ block: "start" });
  }
  function fail() {
    errBox.classList.add("show");
    errBox.scrollIntoView({ block: "center" });
  }

  /* ICC Ocean Trash Data Card block. Returns null when the visitor filled
     in nothing in the section, so a plain dumping report is unchanged. */
  function iccBlock() {
    var date = val("iDate"), site = val("iSite");
    var env = enOf("iEnv"), mode = enOf("iMode");
    var adults = numVal("iAdults"), children = numVal("iChildren");
    var unusual = val("iUnusual");
    var groups = {}, order = [], total = 0, i, j, k, m;
    var counts = formReport.querySelectorAll(".iccCount");
    for (i = 0; i < counts.length; i++) {
      var n = parseInt(counts[i].value, 10);
      if (isNaN(n) || n <= 0) continue;
      var g = counts[i].getAttribute("data-group") || "Items";
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push({ name: counts[i].getAttribute("data-en") || "", n: n });
      total += n;
    }
    var others = [];
    var oNames = formReport.querySelectorAll(".iccOtherName");
    var oCounts = formReport.querySelectorAll(".iccOtherCount");
    for (j = 0; j < oNames.length; j++) {
      var nm = oNames[j].value.trim();
      var cn = oCounts[j] ? parseInt(oCounts[j].value, 10) : NaN;
      if (nm && !isNaN(cn) && cn > 0) { others.push({ name: nm, n: cn }); total += cn; }
    }
    var aType = val("iAnimalType"), aStatus = enOf("iAnimalStatus"),
        aEnt = enOf("iAnimalEntangled"), aItem = val("iAnimalItem");
    var bags = numVal("iBags"), weight = numVal("iWeight"), wUnit = enOf("iWeightUnit"),
        dist = numVal("iDistance"), dUnit = enOf("iDistanceUnit"),
        area = numVal("iArea"), aUnit = enOf("iAreaUnit");
    var hasData = date || site || env || mode || adults || children || unusual ||
      total > 0 || aType || aStatus || aEnt || aItem || bags || weight || dist || area;
    if (!hasData) return null;
    var lines = [];
    lines.push("INTERNATIONAL COASTAL CLEANUP — OCEAN TRASH DATA");
    lines.push("(Ocean Conservancy Volunteer Ocean Trash Data Form, 2021)");
    if (date) lines.push("CLEANUP DATE: " + date);
    if (site) lines.push("SITE NAME (visitor's words): " + site);
    if (env) lines.push("TYPE OF ENVIRONMENT: " + env);
    if (mode) lines.push("MODE OF DATA COLLECTION: " + mode);
    if (adults || children) lines.push("VOLUNTEERS: " + adults + " adults, " + children + " children (under 12)");
    if (unusual) lines.push("MOST UNUSUAL ITEM (visitor's words): " + unusual);
    for (k = 0; k < order.length; k++) {
      var gname = order[k], sub = 0;
      lines.push("");
      lines.push(gname.toUpperCase() + ":");
      for (m = 0; m < groups[gname].length; m++) {
        lines.push("  " + groups[gname][m].name + ": " + groups[gname][m].n);
        sub += groups[gname][m].n;
      }
      lines.push("  Subtotal: " + sub);
    }
    if (others.length) {
      lines.push("");
      lines.push("OTHER ITEMS NOT LISTED:");
      for (j = 0; j < others.length; j++) lines.push("  " + others[j].name + " (visitor's words): " + others[j].n);
    }
    if (aType || aStatus || aEnt || aItem) {
      var parts = [];
      if (aType) parts.push("type: " + aType);
      if (aStatus) parts.push("status: " + aStatus);
      if (aEnt) parts.push("entangled: " + aEnt);
      if (aItem) parts.push("entanglement item: " + aItem);
      lines.push("");
      lines.push("DEAD/INJURED ANIMAL: " + parts.join("; "));
    }
    if (bags || weight || dist || area) {
      var s = [];
      if (bags) s.push("Bags filled: " + bags);
      if (weight) s.push("Weight: " + weight + " " + (wUnit || "lbs"));
      if (dist) s.push("Distance cleaned: " + dist + " " + (dUnit || "miles"));
      if (area) s.push("Area cleaned: " + area + " " + (aUnit || "miles²"));
      lines.push("");
      lines.push("CLEANUP SUMMARY: " + s.join("; "));
    }
    lines.push("");
    lines.push("TOTAL ITEMS COUNTED: " + total);
    lines.push("");
    lines.push("To enter this data in the Ocean Trash Index: record it in Clean Swell (https://oceanconservancy.org/cleanswell) or email this ticket to cleanup@oceanconservancy.org. Ocean Conservancy enters it in the TIDES database.");
    return lines.join("\n");
  }

  formReport.addEventListener("submit", function (e) {
    e.preventDefault();
    var icc = iccBlock();
    var what = enOf("rWhat"), where = val("rWhere");
    var hasDump = what && where;
    /* The hero form is the ICC data card: it submits on counts alone.
       A dumping report submits on what + where. Either one, or both. */
    if (!icc && !hasDump) { fail(); return; }
    errBox.classList.remove("show");
    var lines = [];
    if (hasDump) {
      lines.push(
        "COAST STRONG INTAKE — DUMPING / SITE REPORT",
        "Form language: " + (LANG_NAMES[lang] || lang),
        "",
        "WHAT: " + what,
        "WHERE (visitor's words): " + where,
        "WHEN: " + (enOf("rWhen") || "(not given)"),
        "DETAILS (visitor's original words, untranslated): " + (val("rDetails") || "(none)"),
        "NAME: " + given(val("rName")),
        "CONTACT: " + given(val("rContact")),
        "",
        "Note: Fixed answers were translated into English from the form. Free text above is the visitor's original wording, kept exactly as written."
      );
    } else {
      lines.push(
        "COAST STRONG INTAKE — ICC CLEANUP DATA",
        "Form language: " + (LANG_NAMES[lang] || lang),
        "",
        "NAME: " + given(val("rName")),
        "CONTACT: " + given(val("rContact")),
        ""
      );
    }
    if (icc) lines.push("", icc);
    if (icc && !hasDump) {
      lines.push("", "Note: Fixed answers were translated into English from the form. Free text above is the visitor's original wording, kept exactly as written.");
    }
    var subject = icc
      ? (hasDump ? "Coast Strong intake — Dumping / site report + ICC cleanup data" : "Coast Strong intake — ICC cleanup data")
      : "Coast Strong intake — Dumping / site report";
    present(subject, lines.join("\n"));
  });

  formVol.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = val("vName"), contact = val("vContact");
    /* Compact volunteer section: name + contact is the whole ask. The
       old help checkboxes no longer exist on the page; if a future
       version brings them back, they are still read when present. */
    var helps = [];
    var boxes = formVol.querySelectorAll(".vHelp:checked");
    for (var i = 0; i < boxes.length; i++) helps.push(boxes[i].getAttribute("data-en"));
    if (!name || !contact) { fail(); return; }
    errBox.classList.remove("show");
    var lines = [
      "COAST STRONG INTAKE — VOLUNTEER",
      "Form language: " + (LANG_NAMES[lang] || lang),
      "",
      "NAME: " + name,
      "CONTACT: " + contact,
      "WANTS TO HELP WITH: " + (helps.length ? helps.join("; ") : "(not specified)"),
      "",
      "Note: Fixed answers were translated into English from the form. Free text above is the visitor's original wording, kept exactly as written."
    ];
    present("Coast Strong intake — Volunteer", lines.join("\n"));
  });

  copyBtn.addEventListener("click", function () {
    var done = function () {
      var old = copyBtn.textContent;
      copyBtn.textContent = copyBtn.getAttribute("data-copied") || "Copied";
      setTimeout(function () { copyBtn.textContent = old; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ticketText.value).then(done, function () {
        ticketText.select(); document.execCommand("copy"); done();
      });
    } else {
      ticketText.select(); document.execCommand("copy"); done();
    }
  });
})();
