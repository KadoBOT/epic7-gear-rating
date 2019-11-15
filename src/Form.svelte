<script>
  import Substat from "./Substat.svelte";

  let is88 = false;
  $: enhancementLevel = "-1";
</script>

<div class="form-row align-items-center">
  <div class="col-10">
    <select
      class="form-control"
      id="enhancementLevel"
      value="-1"
      bind:value={enhancementLevel}>
      <option disabled value="-1">Select enhancement level</option>
      <option value="0">None</option>
      <option value="1">3+</option>
      <option value="2">6+</option>
      <option value="3">9+</option>
      <option value="4">12+</option>
      <option value="5">15</option>
    </select>
  </div>
  <div class="col-2">
    <div class="form-check mb-2">
      <input
        type="checkbox"
        class="form-check-input"
        id="higherLevel"
        bind:checked={is88} />
      <label class="form-check-label" for="higherLevel">Level 88+ equip</label>
    </div>
  </div>
</div>
<Substat {is88} {enhancementLevel} />
<Substat {is88} {enhancementLevel} />
<Substat {is88} {enhancementLevel} />
<Substat {is88} {enhancementLevel} />
