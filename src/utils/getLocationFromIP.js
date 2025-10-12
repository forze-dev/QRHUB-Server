// src/utils/getLocationFromIP.js
async function getLocationFromIP(ip) {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
        country: data.country,
        city: data.city
    };
}