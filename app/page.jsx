"use client";

import { useEffect, useState } from "react";



function OSMMap({ lat, lng, height = 140 }) {
  const isOnline = useOnlineStatus();

  if (!lat || !lng) return null;

  if (!isOnline) {
    return (
      <div className="mt-2 p-2 bg-gray-200 rounded text-xs">
        📍 Offline — showing raw coordinates
        <br />
        Lat: {lat}, Lng: {lng}
      </div>
    );
  }

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lng - 0.01
  },${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      className="rounded mt-2"
      loading="lazy"
    />
  );
}


/* ======================
   DEMO JWT UTILS
====================== */

const JWT_KEY = "auth_jwt";
const JWT_SECRET = "demo-secret"; // hardcoded demo secret

function base64Encode(obj) {
  return btoa(JSON.stringify(obj));
}

function base64Decode(str) {
  return JSON.parse(atob(str));
}

function sign(payloadBase64) {
  return btoa(payloadBase64 + JWT_SECRET);
}

function createJWT(payload) {
  const header = { alg: "HS256", typ: "JWT" };

  const encodedHeader = base64Encode(header);
  const encodedPayload = base64Encode(payload);

  const signature = sign(encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    if (sign(payloadB64) !== signature) return null;

    const payload = base64Decode(payloadB64);
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}


/* ======================
   CONSTANTS
====================== */

const STORAGE_KEY = "sos_messages";

/* ======================
   SOS TEMPLATES
====================== */

const SOS_TEMPLATES = [
  {
    label: "Medical Emergency",
    text:
      "Medical emergency reported. The individual requires urgent hospital assistance and immediate ambulance support.",
  },
  {
    label: "Fire Accident",
    text:
      "Fire accident reported. There is an active fire causing immediate danger to life and property. Emergency fire services are required urgently.",
  },

  {
    label: "Sexual Assault",
    text:
      "Sexual assault emergency. Immediate assistance required. Victim is unsafe and needs urgent police and medical intervention.",
  },
  {
    label: "Natural Disaster",
    text:
      "Natural disaster situation detected (flood, earthquake, or cyclone). People may be trapped or injured. Immediate rescue and relief are required.",
  },
];
const DEFAULT_SOS = SOS_TEMPLATES[0].text;
/* ======================
   SERVICES
====================== */

const Services = {
    login(mobile, password) {
      const payload = {
        mobile,
        iat: Date.now(),
        exp: Date.now() + 1000 * 60 * 60 * 6, // 6 hours
      };

      const token = createJWT(payload);
      localStorage.setItem(JWT_KEY, token);
    },

    logout() {
      localStorage.removeItem(JWT_KEY);
    },

    getUser() {
      const token = localStorage.getItem(JWT_KEY);
      if (!token) return null;

      return verifyJWT(token);
    },

    isAuthenticated() {
      return !!this.getUser();
    },

    getLocation() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          () => reject()
        );
      });
    }
};

/* ======================
   OSM MAP
====================== */


/* ======================
   IPHONE SHELL
====================== */

function IPhoneShell({ children }) {
  return (
    <div className="relative w-[360px] h-[740px]">
      <svg viewBox="0 0 360 740" className="absolute inset-0">
        <rect width="360" height="740" rx="48" fill="#000" />
        <rect x="12" y="12" width="336" height="716" rx="36" fill="#fff" />
        <rect x="130" y="20" width="100" height="12" rx="6" fill="#111" />
      </svg>

      <div className="absolute inset-[18px] rounded-[30px] bg-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ======================
   MAIN APP
====================== */

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}


export default function Home() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [sosMessage, setSosMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedSOS, setSelectedSOS] = useState(SOS_TEMPLATES[0].label);

  function loadMessages() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    setMessages(data);
  }

  async function triggerSOS() {
    const user = Services.getUser();
    if (!user || !sosMessage) return;

    const location = await Services.getLocation();

    const newMessage = {
      id: crypto.randomUUID(),
      user_mobile: user.mobile,
      message: sosMessage,
      optional_message: customMessage || `Auto-generated alert at ${new Date().toLocaleString()}`,
      location,
      time: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      department: null,
    };

    const existing =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const updated = [newMessage, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMessages(updated);
    setCustomMessage("");
  }

  function logout() {
    Services.logout();
    setLoggedIn(false);
    setMessages([]);
  }

  const user = Services.getUser();

  useEffect(() => {
    setLoggedIn(Services.isAuthenticated());
    loadMessages();

    const defaultTemplate = SOS_TEMPLATES[0];

    setSelectedSOS(defaultTemplate.label);
    setSosMessage(defaultTemplate.text);

    // ✅ Prefill here too
    setCustomMessage(defaultTemplate.text);

    const id = setInterval(loadMessages, 2000);
    return () => clearInterval(id);
  }, []);


  return (
    <main className="h-screen flex items-center justify-center bg-gray-300">
      <IPhoneShell>
        <div className="p-4 h-full flex flex-col">
          {!loggedIn ? (
            <div className="mt-24 flex flex-col gap-3">
              <h1 className="text-center font-bold">SOS Login</h1>

              <input
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="border p-2 rounded"
              />

              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded"
              />

              <button
                className="bg-black text-white py-2 rounded"
                onClick={() => {
                  Services.login(mobile, password);
                  setLoggedIn(true);
                }}

              >
                Login
              </button>
            </div>
          ) : (
            <>
              <select
                className="border p-2 rounded text-sm"
                value={selectedSOS}
                onChange={(e) => {
                  const selected = SOS_TEMPLATES.find(
                    (x) => x.label === e.target.value
                  );

                  setSelectedSOS(e.target.value);
                  setSosMessage(selected?.text || "");
                  setCustomMessage(selected?.text || "");
                }}
              >
                {SOS_TEMPLATES.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>

              <textarea
                className="border p-2 rounded mt-2 text-sm"
                rows={5}
                placeholder="Optional details"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />

              <button
                onClick={triggerSOS}
                className="mt-2 py-3 bg-red-600 text-white rounded-xl"
              >
                SEND SOS
              </button>

              <div className="mt-4 flex-1 overflow-auto">
                {messages
                  .filter((m) => m.user_mobile === user?.mobile)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-3 rounded shadow mb-3 text-xs"
                    >
                      {/* SOS Message */}
                      <p className="font-semibold text-red-600">
                        {m.message}
                      </p>

                      {/* STATUS */}
                      {!m.acknowledged && (
                        <p className="text-lg text-yellow-600 font-semibold my-4">
                          ⏳ Waiting for acknowledgement
                        </p>
                      )}

                      {m.acknowledged && !m.resolved && (
                        <p className="text-lg text-green-600 font-semibold my-4">
                          ✅ Acknowledged
                        </p>
                      )}

                      {m.resolved && (
                        <p className="text-lg text-blue-600 font-semibold my-4">
                          ✅ Issue Resolved
                        </p>
                      )}

                      {/* LIVE LOCATION — ONLY AFTER ACK */}
                      {m.acknowledged && m.department && (
                        <>
                          <p className="text-base text-green-600 font-semibold my-4">
                            Live location
                          </p>

                          <div className="mt-3 p-2 bg-green-100 rounded">
                            <p className="text-green-700 font-semibold">
                              Help is on the way
                            </p>

                            <OSMMap
                              lat={m.department.location.lat}
                              lng={m.department.location.lng}
                            />

                            <p className="font-bold my-4">
                              <span className="font-semibold">Call us at:</span>{" "}
                              {m.department.phone}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

              </div>

              <button
                onClick={logout}
                className="mt-2 py-3 bg-black text-white rounded-xl"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </IPhoneShell>
    </main>
  );
}
