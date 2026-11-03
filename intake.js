/* Coast Strong intake — builds an English ticket client-side.
   Fixed answers are translated via data-en attributes on the options;
   free text is carried verbatim, labeled as the visitor's original words. */
(function () {
  "use strict";
  var LANG_NAMES = { en: "English", es: "Spanish", vi: "Vietnamese", fr: "French", de: "German", pl: "Polish" };
  var DEST = "228coaststrong@gmail.com";
  var lang = document.documentElement.lang || "en";

  var tabReport = document.getElementById("tabReport");
  var tabVol = document.getElementById("tabVolunteer");
  var formReport = document.getElementById("formReport");
  var formVol = document.getElementById("formVolunteer");
  var ticketSection = document.getElementById("ticketSection");
  var ticketText = document.getElementById("ticketText");
  var sendLink = document.getElementById("sendLink");
  var copyBtn = document.getElementById("copyBtn");
  var errBox = document.getElementById("errBox");

  function showForm(which) {
    var isReport = which === "report";
    formReport.classList.toggle("hidden", !isReport);
    formVol.classList.toggle("hidden", isReport);
    tabReport.setAttribute("aria-selected", isReport ? "true" : "false");
    tabVol.setAttribute("aria-selected", isReport ? "false" : "true");
    errBox.classList.remove("show");
  }
  tabReport.addEventListener("click", function () { showForm("report"); });
  tabVol.addEventListener("click", function () { showForm("volunteer"); });
  var params = new URLSearchParams(window.location.search);
  showForm(params.get("type") === "volunteer" ? "volunteer" : "report");

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function enOf(id) {
    var el = document.getElementById(id);
    if (!el || el.selectedIndex < 0) return "";
    var opt = el.options[el.selectedIndex];
    return (opt.getAttribute("data-en") || opt.textContent || "").trim();
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

  formReport.addEventListener("submit", function (e) {
    e.preventDefault();
    var what = enOf("rWhat"), where = val("rWhere");
    if (!what || !where) { fail(); return; }
    errBox.classList.remove("show");
    var lines = [
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
    ];
    present("Coast Strong intake — Dumping / site report", lines.join("\n"));
  });

  formVol.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = val("vName"), contact = val("vContact");
    var helps = [];
    var boxes = formVol.querySelectorAll(".vHelp:checked");
    for (var i = 0; i < boxes.length; i++) helps.push(boxes[i].getAttribute("data-en"));
    if (!name || !contact || helps.length === 0) { fail(); return; }
    errBox.classList.remove("show");
    var lines = [
      "COAST STRONG INTAKE — VOLUNTEER",
      "Form language: " + (LANG_NAMES[lang] || lang),
      "",
      "NAME: " + name,
      "CONTACT: " + contact,
      "CITY: " + given(val("vCity")),
      "WANTS TO HELP WITH: " + helps.join("; "),
      "USUALLY AVAILABLE: " + (enOf("vAvail") || "(not given)"),
      "NOTES (visitor's original words, untranslated): " + (val("vNotes") || "(none)"),
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
