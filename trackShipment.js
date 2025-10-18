import fetch from "node-fetch";

export async function trackShipment(trackingNumber, courier) {
  if (!process.env.AFTERSHIP_KEY) throw new Error("AFTERSHIP_KEY not configured");
  const url = `https://api.aftership.com/v4/trackings/${courier}/${trackingNumber}`;
  const res = await fetch(url, {
    headers: {
      "aftership-api-key": process.env.AFTERSHIP_KEY,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.data?.tracking || json;
  } catch {
    throw new Error("Invalid AfterShip response");
  }
}

