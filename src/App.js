import { Route, Routes, BrowserRouter } from "react-router-dom";
import React from "react";
import Main from "./components/main/Main";
import { useEffect, useState } from "react";
import GlobalStyles from "./core-ui/Globals";
import { ThemeProvider } from "styled-components";
import { defaultWeather, clouds, rain, clear, thunderstorm, snow, drizzle, mist, smoke, fog, haze } from "./core-ui/Themes.styled";

const WEATHER_KEY = process.env.REACT_APP_VERY_PRIVATE_KEY || process.env.REACT_APP_WEATHER_KEY;
const initialWeather = { name: "", country: "", temp: "", icon: "03d", weather: "", weatherDesc: "", feelsLike: "", humidity: "", wind: "", highest: "", lowest: "" };
const themeMap = { clouds, rain, clear, thunderstorm, snow, drizzle, mist, smoke, fog, haze };


function App() {
  const [todayWeather, setTodayWeather] = useState(initialWeather);
  const [theme, setTheme] = useState("defaultWeather");
  const [formValue, setFormValue] = useState({ searchedLocation: "" });
  const [formError, setFormError] = useState({});
  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedCity = formValue.searchedLocation.trim();
    const errors = validateForm({ searchedLocation: trimmedCity });
    setFormError(errors);
    if (errors.searchedLocation) {
      return null;
    }

    fetchWeatherByCity(trimmedCity);
    setFormValue({ searchedLocation: "" });
  }
  const handleValidation = (e) => {
    const { name, value } = e.target;
    setFormValue({ ...formValue, [name]: value });
  }
  const validateForm = (value) => {
    let errors = {};
    if (!value.searchedLocation) {
      errors.searchedLocation = "Empty field, please add a city name"
    }
    return errors;
  }

  const fetchWeatherByCity = async (city) => {
    if (!WEATHER_KEY) {
      setLoading(false);
      setNoData(true);
      setFormError({ searchedLocation: "Missing API key. Add REACT_APP_VERY_PRIVATE_KEY or REACT_APP_WEATHER_KEY in .env, then restart npm start" });
      return;
    }

    setLoading(true);
    setNoData(false);
    setFormError({});

    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric`);
      const data = await response.json();

      if (!response.ok || !data?.main || !Array.isArray(data?.weather) || !data.weather[0]) {
        if (response.status === 401 || Number(data?.cod) === 401) {
          throw new Error("Invalid API key. Update .env and restart npm start");
        }
        throw new Error("City not found. Try format like London or London,GB");
      }

      const weatherType = data.weather[0].main.toLowerCase();
      setTodayWeather({
        name: data.name || city,
        country: data.sys?.country || "",
        temp: Math.ceil(data.main.temp),
        icon: data.weather[0].icon,
        weather: weatherType,
        weatherDesc: data.weather[0].description,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        highest: data.main.temp_max,
        lowest: data.main.temp_min
      });
      setTheme(themeMap[weatherType] ? weatherType : "defaultWeather");
      setNoData(false);
    } catch (err) {
      setNoData(true);
      setTodayWeather(initialWeather);
      setTheme("defaultWeather");
      setFormError({ searchedLocation: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherByCity("Tbilisi");
  }, []);

  const setWeather = themeMap[theme] || defaultWeather;


  return (
    <ThemeProvider theme={setWeather}>
      <BrowserRouter>
        <GlobalStyles />
        <Routes>
          <Route path="/" element={<Main theme={theme.toLowerCase()} noData={noData} loading={loading} formError={formError} formValue={formValue} todayWeather={todayWeather} handleSubmit={handleSubmit} handleValidation={handleValidation} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );


}

export default App;
