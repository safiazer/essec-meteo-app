<script>
  import Saos from "saos";
  import { fav } from "./store.js";

  let fav_value = [];

  fav.subscribe((value) => {
    fav_value = value;
  });

  const appid_openweather = "de20cef7b5f680d7f00c7ecf69c4b2a2"; //openweathermap appid
  const appcode_heremaps = "xd8J-saYa0g3xYKJVln__jTCRCsRUwZGo9-qa2VYte8"; //here maps app code
  var loading = false; //get loading state varialble
  var feels_like,
    temp,
    humidity,
    disc,
    mapurl,
    temp_max,
    temp_min = ""; //store input value varialble1
  var incomeData = null; //varialble for openweathermap data
  let icon;
  export let city;
  $: {
    console.log("color city", city);
    submitHandler();
  }

  async function submitHandler() {
    mapurl = "";
    icon = "";
    if (!city) return;
    //submit handler function
    loading = true; //chage loading state to true
    const response = await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${appid_openweather}&units=metric`
    );
    let data = await response.json();
    //get data upone a sucsessfull response
    loading = false; //chage loading state to false
    console.log(data.data);
    incomeData = data; //assign response data to the variable
    temp = incomeData.main.temp;
    temp_min = incomeData.main.temp_min;
    temp_max = incomeData.main.temp_max;
    feels_like = incomeData.main.feels_like;
    humidity = incomeData.main.humidity;
    disc = incomeData.weather[0];
    icon = "http://openweathermap.org/img/wn/" + disc.icon + "@2x.png";
    mapurl = `https://image.maps.ls.hereapi.com/mia/1.6/mapview?apiKey=${appcode_heremaps}&c=${incomeData.coord.lat},${incomeData.coord.lon}&t=0&z=12&w=250
  &h=250`; //set the url to of the map image
  }
</script>

<div>
  {#if mapurl}
    <div class="container">
      <Saos
        animation={"puff-in-center 0.7s cubic-bezier(0.470, 0.000, 0.745, 0.715) both"}
        animation_out={"slide-out-elliptic-top-bck 0.7s ease-in both"}
        top={250}
        bottom={250}
      >
        <div class="subcontainer">
          {#if icon}
            <img src={icon} alt="icon" />
          {/if}
          <div>Ville : {city}</div>
          <div>Température : {temp} °C</div>
          <div>Température ressentie: {feels_like} °C</div>
          <div>Température min: {temp_min} °C</div>
          <div>Température max: {temp_max} °C</div>
          <div>Humidité : {humidity} %</div>
          {#if fav_value.includes(city) === false}
          <p></p>
            <button class="button"
              on:click={() => {
                fav_value.push(city);
                fav.set(fav_value);
                localStorage.setItem("fav", JSON.stringify(fav_value));
              }}
            >
              Ajouter aux favoris
            </button>
          {/if}
        </div>
      </Saos>
      <img src={mapurl} alt="mapImageView" />
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;
  }
  .container .subcontainer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background-color: #c9dbe9;
    margin-right: 16px;
    border:1px solid #575756;
    border-radius: 10px;
    padding: 10px;
    height: 250px;
  }

  @keyframes -global-slide-out-elliptic-top-bck {
	  0% {
		transform: translateY(0) rotateX(0) scale(1);
		transform-origin: 50% 1400px;
		opacity: 1;
	  }
	  100% {
		transform: translateY(-600px) rotateX(-30deg) scale(0);
		transform-origin: 50% 100%;
		opacity: 1;
	  }
	}
	@keyframes -global-puff-in-center {
	  0% {
		transform: scale(2);
		filter: blur(4px);
		opacity: 0;
	  }
	  100% {
		transform: scale(1);
		filter: blur(0px);
		opacity: 1;
	  }
	}

</style>
