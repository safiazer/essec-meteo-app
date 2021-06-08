<script>
  import AutoComplete from "simple-svelte-autocomplete";
  import City from "./City.svelte";
  let selectedCountry;
  import { fav } from "./store.js";
  let city;

  let fav_value = [];

  fav.subscribe((value) => {
    if (value.constructor === Array) fav_value = value;
  });

  async function searchCountry(keyword) {
    const url =
      "http://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=" +
      encodeURIComponent(keyword) +
      "&type=CITY&limit=10&offset=0&languageCode=fr";
    const response = await fetch(url);
    return (await response.json()).data.filter((r) => r.type === "CITY");
  }

  var loading = false;

  async function submitHandler() {
    if (!selectedCountry || !selectedCountry.city) return;
    //submit handler function
    loading = true; //chage loading state to true
    city = selectedCountry.city;
  }
</script>

<main>
  <!-- <h1>Bienvenue sur {name}!</h1> -->
  <div />
  <div>
    <div class="search__container">
      <p class="search__title">Your daily weather in one clic !</p>
      <form autocomplete="off">
        <AutoComplete
          className="search__input"
          searchFunction={searchCountry}
          valueFunction={submitHandler}
          html5autocomplete={false}
          showClear={true}
          noResultsText={"Aucun résultat"}
          bind:selectedItem={selectedCountry}
          labelFieldName="city"
          maxItemsToShowInList="10"
          delay="200"
          hideArrow={true}
          localFiltering="false"
          placeholder={"Which city are you looking for"}
        />
      </form>
    </div>
  </div>

  <div class="results">
    <br />
    <City {city} {fav_value} />
    <br />
    {#if fav_value.length > 0}
      Météo des villes favorites
      <p />
    {/if}
    <br />

    {#each fav_value as f}
      <City city={f} />
      <br />
    {/each}
    {#if fav_value.length > 0}
      <button
        class="button"
        on:click={() => {
          fav.set([]);
          localStorage.setItem("fav", JSON.stringify([]));
        }}
      >
        vider les favoris
      </button>
    {/if}
  </div>
</main>

<style>
  main {
    /* text-align: right; */
    /* max-width: 240px; */
    /* margin: 0 auto; */
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
  }
  .results {
    padding: 1em;
    overflow: auto;
  }
  .search__container {
    margin-top: 16px;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
