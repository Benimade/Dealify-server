
import fetch from "node-fetch";

export async function trackShipment(trackingNumber, courier) {
  const url = `https://api.aftership.com/v4/trackings/${courier}/${trackingNumber}`;
  const response = await fetch(url, {
    headers: {
      "aftership-api-key": process.env.AFTERSHIP_KEY,
      "Content-Type": "application/json"
    }
  });
  const json = await response.json();
  return json.data?.tracking || {};
}
