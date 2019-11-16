<script>
  export let is88;
  export let enhancementLevel;
  export let handleValue;

  let substats = {
    0: { min: "", max: "", name: "Other substat or none" },
    1: { min: 4, min88: 5, max: 8, max88: 9, name: "HP/Def/Eff/EffRes/Atk" },
    2: { min: 3, min88: 3, max: 5, max88: 6, name: "Crit Rate" },
    3: { min: 3, min88: 4, max: 7, max88: 8, name: "Crit Dmg" },
    4: { min: 1, min88: 2, max: 4, max88: 5, name: "Speed" }
  };
  $: selected = "0";
  $: isSelected = selected !== "0";
  $: substat = substats[selected];
  $: min = (is88 ? substat.min88 : substat.min);
  $: max = (is88 ? substat.max88 : substat.max) * (Number(enhancementLevel) + 1);
  $: substatPlaceholder = isSelected ? `${min}-${max}` : "N/A";
  $: substatValue = "";
  $: rollsNumberPlaceholder = isSelected
    ? `0-${enhancementLevel}`
    : "Set amount of rolls";

  function handleChange() {
    handleValue(substatValue * 100 / max)
  }
</script>

{#if enhancementLevel !== '-1'}
  <form>
    <div class="form-row align-items-center">
      <div class="col-5">
        <select class="form-control" id="substatType" bind:value={selected}>
          {#each Object.entries(substats) as [key, value]}
            <option value={key}>
              {value.name}
            </option>
          {/each}
        </select>
      </div>
      <div class="col">
        <div class="input-group mb-2">
          {#if isSelected}
            <div class="input-group-prepend d-none d-md-block">
              <div class="input-group-text">Max: {max}</div>
            </div>
          {/if}
          <input
            type="number"
            class="form-control"
            id="substatValue"
            disabled={selected === '0'}
            {min}
            {max}
            placeholder={substatPlaceholder}
            bind:value={substatValue}
            on:change={handleChange} />
          {#if isSelected}
            <div class="input-group-append">
              <div class="input-group-text">%</div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </form>
{/if}
