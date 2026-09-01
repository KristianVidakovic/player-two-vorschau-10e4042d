"""Entwicklungsserver fuer die Player-Two-Website.

Liefert die Dateien aus wie ein normaler Webserver und nimmt zusaetzlich
Bildabzuege der Leinwand entgegen. Damit kann waehrend der Arbeit jederzeit
geprueft werden, wie die Stadt tatsaechlich aussieht, ohne dass jemand
manuell einen Bildschirmabzug macht.

Nur fuer die Entwicklung. Geht nie auf einen echten Server.
"""

import base64
import http.server
import io
import os
import socketserver
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABZUEGE = os.path.join(WURZEL, "werkzeug", "abzuege")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5180


class Griff(http.server.SimpleHTTPRequestHandler):
    # 206 gehoert zu HTTP/1.1. Unter 1.0 wuerde der Browser die Teilantwort
    # nicht zuverlaessig annehmen.
    protocol_version = "HTTP/1.1"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WURZEL, **kw)

    # ---------------------------------------------------------- Bereichsanfragen
    # Der Hero-Film wird beim Scrollen vor- und zurueckgesprungen. Dafuer muss
    # der Browser einzelne Stuecke der Datei anfordern duerfen. Ohne das meldet
    # er seekable als leeren Bereich und klemmt jedes currentTime auf 0 - der
    # Scrub laeuft dann auf einem echten Server, aber nie hier.
    def send_head(self):
        kopf = self.headers.get("Range")
        if not kopf or not kopf.startswith("bytes="):
            return super().send_head()

        pfad = self.translate_path(self.path)
        if not os.path.isfile(pfad):
            return super().send_head()

        groesse = os.path.getsize(pfad)
        von, bis = _bereich_lesen(kopf, groesse)
        if von is None:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % groesse)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        datei = open(pfad, "rb")
        datei.seek(von)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(pfad))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (von, bis, groesse))
        self.send_header("Content-Length", str(bis - von + 1))
        self.end_headers()
        return _Stueck(datei, bis - von + 1)

    def do_POST(self):
        if self.path == "/daten":
            self._daten_speichern()
            return
        if self.path == "/hero":
            self._hero_speichern()
            return
        if self.path != "/abzug":
            self.send_error(404)
            return
        laenge = int(self.headers.get("Content-Length", 0))
        rohdaten = self.rfile.read(laenge).decode("utf-8", "replace")
        name, _, nutzdaten = rohdaten.partition("|")
        if "," in nutzdaten:
            nutzdaten = nutzdaten.split(",", 1)[1]
        sicher = "".join(c for c in name if c.isalnum() or c in "-_")[:60] or "abzug"
        os.makedirs(ABZUEGE, exist_ok=True)
        ziel = os.path.join(ABZUEGE, sicher + ".png")
        with open(ziel, "wb") as f:
            f.write(base64.b64decode(nutzdaten))
        antwort = ziel.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(antwort)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(antwort)

    def _daten_speichern(self):
        """Nimmt eine JSON-Datei entgegen und legt sie unter data/ ab.

        Erste Zeile ist der Dateiname, danach der Inhalt. Nur fuer die
        Entwicklung, damit der Wegeditor speichern kann.
        """
        laenge = int(self.headers.get("Content-Length", 0))
        rohdaten = self.rfile.read(laenge).decode("utf-8", "replace")
        name, _, inhalt = rohdaten.partition("\n")
        sicher = "".join(c for c in name.strip() if c.isalnum() or c in "-_")[:60]
        if not sicher:
            self.send_error(400, "kein Dateiname")
            return
        ordner = os.path.join(WURZEL, "data")
        os.makedirs(ordner, exist_ok=True)
        ziel = os.path.join(ordner, sicher + ".json")
        with open(ziel, "w", encoding="utf-8") as f:
            f.write(inhalt)
        antwort = ziel.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(antwort)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(antwort)

    def _hero_speichern(self):
        """Schreibt die Plaetze der drei Hero-Meldungen ins CSS.

        Der Setzmodus schickt die Werte, die Kristian mit der Maus
        gesetzt hat. Hier werden nur left und top der sechs Regeln
        ersetzt; alles andere in den Regeln bleibt stehen.
        """
        import json
        import re

        laenge = int(self.headers.get("Content-Length", 0))
        try:
            daten = json.loads(self.rfile.read(laenge).decode("utf-8"))
        except ValueError:
            self.send_error(400, "kein gueltiges JSON")
            return

        ERLAUBT = {"index-vorschlag.html", "index.html"}
        datei = daten.get("datei", "index-vorschlag.html")
        if datei not in ERLAUBT:
            self.send_error(400, "diese Datei nicht")
            return

        pfad = os.path.join(WURZEL, datei)
        with open(pfad, encoding="utf-8") as f:
            text = f.read()

        with open(pfad + ".vor-setzen", "w", encoding="utf-8") as f:
            f.write(text)

        geaendert = 0
        for regel in daten.get("regeln", []):
            wahl, links, oben = regel["wahl"], regel["links"], regel["oben"]
            muster = re.compile(
                r"(" + re.escape(wahl) + r"\s*\{)([^}]*)(\})")

            def ersetzen(m):
                inhalt = m.group(2)
                inhalt = re.sub(r"left:\s*[-\d.]+%", "left: %.2f%%" % links, inhalt)
                inhalt = re.sub(r"top:\s*[-\d.]+%", "top: %.2f%%" % oben, inhalt)
                return m.group(1) + inhalt + m.group(3)

            text, n = muster.subn(ersetzen, text, count=1)
            geaendert += n

        with open(pfad, "w", encoding="utf-8") as f:
            f.write(text)

        antwort = ("%d Regeln geschrieben in %s" % (geaendert, datei)).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(antwort)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(antwort)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        # Sagt dem Browser, dass er springen darf. Ohne diesen Kopf probiert
        # er es bei manchen Dateitypen gar nicht erst.
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def log_message(self, form, *args):
        if self.command == "POST":
            super().log_message(form, *args)


def _bereich_lesen(kopf, groesse):
    """Wertet einen einzelnen Bereich aus.

    Mehrfachbereiche kommen bei Video und Bild nicht vor, deshalb reicht
    der erste. Rueckgabe (None, None) heisst: unbrauchbar, also 416.
    """
    try:
        erster = kopf[len("bytes="):].split(",")[0].strip()
        a, _, b = erster.partition("-")
        if a == "":                      # bytes=-500 meint die letzten 500
            laenge = int(b)
            if laenge <= 0:
                return None, None
            return max(0, groesse - laenge), groesse - 1
        von = int(a)
        bis = int(b) if b else groesse - 1
    except (ValueError, TypeError):
        return None, None
    if von >= groesse or von > bis:
        return None, None
    return von, min(bis, groesse - 1)


class _Stueck(io.RawIOBase):
    """Gibt aus einer geoeffneten Datei nur die naechsten n Bytes heraus.

    copyfile wuerde sonst bis zum Dateiende schreiben und damit mehr
    senden, als der Content-Length-Kopf ankuendigt.
    """

    def __init__(self, datei, laenge):
        self._datei = datei
        self._rest = laenge

    def readable(self):
        return True

    def readinto(self, puffer):
        if self._rest <= 0:
            return 0
        daten = self._datei.read(min(len(puffer), self._rest))
        self._rest -= len(daten)
        puffer[:len(daten)] = daten
        return len(daten)

    def close(self):
        try:
            self._datei.close()
        finally:
            super().close()


class Server(socketserver.ThreadingTCPServer):
    # Unter Windows erlaubt SO_REUSEADDR einem zweiten Server, denselben Port
    # zu belegen, waehrend der erste noch daran haengt. Die Anfragen verteilen
    # sich dann auf beide, und die Seite kommt halb, gar nicht, oder als nackte
    # Dateiliste. Dort also aus: ein belegter Port soll ehrlich scheitern,
    # damit _server_oeffnen ausweichen kann.
    allow_reuse_address = os.name != "nt"
    daemon_threads = True


def _server_oeffnen(port, versuche=10):
    """Bindet den ersten freien Port ab `port`.

    Nach einem Absturz haengt der alte Server oft noch am Port. Statt mit
    einem Traceback abzubrechen, weicht der neue auf den naechsten aus.
    Rueckgabe (None, None) heisst: alles belegt.
    """
    for kandidat in range(port, port + versuche):
        try:
            return Server(("127.0.0.1", kandidat), Griff), kandidat
        except OSError:
            print("Port %d ist belegt." % kandidat)
    return None, None


if __name__ == "__main__":
    if not os.path.isfile(os.path.join(WURZEL, "index.html")):
        print("ACHTUNG: index.html fehlt in %s." % WURZEL)
        print("Der Browser zeigt dann nur eine Dateiliste statt der Website.")

    server, port = _server_oeffnen(PORT)
    if server is None:
        print("")
        print("Kein freier Port zwischen %d und %d." % (PORT, PORT + 9))
        print("Wahrscheinlich laufen noch alte Server. Im Task-Manager alle")
        print("python.exe beenden, dann die Vorschau neu starten.")
        sys.exit(1)

    with server as s:
        print("Website auf http://localhost:%d  (Abzuege nach %s)" % (port, ABZUEGE))
        if port != PORT:
            print("Hinweis: %d war belegt, deshalb %d." % (PORT, port))
        try:
            s.serve_forever()
        except KeyboardInterrupt:
            print("")
            print("Server beendet.")
