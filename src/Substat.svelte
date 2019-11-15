<script>
  export let is88;
  export let enhancementLevel;
  let substats = {
    0: { min: "", max: "", name: "Select substat type" },
    1: { min: 4, min88: 5, max: 8, max88: 9, name: "HP/Def/Eff/EffRes/Atk" },
    2: { min: 3, min88: 3, max: 5, max88: 6, name: "Crit Rate" },
    3: { min: 3, min88: 4, max: 7, max88: 8, name: "Crit Dmg" },
    4: { min: 1, min88: 2, max: 4, max88: 5, name: "Speed" }
  };
  $: selected = "0";
  $: isSelected = selected !== "0";
  $: substat = substats[selected];
  $: min = (is88 ? substat.min88 : substat.min) * (rollsNumber + 1);
  $: max = (is88 ? substat.max88 : substat.max) * (rollsNumber + 1);
  $: substatPlaceholder = isSelected ? `${min}-${max}` : "Set substat value";
  $: substatValue = "";
  $: rollsNumberPlaceholder = isSelected
    ? `0-${enhancementLevel}`
    : "Set amount of rolls";
  $: rollsNumber = "";
  $: totalValue = rollsNumber ? substat.max * (rollsNumber + 1) : substat.max;

  $: getRating = () => {
    const rating = (substatValue * 100) / totalValue;
    if (rating < 55) return "F";
    if (rating < 61) return "E";
    if (rating < 68.76) return "D";
    if (rating < 75) return "C";
    if (rating < 81.26) return "B";
    if (rating < 87.6) return "A";
    if (rating < 93.76) return "S";
    if (rating < 98) return "SS";
    return "SSS";
  }
</script>

{#if enhancementLevel !== '-1'}
  <form>
    <div class="form-row align-items-center">
      <div class="col-5">
        <select class="form-control" id="substatType" bind:value={selected}>
          {#each Object.entries(substats) as [key, value]}
            <option value={key} disabled={key === '0' ? true : false}>
              {value.name}
            </option>
          {/each}
        </select>
      </div>
      <div class="col-3">
        <div class="input-group mb-2">
          {#if isSelected}
            <div class="input-group-prepend">
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
            bind:value={substatValue} />
          {#if isSelected}
            <div class="input-group-append">
              <div class="input-group-text">%</div>
            </div>
          {/if}
        </div>
      </div>
      <div class="col-3">
        <input
          type="number"
          class="form-control"
          id="rollsNum"
          min="0"
          disabled={selected === '0'}
          max={Number(enhancementLevel)}
          placeholder={rollsNumberPlaceholder}
          bind:value={rollsNumber} />
      </div>
      {#if isSelected}
        <div class="col-1">{getRating()}</div>
      {/if}
    </div>
  </form>
{/if}
