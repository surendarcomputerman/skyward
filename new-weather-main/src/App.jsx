import { useEffect, useState } from "react";
import "./App.css";

const API_KEY = "834acfb355ef849519a41773c81c2a03";
const QUICK_CITIES = ["New York", "Tokyo", "London", "Sydney"];

function weatherIcon(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function WeatherDashboard() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("London");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState("C");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWeather(location) {
    setLoading(true);
    setError("");
    try {
      const encodedCity = encodeURIComponent(location.trim());
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=metric&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&units=metric&appid=${API_KEY}`),
      ]);
      const [currentData, forecastData] = await Promise.all([
        currentResponse.json(),
        forecastResponse.json(),
      ]);
      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error(currentData.message || forecastData.message || "Weather data is unavailable right now.");
      }

      setWeather(currentData);
      setForecast(forecastData.list || []);
      setCity(currentData.name);
      setQuery("");
    } catch (requestError) {
      setError(requestError.message === "city not found"
        ? "We couldn't find that city. Check the spelling and try again."
        : requestError.message || "Unable to load weather. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather("London");
  }, []);

  const temperature = (value) => Math.round(unit === "C" ? value : value * 9 / 5 + 32);
  const unitLabel = `°${unit}`;
  const hourly = forecast.slice(0, 8);
  const dailyForecast = forecast.reduce((days, item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!days[date]) days[date] = [];
    days[date].push(item);
    return days;
  }, {});
  const days = Object.entries(dailyForecast).slice(0, 5);
  const todayLabel = new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric",
    timeZone: weather?.timezone ? "UTC" : undefined,
  }).format(new Date(Date.now() + (weather?.timezone || 0) * 1000));

  function submitSearch(event) {
    event.preventDefault();
    if (query.trim()) loadWeather(query);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Forecast home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>skyward<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#overview"><span className="nav-icon">◉</span> Overview</a>
          <a className="nav-link" href="#hourly"><span className="nav-icon">◷</span> Hourly forecast</a>
          <a className="nav-link" href="#week"><span className="nav-icon">▤</span> 5-day outlook</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-caption">SAVED LOCATIONS</div>
          {QUICK_CITIES.slice(0, 3).map((savedCity, index) => (
            <button className="saved-city" key={savedCity} onClick={() => loadWeather(savedCity)}>
              <span className={`saved-dot dot-${index}`} />{savedCity}<span className="saved-arrow">↗</span>
            </button>
          ))}
          <div className="sidebar-note"><span className="live-dot" /> Live conditions<br /><small>Updated just now</small></div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="page-heading">
            <span className="eyebrow">YOUR LOCAL WEATHER</span>
            <h1>Weather overview</h1>
          </div>
          <form className="search-form" onSubmit={submitSearch} role="search">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              aria-label="Search for a city"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a city..."
            />
            <button type="submit" disabled={loading || !query.trim()} aria-label="Search city">Search</button>
          </form>
        </header>

        {error && (
          <div className="notice" role="alert">
            <span>{error}</span>
            <button onClick={() => loadWeather(city)}>Try again</button>
          </div>
        )}

        <section className={`hero-panel ${loading ? "is-loading" : ""}`} aria-label="Current weather">
          <div className="hero-copy">
            <div className="location-line"><span className="location-pin">⌖</span>{city}{weather?.sys?.country ? `, ${weather.sys.country}` : ""}</div>
            <p className="date-line">{todayLabel}</p>
            {weather ? (
              <>
                <div className="temperature-row">
                  <span className="hero-temperature">{temperature(weather.main.temp)}°</span>
                  <div className="condition-copy">
                    <span className="condition-name">{weather.weather[0].description}</span>
                    <span className="feels-like">Feels like {temperature(weather.main.feels_like)}{unitLabel}</span>
                  </div>
                </div>
                <p className="high-low">H:{temperature(weather.main.temp_max)}{unitLabel} <span /> L:{temperature(weather.main.temp_min)}{unitLabel}</p>
              </>
            ) : (
              <div className="loading-copy">{loading ? "Gathering the latest conditions…" : "Weather data is unavailable"}</div>
            )}
          </div>
          {weather && <img className="hero-weather-icon" src={weatherIcon(weather.weather[0].icon)} alt={weather.weather[0].description} />}
          <div className="hero-decoration" aria-hidden="true"><span /></div>
          <div className="hero-footer"><span><i className="live-dot" /> LIVE CONDITIONS</span><span>{weather ? `Updated ${new Date(weather.dt * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}</span></div>
        </section>

        <section className="details-section" aria-labelledby="details-title">
          <div className="section-heading">
            <div><span className="eyebrow">AT A GLANCE</span><h2 id="details-title">Today's conditions</h2></div>
            <div className="unit-switch" role="group" aria-label="Temperature unit">
              <button className={unit === "C" ? "selected" : ""} onClick={() => setUnit("C")} aria-pressed={unit === "C"}>°C</button>
              <button className={unit === "F" ? "selected" : ""} onClick={() => setUnit("F")} aria-pressed={unit === "F"}>°F</button>
            </div>
          </div>
          <div className="metric-grid">
            <article className="metric-item"><span className="metric-icon humidity">≈</span><div><span className="metric-label">Humidity</span><strong>{weather ? `${weather.main.humidity}%` : "—"}</strong><small>Feels {weather && weather.main.humidity > 65 ? "humid" : "comfortable"}</small></div></article>
            <article className="metric-item"><span className="metric-icon wind">↗</span><div><span className="metric-label">Wind speed</span><strong>{weather ? <>{Math.round(weather.wind.speed * 3.6)} <small>km/h</small></> : "—"}</strong><small>{weather?.wind?.deg != null ? `${weather.wind.deg}° direction` : "Current conditions"}</small></div></article>
            <article className="metric-item"><span className="metric-icon visibility">◎</span><div><span className="metric-label">Visibility</span><strong>{weather ? <>{(weather.visibility / 1000).toFixed(1)} <small>km</small></> : "—"}</strong><small>Across the area</small></div></article>
            <article className="metric-item"><span className="metric-icon pressure">⌁</span><div><span className="metric-label">Pressure</span><strong>{weather ? <>{weather.main.pressure} <small>hPa</small></> : "—"}</strong><small>Sea level pressure</small></div></article>
          </div>
        </section>

        <section className="forecast-section" id="hourly" aria-labelledby="hourly-title">
          <div className="section-heading"><div><span className="eyebrow">UP NEXT</span><h2 id="hourly-title">Hourly forecast</h2></div><span className="section-meta">Next 24 hours</span></div>
          <div className="hourly-strip">
            {hourly.map((item, index) => (
              <article className={`hour-item ${index === 0 ? "hour-now" : ""}`} key={item.dt}>
                <span className="hour-time">{index === 0 ? "Now" : new Date(item.dt * 1000).toLocaleTimeString([], { hour: "numeric" })}</span>
                <img src={weatherIcon(item.weather[0].icon)} alt="" />
                <strong>{temperature(item.main.temp)}{unitLabel}</strong>
                <span className="hour-rain">{item.pop ? `${Math.round(item.pop * 100)}% rain` : " "}</span>
              </article>
            ))}
            {!weather && <div className="empty-message">{loading ? "Loading hourly forecast…" : "Search for a city to see the forecast."}</div>}
          </div>
        </section>

        <section className="forecast-section week-section" id="week" aria-labelledby="week-title">
          <div className="section-heading"><div><span className="eyebrow">PLAN AHEAD</span><h2 id="week-title">5-day outlook</h2></div><span className="section-meta">Daily conditions</span></div>
          <div className="week-list">
            {days.map(([date, items], index) => {
              const midday = items[Math.floor(items.length / 2)] || items[0];
              const high = Math.max(...items.map((item) => item.main.temp_max));
              const low = Math.min(...items.map((item) => item.main.temp_min));
              return <article className="week-row" key={date}>
                <span className="week-day">{index === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "long" })}</span>
                <span className="week-condition"><img src={weatherIcon(midday.weather[0].icon)} alt="" /><span>{midday.weather[0].description}</span></span>
                <div className="week-range"><span>{temperature(low)}{unitLabel}</span><div className="range-track"><i style={{ left: `${Math.min(70, Math.max(12, 20 + (temperature(low) + 10) * 1.2))}%`, width: `${Math.max(14, Math.min(64, (temperature(high) - temperature(low)) * 3))}%` }} /></div><strong>{temperature(high)}{unitLabel}</strong></div>
              </article>;
            })}
            {!weather && <div className="empty-message">{loading ? "Loading daily outlook…" : "Your forecast will appear here."}</div>}
          </div>
        </section>
        <footer className="app-footer"><span>Weather data by OpenWeather</span><span>Skyward Weather <i>·</i> {new Date().getFullYear()}</span></footer>
      </main>
    </div>
  );
}

export default WeatherDashboard;