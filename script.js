const main = document.querySelector(".main__container");
const additionFirst = document.querySelector(".addition__first");
const additionSecond = document.querySelector(".addition__second");
const searchInput = document.querySelector(".header__input");
const body = document.querySelector(".body");
const btn = document.querySelector(".btn");
const errorMessage = document.querySelector(".error-message");
const search = document.querySelector(".header__search");

const getJSON = async function (url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Помилка запиту на сервер");
  return await response.json();
};

const getDate = function (timezoneString) {
  const now = new Date();

  const options = {
    weekday: "short",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  if (timezoneString) {
    options.timeZone = timezoneString;
  }

  const formatter = new Intl.DateTimeFormat("uk-UA", options);
  return formatter.format(now).toUpperCase();
};

const getPosition = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const { latitude, longitude } = position.coords;

        resolve({ latitude, longitude });
      },

      function (error) {
        reject(error.message);
      },
    );
  });
};

const getWeatherDescription = function (code) {
  if (code === 0) return "ясно";
  if (code === 1 || code === 2 || code === 3) return "хмарно";
  if (code === 45 || code === 48) return "туман";
  if (code >= 51 && code <= 67) return "дощ";
  if (code >= 71 && code <= 77) return "сніг";
  if (code >= 95) return "гроза";
  return "невідомо";
};

const getWeatherSVG = function (code) {
  if (code === 0) return { svg: "day.svg", img: "sun.jpg" };
  if (code === 1 || code === 2 || code === 3)
    return { svg: "cloudy-day-1.svg", img: "cloudy.jpg" };
  if (code === 45 || code === 48) return { svg: "cloudy", img: "mist.jpg" };
  if (code >= 51 && code <= 67) return { svg: "rainy-6.svg", img: "rainy.jpg" };
  if (code >= 71 && code <= 77)
    return { svg: "snowy-1.svg", img: "snowy.avif" };
  if (code >= 95) return { svg: "thunder.svg", img: "thunder.avif" };
  return "невідомо";
};

const getLocation = async function (lat, lng) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=uk`;
    const data = await getJSON(url);
    const countryName = data.countryName;
    const regionName = data.principalSubdivision;
    const cityName = data.city;
    return {
      country: countryName,
      region: regionName,
      city: cityName,
    };
  } catch (error) {
    console.error("Something went Wrong");
  }
};

const getCurrentWeather = async function (lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code,precipitation&hourly=temperature_2m,weathercode,windspeed_10m,precipitation_probability&timezone=auto`;
    const data = await getJSON(url);
    console.log(data);

    const currentTemp = Math.round(data.current.temperature_2m);
    const windSpeed = Math.round(data.current.wind_speed_10m);
    const weatherCode = data.current.weather_code;
    const feelsTemp = Math.round(data.current.apparent_temperature);
    const codeText = getWeatherDescription(weatherCode);
    const codeImg = getWeatherSVG(weatherCode);
    const currentHumidity = data.current.relative_humidity_2m;
    const currentPressure = Math.round(data.current.surface_pressure * 0.75);
    const precipitationAmount = data.current.precipitation * 100;
    return {
      temp: currentTemp,
      wind: windSpeed,
      codeT: codeText,
      codeI: codeImg,
      feels: feelsTemp,
      humidity: currentHumidity,
      pressure: currentPressure,
      precipitation: precipitationAmount,
      timezone: data.timezone,
    };
  } catch (error) {
    console.error(`Something went Wrong ${error}`);
  }
};

const getFutureWeather = async function (lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code,precipitation&hourly=temperature_2m,weathercode,windspeed_10m&timezone=auto`;

    const data = await getJSON(url);
    console.log(data);
    const currentTime = data.current.time;
    const currentHourStr = currentTime.slice(0, 13) + ":00";
    const allHourList = data.hourly.time;
    const currentIndex = allHourList.indexOf(currentHourStr);
    console.log(currentHourStr, currentIndex);
    const futureTime = [];
    for (let i = 1; i <= 5; i++) {
      const timeString = data.hourly.time[currentIndex + i].slice(-5);
      futureTime.push(timeString);
    }
    const futureTemperature = [];
    for (let i = 1; i <= 5; i++) {
      const timeString = Math.round(
        data.hourly.temperature_2m[currentIndex + i],
      );
      futureTemperature.push(timeString);
    }
    const futureWind = [];
    for (let i = 1; i <= 5; i++) {
      const timeString = Math.round(
        Math.round(data.hourly.windspeed_10m[currentIndex + i]),
      );
      futureWind.push(timeString);
    }
    const futureCode = [];
    for (let i = 1; i <= 5; i++) {
      const timeString = Math.round(data.hourly.weathercode[currentIndex + i]);
      futureCode.push(timeString);
    }
    const weatherSVG = [];
    for (el of futureCode) {
      weatherSVG.push(getWeatherSVG(el));
    }
    return {
      time: futureTime,
      temperature: futureTemperature,
      wind: futureWind,
      codeI: weatherSVG,
    };
  } catch (error) {
    console.error(`Something went Wrong ${error}`);
  }
};

const renderMain = function (dateStr, locationObj, tempObj) {
  main.innerHTML = "";

  const html = `   <h3>
          ${dateStr} ${locationObj.country} / ${locationObj.region} / ${locationObj.city}
        </h3>
        <h2>${locationObj.city} ${tempObj.codeT}, ${tempObj.temp > 0 ? "+" : ""}${tempObj.temp}°C</h2>`;

  main.insertAdjacentHTML("afterBegin", html);
  main.style.backgroundImage = `url('images/${tempObj.codeI.img}')`;

  main.style.backgroundSize = "cover";
  main.style.backgroundPosition = "center";
};

const renderAddition = function (dateStr, tempObj, futureTempObj) {
  additionFirst.innerHTML = "";
  additionSecond.innerHTML = "";

  const htmlFirst = `  <h3> ${dateStr}</h3>
          <div class="addition__header">
            <h2>${tempObj.temp >= 0 ? "+" : "-"}${tempObj.temp}°C</h2>
            <img src="images/${tempObj.codeI.svg}" />
          </div>
          <div class="addition__main">
            <p>Відчувається як:       ${tempObj.feels}</p>
            <p>Вітер:    ${tempObj.wind} м/c</p>
            <p>Тиск:      ${tempObj.pressure} мм рт. ст.</p>
            <p>Вологість:          ${tempObj.humidity} %</p>
            <p>Опади:              ${tempObj.precipitation} мм</p>
          </div>`;

  const htmlSecond = `  <h2>Погода на найближчий час</h2>
          <div class="addition__flex indent">
            <p class="item">${futureTempObj.time[0]}</p>
            <p class="item">${futureTempObj.time[1]}</P>
            <p class="item">${futureTempObj.time[2]}</p>
            <p class="item">${futureTempObj.time[3]}</p>
            <p class="item">${futureTempObj.time[4]}</p>
          </div>
          <div class="addition__flex">
             <img  class="item" src="images/${futureTempObj.codeI[0].svg}" />
             <img  class="item" src="images/${futureTempObj.codeI[1].svg}" />
             <img  class="item" src="images/${futureTempObj.codeI[2].svg}" />
             <img  class="item"src="images/${futureTempObj.codeI[3].svg}" />
             <img  class="item"src="images/${futureTempObj.codeI[4].svg}" />
          </div>
          <h2>Температура повітря, °C</h2>
          <div class="addition__flex indent">
            <p class="item">${tempObj.temp >= 0 ? "+" : "-"}${futureTempObj.temperature[0]}</p>
            <p class="item">${tempObj.temp >= 0 ? "+" : "-"}${futureTempObj.temperature[1]}</p>
            <p class="item">${tempObj.temp >= 0 ? "+" : "-"}${futureTempObj.temperature[2]}</p>
            <p class="item">${tempObj.temp >= 0 ? "+" : "-"}${futureTempObj.temperature[3]}</p>
            <p class="item">${tempObj.temp >= 0 ? "+" : "-"}${futureTempObj.temperature[4]}</p>
          </div>
          <h2>Пориви вітру, м/с</h2>
          <div class="addition__flex indent">
            <p class="item">${futureTempObj.wind[0]}</p>
            <p class="item">${futureTempObj.wind[1]}</p>
            <p class="item">${futureTempObj.wind[2]}</p>
            <p class="item">${futureTempObj.wind[3]}</p>
            <p class="item">${futureTempObj.wind[4]}</p>
          </div>`;

  additionFirst.insertAdjacentHTML("afterbegin", htmlFirst);
  additionSecond.insertAdjacentHTML("afterbegin", htmlSecond);
};

const initApp = async function () {
  try {
    const { latitude, longitude } = await getPosition();
    const currentLocation = await getLocation(latitude, longitude);
    const currentWeather = await getCurrentWeather(latitude, longitude);
    const futureWeather = await getFutureWeather(latitude, longitude);
    const currentDate = getDate(currentWeather.timezone);

    renderMain(currentDate, currentLocation, currentWeather);
    renderAddition(currentDate, currentWeather, futureWeather);
  } catch (error) {
    console.error(`Something went Wrong ${error}`);
  }
};
initApp();

searchInput.addEventListener("click", function () {
  errorMessage.classList.add("hide");
});

btn.addEventListener("click", async function (e) {
  e.preventDefault();
  const cityName = searchInput.value.trim();

  if (!cityName) return;
  try {
    const safeCityName = encodeURIComponent(cityName);
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${safeCityName}&format=json&limit=1`,
    );
    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      errorMessage.classList.remove("hide");
      return;
    }

    const latitude = geoData[0].lat;
    const longitude = geoData[0].lon;

    const currentLocation = await getLocation(latitude, longitude);
    const currentWeather = await getCurrentWeather(latitude, longitude);
    const timezone = currentWeather.timezone;
    const exactDateString = getDate(timezone);
    const futureWeather = await getFutureWeather(latitude, longitude);
    renderMain(exactDateString, currentLocation, currentWeather);
    renderAddition(exactDateString, currentWeather, futureWeather);
    console.log(geoData);
  } catch (error) {
    console.error(`Something went Wrong ${error}`);
  }
});
