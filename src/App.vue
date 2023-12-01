<script setup>
import { reactive, ref } from 'vue'
import { fetchWeatherApi } from 'openmeteo'; // https://open-meteo.com/en/docs

const open_mereo_url = "https://api.open-meteo.com/v1/forecast";

// add variables to our 'model'
let latitude = ref(44.9407146);
let longitude = ref(-93.1907503);
let num_days = ref(1);
let forecast = reactive([]);

// helper function for creating an array with values at regular intervals
function range(start, stop, step) {
	return Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
}

// get cardinal direction from direction (in degrees)
function getCardinalDirection(direction) {
    let cardinal = 'E';
    if (direction >= 45 && direction < 135) {
        cardinal = 'N';
    }
    else if (direction >= 135 && direction < 225) {
        cardinal = 'W';
    }
    else if (direction >= 225 && direction < 315) {
        cardinal = 'S';
    }
    return cardinal;
}

// callback for initiating request for getting weather forecast
function getWeatherForcast() {
    // use 'latitude' and 'longitude' values from our model
    let params = {
        latitude: latitude.value,
        longitude: longitude.value,
        hourly: "temperature_2m,wind_speed_10m,wind_direction_10m,weather_code",
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
        forecast_days: num_days.value
    };

    fetchWeatherApi(open_mereo_url, params)
    .then((data) => {
        let hourly = data[0].hourly();
        let utc_offset = data[0].utcOffsetSeconds();

        // create array of times (in local time zone)
        let times = range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval())
                    .map((t) => {
                        return new Date((t + utc_offset) * 1000);
                    });

        // get arrays of data (1 entry per time)
        let temp = hourly.variables(0).valuesArray();
        let wind_speed = hourly.variables(1).valuesArray();
        let wind_dir = hourly.variables(2).valuesArray();
        let weather_code = hourly.variables(3).valuesArray();

        // clear out old data
        //forecast = []; // <-- DON'T DO THIS (removes Vue reference since we assign new value to object)
        forecast.splice(0, forecast.length);
        // combine times and data into list of objects and store in 'forecast' variable in our model
        times.forEach((time, index) => {
            forecast.push({
                time: time,
                temperature: temp[index],
                wind_speed: wind_speed[index],
                wind_direction: wind_dir[index],
                weather_code: weather_code[index]
            });
        });
    })
    .catch((error) => {
        console.log(error);
    });
}
</script>

<template>
    <div class="ui-row">
        <label>Latitude: </label><input class="space-right" type="text" v-model="latitude">
        <label>Longitude: </label><input class="space-right" type="text" v-model="longitude">
        <label>Number of Days: </label>
        <select v-model="num_days">
            <option name="1">1</option>
            <option name="2">2</option>
            <option name="3">3</option>
            <option name="4">4</option>
            <option name="5">5</option>
            <option name="6">6</option>
            <option name="7">7</option>
        </select>
    </div>
    <!-- TODO: add another user input to specify number of days in requested forecast -->
    <div class="ui-row">
        <button type="button" @click="getWeatherForcast">Get Forecast</button>
    </div>
    <!-- TODO: modify list to table (one row per item in forecast) -->
    <table v-if="forecast.length > 0">
        <thead>
            <tr>
                <th>Time</th>
                <th>Temperature</th>
                <th>Wind Speed</th>
                <th>Wind Direction</th>
                <th>Weather Code</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in forecast">
                <td>{{ item.time }}</td>
                <td>{{ item.temperature.toFixed(0) }}&deg;F</td>
                <td>{{ item.wind_speed.toFixed(1) }} mph</td>
                <td>{{ getCardinalDirection(item.wind_direction) }}</td>
                <td>{{ item.weather_code }}</td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
* {
    font-size: 1rem;
}

button {
    background-color: #2360A1;
    color: #FFFFFF;
    border: 0;
    box-shadow: none;
    padding: 0.5rem 1rem;
    cursor:pointer;
}

button:active {
    background-color: #163E68;
}

table {
    border-collapse: collapse;
}

th, td {
    border: solid 1px #000000;
}

.ui-row {
    margin: 1rem 0;
}

.space-right {
    margin-right: 1rem;
}
</style>
