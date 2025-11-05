// script.js
// Replace `API_KEY` with your own OpenWeatherMap API key.
// Get it from https://openweathermap.org/api (Current Weather Data)
const API_KEY = "62fd2851fe1b59b6ad75581a19e165e8";

const elements = {
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  geoBtn: document.getElementById("geoBtn"),
  error: document.getElementById("error"),
  card: document.getElementById("card"),
  loading: document.getElementById("loading"),
  cityName: document.getElementById("cityName"),
  country: document.getElementById("country"),
  temp: document.getElementById("temp"),
  desc: document.getElementById("desc"),
  feels: document.getElementById("feels"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  weatherIcon: document.getElementById("weatherIcon"),
  localTime: document.getElementById("localTime")
};

function setLoading(on = true) {
  elements.loading.classList.toggle("hidden", !on);
  elements.card.classList.toggle("hidden", on);
  elements.error.textContent = "";
}

function showError(msg) {
  elements.error.textContent = msg;
  elements.card.classList.add("hidden");
  elements.loading.classList.add("hidden");
}

// Convert UNIX timestamp + timezone offset to local HH:MM string
function formatLocalTime(unix, tzOffset) {
  // unix in seconds, tzOffset in seconds
  const date = new Date((unix + tzOffset) * 1000);
  const hh = date.getUTCHours().toString().padStart(2, "0");
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

async function fetchWeatherByCity(city) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    showError("Please set your OpenWeatherMap API key in script.js (API_KEY).");
    return;
  }

  setLoading(true);
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("City not found. Try a different name.");
      } else {
        throw new Error("Weather API error. Try again later.");
      }
    }
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    showError(err.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    showError("Please set your OpenWeatherMap API key in script.js (API_KEY).");
    return;
  }

  setLoading(true);
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Unable to fetch weather for your location.");
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    showError(err.message);
  }
}

function renderWeather(data) {
  // data structure: https://openweathermap.org/current
  elements.cityName.textContent = data.name;
  elements.country.textContent = data.sys?.country || "";
  elements.temp.textContent = `${Math.round(data.main.temp)}°C`;
  elements.desc.textContent = data.weather?.[0]?.description || "";
  elements.feels.textContent = `${Math.round(data.main.feels_like)}°C`;
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.wind.textContent = `${data.wind.speed} m/s`;

  // local time
  // data.dt is unix timestamp, data.timezone is offset in seconds
  elements.localTime.textContent = formatLocalTime(data.dt, data.timezone);

  // icon
  const iconCode = data.weather?.[0]?.icon;
  if (iconCode) {
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    elements.weatherIcon.alt = data.weather?.[0]?.description || "Weather icon";
  } else {
    elements.weatherIcon.src = "";
    elements.weatherIcon.alt = "";
  }

  elements.error.textContent = "";
  elements.loading.classList.add("hidden");
  elements.card.classList.remove("hidden");
}

// -- Event listeners
elements.searchBtn.addEventListener("click", () => {
  const city = elements.cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  fetchWeatherByCity(city);
});

elements.cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    elements.searchBtn.click();
  }
});

elements.geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation not supported by your browser.");
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      showError("Unable to get your location. Allow location access or search by city.");
    }
  );
});

// Optionally: load last searched city from localStorage
(function init() {
  const last = localStorage.getItem("lastCity");
  if (last) {
    elements.cityInput.value = last;
    // do not auto-search; wait for user action
  }
  // Save city to localStorage on successful search
  const originalRender = renderWeather;
  renderWeather = function (data) {
    localStorage.setItem("lastCity", data.name);
    originalRender(data);
  };
})();
