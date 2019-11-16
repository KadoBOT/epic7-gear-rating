<script>
  export let isDone;
  export let enhancementLevel;
  export let handleValue;
  export let substats

  $: selected = "0";
  $: isSelected = selected !== "0";
  $: substat = substats[selected];
  $: min = substat.min;
  $: max = substat.max;
  $: substatPlaceholder = isSelected ? `${min}-${max}` : "N/A";
  $: substatValue = "";
  $: rollsNumberPlaceholder = isSelected
    ? `0-${enhancementLevel}`
    : "Set amount of rolls";

  function handleChange() {
    handleValue([substatValue, selected])
  }
</script>

{#if isDone}
  <form>
    <div class="form-row align-items-center">
      <div class="col-5">
        <select class="form-control" id="substatType" bind:value={selected}>
          {#each Object.entries(substats) as [key, value]}
            <option value={key} disabled={Number(key) === 0}>
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
            disabled={Number(selected) <= 0}
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
