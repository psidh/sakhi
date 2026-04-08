"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sos_messages";



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



/* ======================
   OSM MAP
====================== */

function OSMMap({ lat, lng, height = 220 }) {
  const isOnline = useOnlineStatus();

  if (!lat || !lng) return null;

  // OFFLINE fallback
  if (!isOnline) {
    return (
      <div className="mt-3 p-3 bg-gray-200 rounded text-sm">
        📍 Location unavailable (offline)
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
      className="rounded mt-3"
      loading="lazy"
    />
  );
}

/* ======================
   DASHBOARD
====================== */

export default function DepartmentPage() {

  const [messages, setMessages] = useState([]);

  // HARD-CODED department location (demo)
  const DEPARTMENT_LOCATION = {
    lat: 17.385044,
    lng: 78.486671,
  };

  useEffect(() => {
    const load = () => {
      const data =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      setMessages(data);
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const updateMessage = (id, patch) => {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, ...patch } : m
    );
    setMessages(updated);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">
        🚨 Department SOS Dashboard
      </h1>

      <div className="grid gap-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className="bg-white p-5 rounded-xl shadow"
          >
            <p className="font-semibold">
              Mobile: {m.user_mobile}
            </p>

            <p className="text-sm mt-2">{m.message}</p>

            {m.optional_message && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Additional info:</span>{" "}
                {m.optional_message}
              </p>
            )}


            <OSMMap
              lat={m.location.lat}
              lng={m.location.lng}
            />

            {!m.acknowledged && (
              <button
                onClick={() =>
                  updateMessage(m.id, {
                    acknowledged: true,
                    department: {
                      location: DEPARTMENT_LOCATION,
                      phone : "1800-800-1000",
                    },
                  })
                }
                className="mt-4 py-3 w-full bg-green-600 text-white rounded-xl font-semibold"
              >
                ACKNOWLEDGE
              </button>
            )}
            {m.acknowledged && (
              <>
                <button
                  disabled={m.resolved}
                  onClick={() =>
                    updateMessage(m.id, { resolved: true })
                  }
                  className={`mt-4 py-3 w-full rounded-xl font-semibold ${
                    m.resolved
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  MARK AS RESOLVED
                </button>

                {m.resolved && (
                  <p className="mt-3 text-green-700 font-semibold text-center">
                    ✅ Issue has been resolved
                  </p>
                )}
              </>
            )}

          </div>
        ))}
      </div>
    </main>
  );
}
