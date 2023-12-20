<script setup>
import { onMounted, reactive, ref } from 'vue';
let crime_url = ref('');
let dialog_err = ref(false);
let new_location = ref('')
const selectedNeighborhoods = ref([]);
const selectedIncidentTypes = ref([]);
const startDate = ref('');
const endDate = ref('');
let changes = "";
const maxIncidents = ref(1000); // Default value
let map = reactive(
    {
        leaflet: null,
        center: {
            lat: 44.955139,
            lng: -93.102222,
            address: ''
        },
        zoom: 12,
        bounds: {
            nw: { lat: 45.008206, lng: -93.217977 },
            se: { lat: 44.883658, lng: -92.993787 }
        },
        neighborhood_markers: [
            { location: [44.942068, -93.020521], marker: null, number: 1 },
            { location: [44.977413, -93.025156], marker: null, number: 2 },
            { location: [44.931244, -93.079578], marker: null, number: 3 },
            { location: [44.956192, -93.060189], marker: null, number: 4 },
            { location: [44.978883, -93.068163], marker: null, number: 5 },
            { location: [44.975766, -93.113887], marker: null, number: 6 },
            { location: [44.959639, -93.121271], marker: null, number: 7 },
            { location: [44.947700, -93.128505], marker: null, number: 8 },
            { location: [44.930276, -93.119911], marker: null, number: 9 },
            { location: [44.982752, -93.147910], marker: null, number: 10 },
            { location: [44.963631, -93.167548], marker: null, number: 11 },
            { location: [44.973971, -93.197965], marker: null, number: 12 },
            { location: [44.949043, -93.178261], marker: null, number: 13 },
            { location: [44.934848, -93.176736], marker: null, number: 14 },
            { location: [44.913106, -93.170779], marker: null, number: 15 },
            { location: [44.937705, -93.136997], marker: null, number: 16 },
            { location: [44.949203, -93.093739], marker: null, number: 17 }
        ],
        extra_markers: [
            { location: [null, null], marker: null }
        ],
        extra_markers2: [
            { location: [null, null], marker: null }
        ]
    }
);


async function updateMap() {
    const location = new_location.value.trim(); // Get the entered location

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1`);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }

        const data = await response.json();

        if (data && data.length > 0) {
            let { lat, lon, display_name } = data[0];

            if (lat > 45.008206) {
                lat = 45.008206;
                updateMap();
                return;
            }
            if (lat < 44.883658) {
                lat = 44.883658;
                updateMap();
                return;
            }
            if (lon < -93.217977) {
                lon = -93.217977;
                updateMap();
                return;
            }
            if (lon > -92.993787) {
                lon = -92.993787;
                updateMap();
                return;
            }
            
            // Check if there's an existing marker in extra_markers
            const existingMarker = map.extra_markers[0];

            if (existingMarker.marker) {
                // Update the position of the existing marker
                existingMarker.location = [lat, lon];
                existingMarker.marker.setLatLng([lat, lon]).update();
                existingMarker.marker.bindPopup(location).openPopup();
            } else {
                // Create a new marker at the entered location
                const newMarker = L.marker([lat, lon]).addTo(map.leaflet);
                newMarker.bindPopup(location).openPopup();
                map.extra_markers[0] = { location: [lat, lon], marker: newMarker };
            }

            map.leaflet.setView([lat, lon], 15); // Set the view to the entered location with a zoom level of 15
        } else {
            console.log('Location not found');
            alert("The address you input is outside the St. Paul area. Please enter addresses inside St. Paul.");
        }
    } catch (error) {
        console.error('Error fetching location:', error);
    }
}


// Vue callback for once <template> HTML has been added to web page
onMounted(() => {
    // Create Leaflet map (set bounds and valied zoom levels)
    map.leaflet = L.map('leafletmap').setView([map.center.lat, map.center.lng], map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map.leaflet);
    map.leaflet.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);

    // Get boundaries for St. Paul neighborhoods
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map.leaflet);
    fetch('data/StPaulDistrictCouncil.geojson')
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            result.features.forEach((value) => {
                district_boundary.addData(value);
            });
        })
        .catch((error) => {
            console.log('Error:', error);
        });
    map.neighborhood_markers.forEach(neighborhood => {
        const { location, number } = neighborhood;
        const marker = L.marker(location).addTo(map.leaflet);
        marker.bindPopup(`Neighborhood ${number}`).openPopup();
        neighborhood.marker = marker;

    });
    // Listen for the moveend event on the Leaflet map
    map.leaflet.on('moveend', updateLocation);

    function updateLocation() {
        // Get the map's center coordinates after panning/zooming
        const center = map.leaflet.getCenter();

     initializeCrimes(); // On map move, update database

    // Reapply filters if they were previously applied
    
     updateData();
    


        // Update the location input with the new coordinates
        new_location.value = `Lat: ${center.lat.toFixed(6)}, Lng: ${center.lng.toFixed(6)}`;
    }
});

function updateNeighborhoodCrimeCount() {
    const neighborhoodCountMap = new Map();

    // Count crimes per neighborhood
    map.crimes.forEach(crime => {
        const neighborhoodNumber = crime.neighborhood_number;
        if (neighborhoodCountMap.has(neighborhoodNumber)) {
            neighborhoodCountMap.set(neighborhoodNumber, neighborhoodCountMap.get(neighborhoodNumber) + 1);
        } else {
            neighborhoodCountMap.set(neighborhoodNumber, 1);
        }
    });

    // Update the number of crimes for each neighborhood marker
    map.neighborhood_markers.forEach(marker => {
        const count = neighborhoodCountMap.get(marker.number);
        marker.crimes = count || 0;
        if (marker.marker) {
            marker.marker.setPopupContent(`Neighborhood ${marker.number}: Crimes - ${marker.crimes}`);
        }
    });
}

// FUNCTIONS
// Function called once user has entered REST API URL
function initializeCrimes() {
    map.bounds.nw.lat = map.leaflet.getBounds()._northEast.lat;
    map.bounds.nw.lng = map.leaflet.getBounds()._northEast.lng;
    map.bounds.se.lat = map.leaflet.getBounds()._southWest.lat;
    map.bounds.se.lng = map.leaflet.getBounds()._southWest.lng;
    let query = []
    map.neighborhood_markers.forEach((each) => {
        const { location, number, marker } = each;

        if (map.bounds.se.lat < location[0] && map.bounds.nw.lat > location[0] && map.bounds.nw.lng > location[1] && map.bounds.se.lng < location[1]) {
            query.push(number);
        }
    });
    let count = 0
    if (query.length != 0) {
        query.forEach((number) => {
            console.log("In view is " + number)
            if (count == 0) {
                changes = ""
            } else {
                changes = changes + ","
            }
            changes = changes + number
            count = count + 1;
        })
    } else {
        changes = "&neighborhood=18"
        //we need to have this return and empty table
    }
    console.log(changes);
    fetch(`${crime_url.value}/incidents?start_date=2023-01-01&end_date=2023-12-31&neighborhood=` + changes)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            map.crimes = data;
            updateNeighborhoodCrimeCount();
            map.crimes.forEach((crime) => {
                //console.log(crime);
            });

            // TODO: Handle crime data as needed (e.g., display markers on the map)
        })
        .catch((error) => {
            console.error('Error fetching crime data:', error);
            dialog_err.value = true;
        });
}

// Function called when user presses 'OK' on dialog box
function closeDialog() {
    let dialog = document.getElementById('rest-dialog');
    let url_input = document.getElementById('dialog-url');
    if (crime_url.value !== '' && url_input.checkValidity()) {
        dialog_err.value = false;
        dialog.close();
        openLocationDialog()
        initializeCrimes();
    }
    else {
        dialog_err.value = true;
    }
}
function closeLocationDialog() {
    let locationDialog = document.getElementById('location-dialog');
    locationDialog.close(); // Close the location dialog
    initializeCrimes();
}
function openLocationDialog() {
    let locationDialog = document.getElementById('location-dialog');
    locationDialog.showModal(); // Show the location dialog
}

function executeUpdateAndClose() {
    updateMap(); // Call the updateMap function
    closeLocationDialog(); // Call the closeLocationDialog function
}


const neighborhoodData = [
    { "id": 1, "name": "Conway/Battlecreek/Highwood" },
    { "id": 2, "name": "Greater East Side" },
    { "id": 3, "name": "West Side" },
    { "id": 4, "name": "Dayton's Bluff" },
    { "id": 5, "name": "Payne/Phalen" },
    { "id": 6, "name": "North End" },
    { "id": 7, "name": "Thomas/Dale(Frogtown)" },
    { "id": 8, "name": "Summit/University" },
    { "id": 9, "name": "West Seventh" },
    { "id": 10, "name": "Como" },
    { "id": 11, "name": "Hamline/Midway" },
    { "id": 12, "name": "St. Anthony" },
    { "id": 13, "name": "Union Park" },
    { "id": 14, "name": "Macalester-Groveland" },
    { "id": 15, "name": "Highland" },
    { "id": 16, "name": "Summit Hill" },
    { "id": 17, "name": "Capitol River" }
];

const incidentType = [
    { "id": "810,861,862,863", "name": "Simple Assault Dom." },
    { "id": "100,110,120", "name": "Homicide" },
    { "id": "210,220", "name": "Rape" },
    { "id": "400,410,411,412,420,421,422,430,431,432,,440,441,442,450,451,452,453", "name": "Agg. Assault" },
    { "id": "300,311,312,313,314,321,323,324,331,332,333,334,341,342,343,344,351,352,353,354,361,362,363,364,371,372,373,374", "name": "Robbery" },
    { "id": "600,601,603,611,612,613,614,621,622,623,630,631,632,633,640,641,642,643,651,652,653,661,662,663,671,672,673,681,682,683,691,692,693", "name": "Theft" },
    { "id": "700,710,711,712,720,721,722,730,731,732", "name": "Auto Theft" },
    { "id": "500,510,511,513,515,516,520,521,523,525,526,530,531,533,535,536,540,541,543,545,546,550,551,553,555,556,560,561,563,565,566", "name": "Burglary" },
    { "id": "1400,1401,1410,,1415,1416,1420,1425,1426,1430,1435,1436", "name": "Property Damage" },
    {"id": "900,901,903,905,911,913,915,921,922,923,925,931,933,941,942,951,961,971,972,975,981,982", "name": "Arson" },
    { "id": "1800,1810,1811,1812,1813,1814,,1815,1820,1822,1823,1824,1825,1830,1835,1840,1841,1842,1843,1844,1845,1850,1855,1860,1865,1870,1880,1885", "name": "Narotics" },
    { "id": "2619,3100,9954,9959,9986", "name": "other" }
];

const neighborhoodMap = new Map(neighborhoodData.map(entry => [entry.id, entry.name]));
console.log(neighborhoodMap)

let newIncident = reactive({
    case_number: '',
    date_time: '',
    code: '',
    incident: '',
    police_grid: '',
    neighborhood_number: '',
    block: ''
});

const isCrimeFormDialogOpen = ref(false);

// Function to open the dialog
const openCrimeFormDialog = () => {
    const crimeFormDialog = document.getElementById('crime-form-dialog');
    if (crimeFormDialog) {
        crimeFormDialog.showModal(); // Show the crime form dialog
    } else {
        console.error('Crime form dialog not found');
    }
};

const openDataFormDialog = () => {
    const dataFormDialog = document.getElementById('data-form-dialog');
    if (dataFormDialog) {
        dataFormDialog.showModal(); // Show the crime form dialog
    } else {
        console.error('Data form dialog not found');
    }
};
const submitNewIncident = async () => {
    try {
        const response = await fetch(crime_url.value + '/new-incident', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                case_number: newIncident.case_number,
                date_time: newIncident.date_time,
                code: newIncident.code,
                incident: newIncident.incident,
                police_grid: newIncident.police_grid,
                neighborhood_number: newIncident.neighborhood_number,
                block: newIncident.block,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to add new incident');
        } else {
            console.log("New incident has been submitted")
        }

        // Close the dialog or perform any other necessary action upon successful submission
        const crimeFormDialog = document.getElementById('crime-form-dialog');
        crimeFormDialog.close();

        // Clear the form fields after successful submission
        Object.keys(newIncident).forEach(key => {
            newIncident[key] = '';
        });
    } catch (error) {
        console.error('Error adding new incident:', error);
        // Handle error: show error message or perform appropriate actions
    }
};



// Function to determine the row background color based on incident type
const getIncidentType = (incidentType) => {
    switch (incidentType) {
        case "Simple Assault Dom.":
        case "Agg. Assault Dom.":
        case "HOMICIDE":
        case "Rape":
        case "Attempt":
        case "Agg. Assault":
        case "Rape, By Force":
            return "violent-crime";
        case "Robbery":
        case "Theft":
        case "Auto Theft":
        case "Larceny":
        case "Burglary":
        case "Shoplifting":
        case "Criminal Damage":
            return "property-crime";
        default:
            return "other";
    }
};

async function dataMarkers(string) {
    const resultString = string.replace(/XX/g, '00');
    let location = resultString.trim(); // Get the entered location
    location = location + ", St. Paul, MN"
    console.log(location);

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1`);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }

        const data = await response.json();

        if (data && data.length > 0) {
            let { lat, lon, display_name } = data[0];

            // Create a new marker at the entered location
            var newMarker = L.marker([lat, lon], {icon: L.divIcon({className: 'red-marker'})}).addTo(map.leaflet);
            newMarker.bindPopup(location).openPopup();
            let count_extra = map.extra_markers2.size()-1;
            map.extra_markers2[count_extra] = { location: [lat, lon], marker: newMarker };



        } else {
            console.log('Location not found');
            alert("Marker from the database cannot be attributed to a valid address");
        }
    } catch (error) {
        console.error('Error fetching location:', error);
    }
}

async function deleteIncident(incident) {
    try {
        const response = await fetch(crime_url.value + '/remove-incident', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                case_number: incident,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to remove incident');
        } else {
            alert("Case ID: " + incident + " has been removed from the database");
            initializeCrimes();
        }
    } catch (error) {
        console.error('Error removing incident:', error);
        // Handle error: show error message or perform appropriate actions
    }
}

const getNeighborhoodIDFromName = (neighborhoodName) => {
    const neighborhood = neighborhoodData.find((n) => n.name === neighborhoodName);
    return neighborhood ? neighborhood.id : null;
};

const updateData = async () => {
    const startDateValue = startDate.value;
    const endDateValue = endDate.value;
    const selectedIncidentTypesValue = selectedIncidentTypes.value;
    const selectedNeighborhoodsValue = selectedNeighborhoods.value;
    const maxIncidentsValue = maxIncidents.value;

    const incidentTypesQuery = selectedIncidentTypesValue.length > 0 ? `&code=${selectedIncidentTypesValue.join(',')}` : '';
    const neighborhoodIDs = selectedNeighborhoodsValue.map(getNeighborhoodIDFromName);

    const quotedNeighborhoodIDs = neighborhoodIDs.map(id => `${id}`);

    const neighborhoodsQuery = quotedNeighborhoodIDs.length >= 0 ? `&neighborhood=18${quotedNeighborhoodIDs.join(',')}` +',' + changes : '';
    console.log(neighborhoodsQuery)

    const maxIncidentsQuery = `&limit=${maxIncidentsValue}`;

    const apiUrl = `${crime_url.value}/incidents?start_date=${startDateValue}&end_date=${endDateValue}${incidentTypesQuery}${neighborhoodsQuery}${maxIncidentsQuery}`;

    try {
        const response = await fetch(apiUrl); fetch(`${crime_url.value}/incidents?start_date=2023-01-01&end_date=2023-12-31&neighborhood=` + changes)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // Handle the fetched data, update display or state as needed
        // For example:
        map.crimes = data;
        updateNeighborhoodCrimeCount(); // Update crime count for neighborhoods
    } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error: show error message or perform appropriate actions
    }
};


</script>

<template>
    <div>
        <!-- Fixed Search Bar -->
        <div style="position: fixed; top: 0; width: 100%; z-index: 999;">
            <input id="dialog-location" class="dialog-input" type="text" v-model="new_location" placeholder="Enter location"
                style="width: calc(100% - 100px);" />
            <button class="button" type="button" style="float: right; margin-right: 45px; margin-top: -55px;"
                @click="executeUpdateAndClose">Go</button>
        </div>
        

        <!-- Rest of your content -->
        <div style="margin-top: 50px;"> <!-- Add margin to accommodate the fixed search bar -->
            <dialog id="rest-dialog" open>
                <h1 class="dialog-header">St. Paul Crime REST API</h1>
                <label class="dialog-label">URL: </label>
                <input id="dialog-url" class="dialog-input" type="url" v-model="crime_url"
                    placeholder="http://localhost:8000" />
                <p class="dialog-error" v-if="dialog_err">Error: must enter valid URL</p>
                <br />
                <button class="button success" type="button" @click="closeDialog">OK</button>
            </dialog>
            <dialog id="location-dialog">
                <h1 class="dialog-header">Enter Location</h1>
                <label class="dialog-label">Location: </label>
                <input id="dialog-location" class="dialog-input" type="text" v-model="new_location"
                    placeholder="Enter location" />
                <button class="button" type="button" @click="executeUpdateAndClose">Go</button>
                <!-- Call executeUpdateAndClose method -->
            </dialog>
            <div class="grid-container">
                <div class="grid-x grid-padding-x">
                    <div id="leafletmap" class="cell auto"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="grid-x grid-padding-x">
        <div class="cell large-10">
            <table>
                <thead>
                    <tr>
                        <th>Case Number</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Incident</th>
                        <th>Police Grid</th>
                        <th>Neighborhood</th>
                        <th>Block</th>
                        <th><button class="button" style="width: 7rem;" @click="openDataFormDialog">Filter Data</button></th>
                        <th><button class="button" style="width: 7rem;" @click="openCrimeFormDialog">Add New Incident</button></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="crime in map.crimes" :key="crime.case_number" :id=getIncidentType(crime.incident)>
                        <td>{{ crime.case_number }}</td>
                        <td>{{ crime.date }}</td>
                        <td>{{ crime.time }}</td>
                        <td>{{ crime.incident }}</td>
                        <td>{{ crime.police_grid }}</td>
                        <td>{{ neighborhoodMap.get(crime.neighborhood_number) }}</td>
                        <td>{{ crime.block }}</td>
                        <td><button class="button secondary" @click="dataMarkers(crime.block)">Add Marker</button></td>
                        <td><button class="button alert" @click="deleteIncident(crime.case_number)">Delete</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="cell large-2">
            <table>
                <thead>
                    <tr>
                        <th>Legend</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td id="violent-crime" style="line-height: 1.4rem;">Violent Crimes</td></tr>
                    <tr><td id="property-crime" style="line-height: 1.4rem;">Property Crimes</td></tr>
                    <tr><td id="other" style="line-height: 1.4rem;">Other</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    <dialog id="data-form-dialog">
        <h1 class="dialog-header">Filter Data</h1>
        <div style="margin-top: 50px;">
        
            <label>Incident Type:</label>
    
      <div v-for="type in incidentType" :key="type.id">
        <input type="checkbox" :value="type.id" v-model="selectedIncidentTypes" @change="updateData" />
        <label>{{ type.name }}</label>
      </div>
     
      <label>Neighborhood:</label>
      <div v-for="neighborhood in neighborhoodData" :key="neighborhood.id">
        <input type="checkbox" :value="neighborhood.name" v-model="selectedNeighborhoods" @change="updateData" />
        <label>{{ neighborhood.name }}</label>
      </div>

      <!-- Date Range Selector -->
      <label>Start Date:</label>
      <input type="date" v-model="startDate" @change="updateData" />

      <label>End Date:</label>
      <input type="date" v-model="endDate" @change="updateData" />

      <!-- Max Incidents Input -->
      <label>Max Incidents:</label>
      <input type="number" v-model="maxIncidents" @change="updateData" />

      <!-- Update Button -->
      <button class="button" @click="updateData">Update</button>
    </div>
    </dialog>
    <dialog id="crime-form-dialog">
        <h1 class="dialog-header">Add New Crime Incident</h1>
        <form @submit.prevent="submitNewIncident">
            <!-- Input fields for new crime incident -->
            <label class="dialog-label">Case Number: </label>
            <input class="dialog-input" type="text" v-model="newIncident.case_number" required />

            <label class="dialog-label">Date & Time: </label>
            <input class="dialog-input" type="datetime-local" v-model="newIncident.date_time" required />

            <label class="dialog-label">Code: </label>
            <input class="dialog-input" type="text" v-model="newIncident.code" required />

            <label class="dialog-label">Incident: </label>
            <input class="dialog-input" type="text" v-model="newIncident.incident" required />

            <label class="dialog-label">Police Grid: </label>
            <input class="dialog-input" type="text" v-model="newIncident.police_grid" required />

            <label class="dialog-label">Neighborhood Number: </label>
            <input class="dialog-input" type="text" v-model="newIncident.neighborhood_number" required />

            <label class="dialog-label">Block: </label>
            <input class="dialog-input" type="text" v-model="newIncident.block" required />

            <button class="button success" type="submit">Submit</button>
        </form>
    </dialog>
</template>
<style>

#violent-crime {
    background-color: rgb(255, 136, 136);
}

#property-crime {
    background-color: rgb(255, 222, 139);
}

td button {
    width: 7rem;
}
th button {
    font-weight: 800;
}

#other {
    background-color: white;
}

tr th {
    text-align: center;
    font-size: 1.2rem;
}

tr td {
    text-align: center;
}

#rest-dialog {
    width: 20rem;
    margin-top: 1rem;
    z-index: 1000;
}

#leafletmap {
    height: 500px;
}

.dialog-header {
    font-size: 1.2rem;
    font-weight: bold;
}

.dialog-label {
    font-size: 1rem;
}

.dialog-input {
    font-size: 1rem;
    width: 100%;
}

.dialog-error {
    font-size: 1rem;
    color: #D32323;
}
.red-marker {
    background-color: blueviolet;
    border-radius: 50%;
    width: 3vw;
    height: 3vh;
}
</style>