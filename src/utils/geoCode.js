// utils/geocode.js
const axios = require("axios");

const GEOCODING_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getCoordinatesFromAddress(address) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GEOCODING_API_KEY}`;

    const response = await axios.get(url);

    if (response.data.status === "OK") {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      throw new Error("Không tìm thấy tọa độ cho địa chỉ này");
    }
  } catch (error) {
    console.error("Lỗi khi lấy tọa độ:", error.message);
    throw error;
  }
}

module.exports = { getCoordinatesFromAddress };
