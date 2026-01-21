"use client";

import { useEffect, useState } from "react";

/* ======================
   CONSTANTS
====================== */

const STORAGE_KEY = "sos_messages";

/* ======================
   SOS TEMPLATES
====================== */

const SOS_TEMPLATES = [
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
  {
    label: "Medical Emergency",
    text:
      "Medical emergency reported. The individual requires urgent hospital assistance and immediate ambulance support.",
  },
];

/* ======================
   SERVICES
====================== */

const Services = {
  login(mobile, password) {
    localStorage.setItem("auth", "true");
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ mobile, password })
    );
  },

  logout() {
    localStorage.removeItem("auth");
    localStorage.removeItem("auth_user");
  },

  getUser() {
    return JSON.parse(localStorage.getItem("auth_user"));
  },

  verify(mobile, password) {
    const user = JSON.parse(localStorage.getItem("auth_user"));
    if (!user) return false;
    return user.mobile === mobile && user.password === password;
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
  },
};

/* ======================
   OSM MAP
====================== */

function OSMMap({ lat, lng, height = 140 }) {
  if (!lat || !lng) return null;

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

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [sosMessage, setSosMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    setLoggedIn(localStorage.getItem("auth") === "true");
    loadMessages();
    const id = setInterval(loadMessages, 2000);
    return () => clearInterval(id);
  }, []);

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
      optional_message: customMessage || null,
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
                  const existing = Services.getUser();
                  if (existing) {
                    if (!Services.verify(mobile, password)) {
                      alert("Invalid credentials");
                      return;
                    }
                  } else {
                    Services.login(mobile, password);
                  }
                  localStorage.setItem("auth", "true");
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
                onChange={(e) => {
                  const t = SOS_TEMPLATES.find(
                    (x) => x.label === e.target.value
                  );
                  setSosMessage(t?.text || "");
                }}
              >
                <option value="">Select SOS Type</option>
                {SOS_TEMPLATES.map((t) => (
                  <option key={t.label}>{t.label}</option>
                ))}
              </select>

              <textarea
                className="border p-2 rounded mt-2 text-sm"
                rows={3}
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
